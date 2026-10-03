import crypto from 'crypto';
import {
  getDatabase,
  postDoubleEntryTransaction,
  reverseFinancialTransaction,
  getTrialBalance,
  exportDatabaseBackup,
  restoreDatabaseBackup,
} from './db';
import {
  hashPassword,
  verifyPassword,
  signQRPayload,
  verifyQRToken,
  consumeNonce,
  isNonceReplayed,
} from './security';
import { ConstitutionSourceAdapter, canonicalizeJson } from './constitutionAdapter';
import { requirePermission, AuthenticatedRequest } from './auth';

async function runTests() {
  console.log('🦅 ========================================================');
  console.log('🦅  AGILA HUB PRODUCTION BACKEND & SECURITY TEST SUITE');
  console.log('🦅 ========================================================');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  const db = getDatabase();

  // TEST 1: Database and Authoritative Officers Seeding
  console.log('\n[1] Authoritative Database Seeding & Officer Alignment');
  const president = db.members.find((m) => m.id === 'mem-aragon');
  const secretary = db.members.find((m) => m.id === 'mem-camacho');
  const governor = db.members.find((m) => m.id === 'mem-ecat');
  const custodian = db.members.find((m) => m.id === 'mem-devera');

  assert(president?.firstName === 'Joy' && president?.lastName === 'Aragon', 'Authoritative Club President is Joy M. Aragon');
  assert(secretary?.firstName === 'Chester Jan' && secretary?.lastName === 'Camacho', 'Authoritative Club Secretary is Chester Jan T. Camacho');
  assert(governor?.firstName === 'Joel' && governor?.lastName === 'Ecat', 'Authoritative Regional Governor is Joel O. Ecat');
  assert(custodian?.firstName === 'Gabriel' && custodian?.lastName === 'De Vera', 'Authoritative Tech Custodian is Gabriel P. De Vera');

  // TEST 2: Argon2id Password Hashing & Verification
  console.log('\n[2] Password Hashing & Authentication');
  const testPassword = 'Agila2026!';
  const argonHash = await hashPassword(testPassword);
  const isValidArgon = await verifyPassword(testPassword, argonHash);
  const isInvalidArgon = await verifyPassword('WrongPassword!', argonHash);
  assert(isValidArgon, 'Argon2id password verification succeeds for valid credentials');
  assert(!isInvalidArgon, 'Argon2id password verification rejects invalid credentials');

  // TEST 3: Strict Rejection of Legacy Unsigned v1 QR Codes
  console.log('\n[3] Rejection of Legacy Unsigned v1 QR Tokens');
  const legacyV1Token = 'agila://verify/v1/mem-camacho/TFOE-2022-04198';
  const legacyResult = verifyQRToken(legacyV1Token);
  assert(legacyResult.valid === false, 'Strictly rejects legacy unsigned v1 QR code');

  // TEST 4: Cryptographic v2 QR Token HMAC-SHA256 Verification
  console.log('\n[4] Cryptographic v2 QR Signature Verification');
  const validPayload = {
    memberId: secretary!.id,
    memberNumber: secretary!.membershipNumber,
    clubCode: 'BEEC',
    issuedAt: Date.now(),
    nonce: `nonce-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
  };
  const signedV2 = signQRPayload(validPayload);
  const v2Result = verifyQRToken(signedV2);
  assert(v2Result.valid === true && v2Result.payload?.memberId === secretary!.id, 'Server HMAC-SHA256 accepts authentic v2 signed QR token');

  const tamperedV2 = signedV2.replace(/\.[a-f0-9]{64}$/, '.0000000000000000000000000000000000000000000000000000000000000000');
  const tamperedResult = verifyQRToken(tamperedV2);
  assert(tamperedResult.valid === false, 'Server HMAC-SHA256 strictly rejects tampered token');

  // TEST 5: QR Token Expiration Protection (15-minute window)
  console.log('\n[5] QR Token Expiration Protection');
  const expiredPayload = {
    memberId: secretary!.id,
    memberNumber: secretary!.membershipNumber,
    clubCode: 'BEEC',
    issuedAt: Date.now() - (20 * 60 * 1000), // 20 minutes ago (expired)
    nonce: `nonce-expired-${Date.now()}`,
  };
  const expiredSigned = signQRPayload(expiredPayload);
  const expiredResult = verifyQRToken(expiredSigned);
  assert(expiredResult.valid === false, 'Server strictly rejects expired QR token (>15 minutes old)');

  // TEST 6: Server-Side QR Replay Attack Prevention
  console.log('\n[6] Server-Side Nonce Replay Attack Prevention');
  const replayNonce = `nonce-replay-test-${Date.now()}`;
  const replayPayload = {
    memberId: secretary!.id,
    memberNumber: secretary!.membershipNumber,
    clubCode: 'BEEC',
    issuedAt: Date.now(),
    nonce: replayNonce,
  };
  const replayToken = signQRPayload(replayPayload);
  const firstPresentation = verifyQRToken(replayToken);
  assert(firstPresentation.valid === true, 'First presentation of QR token succeeds');

  // Consume nonce on first scan
  consumeNonce(replayNonce);
  assert(isNonceReplayed(replayNonce), 'Nonce is recorded as consumed on the server');

  const secondPresentation = verifyQRToken(replayToken);
  assert(secondPresentation.valid === false, 'Replayed presentation of the exact same QR token is strictly rejected');

  // TEST 7: Separation of Master Admin from Constitutional Authority
  console.log('\n[7] Separation of Master Admin from Constitutional Authority');
  const masterAdminUser: any = {
    id: 'admin-1',
    firstName: 'Tech',
    lastName: 'Admin',
    roles: ['Master_Admin'],
    positions: ['Technical Systems Administrator'],
    permissions: ['SYSTEM_CONFIG_VIEW', 'USER_MANAGE'],
    primaryClubId: 'club-beec',
  };

  const dummyReq: any = {
    user: masterAdminUser,
    originalUrl: '/api/constitution/sync',
    ip: '127.0.0.1',
    body: {},
  };

  let middlewareAllowed = false;
  let middlewareStatus = 200;
  const dummyRes: any = {
    status: (code: number) => {
      middlewareStatus = code;
      return { json: () => {} };
    },
  };
  const dummyNext = () => {
    middlewareAllowed = true;
  };

  const constitutionGuard = requirePermission('CONSTITUTION_SOURCE_MANAGE', 'National');
  constitutionGuard(dummyReq, dummyRes, dummyNext);

  assert(!middlewareAllowed && middlewareStatus === 403, 'Master_Admin WITHOUT constitutional authority is strictly forbidden from constitutional governance');

  // TEST 8: Constitution HTML Parser & Canonical Hashing
  console.log('\n[8] Constitution Parser & Canonical JSON Hashing');
  const adapter = new ConstitutionSourceAdapter();
  const sampleHtml = `
    <html>
      <body>
        <h1>Article I - Name and Domicile</h1>
        <h3>Section 1</h3>
        <p>The name of this fraternal organization shall be The Fraternal Order of Eagles - Philippine Eagles, Inc.</p>
        <h3>Section 2</h3>
        <p>The national headquarters shall be established in Metro Manila, Philippines.</p>
        <h1>Article II - Declaration of Principles</h1>
        <h3>Section 1</h3>
        <p>Humanitarian service through strong brotherhood shall be the guiding light.</p>
      </body>
    </html>
  `;
  const parsed = adapter.parseHtmlArticles(sampleHtml);
  const hash1 = adapter.calculateCanonicalHash(parsed);
  const hash2 = adapter.calculateCanonicalHash(parsed);
  assert(hash1 === hash2, 'Canonical JSON hashing is deterministic and reproducible');
  assert(hash1.startsWith('sha256:') && hash1.length === 71, 'Canonical hash is a standardized 256-bit SHA-256 digest');

  // TEST 9: Dynamic Constitution Rollback Engine
  console.log('\n[9] Constitution Rollback Engine');
  const currentActive = db.constitutionVersions.find((v) => v.isCurrent);
  assert(currentActive !== undefined, 'Authoritative Constitution version is active');

  // Add dummy archived version
  const archivedId = 'const-ver-2024-archived';
  db.constitutionVersions.push({
    id: archivedId,
    version: 'v2024.1',
    effectiveDate: 'January 1, 2024',
    sourceUrl: 'https://e-constitution.tfoe-peinc.com/',
    contentHash: 'sha256:1111222233334444555566667777888899990000aaaaabbbbbcccccdddddeeeee',
    preamble: currentActive!.preamble,
    articles: currentActive!.articles,
    isCurrent: false,
    syncTimestamp: '2024-01-01 00:00:00 PST',
  });

  const rollbackResult = adapter.rollbackToVersion(
    archivedId,
    custodian!.id,
    `${custodian!.firstName} ${custodian!.lastName}`,
    'Executive Council Resolution #2026-08'
  );
  assert(rollbackResult.status === 'ROLLED_BACK', 'Constitution successfully rolled back to archived version');
  const newActive = db.constitutionVersions.find((v) => v.isCurrent);
  assert(newActive?.id === archivedId, 'Archived version promoted to current active version');

  // Restore current version
  adapter.rollbackToVersion(
    currentActive!.id,
    custodian!.id,
    `${custodian!.firstName} ${custodian!.lastName}`,
    'Reinstating 2026 ratified version'
  );
  assert(db.constitutionVersions.find((v) => v.isCurrent)?.id === currentActive!.id, 'Current ratified version restored');

  // TEST 10: True Double-Entry Financial Accounting Ledger & Trial Balance
  console.log('\n[10] Double-Entry Accounting Ledger & Trial Balance');
  const trialBalanceBefore = getTrialBalance();
  assert(trialBalanceBefore.isBalanced, `Initial trial balance is balanced (Debits: ₱${trialBalanceBefore.totalDebits}, Credits: ₱${trialBalanceBefore.totalCredits})`);

  // Post a new verified transaction
  const paymentAmount = 5000;
  const postResult = postDoubleEntryTransaction({
    clubId: 'club-beec',
    memberId: 'mem-aragon',
    memberName: 'Kuya Joy Aragon',
    memberNumber: 'TFOE-2022-04101',
    type: 'Annual Membership Dues',
    amount: paymentAmount,
    referenceNumber: `OR-TEST-${Date.now()}`,
    paymentMethod: 'Bank Transfer',
    date: '2026-10-02',
    recordedBy: 'Kuya Joenathan Talento',
    lines: [
      { accountCode: '1010', debit: paymentAmount, credit: 0, memo: 'Bank Transfer' },
      { accountCode: '4010', debit: 0, credit: paymentAmount, memo: 'Dues' },
    ],
  });

  assert(postResult.transaction && postResult.journalEntry, 'Double-entry transaction posted successfully');
  const trialBalanceAfter = getTrialBalance();
  assert(trialBalanceAfter.isBalanced, `Trial balance remains balanced after posting (Debits: ₱${trialBalanceAfter.totalDebits}, Credits: ₱${trialBalanceAfter.totalCredits})`);

  // TEST 11: Immutable Financial Reversals
  console.log('\n[11] Immutable Financial Reversals (Non-Destructive)');
  const reversalResult = reverseFinancialTransaction(
    postResult.transaction.id,
    'Kuya Joenathan Talento (Treasurer)',
    'Duplicate payment entry reversal'
  );

  assert(reversalResult.original.status === 'Reversed', 'Original transaction status updated to Reversed (not deleted)');
  assert(reversalResult.reversal.amount === -paymentAmount, 'Reversing transaction created with negative offsetting amount');
  const trialBalanceReversed = getTrialBalance();
  assert(trialBalanceReversed.isBalanced, `Trial balance remains balanced after reversal (Debits: ₱${trialBalanceReversed.totalDebits}, Credits: ₱${trialBalanceReversed.totalCredits})`);

  // TEST 12: Append-Only Tamper-Evident Hash Chain
  console.log('\n[12] Append-Only Tamper-Evident Audit Ledger Hash-Chain');
  const logs = db.auditLogs;
  let chainIntact = true;
  for (let i = 1; i < logs.length; i++) {
    if (logs[i].previousHash !== logs[i - 1].currentHash) {
      chainIntact = false;
      break;
    }
  }
  assert(chainIntact, `Audit ledger cryptographic hash-chain across all ${logs.length} blocks is 100% intact`);

  // TEST 13: Database Backup & Restore with Checksum Validation
  console.log('\n[13] Database Backup & Disaster Recovery');
  const backupData = exportDatabaseBackup();
  assert(backupData.checksum.startsWith('sha256:') && backupData.backup.length > 1000, 'Database backup successfully exported with SHA-256 checksum');

  const restoreSuccess = restoreDatabaseBackup(
    backupData.backup,
    backupData.checksum,
    'mem-devera',
    'Gabriel De Vera'
  );
  assert(restoreSuccess === true, 'Database successfully restored from validated backup archive');

  console.log(`\n========================================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
