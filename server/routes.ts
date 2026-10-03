import { Router, Response } from 'express';
import crypto from 'crypto';
import {
  getDatabase,
  saveDatabase,
  appendAuditLog,
  ServerMember,
  postDoubleEntryTransaction,
  reverseFinancialTransaction,
  getTrialBalance,
  recordConsumedNonce,
  isNonceUsedInDB,
  exportDatabaseBackup,
  restoreDatabaseBackup,
} from './db';
import {
  authenticateRequest,
  AuthenticatedRequest,
  createSession,
  revokeSession,
  requirePermission,
} from './auth';
import {
  verifyPassword,
  hashPassword,
  signQRPayload,
  verifyQRToken,
  consumeNonce,
} from './security';
import { ConstitutionSourceAdapter } from './constitutionAdapter';
import { GoogleGenAI } from '@google/genai';

export const apiRouter = Router();

// Initialize Gemini AI if available
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

// ==========================================
// 1. AUTHENTICATION & SESSION LIFECYCLE
// ==========================================

// Login with Membership Number + Password (Argon2id + account lockout protection)
apiRouter.post('/auth/login', async (req, res) => {
  const { membershipNumber, password } = req.body;
  if (!membershipNumber || !password) {
    res.status(400).json({ error: 'Membership Number and Password are required.' });
    return;
  }

  const db = getDatabase();
  const member = db.members.find(
    (m) => m.membershipNumber.toLowerCase() === membershipNumber.toLowerCase().trim()
  );

  if (!member) {
    res.status(401).json({ error: 'Invalid credentials. Membership number not found.' });
    return;
  }

  // Account Lockout check (5 failed attempts -> 15 min lock)
  if (member.lockedUntil && member.lockedUntil > Date.now()) {
    const mins = Math.ceil((member.lockedUntil - Date.now()) / 60000);
    res.status(429).json({ error: `Account locked due to excessive failed attempts. Try again in ${mins} minutes.` });
    return;
  }

  const isPasswordValid = await verifyPassword(password, member.passwordHash, member.passwordSalt);
  if (!isPasswordValid) {
    member.failedLoginAttempts = (member.failedLoginAttempts || 0) + 1;
    if (member.failedLoginAttempts >= 5) {
      member.lockedUntil = Date.now() + 15 * 60 * 1000;
    }
    saveDatabase();

    appendAuditLog({
      actorId: member.id,
      actorName: `${member.firstName} ${member.lastName}`,
      actorPosition: member.positions[0] || 'Member',
      action: 'LOGIN_FAILED',
      resourceType: 'Session',
      resourceId: member.membershipNumber,
      scope: member.primaryClubId,
      result: 'Failed',
      ip: req.ip,
      afterState: { failedAttempts: member.failedLoginAttempts },
    });

    res.status(401).json({ error: 'Incorrect password.' });
    return;
  }

  // Reset failed attempts & issue session token
  member.failedLoginAttempts = 0;
  member.lockedUntil = undefined;
  const sessionToken = createSession(member.id);

  appendAuditLog({
    actorId: member.id,
    actorName: `${member.firstName} ${member.lastName}`,
    actorPosition: member.positions[0] || 'Member',
    action: 'LOGIN_SUCCESS',
    resourceType: 'Session',
    resourceId: sessionToken.substring(0, 15) + '...',
    scope: member.primaryClubId,
    result: 'Success',
    ip: req.ip,
  });

  const { passwordHash: _ph, passwordSalt: _ps, ...safeMember } = member;
  res.json({ token: sessionToken, member: safeMember });
});

// NOTE: /api/auth/switch-demo has been completely removed in compliance with P0 security hardening.

// Get current authenticated user
apiRouter.get('/auth/me', authenticateRequest, (req: AuthenticatedRequest, res) => {
  const { passwordHash: _ph, passwordSalt: _ps, ...safeUser } = req.user!;
  res.json({ member: safeUser });
});

