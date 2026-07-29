import { currentUser, publicUser } from '../../_lib/auth.js';
import { json, errorMessage } from '../../_lib/http.js';

export async function onRequestGet({ env, request }) {
  try {
    const user = await currentUser(env, request);
    if (!user) return json({ ok: false, user: null }, 401);
    return json({ ok: true, user: publicUser(user) });
  } catch (error) {
    return errorMessage(error);
  }
}
