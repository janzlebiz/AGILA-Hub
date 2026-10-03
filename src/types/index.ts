export type OrganizationScopeLevel = 'National' | 'Region' | 'Club';

export type MembershipStatus =
  | 'Active'
  | 'Inactive'
  | 'Suspended'
  | 'Resigned'
  | 'Transferred'
  | 'Deceased'
  | 'Honorary'
  | 'Pending Approval'
  | 'Other';

export type Gender = 'Male' | 'Female' | 'Other';

export interface EmergencyContact {
  name: string;
  relation: string;
  mobile: string;
}

export interface PrivacySettings {
  hideMobile: boolean;
  hideEmail: boolean;
  hideAddress: boolean;
}

export interface MembershipHistoryItem {
  id: string;
  date: string;
  type: 'Joined' | 'Inducted' | 'Position Assigned' | 'Status Change' | 'Award' | 'Transfer';
  description: string;
  clubName: string;
  recordedBy: string;
}

export interface Member {
  id: string;
  membershipNumber: string; // e.g. TFOE-2026-00812
  membershipCardId: string; // e.g. PE-BCNBR1-042
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  nickname: string;
  gender: Gender;
  birthdate: string;
  profilePhoto: string;
  mobile: string;
  email: string;
  address: string;
  occupation: string;
  companyBusiness: string;
  emergencyContact: EmergencyContact;
  dateJoined: string;
  dateInducted: string;
  membershipStatus: MembershipStatus;
  previousClub?: string;
  primaryClubId: string;
  regionId: string;
  positions: string[]; // Active position names
  roles: string[]; // RBAC roles
  permissions?: string[];
  privacySettings: PrivacySettings;
  membershipHistory: MembershipHistoryItem[];
  qrOpaqueCode: string; // Signed / opaque token
}

export interface Club {
  id: string;
  regionId: string;
  name: string;
  code: string;
  logo: string;
  banner: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  description: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  meetingSchedule: string;
  socialLinks: {
    facebook?: string;
    website?: string;
  };
  charterDate: string;
  status: 'Active' | 'Inactive';
}

export interface Region {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  logo: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface Organization {
  id: string;
  name: string;
  legalName: string;
  type: string;
  logo: string;
  description: string;
  motto: string;
}

export interface Position {
  id: string;
  level: OrganizationScopeLevel;
  name: string;
  description: string;
  maxHolders: number;
  seatModel: 'Single' | 'Multiple';
  active: boolean;
  termYears: number;
}

export interface PositionAssignment {
  id: string;
  positionId: string;
  positionName: string;
  memberId: string;
  memberName: string;
  scopeLevel: OrganizationScopeLevel;
  scopeId: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Resigned';
}

export type MeetingType =
  | 'GMM'
  | 'Club Executive Committee Meeting'
  | 'REXECOM'
  | 'Regional Assembly'
  | 'National Assembly'
  | 'Special GMM'
  | 'Emergency Meeting'
  | 'Fellowship'
  | 'Induction'
  | 'Anniversary'
  | 'Election'
  | 'Committee Meeting'
  | 'Other';

export interface Meeting {
  id: string;
  scope: OrganizationScopeLevel;
  clubId?: string;
  regionId?: string;
  type: MeetingType;
  title: string;
  date: string;
  time: string;
  location: string;
  venueType: 'In-Person' | 'Hybrid' | 'Online';
  description: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  createdBy: string;
  agendaItems: string[];
  qrCheckinCode: string;
}

export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Excused';
export type AttendanceMethod = 'QR Scan' | 'Member Self-Check-in' | 'Officer Manual Entry' | 'Photo Capture';

export interface AttendanceRecord {
  id: string;
  meetingId: string;
  memberId: string;
  memberName: string;
  memberNickname: string;
  memberNumber: string;
  method: AttendanceMethod;
  status: AttendanceStatus;
  timestamp: string;
  recordedBy: string;
  photoEvidence?: string;
  notes?: string;
}

export interface AttendanceCorrection {
  id: string;
  attendanceId: string;
  meetingId: string;
  meetingTitle: string;
  memberId: string;
  memberName: string;
  requestedBy: string;
  reason: string;
  oldValue: AttendanceStatus;
  requestedValue: AttendanceStatus;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  requestedAt: string;
  decidedAt?: string;
}

export type ProjectTaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ProjectTaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Completed';

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeNickname?: string;
  assigneePhoto?: string;
  dueDate: string;
  priority: ProjectTaskPriority;
  status: ProjectTaskStatus;
  createdAt: string;
}

