import { requireUser } from '../../_lib/auth.js';
import { json, errorMessage } from '../../_lib/http.js';
import { userPermissions } from '../../_lib/permissions.js';

function adminUser(user) {
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

export async function onRequestGet({ env, request }) {
  try {
    const auth = await requireUser(env, request, 'users.manage');
    if (auth.response) return auth.response;
    const result = await env.DB.prepare(`
      SELECT * FROM users
      ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END, created_at DESC
    `).all();
    return json({ ok: true, users: (result.results || []).map(adminUser) });
  } catch (error) {
    return errorMessage(error);
  }
}
