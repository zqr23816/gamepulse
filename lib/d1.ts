import { env } from 'cloudflare:workers';

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, display_name TEXT NOT NULL, rating INTEGER NOT NULL DEFAULT 1000, wins INTEGER NOT NULL DEFAULT 0, losses INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, winner_id TEXT NOT NULL, loser_id TEXT NOT NULL, winner_delta INTEGER NOT NULL, loser_delta INTEGER NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS game_events (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, player_id TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS idempotency_keys (key TEXT PRIMARY KEY, response_body TEXT NOT NULL, created_at TEXT NOT NULL)`,
];

export function database() {
  if (!env.DB) throw new Error('D1 binding DB is unavailable');
  return env.DB;
}

export async function ensureSchema() {
  const db = database();
  for (const statement of schemaStatements) await db.prepare(statement).run();
  return db;
}

