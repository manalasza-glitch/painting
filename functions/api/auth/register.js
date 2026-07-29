import { hashPassword } from '../../_lib/crypto.js';
import { audit } from '../../_lib/auth.js';
import {
  json, readJson, normalizeEmployeeId, cleanText, clientIp, assertSameOrigin, errorMessage,
} from '../../_lib/http.js';
import { DEFAULT_EMPLOYEE_PERMISSIONS } from '../../_lib/permissions.js';

export async function onRequestPost({ env, request }) {
  try {
    if (!assertSameOrigin(request)) return json({ ok: false, error: 'คำขอไม่ถูกต้อง' }, 403);
    const body = await readJson(request);
    if (!body) return json({ ok: false, error: 'ข้อมูลไม่ถูกต้อง' }, 400);

    const employeeId = normalizeEmployeeId(body.employeeId);
    const displayName = cleanText(body.displayName, 100);
    const department = cleanText(body.department, 100);
    const password = String(body.password || '');

    if (!/^[A-Z0-9_-]{2,30}$/.test(employeeId)) {
      return json({ ok: false, error: 'รหัสพนักงานใช้ได้เฉพาะ A-Z, 0-9, _ และ - จำนวน 2–30 ตัว' }, 400);
    }
    if (displayName.length < 2) return json({ ok: false, error: 'กรุณากรอกชื่อ–นามสกุล' }, 400);
    if (password.length < 10 || password.length > 128) {
      return json({ ok: false, error: 'รหัสผ่านต้องมี 10–128 ตัวอักษร' }, 400);
    }
    if (!env.PASSWORD_PEPPER) return json({ ok: false, error: 'ระบบยังตั้งค่าไม่ครบ' }, 503);

    const existing = await env.DB.prepare('SELECT id FROM users WHERE employee_id = ?').bind(employeeId).first();
    if (existing) return json({ ok: false, error: 'รหัสพนักงานนี้สมัครไว้แล้ว' }, 409);

    const admin = await env.DB.prepare("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1").first();
    const wantsBootstrap = !admin && body.bootstrapToken;
    const isBootstrap = wantsBootstrap && env.ADMIN_BOOTSTRAP_TOKEN
      && String(body.bootstrapToken) === String(env.ADMIN_BOOTSTRAP_TOKEN);
    if (!admin && !isBootstrap) {
      return json({ ok: false, error: 'ต้องสร้างผู้ดูแลระบบคนแรกก่อน' }, 409);
    }
    if (!isBootstrap) {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recent = await env.DB.prepare(`
        SELECT COUNT(*) AS total FROM audit_logs
        WHERE action = 'user.register' AND ip_address = ? AND created_at >= ?
      `).bind(clientIp(request), since).first();
      if (Number(recent && recent.total) >= 5) {
        return json({ ok: false, error: 'มีการสมัครจากอุปกรณ์นี้หลายครั้ง กรุณารอแล้วลองใหม่' }, 429);
      }
    }

    const passwordData = await hashPassword(password, env.PASSWORD_PEPPER);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const role = isBootstrap ? 'super_admin' : 'employee';
    const status = isBootstrap ? 'active' : 'pending';
    const permissions = isBootstrap ? '[]' : JSON.stringify(DEFAULT_EMPLOYEE_PERMISSIONS);

    await env.DB.prepare(`
      INSERT INTO users (
        id, employee_id, display_name, department, password_hash, password_salt,
        password_iterations, role, status, permissions, created_at, updated_at, approved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId, employeeId, displayName, department, passwordData.hash, passwordData.salt,
      passwordData.iterations, role, status, permissions, now, now, isBootstrap ? now : null,
    ).run();

    await audit(env, request, isBootstrap ? userId : null, isBootstrap ? 'admin.bootstrap' : 'user.register', userId, {
      employeeId,
    });
    return json({
      ok: true,
      status,
      message: isBootstrap ? 'สร้างผู้ดูแลระบบสำเร็จ กรุณาเข้าสู่ระบบ' : 'ส่งคำขอสมัครแล้ว กรุณารอผู้ดูแลอนุมัติ',
    }, 201);
  } catch (error) {
    if (String(error).includes('UNIQUE constraint failed')) {
      return json({ ok: false, error: 'รหัสพนักงานนี้สมัครไว้แล้ว' }, 409);
    }
    return errorMessage(error);
  }
}