export interface ProjectVolunteer {
  memberId: string;
  memberName: string;
  memberNickname: string;
  role: string;
  hoursLogged: number;
  checkedIn: boolean;
}

export interface CommunityServiceProject {
  id: string;
  clubId: string;
  title: string;
  description: string;
  category:
    | 'Health & Medical'
    | 'Education & Literacy'
    | 'Disaster Relief'
    | 'Environmental & Greening'
    | 'Livelihood & Skills'
    | 'Feeding Program'
    | 'Community Infrastructure';
  date: string;
  location: string;
  beneficiaries: string;
  beneficiaryCount: number;
  budget: number;
  actualExpense: number;
  status: 'Planning' | 'Ongoing' | 'Completed';
  projectLeadId: string;
  projectLeadName: string;
  volunteers: ProjectVolunteer[];
  tasks: ProjectTask[];
  photos: string[];
  accomplishmentReport?: string;
  sponsors: string[];
}

export type DuesType =
  | 'Annual Membership Dues'
  | 'Regional Dues'
  | 'National Dues'
  | 'Special Assessment'
  | 'Event Fee'
  | 'Voluntary Donation'
  | 'Other';

export interface FinancialTransaction {
  id: string;
  clubId: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  type: DuesType;
  amount: number;
  referenceNumber: string;
  paymentMethod: 'Cash' | 'GCash' | 'Bank Transfer' | 'Check';
  date: string;
  recordedBy: string;
  notes?: string;
  status: 'Verified' | 'Pending Verification';
}

export interface Announcement {
  id: string;
  scope: OrganizationScopeLevel;
  clubId?: string;
  title: string;
  content: string;
  priority: 'Urgent' | 'Official Notice' | 'General Announcement' | 'Event Update';
  status: 'Draft' | 'Pending Approval' | 'Published';
  publishAt: string;
  createdBy: string;
  authorName: string;
  authorPosition: string;
  readBy: string[];
}

export type DocumentCategory =
  | 'Constitution & Bylaws'
  | 'Club Resolutions'
  | 'Meeting Minutes'
  | 'Financial Reports'
  | 'Community Service Reports'
  | 'Memoranda'
  | 'Forms & Templates'
  | 'National Documents'
  | 'Other';

export interface DocumentItem {
  id: string;
  title: string;
  category: DocumentCategory;
  classification: 'Public' | 'Members Only' | 'Officers Only';
  scope: OrganizationScopeLevel;
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'JPG';
  fileSize: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadCount: number;
  description: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  type: 'Meeting Reminder' | 'Dues Due' | 'Project Assignment' | 'Approval Request' | 'Announcement' | 'Attendance';
  title: string;
  body: string;
  deepLink?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
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
  metadata?: Record<string, any>;
}

export interface ConstitutionSection {
  id: string;
  articleId: string;
  articleRoman: string;
  sectionNumber: number;
  title: string;
  content: string;
  sortOrder: number;
}

export interface ConstitutionArticle {
  id: string;
  constitutionId: string;
  articleNumber: number;
  romanNumeral: string;
  title: string;
  sortOrder: number;
  sections: ConstitutionSection[];
}

export interface ConstitutionSyncRun {
  id: string;
  sourceUrl: string;
  startedAt: string;
  completedAt: string;
  status: 'SUCCESS' | 'UNCHANGED' | 'FAILED';
  previousHash: string;
  newHash: string;
  versionDetected: string;
  recordsCreated: number;
  error?: string;
}

export interface ConstitutionQueryRecord {
  id: string;
  memberId: string;
  memberName: string;
  question: string;
  response: string;
  sources: string[];
  model: string;
  constitutionVersion: string;
  timestamp: string;
}
