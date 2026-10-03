import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Member,
  Club,
  Region,
  Organization,
  Meeting,
  AttendanceRecord,
  AttendanceCorrection,
  CommunityServiceProject,
  ProjectTask,
  ProjectTaskStatus,
  FinancialTransaction,
  Announcement,
  DocumentItem,
  AuditLogItem,
  NotificationItem,
  ConstitutionSyncRun,
  ConstitutionQueryRecord,
  AttendanceStatus,
  AttendanceMethod,
} from '../types';
import {
  SEED_ORGANIZATION,
  SEED_REGION,
  SEED_CLUB,
  SEED_MEMBERS,
  SEED_MEETINGS,
  SEED_ATTENDANCE,
  SEED_PROJECTS,
  SEED_FINANCIAL_TRANSACTIONS,
  SEED_ANNOUNCEMENTS,
  SEED_DOCUMENTS,
  SEED_AUDIT_LOGS,
  SEED_SYNC_RUNS,
} from '../data/seedData';

interface AppContextType {
  currentUser: Member;
  setCurrentUser: (member: Member) => void;
  sessionToken: string | null;
  organization: Organization;
  region: Region;
  club: Club;
  allMembers: Member[];
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  loginWithCredentials: (membershipNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  switchUser: (memberId: string) => Promise<void>;
  logout: () => Promise<void>;

  meetings: Meeting[];
  attendanceRecords: AttendanceRecord[];
  attendanceCorrections: AttendanceCorrection[];
  recordAttendance: (
    meetingId: string,
    memberId: string,
    status: AttendanceStatus,
    method: AttendanceMethod,
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;
  requestAttendanceCorrection: (
    attendanceId: string,
    meetingId: string,
    reason: string,
    requestedStatus: AttendanceStatus
  ) => Promise<void>;
  decideAttendanceCorrection: (correctionId: string, decision: 'Approved' | 'Rejected') => Promise<void>;
  createMeeting: (newMeeting: Omit<Meeting, 'id' | 'qrCheckinCode'>) => Promise<void>;

  projects: CommunityServiceProject[];
  addProject: (newProject: Omit<CommunityServiceProject, 'id' | 'tasks' | 'volunteers'>) => Promise<void>;
  addTaskToProject: (projectId: string, task: Omit<ProjectTask, 'id' | 'projectId' | 'createdAt'>) => Promise<void>;
  updateTaskStatus: (projectId: string, taskId: string, newStatus: ProjectTaskStatus) => Promise<void>;
  joinProjectVolunteer: (projectId: string, role: string) => Promise<void>;
  updateProjectStatus: (projectId: string, status: 'Planning' | 'Ongoing' | 'Completed') => Promise<void>;

  registerApplicant: (applicantData: Partial<Member>) => Promise<void>;
  approveMember: (memberId: string) => Promise<void>;
  rejectMember: (memberId: string, reason: string) => Promise<void>;
  updateMemberProfile: (memberId: string, updates: Partial<Member>) => Promise<void>;

  transactions: FinancialTransaction[];
  recordPayment: (payment: Omit<FinancialTransaction, 'id' | 'status'>) => Promise<void>;
  reverseTransaction: (transactionId: string, reason: string) => Promise<{ success: boolean; error?: string }>;

  announcements: Announcement[];
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'readBy'>) => Promise<void>;

  documents: DocumentItem[];
  addDocument: (doc: Omit<DocumentItem, 'id' | 'uploadedAt' | 'downloadCount'>) => Promise<void>;

  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  auditLogs: AuditLogItem[];
  logAuditEvent: (
    action: string,
    resourceType: string,
    resourceId: string,
    scope: string,
    result: 'Success' | 'Failed' | 'Denied',
    metadata?: Record<string, any>
  ) => void;

  constitutionSyncRuns: ConstitutionSyncRun[];
  constitutionQueries: ConstitutionQueryRecord[];
  triggerConstitutionSync: () => Promise<ConstitutionSyncRun>;
  rollbackConstitution: (versionId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  askConstitutionAI: (
    question: string
  ) => Promise<{ answer: string; citations: string[]; version: string; sourceSections: any[] }>;

  isQRScannerOpen: boolean;
  setIsQRScannerOpen: (open: boolean) => void;
  isRoleSwitcherOpen: boolean;
  setIsRoleSwitcherOpen: (open: boolean) => void;
  isDigitalIdModalOpen: boolean;
  setIsDigitalIdModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Member>(() => {
    return SEED_MEMBERS.find((m) => m.id === 'mem-camacho') || SEED_MEMBERS[0];
  });
  const [sessionToken, setSessionToken] = useState<string | null>(() => localStorage.getItem('agila_auth_token'));

  const [allMembers, setAllMembers] = useState<Member[]>(SEED_MEMBERS);
  const [meetings, setMeetings] = useState<Meeting[]>(SEED_MEETINGS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(SEED_ATTENDANCE);
  const [attendanceCorrections, setAttendanceCorrections] = useState<AttendanceCorrection[]>([]);
  const [projects, setProjects] = useState<CommunityServiceProject[]>(SEED_PROJECTS);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(SEED_FINANCIAL_TRANSACTIONS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(SEED_ANNOUNCEMENTS);
  const [documents, setDocuments] = useState<DocumentItem[]>(SEED_DOCUMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(SEED_AUDIT_LOGS);
  const [constitutionSyncRuns, setConstitutionSyncRuns] = useState<ConstitutionSyncRun[]>(SEED_SYNC_RUNS);
  const [constitutionQueries, setConstitutionQueries] = useState<ConstitutionQueryRecord[]>([]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      recipientId: currentUser.id,
      type: 'Meeting Reminder',
      title: 'Upcoming Regular GMM (Oct 10)',
      body: 'Bantayog Elite 2nd Regular GMM is scheduled for Saturday at 6:00 PM.',
      read: false,
      createdAt: '2026-10-02 09:00',
    },
  ]);

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState<boolean>(false);
  const [isDigitalIdModalOpen, setIsDigitalIdModalOpen] = useState<boolean>(false);

  // Authenticated fetch wrapper
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      if (sessionToken) {
        headers.set('Authorization', `Bearer ${sessionToken}`);
      }
      headers.set('Content-Type', 'application/json');
      return fetch(url, { ...options, headers });
    },
    [sessionToken]
  );

  // Authoritative data refresh from server
  const refreshBackendData = useCallback(async () => {
    if (!sessionToken) return;

    try {
      const [membersRes, meetingsRes, projectsRes, financeRes, announcementsRes, docsRes, auditRes, syncRunsRes] =
        await Promise.all([
          authFetch('/api/members'),
          authFetch('/api/meetings'),
          authFetch('/api/projects'),
          authFetch('/api/finance/ledger'),
          authFetch('/api/announcements'),
          authFetch('/api/documents'),
          authFetch('/api/audit'),
          authFetch('/api/constitution/sync-runs'),
        ]);

      if (membersRes.ok) setAllMembers(await membersRes.json());
      if (meetingsRes.ok) setMeetings(await meetingsRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (financeRes.ok) setTransactions(await financeRes.json());
      if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
      if (docsRes.ok) setDocuments(await docsRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (syncRunsRes.ok) setConstitutionSyncRuns(await syncRunsRes.json());
    } catch (err) {
      console.warn('Failed to refresh data from server:', err);
    }
  }, [authFetch, sessionToken]);

  // Login with authentic credentials (POST /api/auth/login)
  const loginWithCredentials = async (membershipNumber: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipNumber, password }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        setSessionToken(data.token);
        localStorage.setItem('agila_auth_token', data.token);
        setCurrentUser(data.member);
        return { success: true };
      }
      return { success: false, error: data.error || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // Initial bootstrap: verify existing token or login default user
  useEffect(() => {
    async function initSession() {
      const storedToken = localStorage.getItem('agila_auth_token');
      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.member);
            setSessionToken(storedToken);
            return;
          }
        } catch {
          // Token expired or invalid
        }
      }

      // Login default user (Chester Jan T. Camacho - Secretary)
      await loginWithCredentials('TFOE-2022-04198', 'Agila2026!');
    }

    initSession();
  }, []);

  useEffect(() => {
    if (sessionToken) {
      refreshBackendData();
    }
  }, [sessionToken, refreshBackendData]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Switch persona using authentic login credentials
  const switchUser = async (memberId: string) => {
    const target = allMembers.find((m) => m.id === memberId) || SEED_MEMBERS.find((m) => m.id === memberId);
    if (!target) return;

    await loginWithCredentials(target.membershipNumber, 'Agila2026!');
  };

  const logout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setSessionToken(null);
    localStorage.removeItem('agila_auth_token');
  };

  // Record Attendance (Server verifies cryptographic v2 HMAC QR token + nonce replay)
  const recordAttendance = async (
    meetingId: string,
    memberId: string,
    status: AttendanceStatus,
    _method: AttendanceMethod,
    _notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    const targetMember = allMembers.find((m) => m.id === memberId);
    if (!targetMember) return { success: false, message: 'Member not found.' };

    try {
      const res = await authFetch('/api/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: targetMember.qrOpaqueCode,
          meetingId,
          status,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshBackendData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Server rejected attendance.' };
    } catch (err: any) {
      return { success: false, message: `Network error: ${err.message}` };
    }
  };

  const requestAttendanceCorrection = async (
    attendanceId: string,
    meetingId: string,
    reason: string,
    requestedStatus: AttendanceStatus
  ) => {
    try {
      const res = await authFetch('/api/attendance/corrections', {
        method: 'POST',
        body: JSON.stringify({ attendanceId, meetingId, reason, requestedStatus }),
      });
      if (res.ok) {
        const corr = await res.json();
        setAttendanceCorrections((prev) => [corr, ...prev]);
      }
    } catch (err) {
      console.error('Failed to submit attendance correction:', err);
    }
  };

  const decideAttendanceCorrection = async (correctionId: string, decision: 'Approved' | 'Rejected') => {
    try {
      const res = await authFetch(`/api/attendance/corrections/${correctionId}/decide`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        await refreshBackendData();
        setAttendanceCorrections((prev) =>
          prev.map((c) => (c.id === correctionId ? { ...c, approvalStatus: decision } : c))
        );
      }
    } catch (err) {
      console.error('Failed to decide attendance correction:', err);
    }
  };

  const createMeeting = async (newMeetingData: Omit<Meeting, 'id' | 'qrCheckinCode'>) => {
    try {
      const res = await authFetch('/api/meetings', {
        method: 'POST',
        body: JSON.stringify(newMeetingData),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to create meeting:', err);
    }
  };

  // Community Service & Tasks
  const addProject = async (newProjectData: Omit<CommunityServiceProject, 'id' | 'tasks' | 'volunteers'>) => {
    try {
      const res = await authFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(newProjectData),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const addTaskToProject = async (
    projectId: string,
    taskData: Omit<ProjectTask, 'id' | 'projectId' | 'createdAt'>
  ) => {
    try {
      const res = await authFetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(taskData),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const updateTaskStatus = async (projectId: string, taskId: string, newStatus: ProjectTaskStatus) => {
    try {
      const res = await authFetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const joinProjectVolunteer = async (projectId: string, role: string) => {
    try {
      const res = await authFetch(`/api/projects/${projectId}/volunteers`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to join volunteer roster:', err);
    }
  };

  const updateProjectStatus = async (projectId: string, status: 'Planning' | 'Ongoing' | 'Completed') => {
    try {
      const res = await authFetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to update project status:', err);
    }
  };

  // Membership Workflows
  const registerApplicant = async (applicantData: Partial<Member>) => {
    try {
      const res = await fetch('/api/members/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicantData),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to register applicant:', err);
    }
  };

  const approveMember = async (memberId: string) => {
    try {
      const res = await authFetch(`/api/members/${memberId}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to approve member:', err);
    }
  };

  const rejectMember = async (memberId: string, reason: string) => {
    try {
      const res = await authFetch(`/api/members/${memberId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to reject applicant:', err);
    }
  };

  const updateMemberProfile = async (memberId: string, updates: Partial<Member>) => {
    try {
      const res = await authFetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to update member profile:', err);
    }
  };

  // Finance Workflows
  const recordPayment = async (paymentData: Omit<FinancialTransaction, 'id' | 'status'>) => {
    try {
      const res = await authFetch('/api/finance/transactions', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to record financial payment:', err);
    }
  };

  const reverseTransaction = async (transactionId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch('/api/finance/reversal', {
        method: 'POST',
        body: JSON.stringify({ transactionId, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshBackendData();
        return { success: true };
      }
      return { success: false, error: data.error || 'Reversal failed' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Announcements
  const createAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'readBy'>) => {
    try {
      const res = await authFetch('/api/announcements', {
        method: 'POST',
        body: JSON.stringify(announcementData),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to create announcement:', err);
    }
  };

  // Documents
  const addDocument = async (docData: Omit<DocumentItem, 'id' | 'uploadedAt' | 'downloadCount'>) => {
    try {
      const res = await authFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify(docData),
      });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    }
  };

  // Notifications
  const markNotificationAsRead = async (id: string) => {
    try {
      await authFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch {}
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await authFetch('/api/notifications/read-all', { method: 'POST' });
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Audit
  const logAuditEvent = (
    _action: string,
    _resourceType: string,
    _resourceId: string,
    _scope: string,
    _result: 'Success' | 'Failed' | 'Denied',
    _metadata?: Record<string, any>
  ) => {
    // Audit logging is authoritative on server-side and recorded automatically
  };

  // Constitution Synchronization & AI
  const triggerConstitutionSync = async (): Promise<ConstitutionSyncRun> => {
    const res = await authFetch('/api/constitution/sync', { method: 'POST' });
    const result = await res.json();
    await refreshBackendData();

    const run: ConstitutionSyncRun = {
      id: `sync-${Date.now()}`,
      sourceUrl: result.sourceUrl,
      startedAt: new Date().toLocaleTimeString(),
      completedAt: new Date().toLocaleTimeString(),
      status: result.status === 'VALIDATION_FAILED' ? 'FAILED' : result.status,
      previousHash: result.previousHash,
      newHash: result.newHash,
      versionDetected: result.versionDetected,
      recordsCreated: result.recordsCreated,
      error: result.error,
    };
    return run;
  };

  const rollbackConstitution = async (versionId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await authFetch('/api/constitution/rollback', {
        method: 'POST',
        body: JSON.stringify({ versionId, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshBackendData();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Rollback failed.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const askConstitutionAI = async (
    question: string
  ): Promise<{ answer: string; citations: string[]; version: string; sourceSections: any[] }> => {
    try {
      const res = await fetch('/api/constitution/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          memberId: currentUser.id,
          memberName: `${currentUser.gender === 'Female' ? 'Ate' : 'Kuya'} ${currentUser.nickname} ${currentUser.lastName}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const record: ConstitutionQueryRecord = {
          id: data.queryId || `q-${Date.now()}`,
          memberId: currentUser.id,
          memberName: currentUser.nickname,
          question,
          response: data.answer,
          sources: data.citations || [],
          model: data.model || 'Gemini 2.5 Flash',
          constitutionVersion: data.version || 'Dynamic Ratified',
          timestamp: new Date().toLocaleTimeString(),
        };
        setConstitutionQueries((prev) => [record, ...prev]);
        return data;
      }
    } catch (err) {
      console.warn('Constitution AI endpoint error:', err);
    }

    return {
      answer: 'I could not find a provision addressing this question in the current indexed e-Constitution.',
      citations: [],
      version: 'Authoritative Ratified Edition',
      sourceSections: [],
    };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        sessionToken,
        organization: SEED_ORGANIZATION,
        region: SEED_REGION,
        club: SEED_CLUB,
        allMembers,
        isOnline,
        setIsOnline,
        activeTab,
        setActiveTab,

        loginWithCredentials,
        switchUser,
        logout,

        meetings,
        attendanceRecords,
        attendanceCorrections,
        recordAttendance,
        requestAttendanceCorrection,
        decideAttendanceCorrection,
        createMeeting,

        projects,
        addProject,
        addTaskToProject,
        updateTaskStatus,
        joinProjectVolunteer,
        updateProjectStatus,

        registerApplicant,
        approveMember,
        rejectMember,
        updateMemberProfile,

        transactions,
        recordPayment,
        reverseTransaction,

        announcements,
        createAnnouncement,

        documents,
        addDocument,

        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,

        auditLogs,
        logAuditEvent,

        constitutionSyncRuns,
        constitutionQueries,
        triggerConstitutionSync,
        rollbackConstitution,
        askConstitutionAI,

        isQRScannerOpen,
        setIsQRScannerOpen,
        isRoleSwitcherOpen,
        setIsRoleSwitcherOpen,
        isDigitalIdModalOpen,
        setIsDigitalIdModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
