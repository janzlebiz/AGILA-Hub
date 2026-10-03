import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { hashPasswordSync, generateSalt, signQRPayload } from './security';
import {
  CONSTITUTION_ARTICLES,
  CONSTITUTION_PREAMBLE,
  OFFICIAL_CONSTITUTION_SOURCE,
  OFFICIAL_CONSTITUTION_VERSION,
  OFFICIAL_CONSTITUTION_HASH,
  OFFICIAL_CONSTITUTION_DATE,
} from '../src/data/constitutionData';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'agila_database.json');

export interface ServerMember {
  id: string;
  membershipNumber: string;
  membershipCardId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  nickname: string;
  gender: 'Male' | 'Female' | 'Other';
  birthdate: string;
  profilePhoto: string;
  mobile: string;
  email: string;
  address: string;
  occupation: string;
  companyBusiness: string;
  emergencyContact: {
    name: string;
    relation: string;
    mobile: string;
  };
  dateJoined: string;
  dateInducted: string;
  membershipStatus:
    | 'Active'
    | 'Inactive'
    | 'Suspended'
    | 'Resigned'
    | 'Transferred'
    | 'Deceased'
    | 'Honorary'
    | 'Pending Approval'
    | 'Other';
  previousClub?: string;
  primaryClubId: string;
  regionId: string;
  positions: string[];
  roles: string[];
  permissions: string[];
  privacySettings: {
    hideMobile: boolean;
    hideEmail: boolean;
    hideAddress: boolean;
  };
  membershipHistory: Array<{
    id: string;
    date: string;
    type: string;
    description: string;
    clubName: string;
    recordedBy: string;
  }>;
  passwordHash: string;
  passwordSalt: string;
  qrOpaqueCode: string;
  failedLoginAttempts: number;
  lockedUntil?: number;
}

export interface ServerAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorPosition: string;
  action: string;
  resourceType: string;
  resourceId: string;
  scope: string;
  result: 'Success' | 'Failed' | 'Denied';
  timestamp: string;
  ip: string;
  userAgent?: string;
  beforeState?: any;
  afterState?: any;
  previousHash: string;
  currentHash: string;
}

export interface DatabaseSchema {
  organization: {
    id: string;
    name: string;
    legalName: string;
    type: string;
    logo: string;
    description: string;
    motto: string;
  };
  region: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    logo: string;
    description: string;
    status: string;
  };
  club: {
    id: string;
    regionId: string;
    name: string;
    code: string;
    logo: string;
    banner: string;
    colors: { primary: string; secondary: string; accent: string };
    description: string;
    contactInfo: { email: string; phone: string; address: string };
    meetingSchedule: string;
    socialLinks: { facebook?: string; website?: string };
    charterDate: string;
    status: string;
  };
  members: ServerMember[];
  meetings: any[];
  attendanceRecords: any[];
  attendanceCorrections: any[];
  projects: any[];
  transactions: any[];
  chartOfAccounts: Array<{ code: string; name: string; type: string; normalBalance: string }>;
  journalEntries: Array<{
    id: string;
    entryNumber: string;
    entryDate: string;
    description: string;
    referenceNumber: string;
    createdBy: string;
    approvedBy?: string;
    status: 'Posted' | 'Reversed';
    reversalOf?: string;
    lines: Array<{ id: string; accountCode: string; accountName: string; debit: number; credit: number; memo?: string }>;
  }>;
  announcements: any[];
  notifications: Array<{
    id: string;
    recipientId: string;
    title: string;
    body: string;
    type: string;
    channel: string;
    status: 'SENT' | 'DELIVERED' | 'READ';
    targetScope?: string;
    createdAt: string;
    readAt?: string;
  }>;
  documents: any[];
  auditLogs: ServerAuditLog[];
  constitutionVersions: Array<{
    id: string;
    version: string;
    effectiveDate: string;
    sourceUrl: string;
    contentHash: string;
    preamble: string;
    articles: any[];
    isCurrent: boolean;
    syncTimestamp: string;
  }>;
  constitutionSyncRuns: any[];
  constitutionQueries: any[];
  usedQRNonces: Record<string, { memberId: string; meetingId: string; usedAt: string }>;
  sessions: Record<string, { memberId: string; expiresAt: number }>;
}

let dbInstance: DatabaseSchema | null = null;

