import json
import sqlite3
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterator

from .domain import stable_event_id
from .models import EventInput

SCHEMA = """
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY, display_name TEXT NOT NULL, rating INTEGER NOT NULL DEFAULT 1000,
  wins INTEGER NOT NULL DEFAULT 0, losses INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY, winner_id TEXT NOT NULL, loser_id TEXT NOT NULL,
  winner_delta INTEGER NOT NULL, loser_delta INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS game_events (
  id TEXT PRIMARY KEY, event_type TEXT NOT NULL, player_id TEXT NOT NULL,
  payload TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY, response_body TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_players_rating ON players(rating DESC);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON game_events(created_at DESC);
"""


class Repository:
    def __init__(self, database_path: str):
        self.database_path = database_path
        Path(database_path).parent.mkdir(parents=True, exist_ok=True)

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.database_path, timeout=5)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA foreign_keys=ON")
        try:
            yield connection
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.executescript(SCHEMA)
            connection.commit()

    def seed(self) -> None:
        now = datetime.now(UTC).isoformat()
        rows = [
            ("player_nova", "NovaFox", 2840, 184, 52, now),
            ("player_pixel", "PixelValkyrie", 2715, 168, 61, now),
            ("player_kite", "KiteRunner", 2592, 151, 64, now),
            ("player_arc", "ArcByte", 2481, 139, 71, now),
        ]
        with self.connect() as connection:
            connection.executemany("INSERT OR IGNORE INTO players VALUES (?, ?, ?, ?, ?, ?)", rows)
            connection.commit()

    def ingest_events(self, key: str, events: list[EventInput]) -> dict:
        now = datetime.now(UTC).isoformat()
        with self.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            cached = connection.execute("SELECT response_body FROM idempotency_keys WHERE key = ?", (key,)).fetchone()
            if cached:
                connection.rollback()
                return {**json.loads(cached["response_body"]), "replayed": True}
            event_ids = []
            for index, event in enumerate(events):
                event_id = stable_event_id(key, index)
                connection.execute(
                    "INSERT INTO game_events VALUES (?, ?, ?, ?, ?)",
                    (event_id, event.type, event.player_id, json.dumps(event.payload, separators=(",", ":")), now),
                )
                event_ids.append(event_id)
            result = {"accepted": len(event_ids), "eventIds": event_ids, "replayed": False}
            connection.execute("INSERT INTO idempotency_keys VALUES (?, ?, ?)", (key, json.dumps(result), now))
            connection.commit()
            return result

    def leaderboard(self, limit: int) -> list[dict]:
        with self.connect() as connection:
            rows = connection.execute(
                "SELECT id, display_name, rating, wins, losses FROM players ORDER BY rating DESC, wins DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [{"rank": index + 1, **dict(row)} for index, row in enumerate(rows)]

    def record_match(self, match_id: str, winner_id: str, loser_id: str, winner_delta: int, loser_delta: int) -> None:
        now = datetime.now(UTC).isoformat()
        with self.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute("INSERT INTO matches VALUES (?, ?, ?, ?, ?, ?)", (match_id, winner_id, loser_id, winner_delta, loser_delta, now))
            connection.execute("UPDATE players SET rating = rating + ?, wins = wins + 1, updated_at = ? WHERE id = ?", (winner_delta, now, winner_id))
            connection.execute("UPDATE players SET rating = rating + ?, losses = losses + 1, updated_at = ? WHERE id = ?", (loser_delta, now, loser_id))
            connection.commit()


