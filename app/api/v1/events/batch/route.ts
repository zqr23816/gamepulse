import { env } from 'cloudflare:workers';
import { ensureSchema } from '@/lib/d1';
import { stableEventId } from '@/lib/rating';

type InputEvent = { type?: string; playerId?: string; payload?: Record<string, unknown> };

export async function POST(request: Request) {
  const ingestKey = (env as unknown as { GAMEPULSE_INGEST_KEY?: string }).GAMEPULSE_INGEST_KEY;
  if (!ingestKey) return Response.json({ error: 'event ingestion is disabled for this demo' }, { status: 503 });
  if (request.headers.get('X-API-Key') !== ingestKey) {
    return Response.json({ error: 'invalid API key' }, { status: 401 });
  }
  const key = request.headers.get('Idempotency-Key');
  if (!key) return Response.json({ error: 'Idempotency-Key header is required' }, { status: 400 });
  const body = await request.json() as { events?: InputEvent[] };
  if (!Array.isArray(body.events) || body.events.length === 0 || body.events.length > 100) {
    return Response.json({ error: 'events must contain between 1 and 100 items' }, { status: 422 });
  }
  const db = await ensureSchema();
  const cached = await db.prepare('SELECT response_body AS responseBody FROM idempotency_keys WHERE key = ?').bind(key).first<{ responseBody: string }>();
  if (cached) return Response.json({ ...JSON.parse(cached.responseBody), replayed: true });
  const now = new Date().toISOString();
  const ids: string[] = [];
  for (let index = 0; index < body.events.length; index += 1) {
    const event = body.events[index];
    if (!event.type || !event.playerId) return Response.json({ error: `event ${index} requires type and playerId` }, { status: 422 });
    const id = stableEventId(key, index);
    await db.prepare('INSERT OR IGNORE INTO game_events (id, event_type, player_id, payload, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, event.type, event.playerId, JSON.stringify(event.payload ?? {}), now).run();
    ids.push(id);
  }
  const response = { accepted: ids.length, eventIds: ids, replayed: false };
  await db.prepare('INSERT INTO idempotency_keys (key, response_body, created_at) VALUES (?, ?, ?)').bind(key, JSON.stringify(response), now).run();
  return Response.json(response, { status: 202 });
}