// Initial Authoritative Officers Seed Data (Per supplied officer sheets)
function getInitialSeedData(): DatabaseSchema {
  const salt = generateSalt();
  const defaultPassHash = hashPasswordSync('Agila2026!', salt);

  const rawMembers: Array<Omit<ServerMember, 'passwordHash' | 'passwordSalt' | 'qrOpaqueCode' | 'failedLoginAttempts'>> = [
    {
      id: 'mem-aragon',
      membershipNumber: 'TFOE-2022-04101',
      membershipCardId: 'BEEC-2026-001',
      firstName: 'Joy',
      middleName: 'M.',
      lastName: 'Aragon',
      nickname: 'Joy',
      gender: 'Male',
      birthdate: '1980-04-12',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 917 555 1001',
      email: 'joy.aragon@bantayogeliteeagles.ph',
      address: 'Daet, Camarines Norte',
      occupation: 'Business Proprietor & Civic Leader',
      companyBusiness: 'Aragon Commercial Enterprises',
      emergencyContact: { name: 'Elena Aragon', relation: 'Spouse', mobile: '+63 917 555 1002' },
      dateJoined: '2022-03-18',
      dateInducted: '2022-04-09',
      membershipStatus: 'Active',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['Club President (2026-2028)'],
      roles: ['President', 'Club_Admin'],
      permissions: [
        'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
        'MEMBER_DIRECTORY_VIEW', 'MEMBER_APPROVE', 'MEMBER_RECORD_MANAGE', 'ATTENDANCE_ADMIN',
        'ANNOUNCEMENT_CREATE', 'ANNOUNCEMENT_PUBLISH', 'COMMUNITY_SERVICE_MANAGE', 'FINANCE_VIEW_CLUB',
        'DOCUMENT_MANAGE', 'REPORT_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
      ],
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
      membershipHistory: [
        { id: 'mh-1', date: '2022-03-18', type: 'Joined', description: 'Charter Member of Bantayog Elite Eagles Club', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'National Secretariat' },
        { id: 'mh-2', date: '2026-01-01', type: 'Position Assigned', description: 'Inducted as Club President (2026-2028 Term)', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'Regional Execom' },
      ],
    },
    {
      id: 'mem-rait',
      membershipNumber: 'TFOE-2022-04102',
      membershipCardId: 'BEEC-2026-002',
      firstName: 'Genmil',
      middleName: 'M.',
      lastName: 'Rait',
      nickname: 'Genmil',
      gender: 'Male',
      birthdate: '1982-08-19',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 918 555 2002',
      email: 'genmil.rait@bantayogeliteeagles.ph',
      address: 'Daet, Camarines Norte',
      occupation: 'Architectural Consultant',
      companyBusiness: 'Rait Designs & Construction',
      emergencyContact: { name: 'Rowena Rait', relation: 'Spouse', mobile: '+63 918 555 2003' },
      dateJoined: '2022-03-18',
      dateInducted: '2022-04-09',
      membershipStatus: 'Active',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['Club Vice President (2026-2028)'],
      roles: ['Vice_President', 'Club_Admin'],
      permissions: [
        'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
        'MEMBER_DIRECTORY_VIEW', 'MEMBER_APPROVE', 'ATTENDANCE_ADMIN', 'COMMUNITY_SERVICE_MANAGE',
        'DOCUMENT_VIEW', 'REPORT_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
      ],
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
      membershipHistory: [
        { id: 'mh-3', date: '2022-03-18', type: 'Joined', description: 'Charter Member of Bantayog Elite Eagles Club', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'National Secretariat' },
        { id: 'mh-4', date: '2026-01-01', type: 'Position Assigned', description: 'Installed as Club Vice President (2026-2028)', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'Pres. Joy Aragon' },
      ],
    },
    {
      id: 'mem-camacho',
      membershipNumber: 'TFOE-2022-04198',
      membershipCardId: 'BEEC-2026-003',
      firstName: 'Chester Jan',
      middleName: 'T.',
      lastName: 'Camacho',
      nickname: 'Chester',
      gender: 'Male',
      birthdate: '1984-06-15',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 917 888 3333',
      email: 'chester.camacho@gmail.com',
      address: 'F. Pimentel Ave, Daet, Camarines Norte',
      occupation: 'Civil Engineer & Corporate Executive',
      companyBusiness: 'Camacho Builders & Engineering',
      emergencyContact: { name: 'Maria Elena Camacho', relation: 'Spouse', mobile: '+63 917 888 3334' },
      dateJoined: '2022-03-18',
      dateInducted: '2022-04-09',
      membershipStatus: 'Active',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['Club Secretary (2026-2028)', 'Regional Protocol Deputy (BCNBR-1)'],
      roles: ['Secretary', 'Club_Admin', 'Regional_Officer'],
      permissions: [
        'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
        'MEMBER_DIRECTORY_VIEW', 'MEMBER_RECORD_MANAGE', 'MEMBER_APPROVE', 'ATTENDANCE_ADMIN',
        'ATTENDANCE_SCAN', 'ATTENDANCE_CORRECTION_MANAGE', 'ANNOUNCEMENT_CREATE', 'ANNOUNCEMENT_PUBLISH',
        'DOCUMENT_MANAGE', 'REPORT_VIEW', 'DATA_EXPORT', 'DATA_IMPORT', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
      ],
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
      membershipHistory: [
        { id: 'mh-5', date: '2022-03-18', type: 'Joined', description: 'Charter Member of Bantayog Elite Eagles Club', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'National Secretariat' },
        { id: 'mh-6', date: '2026-01-01', type: 'Position Assigned', description: 'Reappointed Club Secretary (2026-2028 Term)', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'Pres. Joy Aragon' },
      ],
    },
    {
      id: 'mem-talento',
      membershipNumber: 'TFOE-2022-04104',
      membershipCardId: 'BEEC-2026-004',
      firstName: 'Joenathan',
      middleName: 'L.',
      lastName: 'Talento',
      nickname: 'Joenathan',
      gender: 'Male',
      birthdate: '1986-09-10',
      profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 919 444 4004',
      email: 'joenathan.talento@bantayogeliteeagles.ph',
      address: 'Daet, Camarines Norte',
      occupation: 'Financial Consultant & CPA',
      companyBusiness: 'Talento Accountancy & Advisory',
      emergencyContact: { name: 'Aileen Talento', relation: 'Spouse', mobile: '+63 919 444 4005' },
      dateJoined: '2022-03-18',
      dateInducted: '2022-04-09',
      membershipStatus: 'Active',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['Club Treasurer (2026-2028)'],
      roles: ['Treasurer', 'Finance_Admin'],
      permissions: [
        'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
        'FINANCE_VIEW_SELF', 'FINANCE_MANAGE', 'FINANCE_RECORD_PAYMENT', 'FINANCE_REPORT',
        'REPORT_VIEW', 'DATA_EXPORT', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
      ],
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
      membershipHistory: [
        { id: 'mh-7', date: '2022-03-18', type: 'Joined', description: 'Charter Member of Bantayog Elite Eagles Club', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'National Secretariat' },
        { id: 'mh-8', date: '2026-01-01', type: 'Position Assigned', description: 'Installed as Club Treasurer (2026-2028 Term)', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'Pres. Joy Aragon' },
      ],
    },
    {
      id: 'mem-mago',
      membershipNumber: 'TFOE-2022-04105',
      membershipCardId: 'BEEC-2026-005',
      firstName: 'Jeric',
      middleName: 'R.',
      lastName: 'Mago',
      nickname: 'Jeric',
      gender: 'Male',
      birthdate: '1988-12-04',
      profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 920 333 5005',
      email: 'jeric.mago@bantayogeliteeagles.ph',
      address: 'Vinzons, Camarines Norte',
      occupation: 'Internal Auditor & Tax Practitioner',
      companyBusiness: 'Mago Audit Partners',
      emergencyContact: { name: 'Catherine Mago', relation: 'Spouse', mobile: '+63 920 333 5006' },
      dateJoined: '2022-03-18',
      dateInducted: '2022-04-09',
      membershipStatus: 'Active',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['Club Auditor (2026-2028)'],
      roles: ['Auditor', 'Finance_Admin'],
      permissions: [
        'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
        'FINANCE_VIEW_SELF', 'FINANCE_REPORT', 'AUDIT_LOG_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
      ],
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
      membershipHistory: [
        { id: 'mh-9', date: '2022-03-18', type: 'Joined', description: 'Charter Member of Bantayog Elite Eagles Club', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'National Secretariat' },
        { id: 'mh-10', date: '2026-01-01', type: 'Position Assigned', description: 'Designated Club Auditor (2026-2028)', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'Pres. Joy Aragon' },
      ],
    },
    {
      id: 'mem-giron',
      membershipNumber: 'TFOE-2024-07821',
      membershipCardId: 'BEEC-2026-006',
      firstName: 'Aris',
      middleName: 'G.',
      lastName: 'Giron',
      nickname: 'Aris',
      gender: 'Male',
      birthdate: '1991-01-14',
      profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 921 111 6006',
      email: 'aris.giron@bantayogeliteeagles.ph',
      address: 'Daet, Camarines Norte',
      occupation: 'Broadcaster & Media Communications Director',
      companyBusiness: 'Vanguard Media Bicol',
      emergencyContact: { name: 'Eduardo Giron', relation: 'Father', mobile: '+63 921 111 6007' },
      dateJoined: '2024-02-18',
      dateInducted: '2024-03-10',
      membershipStatus: 'Active',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['Public Information Officer (PIO) (2026-2028)'],
      roles: ['PIO'],
      permissions: [
        'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
        'ANNOUNCEMENT_CREATE', 'ANNOUNCEMENT_PUBLISH', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
      ],
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
      membershipHistory: [
        { id: 'mh-11', date: '2024-02-18', type: 'Joined', description: 'Inducted into Bantayog Elite Eagles Club', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'Sec. Chester Camacho' },
      ],
    },
    {
      id: 'mem-morales',
      membershipNumber: 'TFOE-2023-06100',
      membershipCardId: 'BEEC-2026-007',
      firstName: 'Dave',
      middleName: 'P.',
      lastName: 'Morales',
      nickname: 'Dave',
      gender: 'Male',
      birthdate: '1985-08-25',
      profilePhoto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 920 222 7007',
      email: 'dave.morales@bantayogeliteeagles.ph',
      address: 'Mercedes, Camarines Norte',
      occupation: 'Surgeon / Provincial Medical Officer',
      companyBusiness: 'Camarines Norte Provincial Health Complex',
      emergencyContact: { name: 'Dr. Jocelyn Morales', relation: 'Spouse', mobile: '+63 920 222 7008' },
      dateJoined: '2023-05-12',
      dateInducted: '2023-06-03',
      membershipStatus: 'Active',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['Community Service Committee Chairman (2026-2028)'],
      roles: ['Community_Service_Chair', 'Project_Lead'],
      permissions: [
        'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
        'COMMUNITY_SERVICE_MANAGE', 'TASK_MANAGE', 'DOCUMENT_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
      ],
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
      membershipHistory: [
        { id: 'mh-12', date: '2023-05-12', type: 'Joined', description: 'Inducted into Bantayog Elite Eagles Club', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'Sec. Chester Camacho' },
      ],
    },
    {
      id: 'mem-bautista',
      membershipNumber: 'TFOE-2023-05912',
      membershipCardId: 'BEEC-2026-008',
      firstName: 'Mark',
      middleName: 'D.',
      lastName: 'Bautista',
      nickname: 'Mark',
      gender: 'Male',
      birthdate: '1989-03-08',
      profilePhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 919 777 8008',
      email: 'mark.bautista@bantayogeliteeagles.ph',
      address: 'Talisay, Camarines Norte',
      occupation: 'Logistics Operations Director',
      companyBusiness: 'Bautista Freight & Express',
      emergencyContact: { name: 'Grace Bautista', relation: 'Sister', mobile: '+63 919 777 8009' },
      dateJoined: '2023-01-20',
      dateInducted: '2023-02-15',
      membershipStatus: 'Active',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['Protocol Officer / Sergeant-at-Arms (2026-2028)'],
      roles: ['Protocol_Officer'],
      permissions: [
        'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
        'ATTENDANCE_SCAN', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
      ],
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
      membershipHistory: [
        { id: 'mh-13', date: '2023-01-20', type: 'Joined', description: 'Inducted into Bantayog Elite Eagles Club', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'Sec. Chester Camacho' },
      ],
    },
    {
      id: 'mem-ecat',
      membershipNumber: 'TFOE-2016-00889',
      membershipCardId: 'BCNBR1-2026-001',
      firstName: 'Joel',
      middleName: 'O.',
      lastName: 'Ecat',
      nickname: 'Joel',
      gender: 'Male',
      birthdate: '1975-05-18',
      profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 917 333 9009',
      email: 'governor@bcnbr1.tfoe-peinc.com',
      address: 'Daet, Camarines Norte',
      occupation: 'Regional Enterprise Director',
      companyBusiness: 'Ecat Holdings & Realty',
      emergencyContact: { name: 'Liza Ecat', relation: 'Spouse', mobile: '+63 917 333 9010' },
      dateJoined: '2016-02-10',
      dateInducted: '2016-03-01',
      membershipStatus: 'Active',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['Regional Governor, BCNBR-1 (2026-2028)'],
      roles: ['Regional_Officer', 'Club_Admin'],
      permissions: [
        'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
        'REGIONAL_VIEW', 'REGIONAL_ADMIN', 'REPORT_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
      ],
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
      membershipHistory: [
        { id: 'mh-14', date: '2026-01-01', type: 'Position Assigned', description: 'Assumed Office as Regional Governor BCNBR-1 (2026-2028 Term)', clubName: 'Bicol Camarines Norte Bantayog Region 1', recordedBy: 'National Assembly' },
      ],
    },
    {
      id: 'mem-devera',
      membershipNumber: 'TFOE-2014-00120',
      membershipCardId: 'NAT-2026-001',
      firstName: 'Gabriel',
      middleName: 'P.',
      lastName: 'De Vera',
      nickname: 'Gabriel',
      gender: 'Male',
      birthdate: '1974-11-23',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 917 111 0001',
      email: 'gabriel.devera@tfoe-peinc.com',
      address: 'Quezon City, Metro Manila',
      occupation: 'National Systems Custodian & Legal Tech Counsel',
      companyBusiness: 'TFOE-PE National Headquarters',
      emergencyContact: { name: 'Grace De Vera', relation: 'Spouse', mobile: '+63 917 111 0002' },
      dateJoined: '2014-01-15',
      dateInducted: '2014-02-20',
      membershipStatus: 'Active',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['National Technical Custodian', 'e-Constitution Systems Administrator'],
      roles: ['National_Admin', 'Master_Admin'],
      permissions: [
        'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
        'NATIONAL_ADMIN', 'CONSTITUTION_SOURCE_MANAGE', 'CONSTITUTION_REINDEX', 'CONSTITUTION_SYNC_VIEW',
        'CONSTITUTION_AUDIT_VIEW', 'AUDIT_LOG_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
      ],
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
      membershipHistory: [
        { id: 'mh-15', date: '2026-01-01', type: 'Position Assigned', description: 'Designated National Systems Administrator & Constitution Custodian', clubName: 'TFOE-PE National', recordedBy: 'National Assembly' },
      ],
    },
    {
      id: 'mem-delgado',
      membershipNumber: 'TFOE-2024-08015',
      membershipCardId: 'BEEC-2026-009',
      firstName: 'Maria',
      middleName: 'Santos',
      lastName: 'Delgado',
      nickname: 'Maria',
      gender: 'Female',
      birthdate: '1992-04-12',
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 922 999 7777',
      email: 'maria.delgado@bantayogeliteeagles.ph',
      address: 'Jose Panganiban, Camarines Norte',
      occupation: 'Licensed Pharmacist & Community Retailer',
      companyBusiness: 'Delgado Pharma & Health Supplies',
      emergencyContact: { name: 'Antonio Delgado', relation: 'Brother', mobile: '+63 922 999 7778' },
      dateJoined: '2024-05-10',
      dateInducted: '2024-06-01',
      membershipStatus: 'Active',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['Lady Eagle / Regular Member'],
      roles: ['Member'],
      permissions: [
        'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
        'FINANCE_VIEW_SELF', 'DOCUMENT_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
      ],
      privacySettings: { hideMobile: true, hideEmail: false, hideAddress: true },
      membershipHistory: [
        { id: 'mh-16', date: '2024-05-10', type: 'Joined', description: 'Inducted as Lady Eagle into Bantayog Elite Eagles Club', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'Sec. Chester Camacho' },
      ],
    },
    {
      id: 'mem-joel-pending',
      membershipNumber: 'TFOE-APP-2026-010',
      membershipCardId: 'BEEC-APP-010',
      firstName: 'Joel',
      middleName: 'Navarro',
      lastName: 'Santos',
      nickname: 'Joel',
      gender: 'Male',
      birthdate: '1993-07-22',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      mobile: '+63 928 777 9009',
      email: 'joel.navarro@gmail.com',
      address: 'Basud, Camarines Norte',
      occupation: 'Agri-Business Producer',
      companyBusiness: 'Basud Agro-Harvest Ventures',
      emergencyContact: { name: 'Rebecca Navarro', relation: 'Mother', mobile: '+63 928 777 9010' },
      dateJoined: '2026-02-01',
      dateInducted: 'Pending Induction',
      membershipStatus: 'Pending Approval',
      previousClub: 'None (First-time Applicant)',
      primaryClubId: 'club-beec',
      regionId: 'region-bcnbr1',
      positions: ['Applicant'],
      roles: ['Applicant'],
      permissions: ['MEMBER_VIEW_SELF', 'CONSTITUTION_VIEW'],
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
      membershipHistory: [
        { id: 'mh-17', date: '2026-02-01', type: 'Joined', description: 'Submitted digital self-registration. Sponsored by Kuya Joy Aragon & Kuya Chester Camacho.', clubName: 'Bantayog Elite Eagles Club', recordedBy: 'Self-Registration' },
      ],
    },
  ];

  const members: ServerMember[] = rawMembers.map((m) => {
    const qrOpaqueCode = signQRPayload({
      memberId: m.id,
      memberNumber: m.membershipNumber,
      clubCode: 'BEEC',
      issuedAt: Date.now(),
      nonce: crypto.randomBytes(8).toString('hex'),
    });

    return {
      ...m,
      passwordHash: defaultPassHash,
      passwordSalt: salt,
      qrOpaqueCode,
      failedLoginAttempts: 0,
    };
  });

  const initialGenesisLog: ServerAuditLog = {
    id: 'aud-genesis',
    actorId: 'system',
    actorName: 'AGILA System Initialization',
    actorPosition: 'Root Custodian',
    action: 'SYSTEM_BOOTSTRAP',
    resourceType: 'Database',
    resourceId: 'agila-db-v1',
    scope: 'National',
    result: 'Success',
    timestamp: '2026-01-01 00:00:00 PST',
    ip: '127.0.0.1',
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    currentHash: '7f92b49c0d9a6c1e30a597e74fd712bc90a88ef114b397de8e48950d98ad4421',
  };

  return {
    organization: {
      id: 'org-tfoe-pe',
      name: 'The Fraternal Order of Eagles',
      legalName: 'The Fraternal Order of Eagles - Philippine Eagles, Inc. (TFOE-PE, Inc.)',
      type: 'Fraternal Socio-Civic Order',
      logo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
      description: 'The premier Philippine-born fraternal socio-civic movement.',
      motto: 'Service Through Strong Brotherhood (Humanitarian Service)',
    },
    region: {
      id: 'region-bcnbr1',
      organizationId: 'org-tfoe-pe',
      name: 'Bicol Camarines Norte Bantayog Region 1',
      code: 'BCNBR-1',
      logo: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80',
      description: 'Governing Region 1 of Camarines Norte chartered clubs.',
      status: 'Active',
    },
    club: {
      id: 'club-beec',
      regionId: 'region-bcnbr1',
      name: 'Bantayog Elite Eagles Club',
      code: 'BEEC',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      colors: { primary: '#d97706', secondary: '#1e3a8a', accent: '#0f172a' },
      description: 'A distinguished chapter of visionary community leaders committed to fraternal unity and disaster response across Camarines Norte.',
      contactInfo: {
        email: 'secretariat@bantayogeliteeagles.ph',
        phone: '+63 917 888 3333',
        address: 'Bantayog Elite Eagles Club Hall, F. Pimentel Ave, Daet, Camarines Norte',
      },
      meetingSchedule: 'Every 2nd & 4th Saturday of the month at 6:00 PM',
      socialLinks: {
        facebook: 'https://facebook.com/BantayogEliteEaglesClub',
        website: 'https://bantayogelite.tfoe-peinc.com',
      },
      charterDate: '2022-03-18',
      status: 'Active',
    },
    members,
    meetings: [
      {
        id: 'meet-1',
        scope: 'Club',
        clubId: 'club-beec',
        type: 'GMM',
        title: 'Bantayog Elite 2nd Regular GMM (October 2026)',
        date: '2026-10-10',
        time: '18:00 - 21:00 PST',
        location: 'Bantayog Elite Club Hall, Daet, Camarines Norte',
        venueType: 'In-Person',
        description: 'Mandatory monthly General Membership Meeting to review Q3 accomplishments, mobilize for the Daet Medical Outreach, and present financial standing.',
        status: 'Scheduled',
        createdBy: 'Kuya Chester Jan Camacho',
        agendaItems: [
          'Call to Order & Invocation to Divine Providence',
          'Singing of National Anthem & Eagles Hymn',
          'Roll Call of Officers & Quorum Declaration by Sec. Chester Camacho',
          'Presidential Address by Kuya Joy Aragon',
          'Treasurer’s Report by Kuya Joenathan Talento',
          'Community Service Briefing by Kuya Dave Morales',
          'Fraternal Fellowship & Dinner',
        ],
        qrCheckinCode: 'tfoe-gmm-beec-2026-10-10-token-84129',
      },
      {
        id: 'meet-2',
        scope: 'Club',
        clubId: 'club-beec',
        type: 'Club Executive Committee Meeting',
        title: 'Executive Council Strategic Planning Session',
        date: '2026-10-05',
        time: '19:00 - 21:30 PST',
        location: 'The Executive Lounge, Daet Hotel, Daet',
        venueType: 'Hybrid',
        description: 'Review applicant dossiers, finalize Medical Mission task force assignments, and audit dues remittance compliance.',
        status: 'In Progress',
        createdBy: 'Kuya Joy Aragon',
        agendaItems: [
          'Review of Pending Applicant Dossiers',
          'Task Assignments for Medical Mission',
          'Treasurer Ledger Audit',
        ],
        qrCheckinCode: 'tfoe-execom-beec-2026-10-05-token-39102',
      },
    ],
    attendanceRecords: [
      { id: 'att-1', meetingId: 'meet-1', memberId: 'mem-aragon', memberName: 'Joy Aragon', memberNickname: 'Joy', memberNumber: 'TFOE-2022-04101', method: 'Officer Manual Entry', status: 'Present', timestamp: '2026-10-02 18:00 PST', recordedBy: 'Sec. Chester Camacho' },
      { id: 'att-2', meetingId: 'meet-1', memberId: 'mem-camacho', memberName: 'Chester Jan Camacho', memberNickname: 'Chester', memberNumber: 'TFOE-2022-04198', method: 'QR Scan', status: 'Present', timestamp: '2026-10-02 18:02 PST', recordedBy: 'Sec. Chester Camacho' },
      { id: 'att-3', meetingId: 'meet-1', memberId: 'mem-talento', memberName: 'Joenathan Talento', memberNickname: 'Joenathan', memberNumber: 'TFOE-2022-04104', method: 'QR Scan', status: 'Present', timestamp: '2026-10-02 18:05 PST', recordedBy: 'Sec. Chester Camacho' },
    ],
    attendanceCorrections: [],
    projects: [
      {
        id: 'proj-1',
        clubId: 'club-beec',
        title: 'Bantayog Eagle Health: Medical & Dental Outreach',
        description: 'Comprehensive medical consultations, dental extractions, eye check-ups, and free medicines for 500+ underprivileged residents in Barangay Bagasbas, Daet.',
        category: 'Health & Medical',
        date: '2026-10-18',
        location: 'Bagasbas Elementary School Grounds, Daet',
        beneficiaries: 'Impoverished fisherfolk and coastal households',
        beneficiaryCount: 520,
        budget: 150000,
        actualExpense: 85000,
        status: 'Ongoing',
        projectLeadId: 'mem-morales',
        projectLeadName: 'Kuya Dave P. Morales, MD',
        sponsors: ['Provincial Health Office', 'Camacho Builders', 'Delgado Pharma'],
        photos: ['https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80'],
        volunteers: [
          { memberId: 'mem-morales', memberName: 'Dave Morales', memberNickname: 'Dave', role: 'Head Medical Director', hoursLogged: 16, checkedIn: true },
          { memberId: 'mem-camacho', memberName: 'Chester Camacho', memberNickname: 'Chester', role: 'Logistics Coordinator', hoursLogged: 12, checkedIn: true },
          { memberId: 'mem-delgado', memberName: 'Maria Delgado', memberNickname: 'Maria', role: 'Pharmacy Head', hoursLogged: 10, checkedIn: true },
        ],
        tasks: [
          {
            id: 'task-1',
            projectId: 'proj-1',
            title: 'Procure Antibiotics & Pediatric Vitamins Consignment',
            description: 'Order wholesale lot from Delgado Pharma with batch inspection certificates.',
            assigneeId: 'mem-delgado',
            assigneeName: 'Maria Delgado',
            assigneeNickname: 'Maria',
            assigneePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
            dueDate: '2026-10-12',
            priority: 'Urgent',
            status: 'In Progress',
            createdAt: '2026-09-25',
          },
          {
            id: 'task-2',
            projectId: 'proj-1',
            title: 'Coordinate Venue Clearance with Bagasbas Barangay Council',
            description: 'Secure permit for covered court and crowd marshals.',
            assigneeId: 'mem-camacho',
            assigneeName: 'Chester Camacho',
            assigneeNickname: 'Chester',
            assigneePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
            dueDate: '2026-10-08',
            priority: 'High',
            status: 'Completed',
            createdAt: '2026-09-22',
          },
        ],
      },
    ],
    transactions: [
      {
        id: 'tx-1',
        clubId: 'club-beec',
        memberId: 'mem-aragon',
        memberName: 'Kuya Joy M. Aragon',
        memberNumber: 'TFOE-2022-04101',
        type: 'Annual Membership Dues',
        amount: 6000,
        referenceNumber: 'OR-2026-001',
        paymentMethod: 'Bank Transfer',
        date: '2026-01-15',
        recordedBy: 'Kuya Joenathan Talento (Treasurer)',
        status: 'Verified',
        notes: 'Full annual club membership dues for 2026',
      },
      {
        id: 'tx-2',
        clubId: 'club-beec',
        memberId: 'mem-camacho',
        memberName: 'Kuya Chester Jan Camacho',
        memberNumber: 'TFOE-2022-04198',
        type: 'Annual Membership Dues',
        amount: 6000,
        referenceNumber: 'OR-2026-002',
        paymentMethod: 'GCash',
        date: '2026-01-18',
        recordedBy: 'Kuya Joenathan Talento (Treasurer)',
        status: 'Verified',
        notes: 'Full annual club membership dues for 2026',
      },
      {
        id: 'tx-3',
        clubId: 'club-beec',
        memberId: 'mem-camacho',
        memberName: 'Kuya Chester Jan Camacho',
        memberNumber: 'TFOE-2022-04198',
        type: 'Regional Dues',
        amount: 2000,
        referenceNumber: 'OR-2026-003',
        paymentMethod: 'GCash',
        date: '2026-01-18',
        recordedBy: 'Kuya Joenathan Talento (Treasurer)',
        status: 'Verified',
        notes: 'BCNBR-1 regional capitation remittance',
      },
    ],
    chartOfAccounts: [
      { code: '1010', name: 'Cash & Bank Balances', type: 'Asset', normalBalance: 'Debit' },
      { code: '1020', name: 'Accounts Receivable (Member Dues)', type: 'Asset', normalBalance: 'Debit' },
      { code: '2010', name: 'Regional Dues Remittance Payable', type: 'Liability', normalBalance: 'Credit' },
      { code: '2020', name: 'National Capitation Remittance Payable', type: 'Liability', normalBalance: 'Credit' },
      { code: '3010', name: 'Club Fraternal Fund Equity', type: 'Equity', normalBalance: 'Credit' },
      { code: '4010', name: 'Membership Dues Revenue', type: 'Revenue', normalBalance: 'Credit' },
      { code: '4020', name: 'Special Assessment Donations', type: 'Revenue', normalBalance: 'Credit' },
      { code: '5010', name: 'Community Service Project Expenses', type: 'Expense', normalBalance: 'Debit' },
      { code: '5020', name: 'Meeting & Fellowship Operational Expenses', type: 'Expense', normalBalance: 'Debit' },
    ],
    journalEntries: [
      {
        id: 'je-1',
        entryNumber: 'JE-2026-0001',
        entryDate: '2026-01-15',
        description: 'Payment of annual membership dues - Kuya Joy Aragon (Pres.)',
        referenceNumber: 'OR-2026-001',
        createdBy: 'Kuya Joenathan Talento (Treasurer)',
        status: 'Posted',
        lines: [
          { id: 'jl-1a', accountCode: '1010', accountName: 'Cash & Bank Balances', debit: 6000, credit: 0, memo: 'Bank Transfer' },
          { id: 'jl-1b', accountCode: '4010', accountName: 'Membership Dues Revenue', debit: 0, credit: 6000, memo: 'Annual Dues 2026' },
        ],
      },
      {
        id: 'je-2',
        entryNumber: 'JE-2026-0002',
        entryDate: '2026-01-18',
        description: 'Payment of annual membership dues - Kuya Chester Jan Camacho (Sec.)',
        referenceNumber: 'OR-2026-002',
        createdBy: 'Kuya Joenathan Talento (Treasurer)',
        status: 'Posted',
        lines: [
          { id: 'jl-2a', accountCode: '1010', accountName: 'Cash & Bank Balances', debit: 6000, credit: 0, memo: 'GCash Payment' },
          { id: 'jl-2b', accountCode: '4010', accountName: 'Membership Dues Revenue', debit: 0, credit: 6000, memo: 'Annual Dues 2026' },
        ],
      },
      {
        id: 'je-3',
        entryNumber: 'JE-2026-0003',
        entryDate: '2026-01-18',
        description: 'Remittance collection for BCNBR-1 Regional Dues - Kuya Chester Jan Camacho',
        referenceNumber: 'OR-2026-003',
        createdBy: 'Kuya Joenathan Talento (Treasurer)',
        status: 'Posted',
        lines: [
          { id: 'jl-3a', accountCode: '1010', accountName: 'Cash & Bank Balances', debit: 2000, credit: 0, memo: 'GCash Payment' },
          { id: 'jl-3b', accountCode: '2010', accountName: 'Regional Dues Remittance Payable', debit: 0, credit: 2000, memo: 'BCNBR-1 Capitation' },
        ],
      },
    ],
    announcements: [
      {
        id: 'ann-1',
        scope: 'Club',
        clubId: 'club-beec',
        title: 'Mobilization Briefing: Bagasbas Medical-Dental Outreach',
        content: 'All Kuya and Ate Eagles are called to the final logistics meeting for our October 18 Medical Mission. Please check your assigned tasks in the Project Tracking Board.',
        priority: 'Urgent',
        status: 'Published',
        publishAt: '2026-10-01 08:00 PST',
        createdBy: 'mem-morales',
        authorName: 'Kuya Dave P. Morales, MD',
        authorPosition: 'Community Service Chairman',
        readBy: ['mem-camacho', 'mem-aragon'],
      },
    ],
    documents: [
      {
        id: 'doc-1',
        title: 'Official Constitution and By-Laws of TFOE-PE, Inc. (e-Edition)',
        category: 'Constitution & Bylaws',
        classification: 'Public',
        scope: 'National',
        fileType: 'PDF',
        fileSize: '4.2 MB',
        version: 'v2026.1',
        uploadedBy: 'National Secretariat',
        uploadedAt: '2026-01-15',
        downloadCount: 142,
        description: 'The authoritative codified Constitution and By-Laws synchronized from the official National e-Constitution portal.',
      },
    ],
    auditLogs: [initialGenesisLog],
    constitutionVersions: [
      {
        id: 'const-ver-2026-1',
        version: OFFICIAL_CONSTITUTION_VERSION,
        effectiveDate: OFFICIAL_CONSTITUTION_DATE,
        sourceUrl: OFFICIAL_CONSTITUTION_SOURCE,
        contentHash: OFFICIAL_CONSTITUTION_HASH,
        preamble: CONSTITUTION_PREAMBLE,
        articles: CONSTITUTION_ARTICLES,
        isCurrent: true,
        syncTimestamp: '2026-01-15 00:00:00 PST',
      },
    ],
    constitutionSyncRuns: [
      {
        id: 'sync-1',
        sourceUrl: OFFICIAL_CONSTITUTION_SOURCE,
        startedAt: '2026-09-30 03:00:00 PST',
        completedAt: '2026-09-30 03:00:04 PST',
        status: 'SUCCESS',
        previousHash: OFFICIAL_CONSTITUTION_HASH,
        newHash: OFFICIAL_CONSTITUTION_HASH,
        versionDetected: OFFICIAL_CONSTITUTION_VERSION + ' (National e-Constitution Portal)',
        recordsCreated: 8,
      },
    ],
    constitutionQueries: [],
    notifications: [
      {
        id: 'notif-1',
        recipientId: 'mem-camacho',
        title: 'Upcoming Regular GMM (Oct 10)',
        body: 'Bantayog Elite 2nd Regular GMM is scheduled for Saturday at 6:00 PM. Please bring your Digital ID for QR attendance check-in.',
        type: 'Meeting Notice',
        channel: 'IN_APP',
        status: 'SENT',
        targetScope: 'club-beec',
        createdAt: '2026-10-02 09:00 PST',
      },
    ],
    usedQRNonces: {},
    sessions: {},
  };
}

