import { cookieOptions, issueSession } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_USER || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return Response.json({
      ok: false,
      error: 'Missing Cloudflare variables. Set ADMIN_USER, ADMIN_PASSWORD and SESSION_SECRET.'
    }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const username = String(body?.username || '').trim();
  const password = String(body?.password || '');

  if (username !== env.ADMIN_USER || password !== env.ADMIN_PASSWORD) {
    return Response.json({ ok: false, error: 'Identifiants incorrects.' }, { status: 401 });
  }

  const token = await issueSession(username, env.SESSION_SECRET);
  return Response.json(
    { ok: true },
    {
      headers: {
        'Set-Cookie': cookieOptions(request, token)
      }
    }
  );
}
