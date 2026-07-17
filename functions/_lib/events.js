export async function ensureEventsTable(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      badge TEXT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      images_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function parseImages(value) {
  if (Array.isArray(value)) return value.filter(v => typeof v === 'string' && v.trim());
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(v => typeof v === 'string' && v.trim());
    } catch {}
  }
  return [];
}

export function normalizeEventRow(row) {
  if (!row) return null;
  let images = [];
  try {
    images = JSON.parse(row.images_json || '[]');
  } catch {
    images = [];
  }
  if (!Array.isArray(images)) images = [];
  return {
    id: row.id,
    date: row.date,
    badge: row.badge || '',
    category: row.category || 'Événement',
    title: row.title || '',
    description: row.description || '',
    images
  };
}

export async function listEvents(db) {
  const result = await db.prepare(`
    SELECT id, date, badge, category, title, description, images_json
    FROM events
    ORDER BY date DESC, updated_at DESC
  `).all();
  return (result.results || []).map(normalizeEventRow);
}

export async function upsertEvent(db, event, id = null) {
  const eventId = id || crypto.randomUUID();
  const images = parseImages(event.images);
  await db.prepare(`
    INSERT INTO events (id, date, badge, category, title, description, images_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM events WHERE id = ?), CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      date=excluded.date,
      badge=excluded.badge,
      category=excluded.category,
      title=excluded.title,
      description=excluded.description,
      images_json=excluded.images_json,
      updated_at=CURRENT_TIMESTAMP
  `).bind(
    eventId,
    event.date,
    event.badge || '',
    event.category,
    event.title,
    event.description,
    JSON.stringify(images),
    eventId
  ).run();
  return eventId;
}

export async function deleteEvent(db, id) {
  await db.prepare(`DELETE FROM events WHERE id = ?`).bind(id).run();
}
