import { getCookie, verifySession } from '../_lib/auth.js';
import { ensureEventsTable, deleteEvent, listEvents, upsertEvent } from '../_lib/events.js';

async function requireAuth(request, env) {
  const token = getCookie(request, 'cfn_session');
  const user = await verifySession(token, env.SESSION_SECRET || '');
  if (!user) return null;
  return user;
}

function json(data, init = {}) {
  return Response.json(data, {
    headers: { 'Cache-Control': 'no-store', ...(init.headers || {}) },
    ...init
  });
}

async function readBody(request) {
  const text = await request.text();
  if (!text.trim()) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

export async function onRequestGet({ env }) {
  await ensureEventsTable(env.CFN_DB);
  const events = await listEvents(env.CFN_DB);
  return json(events);
}

export async function onRequestPost({ request, env }) {
  const user = await requireAuth(request, env);
  if (!user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  await ensureEventsTable(env.CFN_DB);
  const body = await readBody(request);

  const payload = {
    date: String(body.date || '').trim(),
    badge: String(body.badge || '').trim(),
    category: String(body.category || '').trim() || 'Événement',
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    images: Array.isArray(body.images) ? body.images.filter(v => typeof v === 'string' && v.trim()) : []
  };

  if (!payload.date || !payload.title || !payload.description) {
    return json({ ok: false, error: 'date, title et description sont obligatoires.' }, { status: 400 });
  }

  const id = await upsertEvent(env.CFN_DB, payload);
  const events = await listEvents(env.CFN_DB);
  return json({ ok: true, id, events });
}

export async function onRequestPut({ request, env }) {
  const user = await requireAuth(request, env);
  if (!user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  await ensureEventsTable(env.CFN_DB);
  const body = await readBody(request);
  const id = String(body.id || '').trim();
  if (!id) return json({ ok: false, error: 'id requis.' }, { status: 400 });

  const payload = {
    date: String(body.date || '').trim(),
    badge: String(body.badge || '').trim(),
    category: String(body.category || '').trim() || 'Événement',
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    images: Array.isArray(body.images) ? body.images.filter(v => typeof v === 'string' && v.trim()) : []
  };

  if (!payload.date || !payload.title || !payload.description) {
    return json({ ok: false, error: 'date, title et description sont obligatoires.' }, { status: 400 });
  }

  await upsertEvent(env.CFN_DB, payload, id);
  const events = await listEvents(env.CFN_DB);
  return json({ ok: true, id, events });
}

export async function onRequestDelete({ request, env }) {
  const user = await requireAuth(request, env);
  if (!user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  await ensureEventsTable(env.CFN_DB);
  const body = await readBody(request);
  const id = String(body.id || '').trim();
  if (!id) return json({ ok: false, error: 'id requis.' }, { status: 400 });

  await deleteEvent(env.CFN_DB, id);
  const events = await listEvents(env.CFN_DB);
  return json({ ok: true, events });
}
