import { requireUser, audit } from '../_lib/auth.js';
import { json, errorMessage } from '../_lib/http.js';
import { ACTION_PERMISSIONS } from '../_lib/permissions.js';

function upstreamError(message, status = 502) {
  return json({ ok: false, error: message }, status);
}

export async function onRequest({ env, request }) {
  try {
    if (!env.SHEETS_API_URL || !env.APPS_SCRIPT_SHARED_SECRET) {
      return upstreamError('ระบบเชื่อมต่อฐานข้อมูลยังตั้งค่าไม่ครบ', 503);
    }
    const incomingUrl = new URL(request.url);
    let bodyText = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text();
    let body = null;
    if (bodyText) {
      try { body = JSON.parse(bodyText); } catch { body = null; }
    }
    const action = incomingUrl.searchParams.get('action') || (body && body.action) || '';
    const permission = ACTION_PERMISSIONS[action];
    if (permission === undefined) return json({ ok: false, error: 'ไม่อนุญาตคำสั่งนี้' }, 400);

    const auth = await requireUser(env, request, permission);
    if (auth.response) return auth.response;

    const upstreamUrl = new URL(env.SHEETS_API_URL);
    for (const [key, value] of incomingUrl.searchParams) upstreamUrl.searchParams.set(key, value);
    upstreamUrl.searchParams.set('serverToken', env.APPS_SCRIPT_SHARED_SECRET);

    const init = { method: request.method, redirect: 'follow' };
    if (bodyText) {
      if (body && typeof body === 'object') {
        body.serverToken = env.APPS_SCRIPT_SHARED_SECRET;
        bodyText = JSON.stringify(body);
      }
      init.body = bodyText;
      init.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    }
    const response = await fetch(upstreamUrl.toString(), init);
    if (!response.ok) return upstreamError('ฐานข้อมูลไม่ตอบสนอง');
    const responseText = await response.text();
    if (!['', 'getDailyReportData', 'getPartModels', 'getRecorders', 'getEvents'].includes(action)) {
      await audit(env, request, auth.user.id, `data.${action}`, null);
    }
    return new Response(responseText, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return errorMessage(error);
  }
}
