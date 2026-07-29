export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function normalizeEmployeeId(value) {
  return String(value || '').trim().toUpperCase();
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || '';
}

export function assertSameOrigin(request) {
  const origin = request.headers.get('Origin');
  const expected = new URL(request.url).origin;
  return !origin || origin === expected;
}

export function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

export function errorMessage(error) {
  console.error(error);
  return json({ ok: false, error: 'เกิดข้อผิดพลาดภายในระบบ' }, 500);
}
