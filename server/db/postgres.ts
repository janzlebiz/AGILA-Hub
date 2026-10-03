import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import { hash as hashArgon, Algorithm } from '@node-rs/argon2';
import crypto from 'crypto';
import {
  CONSTITUTION_ARTICLES,
  CONSTITUTION_PREAMBLE,
  OFFICIAL_CONSTITUTION_SOURCE,
  OFFICIAL_CONSTITUTION_VERSION,
  OFFICIAL_CONSTITUTION_HASH,
  OFFICIAL_CONSTITUTION_DATE,
} from '../../src/data/constitutionData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PG_DATA_DIR = path.resolve(DATA_DIR, 'postgres');

let pgClient: PGlite | null = null;

export async function getPostgresClient(): Promise<PGlite> {
  if (pgClient) return pgClient;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Initialize persistent PGlite PostgreSQL instance
  pgClient = new PGlite(PG_DATA_DIR);
  await initSchemaAndSeed(pgClient);
  return pgClient;
}

// Canonical JSON serializer for reliable hashing
export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalizeJson(obj[k])).join(',') + '}';
}

async function initSchemaAndSeed(db: PGlite) {
  // 1. Core Organizational Hierarchy & Authentication Tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      legal_name VARCHAR(255) NOT NULL,
      type VARCHAR(100),
      logo TEXT,
      description TEXT,
      motto TEXT
    );

    CREATE TABLE IF NOT EXISTS regions (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) REFERENCES organizations(id),
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL,
      logo TEXT,
      description TEXT,
      status VARCHAR(50) DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id VARCHAR(64) PRIMARY KEY,
      region_id VARCHAR(64) REFERENCES regions(id),
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL,
      logo TEXT,
      banner TEXT,
      colors JSONB,
      description TEXT,
      contact_info JSONB,
      meeting_schedule TEXT,
      social_links JSONB,
      charter_date VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS members (
      id VARCHAR(64) PRIMARY KEY,
      membership_number VARCHAR(100) UNIQUE NOT NULL,
      membership_card_id VARCHAR(100) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      middle_name VARCHAR(100),
      last_name VARCHAR(100) NOT NULL,
      suffix VARCHAR(50),
      nickname VARCHAR(100) NOT NULL,
      gender VARCHAR(20) NOT NULL,
      birthdate VARCHAR(50),
      profile_photo TEXT,
      mobile VARCHAR(50),
      email VARCHAR(255) UNIQUE,
      address TEXT,
      occupation TEXT,
      company_business TEXT,
      emergency_contact JSONB,
      date_joined VARCHAR(50),
      date_inducted VARCHAR(50),
      membership_status VARCHAR(50) NOT NULL,
      previous_club TEXT,
      primary_club_id VARCHAR(64) REFERENCES clubs(id),
      region_id VARCHAR(64) REFERENCES regions(id),
      positions JSONB,
      roles JSONB,
      permissions JSONB,
      privacy_settings JSONB,
      password_hash TEXT NOT NULL,
      failed_login_attempts INT DEFAULT 0,
      locked_until BIGINT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS member_history (
      id VARCHAR(64) PRIMARY KEY,
      member_id VARCHAR(64) REFERENCES members(id),
      date VARCHAR(50),
      type VARCHAR(100),
      description TEXT,
      club_name VARCHAR(255),
      recorded_by VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(128) PRIMARY KEY,
      member_id VARCHAR(64) REFERENCES members(id),
      expires_at BIGINT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 2. Meetings & Cryptographic Attendance Tables
    CREATE TABLE IF NOT EXISTS meetings (
      id VARCHAR(64) PRIMARY KEY,
      scope VARCHAR(50) NOT NULL,
      club_id VARCHAR(64) REFERENCES clubs(id),
      type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      date VARCHAR(50) NOT NULL,
      time VARCHAR(50) NOT NULL,
      location TEXT NOT NULL,
      venue_type VARCHAR(50) DEFAULT 'In-Person',
      description TEXT,
      status VARCHAR(50) DEFAULT 'Scheduled',
      created_by VARCHAR(255),
      agenda_items JSONB,
      qr_checkin_code VARCHAR(128)
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id VARCHAR(64) PRIMARY KEY,
      meeting_id VARCHAR(64) REFERENCES meetings(id),
      member_id VARCHAR(64) REFERENCES members(id),
      member_name VARCHAR(255) NOT NULL,
      member_nickname VARCHAR(100),
      member_number VARCHAR(100),
      method VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL,
      timestamp VARCHAR(100) NOT NULL,
      recorded_by VARCHAR(255),
      photo_evidence TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance_corrections (
      id VARCHAR(64) PRIMARY KEY,
      attendance_id VARCHAR(64),
      meeting_id VARCHAR(64) REFERENCES meetings(id),
      meeting_title VARCHAR(255),
      member_id VARCHAR(64) REFERENCES members(id),
      member_name VARCHAR(255),
      requested_by VARCHAR(255),
      reason TEXT NOT NULL,
      old_value VARCHAR(50),
      requested_value VARCHAR(50) NOT NULL,
      approval_status VARCHAR(50) DEFAULT 'Pending',
      approved_by VARCHAR(255),
      requested_at VARCHAR(100),
      decided_at VARCHAR(100)
    );

    -- Nonce Replay Protection for Cryptographic QR Tokens
    CREATE TABLE IF NOT EXISTS used_qr_nonces (
      nonce VARCHAR(128) PRIMARY KEY,
      member_id VARCHAR(64) REFERENCES members(id),
      meeting_id VARCHAR(64),
      used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 3. Community Service & Task Tracking
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(64) PRIMARY KEY,
      club_id VARCHAR(64) REFERENCES clubs(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      date VARCHAR(50),
      location TEXT,
      beneficiaries TEXT,
      beneficiary_count INT DEFAULT 0,
      budget NUMERIC(12,2) DEFAULT 0,
      actual_expense NUMERIC(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Planning',
      project_lead_id VARCHAR(64),
      project_lead_name VARCHAR(255),
      photos JSONB,
      sponsors JSONB,
      accomplishment_report TEXT
    );

    CREATE TABLE IF NOT EXISTS project_tasks (
      id VARCHAR(64) PRIMARY KEY,
      project_id VARCHAR(64) REFERENCES projects(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assignee_id VARCHAR(64),
      assignee_name VARCHAR(255),
      assignee_nickname VARCHAR(100),
      assignee_photo TEXT,
      due_date VARCHAR(50),
      priority VARCHAR(50) DEFAULT 'Medium',
      status VARCHAR(50) DEFAULT 'To Do',
      created_at VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS project_volunteers (
      id VARCHAR(64) PRIMARY KEY,
      project_id VARCHAR(64) REFERENCES projects(id),
      member_id VARCHAR(64) REFERENCES members(id),
      member_name VARCHAR(255),
      member_nickname VARCHAR(100),
      role VARCHAR(100),
      hours_logged INT DEFAULT 0,
      checked_in BOOLEAN DEFAULT FALSE
    );

    -- 4. True Double-Entry Financial Accounting Ledger
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      code VARCHAR(20) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
      normal_balance VARCHAR(10) NOT NULL -- Debit, Credit
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id VARCHAR(64) PRIMARY KEY,
      entry_number VARCHAR(50) UNIQUE NOT NULL,
      entry_date VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      reference_number VARCHAR(100),
      created_by VARCHAR(255) NOT NULL,
      approved_by VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Posted', -- Posted, Reversed
      reversal_of VARCHAR(64),
      club_id VARCHAR(64) REFERENCES clubs(id)
    );

    CREATE TABLE IF NOT EXISTS journal_lines (
      id VARCHAR(64) PRIMARY KEY,
      entry_id VARCHAR(64) REFERENCES journal_entries(id),
      account_code VARCHAR(20) REFERENCES chart_of_accounts(code),
      debit NUMERIC(12,2) DEFAULT 0,
      credit NUMERIC(12,2) DEFAULT 0,
      memo TEXT
    );

    CREATE TABLE IF NOT EXISTS financial_transactions (
      id VARCHAR(64) PRIMARY KEY,
      club_id VARCHAR(64) REFERENCES clubs(id),
      member_id VARCHAR(64) REFERENCES members(id),
      member_name VARCHAR(255),
      member_number VARCHAR(100),
      type VARCHAR(100) NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      reference_number VARCHAR(100) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      date VARCHAR(50) NOT NULL,
      recorded_by VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Verified',
      journal_entry_id VARCHAR(64) REFERENCES journal_entries(id),
      notes TEXT
    );

    -- 5. Secure Documents & Announcements & Notifications
    CREATE TABLE IF NOT EXISTS documents (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      classification VARCHAR(50) NOT NULL, -- Public, Members Only, Officers Only
      scope VARCHAR(50) NOT NULL,
      file_type VARCHAR(20) NOT NULL,
      file_size VARCHAR(50),
      storage_path TEXT NOT NULL,
      version VARCHAR(50) DEFAULT 'v1.0',
      uploaded_by VARCHAR(255),
      uploaded_at VARCHAR(50),
      download_count INT DEFAULT 0,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id VARCHAR(64) PRIMARY KEY,
      scope VARCHAR(50) NOT NULL,
      club_id VARCHAR(64) REFERENCES clubs(id),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      priority VARCHAR(50) DEFAULT 'Official Notice',
      status VARCHAR(50) DEFAULT 'Published',
      publish_at VARCHAR(100),
      created_by VARCHAR(64) REFERENCES members(id),
      author_name VARCHAR(255),
      author_position VARCHAR(255),
      read_by JSONB DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(64) PRIMARY KEY,
      recipient_id VARCHAR(64) REFERENCES members(id),
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      type VARCHAR(100) NOT NULL,
      channel VARCHAR(50) DEFAULT 'IN_APP',
      status VARCHAR(50) DEFAULT 'SENT', -- SENT, DELIVERED, READ
      target_scope VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      read_at TIMESTAMP WITH TIME ZONE
    );

    -- 6. Append-Only Tamper-Evident Audit Ledger
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      actor_id VARCHAR(64) NOT NULL,
      actor_name VARCHAR(255) NOT NULL,
      actor_position VARCHAR(255) NOT NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(100) NOT NULL,
      resource_id VARCHAR(100) NOT NULL,
      scope VARCHAR(100) NOT NULL,
      result VARCHAR(50) NOT NULL,
      timestamp VARCHAR(100) NOT NULL,
      ip VARCHAR(100) DEFAULT '127.0.0.1',
      user_agent TEXT,
      before_state JSONB,
      after_state JSONB,
      previous_hash VARCHAR(128) NOT NULL,
      current_hash VARCHAR(128) NOT NULL
    );

    -- 7. Constitution Versions & Dynamic Sections for RAG
    CREATE TABLE IF NOT EXISTS constitution_versions (
      id VARCHAR(64) PRIMARY KEY,
      version VARCHAR(50) UNIQUE NOT NULL,
      effective_date VARCHAR(100) NOT NULL,
      source_url TEXT NOT NULL,
      content_hash VARCHAR(128) NOT NULL,
      preamble TEXT NOT NULL,
      is_current BOOLEAN DEFAULT FALSE,
      sync_timestamp VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS constitution_articles (
      id VARCHAR(64) PRIMARY KEY,
      version_id VARCHAR(64) REFERENCES constitution_versions(id),
      article_number INT NOT NULL,
      roman_numeral VARCHAR(20) NOT NULL,
      title VARCHAR(255) NOT NULL,
      sort_order INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS constitution_sections (
      id VARCHAR(64) PRIMARY KEY,
      article_id VARCHAR(64) REFERENCES constitution_articles(id),
      version_id VARCHAR(64) REFERENCES constitution_versions(id),
      article_roman VARCHAR(20) NOT NULL,
      section_number INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      sort_order INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS constitution_sync_runs (
      id VARCHAR(64) PRIMARY KEY,
      source_url TEXT NOT NULL,
      started_at VARCHAR(100) NOT NULL,
      completed_at VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL,
      previous_hash VARCHAR(128),
      new_hash VARCHAR(128),
      version_detected VARCHAR(100),
      records_created INT DEFAULT 0,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS constitution_queries (
      id VARCHAR(64) PRIMARY KEY,
      member_id VARCHAR(64),
      member_name VARCHAR(255),
      question TEXT NOT NULL,
      response TEXT NOT NULL,
      sources JSONB,
      model VARCHAR(100),
      constitution_version VARCHAR(50),
      timestamp VARCHAR(100) NOT NULL
    );
  `);

  // Seed Chart of Accounts for Double-Entry Accounting
  const accountsCount = await db.query(`SELECT COUNT(*) as count FROM chart_of_accounts`);
  if (parseInt((accountsCount.rows[0] as any).count as string) === 0) {
    await db.exec(`
      INSERT INTO chart_of_accounts (code, name, type, normal_balance) VALUES
      ('1010', 'Cash & Bank Balances', 'Asset', 'Debit'),
      ('1020', 'Accounts Receivable (Member Dues)', 'Asset', 'Debit'),
      ('2010', 'Regional Dues Remittance Payable', 'Liability', 'Credit'),
      ('2020', 'National Capitation Remittance Payable', 'Liability', 'Credit'),
      ('3010', 'Club Fraternal Fund Equity', 'Equity', 'Credit'),
      ('4010', 'Membership Dues Revenue', 'Revenue', 'Credit'),
      ('4020', 'Special Assessment Donations', 'Revenue', 'Credit'),
      ('5010', 'Community Service Project Expenses', 'Expense', 'Debit'),
      ('5020', 'Meeting & Fellowship Operational Expenses', 'Expense', 'Debit');
    `);
  }

  // Seed Initial Org Hierarchy
  const orgCount = await db.query(`SELECT COUNT(*) as count FROM organizations`);
  if (parseInt((orgCount.rows[0] as any).count as string) === 0) {
    await db.exec(`
      INSERT INTO organizations (id, name, legal_name, type, logo, description, motto)
      VALUES (
        'org-tfoe-pe',
        'The Fraternal Order of Eagles',
        'The Fraternal Order of Eagles - Philippine Eagles, Inc. (TFOE-PE, Inc.)',
        'Fraternal Socio-Civic Order',
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
        'The first Philippine-born fraternal socio-civic movement.',
        'Service Through Strong Brotherhood (Humanitarian Service)'
      );

      INSERT INTO regions (id, organization_id, name, code, logo, description, status)
      VALUES (
        'region-bcnbr1',
        'org-tfoe-pe',
        'Bicol Camarines Norte Bantayog Region 1',
        'BCNBR-1',
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80',
        'Governing Region 1 of Camarines Norte chartered clubs.',
        'Active'
      );

      INSERT INTO clubs (id, region_id, name, code, logo, banner, colors, description, contact_info, meeting_schedule, social_links, charter_date, status)
      VALUES (
        'club-beec',
        'region-bcnbr1',
        'Bantayog Elite Eagles Club',
        'BEEC',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
        '{"primary": "#d97706", "secondary": "#1e3a8a", "accent": "#0f172a"}'::jsonb,
        'Distinguished chapter of visionary community leaders committed to fraternal unity and disaster response.',
        '{"email": "secretariat@bantayogeliteeagles.ph", "phone": "+63 917 888 3333", "address": "Bantayog Elite Eagles Club Hall, F. Pimentel Ave, Daet, Camarines Norte"}'::jsonb,
        'Every 2nd & 4th Saturday of the month at 6:00 PM',
        '{"facebook": "https://facebook.com/BantayogEliteEaglesClub"}'::jsonb,
        '2022-03-18',
        'Active'
      );
    `);
  }

  // Seed Authoritative Members with Argon2id Password Hashing
  const memberCount = await db.query(`SELECT COUNT(*) as count FROM members`);
  if (parseInt((memberCount.rows[0] as any).count as string) === 0) {
    const defaultPassword = 'Agila2026!';
    const defaultArgonHash = await hashArgon(defaultPassword, {
      algorithm: 2 as Algorithm,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const seedMembers = [
      {
        id: 'mem-aragon',
        num: 'TFOE-2022-04101',
        card: 'BEEC-2026-001',
        first: 'Joy',
        mid: 'M.',
        last: 'Aragon',
        nick: 'Joy',
        gender: 'Male',
        pos: ['Club President (2026-2028)'],
        roles: ['President', 'Club_Admin'],
        perms: [
          'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
          'MEMBER_DIRECTORY_VIEW', 'MEMBER_APPROVE', 'MEMBER_RECORD_MANAGE', 'ATTENDANCE_ADMIN',
          'ANNOUNCEMENT_CREATE', 'ANNOUNCEMENT_PUBLISH', 'COMMUNITY_SERVICE_MANAGE', 'FINANCE_VIEW_CLUB',
          'DOCUMENT_MANAGE', 'REPORT_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
        ],
        mobile: '+63 917 555 1001',
        email: 'joy.aragon@bantayogeliteeagles.ph',
      },
      {
        id: 'mem-rait',
        num: 'TFOE-2022-04102',
        card: 'BEEC-2026-002',
        first: 'Genmil',
        mid: 'M.',
        last: 'Rait',
        nick: 'Genmil',
        gender: 'Male',
        pos: ['Club Vice President (2026-2028)'],
        roles: ['Vice_President', 'Club_Admin'],
        perms: [
          'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
          'MEMBER_DIRECTORY_VIEW', 'MEMBER_APPROVE', 'ATTENDANCE_ADMIN', 'COMMUNITY_SERVICE_MANAGE',
          'DOCUMENT_VIEW', 'REPORT_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
        ],
        mobile: '+63 918 555 2002',
        email: 'genmil.rait@bantayogeliteeagles.ph',
      },
      {
        id: 'mem-camacho',
        num: 'TFOE-2022-04198',
        card: 'BEEC-2026-003',
        first: 'Chester Jan',
        mid: 'T.',
        last: 'Camacho',
        nick: 'Chester',
        gender: 'Male',
        pos: ['Club Secretary (2026-2028)', 'Regional Protocol Deputy (BCNBR-1)'],
        roles: ['Secretary', 'Club_Admin', 'Regional_Officer'],
        perms: [
          'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
          'MEMBER_DIRECTORY_VIEW', 'MEMBER_RECORD_MANAGE', 'MEMBER_APPROVE', 'ATTENDANCE_ADMIN',
          'ATTENDANCE_SCAN', 'ATTENDANCE_CORRECTION_MANAGE', 'ANNOUNCEMENT_CREATE', 'ANNOUNCEMENT_PUBLISH',
          'DOCUMENT_MANAGE', 'REPORT_VIEW', 'DATA_EXPORT', 'DATA_IMPORT', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
        ],
        mobile: '+63 917 888 3333',
        email: 'chester.camacho@gmail.com',
      },
      {
        id: 'mem-talento',
        num: 'TFOE-2022-04104',
        card: 'BEEC-2026-004',
        first: 'Joenathan',
        mid: 'L.',
        last: 'Talento',
        nick: 'Joenathan',
        gender: 'Male',
        pos: ['Club Treasurer (2026-2028)'],
        roles: ['Treasurer', 'Finance_Admin'],
        perms: [
          'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
          'FINANCE_VIEW_SELF', 'FINANCE_MANAGE', 'FINANCE_RECORD_PAYMENT', 'FINANCE_REPORT',
          'REPORT_VIEW', 'DATA_EXPORT', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
        ],
        mobile: '+63 919 444 4004',
        email: 'joenathan.talento@bantayogeliteeagles.ph',
      },
      {
        id: 'mem-mago',
        num: 'TFOE-2022-04105',
        card: 'BEEC-2026-005',
        first: 'Jeric',
        mid: 'R.',
        last: 'Mago',
        nick: 'Jeric',
        gender: 'Male',
        pos: ['Club Auditor (2026-2028)'],
        roles: ['Auditor', 'Finance_Admin'],
        perms: [
          'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
          'FINANCE_VIEW_SELF', 'FINANCE_REPORT', 'AUDIT_LOG_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
        ],
        mobile: '+63 920 333 5005',
        email: 'jeric.mago@bantayogeliteeagles.ph',
      },
      {
        id: 'mem-giron',
        num: 'TFOE-2024-07821',
        card: 'BEEC-2026-006',
        first: 'Aris',
        mid: 'G.',
        last: 'Giron',
        nick: 'Aris',
        gender: 'Male',
        pos: ['Public Information Officer (PIO) (2026-2028)'],
        roles: ['PIO'],
        perms: [
          'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
          'ANNOUNCEMENT_CREATE', 'ANNOUNCEMENT_PUBLISH', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
        ],
        mobile: '+63 921 111 6006',
        email: 'aris.giron@bantayogeliteeagles.ph',
      },
      {
        id: 'mem-morales',
        num: 'TFOE-2023-06100',
        card: 'BEEC-2026-007',
        first: 'Dave',
        mid: 'P.',
        last: 'Morales',
        nick: 'Dave',
        gender: 'Male',
        pos: ['Community Service Committee Chairman (2026-2028)'],
        roles: ['Community_Service_Chair', 'Project_Lead'],
        perms: [
          'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
          'COMMUNITY_SERVICE_MANAGE', 'TASK_MANAGE', 'DOCUMENT_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
        ],
        mobile: '+63 920 222 7007',
        email: 'dave.morales@bantayogeliteeagles.ph',
      },
      {
        id: 'mem-bautista',
        num: 'TFOE-2023-05912',
        card: 'BEEC-2026-008',
        first: 'Mark',
        mid: 'D.',
        last: 'Bautista',
        nick: 'Mark',
        gender: 'Male',
        pos: ['Protocol Officer / Sergeant-at-Arms (2026-2028)'],
        roles: ['Protocol_Officer'],
        perms: [
          'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
          'ATTENDANCE_SCAN', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
        ],
        mobile: '+63 919 777 8008',
        email: 'mark.bautista@bantayogeliteeagles.ph',
      },
      {
        id: 'mem-ecat',
        num: 'TFOE-2016-00889',
        card: 'BCNBR1-2026-001',
        first: 'Joel',
        mid: 'O.',
        last: 'Ecat',
        nick: 'Joel',
        gender: 'Male',
        pos: ['Regional Governor, BCNBR-1 (2026-2028)'],
        roles: ['Regional_Officer', 'Club_Admin'],
        perms: [
          'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
          'REGIONAL_VIEW', 'REGIONAL_ADMIN', 'REPORT_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
        ],
        mobile: '+63 917 333 9009',
        email: 'governor@bcnbr1.tfoe-peinc.com',
      },
      {
        id: 'mem-devera',
        num: 'TFOE-2014-00120',
        card: 'NAT-2026-001',
        first: 'Gabriel',
        mid: 'P.',
        last: 'De Vera',
        nick: 'Gabriel',
        gender: 'Male',
        pos: ['National Technical Custodian', 'e-Constitution Systems Administrator'],
        roles: ['National_Admin', 'Master_Admin', 'National_Custodian'],
        perms: [
          'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
          'NATIONAL_ADMIN', 'CONSTITUTION_SOURCE_MANAGE', 'CONSTITUTION_REINDEX', 'CONSTITUTION_SYNC_VIEW',
          'CONSTITUTION_AUDIT_VIEW', 'AUDIT_LOG_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
        ],
        mobile: '+63 917 111 0001',
        email: 'gabriel.devera@tfoe-peinc.com',
      },
      {
        id: 'mem-delgado',
        num: 'TFOE-2024-08015',
        card: 'BEEC-2026-009',
        first: 'Maria',
        mid: 'Santos',
        last: 'Delgado',
        nick: 'Maria',
        gender: 'Female',
        pos: ['Lady Eagle / Regular Member'],
        roles: ['Member'],
        perms: [
          'MEMBER_VIEW_SELF', 'MEMBER_EDIT_SELF', 'DIGITAL_ID_VIEW', 'ATTENDANCE_VIEW_SELF',
          'FINANCE_VIEW_SELF', 'DOCUMENT_VIEW', 'CONSTITUTION_VIEW', 'CONSTITUTION_AI_ASK'
        ],
        mobile: '+63 922 999 7777',
        email: 'maria.delgado@bantayogeliteeagles.ph',
      },
      {
        id: 'mem-joel-pending',
        num: 'TFOE-APP-2026-010',
        card: 'BEEC-APP-010',
        first: 'Joel',
        mid: 'Navarro',
        last: 'Santos',
        nick: 'Joel',
        gender: 'Male',
        pos: ['Applicant'],
        roles: ['Applicant'],
        perms: ['MEMBER_VIEW_SELF', 'CONSTITUTION_VIEW'],
        mobile: '+63 928 777 9009',
        email: 'joel.navarro@gmail.com',
      },
    ];

    for (const m of seedMembers) {
      await db.query(
        `INSERT INTO members (
          id, membership_number, membership_card_id, first_name, middle_name, last_name,
          nickname, gender, birthdate, profile_photo, mobile, email, address, occupation,
          company_business, emergency_contact, date_joined, date_inducted, membership_status,
          primary_club_id, region_id, positions, roles, permissions, privacy_settings, password_hash
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
        )`,
        [
          m.id,
          m.num,
          m.card,
          m.first,
          m.mid,
          m.last,
          m.nick,
          m.gender,
          '1985-01-01',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          m.mobile,
          m.email,
          'Daet, Camarines Norte',
          'Professional Executive',
          'Private Enterprise',
          JSON.stringify({ name: 'Emergency Family', relation: 'Family', mobile: m.mobile }),
          '2022-03-18',
          m.id === 'mem-joel-pending' ? 'Pending Induction' : '2022-04-09',
          m.id === 'mem-joel-pending' ? 'Pending Approval' : 'Active',
          'club-beec',
          'region-bcnbr1',
          JSON.stringify(m.pos),
          JSON.stringify(m.roles),
          JSON.stringify(m.perms),
          JSON.stringify({ hideMobile: false, hideEmail: false, hideAddress: false }),
          defaultArgonHash,
        ]
      );
    }
  }

  // Seed Ratified Constitution Version & Relational Sections into PostgreSQL
  const constCount = await db.query(`SELECT COUNT(*) as count FROM constitution_versions`);
  if (parseInt((constCount.rows[0] as any).count as string) === 0) {
    const versionId = 'const-ver-2026-1';
    await db.query(
      `INSERT INTO constitution_versions (
        id, version, effective_date, source_url, content_hash, preamble, is_current, sync_timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        versionId,
        OFFICIAL_CONSTITUTION_VERSION,
        OFFICIAL_CONSTITUTION_DATE,
        OFFICIAL_CONSTITUTION_SOURCE,
        OFFICIAL_CONSTITUTION_HASH,
        CONSTITUTION_PREAMBLE,
        true,
        '2026-01-15 00:00:00 PST',
      ]
    );

    for (const art of CONSTITUTION_ARTICLES) {
      const artId = `art-${art.articleNumber}`;
      await db.query(
        `INSERT INTO constitution_articles (id, version_id, article_number, roman_numeral, title, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [artId, versionId, art.articleNumber, art.romanNumeral, art.title, art.sortOrder]
      );

      for (const sec of art.sections) {
        const secId = `sec-${art.articleNumber}-${sec.sectionNumber}`;
        await db.query(
          `INSERT INTO constitution_sections (id, article_id, version_id, article_roman, section_number, title, content, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [secId, artId, versionId, sec.articleRoman, sec.sectionNumber, sec.title, sec.content, sec.sortOrder]
        );
      }
    }
  }

  // Seed Initial Genesis Block in Audit Log
  const auditCount = await db.query(`SELECT COUNT(*) as count FROM audit_logs`);
  if (parseInt((auditCount.rows[0] as any).count as string) === 0) {
    await db.query(
      `INSERT INTO audit_logs (
        id, actor_id, actor_name, actor_position, action, resource_type, resource_id, scope, result, timestamp, ip, previous_hash, current_hash
      ) VALUES (
        'aud-genesis', 'system', 'AGILA System Initialization', 'Root Custodian', 'POSTGRESQL_BOOTSTRAP',
        'Database', 'postgres-v1', 'National', 'Success', '2026-01-01 00:00:00 PST', '127.0.0.1',
        '0000000000000000000000000000000000000000000000000000000000000000',
        '7f92b49c0d9a6c1e30a597e74fd712bc90a88ef114b397de8e48950d98ad4421'
      )`
    );
  }
}
