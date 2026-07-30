import { requireUser, audit } from '../../_lib/auth.js';
import { json, readJson, cleanText, assertSameOrigin, errorMessage } from '../../_lib/http.js';
import { sanitizePermissions } from '../../_lib/permissions.js';

export async function onRequestPatch({ env, request, params }) {
  try {
    if (!assertSameOrigin(request)) return json({ ok: false, error: 'คำขอไม่ถูกต้อง' }, 403);
    const auth = await requireUser(env, request, 'users.manage');
    if (auth.response) return auth.response;
    const target = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(params.id).first();
    if (!target) return json({ ok: false, error: 'ไม่พบบัญชีนี้' }, 404);

    const body = await readJson(request);
    if (!body) return json({ ok: false, error: 'ข้อมูลไม่ถูกต้อง' }, 400);
    const allowedStatuses = ['pending', 'active', 'rejected', 'disabled'];
    const status = allowedStatuses.includes(body.status) ? body.status : target.status;
    if (target.role === 'super_admin' && status !== 'active') {
      return json({ ok: false, error: 'ไม่สามารถระงับ Super Admin ผ่านหน้านี้ได้' }, 400);
    }
    const displayName = body.displayName === undefined ? target.display_name : cleanText(body.displayName, 100);
    const department = body.department === undefined ? target.department : cleanText(body.department, 100);
    const permissions = body.permissions === undefined
      ? target.permissions
      : JSON.stringify(sanitizePermissions(body.permissions));
    const now = new Date().toISOString();
    const approving = status === 'active' && target.status !== 'active';

    await env.DB.prepare(`
      UPDATE users SET display_name = ?, department = ?, status = ?, permissions = ?,
        approved_at = CASE WHEN ? THEN ? ELSE approved_at END,
        approved_by = CASE WHEN ? THEN ? ELSE approved_by END,
        updated_at = ?
      WHERE id = ?
    `).bind(
      displayName, department, status, permissions,
      approving ? 1 : 0, now, approving ? 1 : 0, auth.user.id,
      now, target.id,
    ).run();
    if (status !== 'active') await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id).run();

    await audit(env, request, auth.user.id, 'user.update', target.id, {
      fromStatus: target.status,
      toStatus: status,
      permissions: JSON.parse(permissions || '[]'),
    });
    return json({ ok: true });
  } catch (error) {
    return errorMessage(error);
  }
}

export async function onRequestDelete({ env, request, params }) {
  try {
    if (!assertSameOrigin(request)) return json({ ok: false, error: 'คำขอไม่ถูกต้อง' }, 403);
    const auth = await requireUser(env, request, 'users.manage');
    if (auth.response) return auth.response;

    const target = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(params.id).first();
    if (!target) return json({ ok: false, error: 'ไม่พบบัญชีนี้' }, 404);
    if (target.id === auth.user.id) {
      return json({ ok: false, error: 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้' }, 400);
    }
    if (target.role === 'super_admin') {
      return json({ ok: false, error: 'ไม่สามารถลบบัญชี Super Admin ผ่านหน้านี้ได้' }, 400);
    }

    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id),
      env.DB.prepare('UPDATE users SET approved_by = NULL WHERE approved_by = ?').bind(target.id),
      env.DB.prepare('UPDATE audit_logs SET target_user_id = NULL WHERE target_user_id = ?').bind(target.id),
      env.DB.prepare('UPDATE audit_logs SET actor_user_id = NULL WHERE actor_user_id = ?').bind(target.id),
      env.DB.prepare('DELETE FROM login_attempts WHERE employee_id = ? COLLATE NOCASE').bind(target.employee_id),
      env.DB.prepare('DELETE FROM users WHERE id = ?').bind(target.id),
    ]);

    await audit(env, request, auth.user.id, 'user.delete', null, {
      deletedUserId: target.id,
      employeeId: target.employee_id,
      displayName: target.display_name,
      previousStatus: target.status,
    });
    return json({ ok: true, message: 'ลบบัญชีเรียบร้อยแล้ว' });
  } catch (error) {
    return errorMessage(error);
  }
}
