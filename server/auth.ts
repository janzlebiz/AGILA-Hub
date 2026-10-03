import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getDatabase, saveDatabase, ServerMember, appendAuditLog } from './db';

export interface AuthenticatedRequest extends Request {
  user?: ServerMember;
  sessionToken?: string;
}

// 24-hour session lifetime
const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function createSession(memberId: string): string {
  const db = getDatabase();
  const token = `agila_sess_${crypto.randomBytes(32).toString('hex')}`;
  db.sessions[token] = {
    memberId,
    expiresAt: Date.now() + SESSION_LIFETIME_MS,
  };
  saveDatabase();
  return token;
}

export function revokeSession(token: string): void {
  const db = getDatabase();
  if (db.sessions[token]) {
    delete db.sessions[token];
    saveDatabase();
  }
}

export function authenticateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing or malformed Bearer token.' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const db = getDatabase();
  const session = db.sessions[token];

  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    return;
  }

  if (Date.now() > session.expiresAt) {
    delete db.sessions[token];
    saveDatabase();
    res.status(401).json({ error: 'Session expired. Please re-authenticate.' });
    return;
  }

  const member = db.members.find((m) => m.id === session.memberId);
  if (!member) {
    res.status(401).json({ error: 'Member record associated with session not found.' });
    return;
  }

  if (member.membershipStatus === 'Suspended' || member.membershipStatus === 'Deceased') {
    res.status(403).json({ error: `Account access restricted. Status: ${member.membershipStatus}` });
    return;
  }

  req.user = member;
  req.sessionToken = token;
  next();
}

// Constitutional governance actions that REQUIRE constitutional authority and are NOT granted by Master_Admin
const CONSTITUTIONAL_GOVERNANCE_PERMISSIONS = [
  'CONSTITUTION_SOURCE_MANAGE',
  'CONSTITUTION_ROLLBACK',
  'CONSTITUTION_RATIFY',
  'CONSTITUTION_AMEND',
];

// Scope & Permission Guard with strict separation of Technical Admin vs Constitutional Authority
export function requirePermission(permission: string, requiredScope?: 'Club' | 'Region' | 'National') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const isMasterAdmin = user.roles.includes('Master_Admin');
    const isConstitutionalAction = CONSTITUTIONAL_GOVERNANCE_PERMISSIONS.includes(permission);

    // CRITICAL: Master Admin alone does NOT convey constitutional authority
    if (isConstitutionalAction) {
      const hasConstitutionalAuthority =
        user.permissions.includes(permission) ||
        user.roles.includes('National_Constitution_Commission') ||
        user.roles.includes('National_Executive_Officer');

      if (!hasConstitutionalAuthority) {
        appendAuditLog({
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          actorPosition: user.positions[0] || 'Administrator',
          action: 'CONSTITUTIONAL_AUTHORITY_DENIED',
          resourceType: 'Constitution',
          resourceId: req.originalUrl,
          scope: 'National',
          result: 'Denied',
          ip: req.ip,
          afterState: { attemptedPermission: permission, isMasterAdmin },
        });

        res.status(403).json({
          error: 'Forbidden: Technical administration (Master Admin) does not confer constitutional authority under TFOE-PE statutory rules.',
          requiredAuthority: 'National Constitutional Commission or explicit constitutional resolution',
        });
        return;
      }
    } else {
      // For general operational permissions, check role/permission
      const hasPerm = isMasterAdmin || user.permissions.includes(permission);
      if (!hasPerm) {
        appendAuditLog({
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          actorPosition: user.positions[0] || 'Member',
          action: 'PERMISSION_DENIED',
          resourceType: 'API',
          resourceId: req.originalUrl,
          scope: user.primaryClubId,
          result: 'Denied',
          ip: req.ip,
          afterState: { attemptedPermission: permission },
        });

        res.status(403).json({
          error: `Forbidden: Insufficient privileges. Required permission: ${permission}`,
          permission,
        });
        return;
      }
    }

    // Organizational Scope Enforcement: National -> Region -> Club
    if (requiredScope === 'Club') {
      const targetClub = req.body?.clubId || req.query?.clubId || req.params?.clubId;
      if (targetClub && targetClub !== user.primaryClubId) {
        const isRegionalOrNational =
          user.roles.includes('Regional_Officer') ||
          user.roles.includes('National_Admin') ||
          user.roles.includes('Master_Admin');

        if (!isRegionalOrNational) {
          res.status(403).json({
            error: `Forbidden: Operation crosses organizational boundary. Action restricted to primary club (${user.primaryClubId}).`,
          });
          return;
        }
      }
    }

    if (requiredScope === 'Region') {
      const isRegionalOrNational =
        user.roles.includes('Regional_Officer') ||
        user.roles.includes('National_Admin') ||
        user.roles.includes('Master_Admin') ||
        user.positions.some((p) => p.toLowerCase().includes('regional') || p.toLowerCase().includes('governor'));

      if (!isRegionalOrNational) {
        res.status(403).json({ error: 'Forbidden: Operation restricted strictly to Regional Executive authority.' });
        return;
      }
    }

    if (requiredScope === 'National') {
      const isNational =
        user.roles.includes('National_Admin') ||
        user.roles.includes('Master_Admin') ||
        user.roles.includes('National_Constitution_Commission') ||
        user.positions.some((p) => p.toLowerCase().includes('national'));

      if (!isNational) {
        res.status(403).json({ error: 'Forbidden: Operation restricted strictly to National Executive authority.' });
        return;
      }
    }

    next();
  };
}
