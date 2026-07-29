import { verifyPassword, hashPassword } from '../../_lib/crypto.js';
import { createSession, sessionCookie, publicUser, audit } from '../../_lib/auth.js';
import {
  json, readJson, normalizeEmployeeId, clientIp, assertSameOrigin, errorMessage,
} from '../../_lib/http.js';

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;
const MAX_ACCOUNT_FAILURES = 10;

export async function onRequestPost({ env, request }) {
  try {
    if (!assertSameOrigin(request)) return json({ ok: false, error: 'คำขอไม่ถูกต้อง' }, 403);
    const body = await readJson(request);
    const employeeId = normalizeEmployeeId(body && body.employeeId);
    const password = String((body && body.password) || '');
    if (!employeeId || !password) return json({ ok: false, error: 'กรุณากรอกรหัสพนักงานและรหัสผ่าน' }, 400);
    if (!env.PASSWORD_PEPPER) return json({ ok: false, error: 'ระบบยังตั้งค่าไม่ครบ' }, 503);

    const ip = clientIp(request);
    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    const attempts = await env.DB.prepare(`
      SELECT COUNT(*) AS total FROM login_attempts
      WHERE employee_id = ? AND ip_address = ? AND succeeded = 0 AND attempted_at >= ?
    `).bind(employeeId, ip, since).first();
    const accountAttempts = await env.DB.prepare(`
      SELECT COUNT(*) AS total FROM login_attempts
      WHERE employee_id = ? AND succeeded = 0 AND attempted_at >= ?
    `).bind(employeeId, since).first();
    if (Number(attempts && attempts.total) >= MAX_FAILURES
      || Number(accountAttempts && accountAttempts.total) >= MAX_ACCOUNT_FAILURES) {
      return json({ ok: false, error: 'ลองรหัสผ่านผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่' }, 429);
    }

    const user = await env.DB.prepare('SELECT * FROM users WHERE employee_id = ?').bind(employeeId).first();
    let valid = false;
    if (user) {
      valid = await verifyPassword(password, env.PASSWORD_PEPPER, user.password_hash, user.password_salt, user.password_iterations);
    } else {
      await hashPassword(password, env.PASSWORD_PEPPER, 'AAAAAAAAAAAAAAAAAAAAAA==', 10000);
    }

    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO login_attempts (employee_id, ip_address, succeeded, attempted_at)
      VALUES (?, ?, ?, ?)
    `).bind(employeeId, ip, valid ? 1 : 0, now).run();

    if (!valid) return json({ ok: false, error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง' }, 401);
    if (user.status === 'pending') return json({ ok: false, status: 'pending', error: 'บัญชีกำลังรอผู้ดูแลอนุมัติ' }, 403);
    if (user.status === 'rejected') return json({ ok: false, status: 'rejected', error: 'คำขอสมัครไม่ได้รับการอนุมัติ กรุณาติดต่อผู้ดูแล' }, 403);
    if (user.status !== 'active') return json({ ok: false, status: user.status, error: 'บัญชีนี้ถูกระงับ กรุณาติดต่อผู้ดูแล' }, 403);

    await env.DB.batch([
      env.DB.prepare('DELETE FROM login_attempts WHERE employee_id = ? AND ip_address = ?').bind(employeeId, ip),
      env.DB.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').bind(now, now, user.id),
      env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now),
    ]);
    const token = await createSession(env, request, user.id);
    await audit(env, request, user.id, 'auth.login', user.id);
    user.last_login_at = now;
    return json({ ok: true, user: publicUser(user) }, 200, { 'Set-Cookie': sessionCookie(token) });
  } catch (error) {
    return errorMessage(error);
  }
}
