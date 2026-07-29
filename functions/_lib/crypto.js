const encoder = new TextEncoder();
// Pages Functions on the Workers Free plan has a tight per-request CPU budget.
// 600k PBKDF2 rounds can fail before the user row is written. The per-user
// salt, server-only pepper, login throttling and constant-time comparison are
// retained; the stored iteration count keeps future upgrades possible.
export const PASSWORD_ITERATIONS = 100000;

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function pepperPassword(password, pepper) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(String(pepper)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return crypto.subtle.sign('HMAC', key, encoder.encode(password));
}

export async function hashPassword(password, pepper, saltBase64 = null, iterations = PASSWORD_ITERATIONS) {
  const salt = saltBase64 ? base64ToBytes(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
  const peppered = await pepperPassword(password, pepper);
  const key = await crypto.subtle.importKey('raw', peppered, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  );
  return {
    hash: bytesToBase64(new Uint8Array(bits)),
    salt: bytesToBase64(salt),
    iterations,
  };
}

export async function verifyPassword(password, pepper, storedHash, storedSalt, iterations) {
  const candidate = await hashPassword(password, pepper, storedSalt, iterations);
  const a = base64ToBytes(candidate.hash);
  const b = base64ToBytes(storedHash);
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a[index] ^ b[index];
  return mismatch === 0;
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return bytesToBase64(new Uint8Array(digest));
}