// Logout
apiRouter.post('/auth/logout', authenticateRequest, (req: AuthenticatedRequest, res) => {
  revokeSession(req.sessionToken!);
  appendAuditLog({
    actorId: req.user!.id,
    actorName: `${req.user!.firstName} ${req.user!.lastName}`,
    actorPosition: req.user!.positions[0] || 'Member',
    action: 'LOGOUT',
    resourceType: 'Session',
    resourceId: req.sessionToken!.substring(0, 15) + '...',
    scope: req.user!.primaryClubId,
    result: 'Success',
    ip: req.ip,
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================
// 2. MEMBERSHIP LIFECYCLE & ONBOARDING
// ==========================================

// List members with scope and privacy masking
apiRouter.get('/members', authenticateRequest, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const isOfficer =
    req.user!.roles.includes('President') ||
    req.user!.roles.includes('Secretary') ||
    req.user!.roles.includes('Club_Admin') ||
    req.user!.roles.includes('Regional_Officer') ||
    req.user!.roles.includes('National_Admin');

  const sanitized = db.members.map((m) => {
    const isSelf = m.id === req.user!.id;
    const { passwordHash: _ph, passwordSalt: _ps, ...rest } = m;

    if (!isOfficer && !isSelf) {
      if (m.privacySettings?.hideMobile) rest.mobile = 'Protected / Contact via Secretariat';
      if (m.privacySettings?.hideAddress) rest.address = 'Daet, Camarines Norte (Masked)';
    }
    return rest;
  });

  res.json(sanitized);
});

// Self-Registration Onboarding
apiRouter.post('/members/register', async (req, res) => {
  const db = getDatabase();
  const data = req.body;

  const newId = `mem-app-${Date.now()}`;
  const salt = crypto.randomBytes(16).toString('hex');
  const passHash = await hashPassword(data.password || 'Agila2026!');

  const qrToken = signQRPayload({
    memberId: newId,
    memberNumber: `TFOE-APP-${Date.now().toString().slice(-4)}`,
    clubCode: 'BEEC',
    issuedAt: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex'),
  });

  const newMember: ServerMember = {
    id: newId,
    membershipNumber: `TFOE-APP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    membershipCardId: `BEEC-APP-${Math.floor(100 + Math.random() * 900)}`,
    firstName: data.firstName || 'Applicant',
    middleName: data.middleName || '',
    lastName: data.lastName || 'Eagle',
    nickname: data.nickname || 'Applicant',
    gender: data.gender || 'Male',
    birthdate: data.birthdate || '1995-01-01',
    profilePhoto: data.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    mobile: data.mobile || '+63 900 000 0000',
    email: data.email || 'applicant@tfoe-pe.org',
    address: data.address || 'Daet, Camarines Norte',
    occupation: data.occupation || 'Professional / Entrepreneur',
    companyBusiness: data.companyBusiness || 'Private Practice',
    emergencyContact: data.emergencyContact || { name: 'Family Contact', relation: 'Family', mobile: '+63 900 000 0001' },
    dateJoined: new Date().toISOString().split('T')[0],
    dateInducted: 'Pending Induction',
    membershipStatus: 'Pending Approval',
    previousClub: data.previousClub || 'None',
    primaryClubId: 'club-beec',
    regionId: 'region-bcnbr1',
    positions: ['Applicant'],
    roles: ['Applicant'],
    permissions: ['MEMBER_VIEW_SELF', 'CONSTITUTION_VIEW'],
    privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
    membershipHistory: [
      {
        id: `mh-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'Application Submitted',
        description: 'Submitted digital self-registration on AGILA Hub portal.',
        clubName: 'Bantayog Elite Eagles Club',
        recordedBy: 'Self Registration',
      },
    ],
    passwordHash: passHash,
    passwordSalt: salt,
    qrOpaqueCode: qrToken,
    failedLoginAttempts: 0,
  };

  db.members.unshift(newMember);
  saveDatabase();

  appendAuditLog({
    actorId: newId,
    actorName: `${newMember.firstName} ${newMember.lastName}`,
    actorPosition: 'Applicant',
    action: 'MEMBER_REGISTER',
    resourceType: 'Member',
    resourceId: newId,
    scope: 'Club:BEEC',
    result: 'Success',
    ip: req.ip,
  });

  const { passwordHash: _ph, passwordSalt: _ps, ...safeMember } = newMember;
  res.status(201).json(safeMember);
});

// Member Approval (Club Secretary / President Only)
apiRouter.post(
  '/members/:id/approve',
  authenticateRequest,
  requirePermission('MEMBER_APPROVE', 'Club'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = getDatabase();
    const member = db.members.find((m) => m.id === id);

    if (!member) {
      res.status(404).json({ error: 'Applicant record not found.' });
      return;
    }

    const beforeState = { status: member.membershipStatus };
    const verifiedNumber = member.membershipNumber.replace('TFOE-APP-', 'TFOE-2026-');
    const verifiedCardId = member.membershipCardId.replace('BEEC-APP-', 'BEEC-2026-');

    member.membershipStatus = 'Active';
    member.membershipNumber = verifiedNumber;
    member.membershipCardId = verifiedCardId;
    member.dateInducted = new Date().toISOString().split('T')[0];
    member.positions = ['Regular Eagle Member'];
    member.roles = ['Member'];
    member.permissions = [
      'MEMBER_VIEW_SELF',
      'MEMBER_EDIT_SELF',
      'DIGITAL_ID_VIEW',
      'ATTENDANCE_VIEW_SELF',
      'MEMBER_DIRECTORY_VIEW',
      'FINANCE_VIEW_SELF',
      'DOCUMENT_VIEW',
      'CONSTITUTION_VIEW',
      'CONSTITUTION_AI_ASK',
    ];

    member.qrOpaqueCode = signQRPayload({
      memberId: member.id,
      memberNumber: verifiedNumber,
      clubCode: 'BEEC',
      issuedAt: Date.now(),
      nonce: crypto.randomBytes(8).toString('hex'),
    });

    member.membershipHistory.push({
      id: `mh-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Inducted & Ratified',
      description: `Application approved and inducted by ${req.user!.nickname} (${req.user!.positions[0] || 'Officer'}). Official ID: ${verifiedCardId}`,
      clubName: 'Bantayog Elite Eagles Club',
      recordedBy: req.user!.nickname,
    });

    saveDatabase();

    appendAuditLog({
      actorId: req.user!.id,
      actorName: `${req.user!.firstName} ${req.user!.lastName}`,
      actorPosition: req.user!.positions[0] || 'Officer',
      action: 'MEMBER_APPROVE',
      resourceType: 'Member',
      resourceId: member.id,
      scope: 'Club:BEEC',
      result: 'Success',
      ip: req.ip,
      beforeState,
      afterState: { status: 'Active', verifiedNumber, verifiedCardId },
    });

    const { passwordHash: _ph, passwordSalt: _ps, ...safeMember } = member;
    res.json({ success: true, member: safeMember });
  }
);

// Member Rejection
apiRouter.post(
  '/members/:id/reject',
  authenticateRequest,
  requirePermission('MEMBER_APPROVE', 'Club'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const db = getDatabase();
    const member = db.members.find((m) => m.id === id);

    if (!member) {
      res.status(404).json({ error: 'Applicant record not found.' });
      return;
    }

    member.membershipStatus = 'Inactive';
    member.membershipHistory.push({
      id: `mh-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Status Change',
      description: `Application rejected by ${req.user!.nickname}. Reason: ${reason || 'Incomplete onboarding dossier'}`,
      clubName: 'Bantayog Elite Eagles Club',
      recordedBy: req.user!.nickname,
    });

    saveDatabase();

    appendAuditLog({
      actorId: req.user!.id,
      actorName: `${req.user!.firstName} ${req.user!.lastName}`,
      actorPosition: req.user!.positions[0] || 'Officer',
      action: 'MEMBER_REJECT',
      resourceType: 'Member',
      resourceId: member.id,
      scope: 'Club:BEEC',
      result: 'Success',
      ip: req.ip,
      afterState: { reason, status: 'Inactive' },
    });

    res.json({ success: true, message: 'Applicant rejected.' });
  }
);

// Update Member Profile (Self or Admin)
apiRouter.patch('/members/:id', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isSelf = req.user!.id === id;
  const isOfficer = req.user!.roles.includes('President') || req.user!.roles.includes('Secretary') || req.user!.roles.includes('Master_Admin');

  if (!isSelf && !isOfficer) {
    res.status(403).json({ error: 'Forbidden: You can only edit your own profile.' });
    return;
  }

  const db = getDatabase();
  const member = db.members.find((m) => m.id === id);
  if (!member) {
    res.status(404).json({ error: 'Member not found.' });
    return;
  }

  const updates = req.body;
  if (isSelf && !isOfficer) {
    // Regular members can only update contact info & privacy settings
    if (updates.mobile) member.mobile = updates.mobile;
    if (updates.email) member.email = updates.email;
    if (updates.address) member.address = updates.address;
    if (updates.occupation) member.occupation = updates.occupation;
    if (updates.companyBusiness) member.companyBusiness = updates.companyBusiness;
    if (updates.emergencyContact) member.emergencyContact = updates.emergencyContact;
    if (updates.privacySettings) member.privacySettings = { ...member.privacySettings, ...updates.privacySettings };
  } else {
    // Officers can update all fields
    Object.assign(member, updates);
  }

  saveDatabase();

  appendAuditLog({
    actorId: req.user!.id,
    actorName: `${req.user!.firstName} ${req.user!.lastName}`,
    actorPosition: req.user!.positions[0] || 'Member',
    action: 'MEMBER_PROFILE_UPDATED',
    resourceType: 'Member',
    resourceId: member.id,
    scope: member.primaryClubId,
    result: 'Success',
    ip: req.ip,
  });

  const { passwordHash: _ph, passwordSalt: _ps, ...safeMember } = member;
  res.json({ success: true, member: safeMember });
});

