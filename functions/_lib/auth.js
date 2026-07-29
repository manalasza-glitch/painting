import { sha256, randomToken } from './crypto.js';
import { json, clientIp } from './http.js';
import { hasPermission, userPermissions } from './permissions.js';

const COOKIE_NAME = 'painting_session';
const SESSION_SECONDS = 12 * 60 * 60;

function parseCookies(request) {
  const output = {};
  for (const pair of (request.headers.get('Cookie') || '').split(';')) {
    const index = pair.indexOf('=');
    if (index > 0) output[pair.slice(0, index).trim()] = pair.slice(index + 1).trim();
  }
  return output;
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function createSession(env, request, userId) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_SECONDS * 1000);
  await env.DB.prepare(`
    INSERT INTO sessions
      (token_hash, user_id, created_at, expires_at, last_seen_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    tokenHash,
    userId,
    now.toISOString(),
    expiresAt.toISOString(),
    now.toISOString(),
    clientIp(request),
    (request.headers.get('User-Agent') || '').slice(0, 300),
  ).run();
  return token;
}

export async function destroySession(env, request) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
}

export async function currentUser(env, request) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const user = await env.DB.prepare(`
    SELECT u.*, s.expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active'
  `).bind(tokenHash, now).first();
  if (!user) return null;
  await env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?')
    .bind(now, tokenHash).run();
  return user;
}

export function publicUser(user) {
  return {
    id: user.id,
    employeeId: user.employee_id,
    displayName: user.display_name,
    department: user.department,
    role: user.role,
    status: user.status,
    permissions: userPermissions(user),
    createdAt: user.created_at,
    approvedAt: user.approved_at,
    lastLoginAt: user.last_login_at,
  };
}

export async function requireUser(env, request, permission = null) {
  const user = await currentUser(env, request);
  if (!user) return { response: json({ ok: false, error: 'กรุณาเข้าสู่ระบบ' }, 401) };
  if (permission && !hasPermission(user, permission)) {
    return { response: json({ ok: false, error: 'บัญชีนี้ไม่มีสิทธิ์ดำเนินการ' }, 403) };
  }
  return { user };
}

export async function audit(env, request, actorId, action, targetId = null, details = {}) {
  await env.DB.prepare(`
    INSERT INTO audit_logs (actor_user_id, action, target_user_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(actorId, action, targetId, JSON.stringify(details), clientIp(request), new Date().toISOString()).run();
}
