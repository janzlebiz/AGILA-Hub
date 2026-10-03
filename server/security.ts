import crypto from 'crypto';
import { hash, verify, Algorithm } from '@node-rs/argon2';

// ==========================================
// 1. PASSWORD HASHING (ARGON2id)
// ==========================================

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    algorithm: 2 as Algorithm,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

// Synchronous wrapper using PBKDF2 for legacy fallback support
export function hashPasswordSync(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export async function verifyPassword(password: string, passwordHash: string, salt?: string): Promise<boolean> {
  if (passwordHash.startsWith('$argon2')) {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }
  // Check PBKDF2 legacy format
  if (salt) {
    const legacy = hashPasswordSync(password, salt);
    return legacy === passwordHash;
  }
  return false;
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// ==========================================
// 2. CRYPTOGRAPHIC QR ATTENDANCE TOKENS (v2 HMAC-SHA256)
// ==========================================

const QR_SECRET = process.env.QR_SIGNING_SECRET || 'tfoe-pe-agila-qr-signing-key-2026-prod';
const MAX_QR_LIFETIME_MS = 15 * 60 * 1000; // 15-minute validity window

export interface QRPayload {
  memberId: string;
  memberNumber: string;
  clubCode: string;
  issuedAt: number;
  nonce: string;
}

export function signQRPayload(payload: QRPayload): string {
  const data = `${payload.memberId}:${payload.memberNumber}:${payload.clubCode}:${payload.issuedAt}:${payload.nonce}`;
  const signature = crypto.createHmac('sha256', QR_SECRET).update(data).digest('hex');
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `agila://verify/v2/${encoded}.${signature}`;
}

// In-memory nonce cache with TTL for ultra-fast replay checking
const consumedNonces = new Map<string, number>();

// Evict expired nonces every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - (MAX_QR_LIFETIME_MS * 2);
  for (const [nonce, timestamp] of consumedNonces.entries()) {
    if (timestamp < cutoff) {
      consumedNonces.delete(nonce);
    }
  }
}, 10 * 60 * 1000).unref();

export function isNonceReplayed(nonce: string): boolean {
  return consumedNonces.has(nonce);
}

export function consumeNonce(nonce: string): void {
  consumedNonces.set(nonce, Date.now());
}

export function verifyQRToken(token: string): { valid: boolean; payload?: QRPayload; error?: string } {
  // STRICT REQUIREMENT: Reject all legacy/unsigned v1 tokens
  if (!token || !token.startsWith('agila://verify/v2/')) {
    return {
      valid: false,
      error: 'Legacy or unsigned QR code rejected. Cryptographically signed v2 QR token is strictly required.',
    };
  }

  try {
    const raw = token.replace('agila://verify/v2/', '');
    const [encodedPayload, signature] = raw.split('.');
    if (!encodedPayload || !signature) {
      return { valid: false, error: 'Malformed QR signature structure' };
    }

    const payload: QRPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    
    // 1. Validate required payload fields
    if (!payload.memberId || !payload.memberNumber || !payload.nonce || !payload.issuedAt) {
      return { valid: false, error: 'QR token payload missing required cryptographic claims' };
    }

    // 2. Validate cryptographic HMAC-SHA256 signature
    const expectedData = `${payload.memberId}:${payload.memberNumber}:${payload.clubCode}:${payload.issuedAt}:${payload.nonce}`;
    const expectedSig = crypto.createHmac('sha256', QR_SECRET).update(expectedData).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false, error: 'Cryptographic signature mismatch. Token has been tampered with.' };
    }

    // 3. Expiration verification (15-minute maximum lifetime)
    const now = Date.now();
    if (now - payload.issuedAt > MAX_QR_LIFETIME_MS) {
      return { valid: false, error: 'QR code has expired (exceeded 15-minute validity window). Please refresh Digital ID.' };
    }
    if (payload.issuedAt > now + 60 * 1000) {
      return { valid: false, error: 'Invalid QR token: issued timestamp is set in the future.' };
    }

    // 4. Server-Side Nonce Replay Check
    if (isNonceReplayed(payload.nonce)) {
      return { valid: false, error: 'Replay attack detected: QR code token has already been presented and consumed.' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Signature verification failed' };
  }
}
