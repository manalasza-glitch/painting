import { json, errorMessage } from '../../_lib/http.js';

export async function onRequestGet({ env }) {
  try {
    const admin = await env.DB.prepare(
      "SELECT id FROM users WHERE role = 'super_admin' LIMIT 1",
    ).first();
    return json({ ok: true, setupRequired: !admin });
  } catch (error) {
    return errorMessage(error);
  }
}
