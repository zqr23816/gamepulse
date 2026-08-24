// Add Drizzle tables here when the site needs a database.
export {};
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  rating: integer('rating').notNull().default(1000),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
});

export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  winnerId: text('winner_id').notNull(),
  loserId: text('loser_id').notNull(),
  winnerDelta: integer('winner_delta').notNull(),
  loserDelta: integer('loser_delta').notNull(),
  createdAt: text('created_at').notNull(),
});

export const gameEvents = sqliteTable('game_events', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(),
  playerId: text('player_id').notNull(),
  payload: text('payload').notNull(),
  createdAt: text('created_at').notNull(),
});

export const idempotencyKeys = sqliteTable('idempotency_keys', {
  key: text('key').primaryKey(),
  responseBody: text('response_body').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [uniqueIndex('idx_idempotency_key').on(table.key)]);

