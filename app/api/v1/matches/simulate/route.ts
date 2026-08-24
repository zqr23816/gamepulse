import { ensureSchema } from '@/lib/d1';
import { eloDelta } from '@/lib/rating';

export async function POST() {
  const db = await ensureSchema();
  const winner = { id: 'player_nova', name: 'NovaFox', rating: 2840 };
  const loser = { id: 'player_demo', name: 'DemoPlayer', rating: 1500 };
  const { winnerDelta, loserDelta } = eloDelta(winner.rating, loser.rating);
  const now = new Date().toISOString();
  const id = `match_${crypto.randomUUID().slice(0, 8)}`;
  await db.prepare('INSERT OR IGNORE INTO players (id, display_name, rating, wins, losses, updated_at) VALUES (?, ?, ?, 0, 0, ?)').bind(winner.id, winner.name, winner.rating, now).run();
  await db.prepare('INSERT OR IGNORE INTO players (id, display_name, rating, wins, losses, updated_at) VALUES (?, ?, ?, 0, 0, ?)').bind(loser.id, loser.name, loser.rating, now).run();
  await db.prepare('INSERT INTO matches (id, winner_id, loser_id, winner_delta, loser_delta, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, winner.id, loser.id, winnerDelta, loserDelta, now).run();
  await db.prepare('UPDATE players SET rating = rating + ?, wins = wins + 1, updated_at = ? WHERE id = ?').bind(winnerDelta, now, winner.id).run();
  await db.prepare('UPDATE players SET rating = rating + ?, losses = losses + 1, updated_at = ? WHERE id = ?').bind(loserDelta, now, loser.id).run();
  return Response.json({ id, eventId: `evt_${id.slice(6)}`, winner: winner.name, winnerDelta, loserDelta }, { status: 201 });
}

