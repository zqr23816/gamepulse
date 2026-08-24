import { ensureSchema } from '@/lib/d1';

const seedPlayers = [
  ['player_nova', 'NovaFox', 2840, 184, 52],
  ['player_pixel', 'PixelValkyrie', 2715, 168, 61],
  ['player_kite', 'KiteRunner', 2592, 151, 64],
  ['player_arc', 'ArcByte', 2481, 139, 71],
] as const;

export async function GET() {
  const db = await ensureSchema();
  const now = new Date().toISOString();
  for (const player of seedPlayers) {
    await db.prepare('INSERT OR IGNORE INTO players (id, display_name, rating, wins, losses, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(...player, now).run();
  }
  const result = await db.prepare('SELECT id, display_name AS displayName, rating, wins, losses, updated_at AS updatedAt FROM players ORDER BY rating DESC LIMIT 20').all();
  return Response.json({ season: '08', players: result.results });
}