// ==========================================
// 3. MEETINGS & CRYPTOGRAPHIC ATTENDANCE
// ==========================================

apiRouter.get('/meetings', authenticateRequest, (_req, res) => {
  const db = getDatabase();
  res.json(db.meetings);
});

apiRouter.post(
  '/meetings',
  authenticateRequest,
  requirePermission('ATTENDANCE_ADMIN', 'Club'),
  (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const newMeeting = {
      ...req.body,
      id: `meet-${Date.now()}`,
      scope: req.body.scope || 'Club',
      clubId: req.user!.primaryClubId,
      createdBy: `${req.user!.nickname} (${req.user!.positions[0] || 'Officer'})`,
      qrCheckinCode: `tfoe-qr-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Scheduled',
    };
    db.meetings.unshift(newMeeting);
    saveDatabase();

    appendAuditLog({
      actorId: req.user!.id,
      actorName: `${req.user!.firstName} ${req.user!.lastName}`,
      actorPosition: req.user!.positions[0] || 'Officer',
      action: 'MEETING_CREATE',
      resourceType: 'Meeting',
      resourceId: newMeeting.id,
      scope: 'Club:BEEC',
      result: 'Success',
      ip: req.ip,
      afterState: { title: newMeeting.title, date: newMeeting.date },
    });

    res.status(201).json(newMeeting);
  }
);

apiRouter.get('/meetings/:id/attendance', authenticateRequest, (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  const records = db.attendanceRecords.filter((a) => a.meetingId === id);
  res.json(records);
});

// Server-Side Cryptographic QR Scan Validation (v2 token + expiry + nonce replay check)
apiRouter.post(
  '/attendance/scan',
  authenticateRequest,
  requirePermission('ATTENDANCE_SCAN', 'Club'),
  (req: AuthenticatedRequest, res: Response) => {
    const { qrToken, meetingId, status = 'Present' } = req.body;
    if (!qrToken || !meetingId) {
      res.status(400).json({ error: 'qrToken and meetingId are required.' });
      return;
    }

    const verification = verifyQRToken(qrToken);
    if (!verification.valid || !verification.payload) {
      res.status(400).json({ error: `QR Verification Failed: ${verification.error}` });
      return;
    }

    const { memberId, nonce } = verification.payload;

    // Check DB persistent nonce registry for replay protection
    if (isNonceUsedInDB(nonce)) {
      res.status(409).json({
        error: 'Replay attack detected: QR code nonce has already been consumed for attendance.',
      });
      return;
    }

    const db = getDatabase();
    const meeting = db.meetings.find((m) => m.id === meetingId);
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found.' });
      return;
    }

    const targetMember = db.members.find((m) => m.id === memberId);
    if (!targetMember) {
      res.status(404).json({ error: 'Member not found in authoritative registry.' });
      return;
    }

    // Mark nonce as consumed both in memory and persistent storage
    consumeNonce(nonce);
    recordConsumedNonce(nonce, targetMember.id, meetingId);

    // Check if record exists
    const existingIndex = db.attendanceRecords.findIndex(
      (a) => a.meetingId === meetingId && a.memberId === targetMember.id
    );

    const record = {
      id: existingIndex >= 0 ? db.attendanceRecords[existingIndex].id : `att-${Date.now()}`,
      meetingId,
      memberId: targetMember.id,
      memberName: `${targetMember.firstName} ${targetMember.lastName}`,
      memberNickname: targetMember.nickname,
      memberNumber: targetMember.membershipNumber,
      method: 'QR Scan' as const,
      status: status || 'Present',
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST',
      recordedBy: `${req.user!.gender === 'Female' ? 'Ate' : 'Kuya'} ${req.user!.nickname} (${req.user!.positions[0] || 'Officer'})`,
    };

    if (existingIndex >= 0) {
      db.attendanceRecords[existingIndex] = record;
    } else {
      db.attendanceRecords.unshift(record);
    }
    saveDatabase();

    appendAuditLog({
      actorId: req.user!.id,
      actorName: `${req.user!.firstName} ${req.user!.lastName}`,
      actorPosition: req.user!.positions[0] || 'Officer',
      action: 'RECORD_ATTENDANCE_QR',
      resourceType: 'AttendanceRecord',
      resourceId: record.id,
      scope: 'Club:BEEC',
      result: 'Success',
      ip: req.ip,
      afterState: { targetMember: targetMember.membershipNumber, meetingId, status: record.status },
    });

    res.json({
      success: true,
      message: `Verified: ${targetMember.firstName} ${targetMember.lastName} checked in as ${record.status}.`,
      record,
    });
  }
);

// Attendance Corrections Workflow
apiRouter.get('/attendance/corrections', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const isOfficer = req.user!.roles.includes('Secretary') || req.user!.roles.includes('President');
  if (isOfficer) {
    res.json(db.attendanceCorrections);
  } else {
    res.json(db.attendanceCorrections.filter((c) => c.memberId === req.user!.id));
  }
});

apiRouter.post('/attendance/corrections', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const { attendanceId, meetingId, reason, requestedStatus } = req.body;
  const db = getDatabase();
  const meeting = db.meetings.find((m) => m.id === meetingId);

  const correction = {
    id: `corr-${Date.now()}`,
    attendanceId,
    meetingId,
    meetingTitle: meeting?.title || 'Assembly',
    memberId: req.user!.id,
    memberName: `${req.user!.firstName} ${req.user!.lastName}`,
    requestedBy: req.user!.nickname,
    reason,
    oldValue: 'Absent',
    requestedValue: requestedStatus,
    approvalStatus: 'Pending' as const,
    requestedAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST',
  };

  db.attendanceCorrections.unshift(correction);
  saveDatabase();

  appendAuditLog({
    actorId: req.user!.id,
    actorName: `${req.user!.firstName} ${req.user!.lastName}`,
    actorPosition: req.user!.positions[0] || 'Member',
    action: 'ATTENDANCE_CORRECTION_REQUESTED',
    resourceType: 'AttendanceCorrection',
    resourceId: correction.id,
    scope: 'Club:BEEC',
    result: 'Success',
    ip: req.ip,
  });

  res.status(201).json(correction);
});

apiRouter.post(
  '/attendance/corrections/:id/decide',
  authenticateRequest,
  requirePermission('ATTENDANCE_CORRECTION_MANAGE', 'Club'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { decision } = req.body; // 'Approved' | 'Rejected'
    const db = getDatabase();
    const corr = db.attendanceCorrections.find((c) => c.id === id);

    if (!corr) {
      res.status(404).json({ error: 'Correction request not found.' });
      return;
    }

    corr.approvalStatus = decision;
    corr.approvedBy = req.user!.nickname;
    corr.decidedAt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST';

    // If approved, update or insert corresponding attendance record
    if (decision === 'Approved') {
      const existing = db.attendanceRecords.find((a) => a.id === corr.attendanceId);
      if (existing) {
        existing.status = corr.requestedValue;
        existing.notes = `Corrected by ${req.user!.nickname}. Reason: ${corr.reason}`;
      } else {
        db.attendanceRecords.unshift({
          id: `att-corr-${Date.now()}`,
          meetingId: corr.meetingId,
          memberId: corr.memberId,
          memberName: corr.memberName,
          memberNickname: corr.requestedBy,
          memberNumber: 'TFOE-MEMBER',
          method: 'Manual Entry',
          status: corr.requestedValue,
          timestamp: corr.decidedAt,
          recordedBy: req.user!.nickname,
          notes: `Correction approved: ${corr.reason}`,
        });
      }
    }

    saveDatabase();

    appendAuditLog({
      actorId: req.user!.id,
      actorName: `${req.user!.firstName} ${req.user!.lastName}`,
      actorPosition: req.user!.positions[0] || 'Officer',
      action: 'ATTENDANCE_CORRECTION_DECIDED',
      resourceType: 'AttendanceCorrection',
      resourceId: corr.id,
      scope: 'Club:BEEC',
      result: 'Success',
      ip: req.ip,
      afterState: { decision },
    });

    res.json({ success: true, correction: corr });
  }
);

// ==========================================
// 4. COMMUNITY SERVICE & TASK TRACKING WORKFLOWS
// ==========================================

apiRouter.get('/projects', authenticateRequest, (_req, res) => {
  const db = getDatabase();
  res.json(db.projects);
});

apiRouter.post(
  '/projects',
  authenticateRequest,
  requirePermission('COMMUNITY_SERVICE_MANAGE', 'Club'),
  (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const newProj = {
      ...req.body,
      id: `proj-${Date.now()}`,
      clubId: req.user!.primaryClubId,
      tasks: [],
      volunteers: [
        {
          memberId: req.user!.id,
          memberName: `${req.user!.firstName} ${req.user!.lastName}`,
          memberNickname: req.user!.nickname,
          role: 'Project Proponent',
          hoursLogged: 0,
          checkedIn: true,
        },
      ],
    };
    db.projects.unshift(newProj);
    saveDatabase();

    appendAuditLog({
      actorId: req.user!.id,
      actorName: `${req.user!.firstName} ${req.user!.lastName}`,
      actorPosition: req.user!.positions[0] || 'Officer',
      action: 'CREATE_PROJECT',
      resourceType: 'CommunityServiceProject',
      resourceId: newProj.id,
      scope: 'Club:BEEC',
      result: 'Success',
      ip: req.ip,
      afterState: { title: newProj.title, category: newProj.category },
    });

    res.status(201).json(newProj);
  }
);

apiRouter.post(
  '/projects/:id/tasks',
  authenticateRequest,
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = getDatabase();
    const proj = db.projects.find((p) => p.id === id);
    if (!proj) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const newTask = {
      ...req.body,
      id: `task-${Date.now()}`,
      projectId: id,
      createdAt: new Date().toISOString().split('T')[0],
      status: req.body.status || 'To Do',
    };

    proj.tasks.push(newTask);
    saveDatabase();

    appendAuditLog({
      actorId: req.user!.id,
      actorName: `${req.user!.firstName} ${req.user!.lastName}`,
      actorPosition: req.user!.positions[0] || 'Member',
      action: 'CREATE_TASK',
      resourceType: 'ProjectTask',
      resourceId: newTask.id,
      scope: 'Club:BEEC',
      result: 'Success',
      ip: req.ip,
      afterState: { title: newTask.title, assignee: newTask.assigneeNickname },
    });

    res.status(201).json(newTask);
  }
);

apiRouter.patch('/projects/:id/tasks/:taskId', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const { id, taskId } = req.params;
  const { status } = req.body;
  const db = getDatabase();
  const proj = db.projects.find((p) => p.id === id);
  if (!proj) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const task = proj.tasks.find((t: any) => t.id === taskId);
  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const oldStatus = task.status;
  task.status = status;
  saveDatabase();

  appendAuditLog({
    actorId: req.user!.id,
    actorName: `${req.user!.firstName} ${req.user!.lastName}`,
    actorPosition: req.user!.positions[0] || 'Member',
    action: 'UPDATE_TASK_STATUS',
    resourceType: 'ProjectTask',
    resourceId: taskId,
    scope: 'Club:BEEC',
    result: 'Success',
    ip: req.ip,
    beforeState: { status: oldStatus },
    afterState: { status },
  });

  res.json({ success: true, task });
});

apiRouter.post('/projects/:id/volunteers', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const db = getDatabase();
  const proj = db.projects.find((p) => p.id === id);
  if (!proj) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const existing = proj.volunteers.find((v: any) => v.memberId === req.user!.id);
  if (existing) {
    existing.role = role || existing.role;
    existing.checkedIn = true;
  } else {
    proj.volunteers.push({
      memberId: req.user!.id,
      memberName: `${req.user!.firstName} ${req.user!.lastName}`,
      memberNickname: req.user!.nickname,
      role: role || 'Volunteer',
      hoursLogged: 4,
      checkedIn: true,
    });
  }

  saveDatabase();
  res.json({ success: true, project: proj });
});

// ==========================================
// 5. TRUE DOUBLE-ENTRY FINANCIAL ACCOUNTING
// ==========================================

apiRouter.get('/finance/ledger', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const isOfficer =
    req.user!.roles.includes('Treasurer') ||
    req.user!.roles.includes('President') ||
    req.user!.roles.includes('Auditor') ||
    req.user!.roles.includes('Master_Admin');

  const db = getDatabase();

  if (isOfficer) {
    res.json(db.transactions);
  } else {
    // Regular members only see their personal dues receipts
    const memberTx = db.transactions.filter((t) => t.memberId === req.user!.id);
    res.json(memberTx);
  }
});

apiRouter.get('/finance/accounts', authenticateRequest, (_req, res) => {
  const db = getDatabase();
  res.json(db.chartOfAccounts);
});

apiRouter.get('/finance/journal-entries', authenticateRequest, requirePermission('FINANCE_REPORT'), (_req, res) => {
  const db = getDatabase();
  res.json(db.journalEntries);
});

apiRouter.get('/finance/trial-balance', authenticateRequest, requirePermission('FINANCE_REPORT'), (_req, res) => {
  const trialBalance = getTrialBalance();
  res.json(trialBalance);
});

// Post Verified Payment with Balanced Double-Entry Journal Entry
apiRouter.post(
  '/finance/transactions',
  authenticateRequest,
  requirePermission('FINANCE_RECORD_PAYMENT', 'Club'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        memberId,
        memberName,
        memberNumber,
        type,
        amount,
        referenceNumber,
        paymentMethod,
        date,
        notes,
        lines,
      } = req.body;

      if (!amount || !referenceNumber || !type) {
        res.status(400).json({ error: 'Amount, Reference Number, and Transaction Type are required.' });
        return;
      }

      // Default double-entry lines if not provided explicitly:
      // Debit: 1010 Cash & Bank Balances (Asset increases)
      // Credit: 4010 Membership Dues Revenue (or 2010 Regional Payable if regional dues)
      const creditAccount = type.toLowerCase().includes('regional') ? '2010' : '4010';
      const resolvedLines = lines || [
        { accountCode: '1010', debit: Number(amount), credit: 0, memo: paymentMethod },
        { accountCode: creditAccount, debit: 0, credit: Number(amount), memo: type },
      ];

      const { transaction, journalEntry } = postDoubleEntryTransaction({
        clubId: req.user!.primaryClubId,
        memberId,
        memberName,
        memberNumber,
        type,
        amount: Number(amount),
        referenceNumber,
        paymentMethod,
        date: date || new Date().toISOString().split('T')[0],
        recordedBy: `${req.user!.nickname} (${req.user!.positions[0] || 'Treasurer'})`,
        notes,
        lines: resolvedLines,
      });

      appendAuditLog({
        actorId: req.user!.id,
        actorName: `${req.user!.firstName} ${req.user!.lastName}`,
        actorPosition: req.user!.positions[0] || 'Officer',
        action: 'FINANCE_TRANSACTION_RECORDED',
        resourceType: 'FinancialTransaction',
        resourceId: transaction.id,
        scope: 'Club:BEEC',
        result: 'Success',
        ip: req.ip,
        afterState: { amount, referenceNumber, journalEntryId: journalEntry.id },
      });

      res.status(201).json({ success: true, transaction, journalEntry });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Financial Reversal (Strict immutability: posts reversing journal entry, never deletes historical entries)
apiRouter.post(
  '/finance/reversal',
  authenticateRequest,
  requirePermission('FINANCE_MANAGE', 'Club'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { transactionId, reason } = req.body;
      if (!transactionId || !reason) {
        res.status(400).json({ error: 'transactionId and reason are required.' });
        return;
      }

      const { original, reversal, journalEntry } = reverseFinancialTransaction(
        transactionId,
        `${req.user!.nickname} (${req.user!.positions[0] || 'Treasurer'})`,
        reason
      );

      appendAuditLog({
        actorId: req.user!.id,
        actorName: `${req.user!.firstName} ${req.user!.lastName}`,
        actorPosition: req.user!.positions[0] || 'Officer',
        action: 'FINANCE_TRANSACTION_REVERSED',
        resourceType: 'FinancialTransaction',
        resourceId: original.id,
        scope: 'Club:BEEC',
        result: 'Success',
        ip: req.ip,
        afterState: { reason, reversalTxId: reversal.id, reversalJeId: journalEntry.id },
      });

      res.json({ success: true, original, reversal, journalEntry });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// ==========================================
// 6. NATIONAL e-CONSTITUTION & AI RAG
// ==========================================

apiRouter.get('/constitution/data', (_req, res) => {
  const db = getDatabase();
  const current = db.constitutionVersions.find((v) => v.isCurrent) || db.constitutionVersions[0];
  res.json(current);
});

apiRouter.get('/constitution/versions', (_req, res) => {
  const db = getDatabase();
  res.json(db.constitutionVersions);
});

apiRouter.get('/constitution/sync-runs', (_req, res) => {
  const db = getDatabase();
  res.json(db.constitutionSyncRuns);
});

// Trigger Official Synchronization (Requires CONSTITUTION_SOURCE_MANAGE and Constitutional Authority)
apiRouter.post(
  '/constitution/sync',
  authenticateRequest,
  requirePermission('CONSTITUTION_SOURCE_MANAGE', 'National'),
  async (req: AuthenticatedRequest, res: Response) => {
    const adapter = new ConstitutionSourceAdapter();
    const result = await adapter.executeSync(req.user!.id, `${req.user!.firstName} ${req.user!.lastName}`);
    res.json(result);
  }
);

// Rollback to specific ratified Constitution version (Requires CONSTITUTION_ROLLBACK and Constitutional Authority)
apiRouter.post(
  '/constitution/rollback',
  authenticateRequest,
  requirePermission('CONSTITUTION_ROLLBACK', 'National'),
  (req: AuthenticatedRequest, res: Response) => {
    const { versionId, reason } = req.body;
    if (!versionId || !reason) {
      res.status(400).json({ error: 'versionId and reason are required.' });
      return;
    }

    try {
      const adapter = new ConstitutionSourceAdapter();
      const result = adapter.rollbackToVersion(
        versionId,
        req.user!.id,
        `${req.user!.firstName} ${req.user!.lastName}`,
        reason
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Dynamic Constitution AI RAG Query Endpoint
apiRouter.post('/constitution/ask', async (req, res) => {
  const { question, memberName } = req.body;
  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Question is required.' });
    return;
  }

  const queryNormalized = question.trim();
  const db = getDatabase();
  const activeVersion = db.constitutionVersions.find((v) => v.isCurrent) || db.constitutionVersions[0];

  // Dynamic search over CURRENT active version's articles and sections (NO local hardcoded files)
  const tokens = queryNormalized.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const scoredSections: Array<{ section: any; score: number }> = [];

  for (const article of activeVersion.articles || []) {
    for (const section of article.sections || []) {
      const textToSearch = `${article.title} ${section.title} ${section.content}`.toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (textToSearch.includes(token)) {
          score += 1;
        }
      }
      if (score > 0) {
        scoredSections.push({ section, score });
      }
    }
  }

  scoredSections.sort((a, b) => b.score - a.score);
  const topHits = scoredSections.slice(0, 3).map((h) => h.section);

  const isClearlyOutOfScope =
    topHits.length === 0 ||
    (/weather|recipe|bitcoin|cricket|nba|crypto|movie|joke|football/i.test(queryNormalized) &&
      !/eagle|constitution|officer|dues|gmm|member|assembly|charter/i.test(queryNormalized));

  if (isClearlyOutOfScope && !/who|what|how|where|when|can|is/i.test(queryNormalized)) {
    res.json({
      answer: 'I could not find a provision addressing this question in the current indexed e-Constitution.',
      citations: [],
      version: activeVersion.version,
      sourceSections: [],
      queryId: `q-${Date.now()}`,
      model: 'e-Constitution Guard',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const contextSnippet = topHits
    .map((s) => `[${s.articleRoman}, Section ${s.sectionNumber} - ${s.title}]\n${s.content}`)
    .join('\n\n');

  const citations = topHits.map((s) => `${s.articleRoman}, Section ${s.sectionNumber} (${s.title})`);

  if (ai && topHits.length > 0) {
    try {
      const systemInstruction = `You are Constitution AI, the official Retrieval-Augmented Generation system for The Fraternal Order of Eagles - Philippine Eagles, Inc. (TFOE-PE, Inc.).
Your answers must be grounded strictly and exclusively in the provided official e-Constitution provisions (Version: ${activeVersion.version}).
- Always cite the exact Article and Section (e.g. "Article IV, Section 3").
- Always mention the dynamic e-Constitution version (${activeVersion.version}).
- Always address the fraternal member respectfully as Kuya or Ate.
- CRITICAL GUARDRAIL: If the provided provisions do not explicitly answer the question or if the question is unaddressed in the text, you MUST respond EXACTLY:
"I could not find a provision addressing this question in the current indexed e-Constitution."
- Never hallucinate, never invent constitutional rulings, and never give personal opinions.`;

      const prompt = `Official Indexed Constitution Provisions Context:\n${contextSnippet}\n\nMember Inquirer: ${
        memberName || 'Eagle Brother/Sister'
      }\nQuestion: "${queryNormalized}"\n\nProvide a concise, formal, and cited answer based ONLY on the provisions above.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction, temperature: 0.2 },
      });

      const responseText = response.text || '';

      res.json({
        answer: responseText.trim(),
        citations,
        version: activeVersion.version,
        sourceSections: topHits,
        queryId: `q-${Date.now()}`,
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString(),
      });
      return;
    } catch (err: any) {
      console.warn('Gemini RAG call fallback:', err?.message);
    }
  }

  // Resilient fallback grounded directly in the active version's provision
  if (topHits.length === 0) {
    res.json({
      answer: 'I could not find a provision addressing this question in the current indexed e-Constitution.',
      citations: [],
      version: activeVersion.version,
      sourceSections: [],
      queryId: `q-${Date.now()}`,
      model: 'Constitution-Search-Grounder',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const primary = topHits[0];
  const groundedAnswer = `According to the official National e-Constitution (${activeVersion.version}), **${primary.articleRoman}, Section ${primary.sectionNumber} (${primary.title})** provides:\n\n> "${primary.content}"\n\nThis authoritative provision governs the matter in question under TFOE-PE statutory rules.`;

  res.json({
    answer: groundedAnswer,
    citations,
    version: activeVersion.version,
    sourceSections: topHits,
    queryId: `q-${Date.now()}`,
    model: 'Constitution-RAG-Engine',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 7. SECURITY & APPEND-ONLY AUDIT TRAIL
// ==========================================

apiRouter.get('/audit', authenticateRequest, requirePermission('AUDIT_LOG_VIEW'), (_req, res) => {
  const db = getDatabase();
  res.json(db.auditLogs);
});

// Audit Hash-Chain Integrity Verifier
apiRouter.get('/audit/verify-chain', authenticateRequest, requirePermission('AUDIT_LOG_VIEW'), (_req, res) => {
  const db = getDatabase();
  const logs = db.auditLogs;
  let intact = true;
  let brokenIndex = -1;

  for (let i = 1; i < logs.length; i++) {
    const prev = logs[i - 1];
    const curr = logs[i];
    if (curr.previousHash !== prev.currentHash) {
      intact = false;
      brokenIndex = i;
      break;
    }
  }

  res.json({
    chainIntact: intact,
    totalEntries: logs.length,
    brokenIndex: brokenIndex >= 0 ? brokenIndex : null,
    latestHash: logs[logs.length - 1]?.currentHash,
  });
});

// ==========================================
// 8. ANNOUNCEMENTS & NOTIFICATIONS BACKEND
// ==========================================

apiRouter.get('/announcements', authenticateRequest, (_req, res) => {
  const db = getDatabase();
  res.json(db.announcements);
});

apiRouter.post(
  '/announcements',
  authenticateRequest,
  requirePermission('ANNOUNCEMENT_CREATE', 'Club'),
  (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const newAnn = {
      ...req.body,
      id: `ann-${Date.now()}`,
      publishAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST',
      createdBy: req.user!.id,
      authorName: `${req.user!.gender === 'Female' ? 'Ate' : 'Kuya'} ${req.user!.nickname} ${req.user!.lastName}`,
      authorPosition: req.user!.positions[0] || 'Club Officer',
      readBy: [req.user!.id],
    };
    db.announcements.unshift(newAnn);
    saveDatabase();

    appendAuditLog({
      actorId: req.user!.id,
      actorName: `${req.user!.firstName} ${req.user!.lastName}`,
      actorPosition: req.user!.positions[0] || 'Officer',
      action: 'ANNOUNCEMENT_CREATE',
      resourceType: 'Announcement',
      resourceId: newAnn.id,
      scope: req.user!.primaryClubId,
      result: 'Success',
      ip: req.ip,
      afterState: { title: newAnn.title, priority: newAnn.priority },
    });

    res.status(201).json(newAnn);
  }
);

apiRouter.get('/notifications', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const userNotifs = db.notifications.filter(
    (n) => n.recipientId === req.user!.id || n.targetScope === req.user!.primaryClubId || n.targetScope === 'National'
  );
  res.json(userNotifs);
});

apiRouter.post(
  '/notifications/send',
  authenticateRequest,
  requirePermission('ANNOUNCEMENT_PUBLISH', 'Club'),
  (req: AuthenticatedRequest, res: Response) => {
    const { title, body, type = 'Official Notice', targetScope = 'club-beec' } = req.body;
    const db = getDatabase();

    const notif = {
      id: `notif-${Date.now()}`,
      recipientId: req.user!.id,
      title,
      body,
      type,
      channel: 'IN_APP' as const,
      status: 'SENT' as const,
      targetScope,
      createdAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST',
    };

    db.notifications.unshift(notif);
    saveDatabase();

    res.status(201).json({ success: true, notification: notif });
  }
);

apiRouter.post('/notifications/:id/read', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const notif = db.notifications.find((n) => n.id === id);
  if (notif) {
    notif.status = 'READ';
    notif.readAt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST';
    saveDatabase();
  }
  res.json({ success: true });
});

apiRouter.post('/notifications/read-all', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.notifications.forEach((n) => {
    if (n.recipientId === req.user!.id) {
      n.status = 'READ';
      n.readAt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST';
    }
  });
  saveDatabase();
  res.json({ success: true });
});

// ==========================================
// 9. SECURE DOCUMENT STORAGE & AUDIT
// ==========================================

apiRouter.get('/documents', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const isOfficer =
    req.user!.roles.includes('President') ||
    req.user!.roles.includes('Secretary') ||
    req.user!.roles.includes('Club_Admin') ||
    req.user!.roles.includes('Treasurer');

  const visibleDocs = db.documents.filter((doc) => {
    if (doc.classification === 'Officers Only' && !isOfficer) return false;
    return true;
  });

  res.json(visibleDocs);
});

apiRouter.post(
  '/documents',
  authenticateRequest,
  requirePermission('DOCUMENT_MANAGE', 'Club'),
  (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const newDoc = {
      ...req.body,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
      downloadCount: 0,
      uploadedBy: `${req.user!.nickname} (${req.user!.positions[0] || 'Officer'})`,
    };
    db.documents.unshift(newDoc);
    saveDatabase();

    appendAuditLog({
      actorId: req.user!.id,
      actorName: `${req.user!.firstName} ${req.user!.lastName}`,
      actorPosition: req.user!.positions[0] || 'Officer',
      action: 'DOCUMENT_UPLOAD',
      resourceType: 'Document',
      resourceId: newDoc.id,
      scope: 'Club:BEEC',
      result: 'Success',
      ip: req.ip,
      afterState: { title: newDoc.title, classification: newDoc.classification },
    });

    res.status(201).json(newDoc);
  }
);

apiRouter.get('/documents/:id/download', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const doc = db.documents.find((d) => d.id === id);

  if (!doc) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }

  // Permission check
  const isOfficer =
    req.user!.roles.includes('President') ||
    req.user!.roles.includes('Secretary') ||
    req.user!.roles.includes('Club_Admin');

  if (doc.classification === 'Officers Only' && !isOfficer) {
    res.status(403).json({ error: 'Forbidden: Document classified as Officers Only.' });
    return;
  }

  doc.downloadCount = (doc.downloadCount || 0) + 1;
  saveDatabase();

  appendAuditLog({
    actorId: req.user!.id,
    actorName: `${req.user!.firstName} ${req.user!.lastName}`,
    actorPosition: req.user!.positions[0] || 'Member',
    action: 'DOCUMENT_DOWNLOAD',
    resourceType: 'Document',
    resourceId: doc.id,
    scope: doc.scope,
    result: 'Success',
    ip: req.ip,
  });

  res.json({ success: true, downloadUrl: `/files/${doc.id}.pdf`, doc });
});

