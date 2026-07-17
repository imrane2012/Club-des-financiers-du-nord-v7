import { getCookie, verifySession } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const token = getCookie(request, 'cfn_session');
  const user = await verifySession(token, env.SESSION_SECRET || '');
  if (!user) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true, user });
}
