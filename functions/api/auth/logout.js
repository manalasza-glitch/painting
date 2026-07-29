import { destroySession, clearSessionCookie } from '../../_lib/auth.js';
import { json, assertSameOrigin, errorMessage } from '../../_lib/http.js';

export async function onRequestPost({ env, request }) {
  try {
    if (!assertSameOrigin(request)) return json({ ok: false, error: 'คำขอไม่ถูกต้อง' }, 403);
    await destroySession(env, request);
    return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
  } catch (error) {
    return errorMessage(error);
  }
}