export function getDatabase(): DatabaseSchema {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbInstance = JSON.parse(content);
      const defaults = getInitialSeedData();
      if (!dbInstance!.chartOfAccounts || dbInstance!.chartOfAccounts.length === 0) {
        dbInstance!.chartOfAccounts = defaults.chartOfAccounts;
      }
      if (!dbInstance!.journalEntries || dbInstance!.journalEntries.length === 0) {
        dbInstance!.journalEntries = defaults.journalEntries;
      }
      if (!dbInstance!.notifications) {
        dbInstance!.notifications = defaults.notifications;
      }
      if (!dbInstance!.usedQRNonces) {
        dbInstance!.usedQRNonces = defaults.usedQRNonces;
      }
      return dbInstance!;
    } catch (e) {
      console.warn('Database file corrupt or unreadable, initializing authoritative seed data:', e);
    }
  }

  dbInstance = getInitialSeedData();
  saveDatabase();
  return dbInstance;
}

export function saveDatabase(): void {
  if (!dbInstance) return;
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(dbInstance, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

// Tamper-Evident Append-Only Audit Logger
export function appendAuditLog(entry: {
  actorId: string;
  actorName: string;
  actorPosition: string;
  action: string;
  resourceType: string;
  resourceId: string;
  scope: string;
  result: 'Success' | 'Failed' | 'Denied';
  ip?: string;
  userAgent?: string;
  beforeState?: any;
  afterState?: any;
}): ServerAuditLog {
  const db = getDatabase();
  const lastLog = db.auditLogs[db.auditLogs.length - 1];
  const previousHash = lastLog ? lastLog.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';

  const id = `aud-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST';

  const dataToHash = `${id}|${entry.actorId}|${entry.action}|${entry.resourceType}|${entry.resourceId}|${entry.scope}|${entry.result}|${timestamp}|${previousHash}`;
  const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

  const newLog: ServerAuditLog = {
    id,
    actorId: entry.actorId,
    actorName: entry.actorName,
    actorPosition: entry.actorPosition,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    scope: entry.scope,
    result: entry.result,
    timestamp,
    ip: entry.ip || '127.0.0.1',
    userAgent: entry.userAgent || 'AGILA-Core',
    beforeState: entry.beforeState,
    afterState: entry.afterState,
    previousHash,
    currentHash,
  };

  db.auditLogs.push(newLog);
  saveDatabase();
  return newLog;
}

// ==========================================
// 8. DOUBLE-ENTRY FINANCIAL ACCOUNTING LEDGER
// ==========================================

export interface JournalLineInput {
  accountCode: string;
  debit: number;
  credit: number;
  memo?: string;
}

export function postDoubleEntryTransaction(params: {
  clubId: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  type: string;
  amount: number;
  referenceNumber: string;
  paymentMethod: string;
  date: string;
  recordedBy: string;
  notes?: string;
  lines: JournalLineInput[];
}): { transaction: any; journalEntry: any } {
  const db = getDatabase();

  // Validate balanced double-entry equation (Total Debits must EQUAL Total Credits)
  const totalDebits = params.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredits = params.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

  if (Math.abs(totalDebits - totalCredits) > 0.001) {
    throw new Error(`Double-entry balance violation: Debits (₱${totalDebits}) do not equal Credits (₱${totalCredits}).`);
  }

  if (Math.abs(totalDebits - params.amount) > 0.001) {
    throw new Error(`Transaction amount (₱${params.amount}) does not match Journal total (₱${totalDebits}).`);
  }

  const txId = `tx-${Date.now()}`;
  const jeId = `je-${Date.now()}`;
  const jeNumber = `JE-2026-${String(db.journalEntries.length + 1).padStart(4, '0')}`;

  const resolvedLines = params.lines.map((line, idx) => {
    const account = db.chartOfAccounts.find((a) => a.code === line.accountCode);
    return {
      id: `jl-${Date.now()}-${idx}`,
      accountCode: line.accountCode,
      accountName: account?.name || 'General Ledger Account',
      debit: Number(line.debit) || 0,
      credit: Number(line.credit) || 0,
      memo: line.memo || params.notes,
    };
  });

  const journalEntry = {
    id: jeId,
    entryNumber: jeNumber,
    entryDate: params.date,
    description: `${params.type} - ${params.memberName} (${params.referenceNumber})`,
    referenceNumber: params.referenceNumber,
    createdBy: params.recordedBy,
    status: 'Posted' as const,
    lines: resolvedLines,
  };

  const transaction = {
    id: txId,
    clubId: params.clubId,
    memberId: params.memberId,
    memberName: params.memberName,
    memberNumber: params.memberNumber,
    type: params.type,
    amount: params.amount,
    referenceNumber: params.referenceNumber,
    paymentMethod: params.paymentMethod,
    date: params.date,
    recordedBy: params.recordedBy,
    status: 'Verified',
    journalEntryId: jeId,
    notes: params.notes,
  };

  db.journalEntries.unshift(journalEntry);
  db.transactions.unshift(transaction);
  saveDatabase();

  return { transaction, journalEntry };
}

export function reverseFinancialTransaction(
  originalTxId: string,
  reversedBy: string,
  reason: string
): { original: any; reversal: any; journalEntry: any } {
  const db = getDatabase();
  const original = db.transactions.find((t) => t.id === originalTxId);

  if (!original) {
    throw new Error('Transaction not found in ledger.');
  }

  if (original.status === 'Reversed') {
    throw new Error('Transaction has already been reversed.');
  }

  original.status = 'Reversed';

  // Find original journal entry and create reversing entry (swapping debits and credits)
  const origJE = db.journalEntries.find((je) => je.id === original.journalEntryId);
  const revJeId = `je-rev-${Date.now()}`;
  const revJeNumber = `JE-REV-2026-${String(db.journalEntries.length + 1).padStart(4, '0')}`;

  const reversingLines = origJE
    ? origJE.lines.map((l, idx) => ({
        id: `jl-rev-${Date.now()}-${idx}`,
        accountCode: l.accountCode,
        accountName: l.accountName,
        debit: l.credit, // SWAP
        credit: l.debit, // SWAP
        memo: `Reversal: ${reason}`,
      }))
    : [
        {
          id: `jl-rev-1`,
          accountCode: '4010',
          accountName: 'Membership Dues Revenue',
          debit: original.amount,
          credit: 0,
          memo: `Reversal of ${original.referenceNumber}: ${reason}`,
        },
        {
          id: `jl-rev-2`,
          accountCode: '1010',
          accountName: 'Cash & Bank Balances',
          debit: 0,
          credit: original.amount,
          memo: `Reversal of ${original.referenceNumber}: ${reason}`,
        },
      ];

  const reversingJE = {
    id: revJeId,
    entryNumber: revJeNumber,
    entryDate: new Date().toISOString().split('T')[0],
    description: `REVERSAL of ${original.referenceNumber} (${origJE?.entryNumber || 'JE'}): ${reason}`,
    referenceNumber: `REV-${original.referenceNumber}`,
    createdBy: reversedBy,
    status: 'Posted' as const,
    reversalOf: origJE?.id,
    lines: reversingLines,
  };

  const reversalTx = {
    id: `tx-rev-${Date.now()}`,
    clubId: original.clubId,
    memberId: original.memberId,
    memberName: original.memberName,
    memberNumber: original.memberNumber,
    type: `Reversal: ${original.type}`,
    amount: -Math.abs(original.amount),
    referenceNumber: `REV-${original.referenceNumber}`,
    paymentMethod: original.paymentMethod,
    date: new Date().toISOString().split('T')[0],
    recordedBy: reversedBy,
    status: 'Verified',
    journalEntryId: revJeId,
    notes: `Reversal of transaction ${original.id}. Reason: ${reason}`,
  };

  db.journalEntries.unshift(reversingJE);
  db.transactions.unshift(reversalTx);
  saveDatabase();

  return { original, reversal: reversalTx, journalEntry: reversingJE };
}

export function getTrialBalance() {
  const db = getDatabase();
  const balances: Record<string, { code: string; name: string; type: string; debit: number; credit: number }> = {};

  for (const acc of db.chartOfAccounts) {
    balances[acc.code] = {
      code: acc.code,
      name: acc.name,
      type: acc.type,
      debit: 0,
      credit: 0,
    };
  }

  for (const je of db.journalEntries) {
    for (const line of je.lines) {
      if (!balances[line.accountCode]) {
        balances[line.accountCode] = {
          code: line.accountCode,
          name: line.accountName,
          type: 'Unclassified',
          debit: 0,
          credit: 0,
        };
      }
      balances[line.accountCode].debit += line.debit;
      balances[line.accountCode].credit += line.credit;
    }
  }

  const rows = Object.values(balances);
  const totalDebits = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredits = rows.reduce((sum, r) => sum + r.credit, 0);

  return {
    accounts: rows,
    totalDebits,
    totalCredits,
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.001,
  };
}

// ==========================================
// 9. NONCE REPLAY REGISTRY & BACKUP/RESTORE
// ==========================================

export function recordConsumedNonce(nonce: string, memberId: string, meetingId: string): void {
  const db = getDatabase();
  db.usedQRNonces[nonce] = {
    memberId,
    meetingId,
    usedAt: new Date().toISOString(),
  };
  saveDatabase();
}

export function isNonceUsedInDB(nonce: string): boolean {
  const db = getDatabase();
  return !!db.usedQRNonces[nonce];
}

export function exportDatabaseBackup(): { backup: string; checksum: string; timestamp: string } {
  const db = getDatabase();
  const backup = JSON.stringify(db, null, 2);
  const checksum = 'sha256:' + crypto.createHash('sha256').update(backup, 'utf-8').digest('hex');
  const timestamp = new Date().toISOString();
  return { backup, checksum, timestamp };
}

export function restoreDatabaseBackup(backupJson: string, expectedChecksum: string, actorId: string, actorName: string): boolean {
  const calculatedChecksum = 'sha256:' + crypto.createHash('sha256').update(backupJson, 'utf-8').digest('hex');
  if (calculatedChecksum !== expectedChecksum) {
    throw new Error('Integrity validation failed: Backup checksum does not match.');
  }

  const parsed = JSON.parse(backupJson);
  if (!parsed.members || !parsed.auditLogs || !parsed.constitutionVersions) {
    throw new Error('Invalid backup archive structure: Missing core relational datasets.');
  }

  dbInstance = parsed;
  saveDatabase();

  appendAuditLog({
    actorId,
    actorName,
    actorPosition: 'Technical Administrator',
    action: 'DATABASE_RESTORE_EXECUTED',
    resourceType: 'Database',
    resourceId: 'agila-primary',
    scope: 'National',
    result: 'Success',
    afterState: { checksum: expectedChecksum },
  });

  return true;
}