// ==========================================
// 10. PRODUCTION BACKUP & DISASTER RECOVERY
// ==========================================

apiRouter.get(
  '/admin/backup',
  authenticateRequest,
  requirePermission('NATIONAL_ADMIN', 'National'),
  (req: AuthenticatedRequest, res: Response) => {
    const backupData = exportDatabaseBackup();

    appendAuditLog({
      actorId: req.user!.id,
      actorName: `${req.user!.firstName} ${req.user!.lastName}`,
      actorPosition: req.user!.positions[0] || 'Administrator',
      action: 'DATABASE_BACKUP_EXPORTED',
      resourceType: 'Database',
      resourceId: 'agila-primary',
      scope: 'National',
      result: 'Success',
      ip: req.ip,
      afterState: { checksum: backupData.checksum },
    });

    res.json(backupData);
  }
);

apiRouter.post(
  '/admin/restore',
  authenticateRequest,
  requirePermission('NATIONAL_ADMIN', 'National'),
  (req: AuthenticatedRequest, res: Response) => {
    const { backup, checksum } = req.body;
    if (!backup || !checksum) {
      res.status(400).json({ error: 'backup content and checksum are required.' });
      return;
    }

    try {
      restoreDatabaseBackup(
        backup,
        checksum,
        req.user!.id,
        `${req.user!.firstName} ${req.user!.lastName}`
      );
      res.json({ success: true, message: 'Database successfully restored from verified archive.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);
