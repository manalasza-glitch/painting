import { requireUser } from '../_lib/auth.js';
import { json, errorMessage } from '../_lib/http.js';

export async function onRequestGet({ env, request }) {
  try {
    const auth = await requireUser(env, request, 'audit.read');
    if (auth.response) return auth.response;
    const result = await env.DB.prepare(`
      SELECT a.id, a.action, a.details, a.ip_address, a.created_at,
        actor.employee_id AS actor_employee_id, target.employee_id AS target_employee_id
      FROM audit_logs a
      LEFT JOIN users actor ON actor.id = a.actor_user_id
      LEFT JOIN users target ON target.id = a.target_user_id
      ORDER BY a.created_at DESC LIMIT 200
    `).all();
    return json({ ok: true, logs: result.results || [] });
  } catch (error) {
    return errorMessage(error);
  }
}
