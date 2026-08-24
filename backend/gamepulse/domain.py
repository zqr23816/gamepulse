import hashlib
import math


def elo_delta(winner_rating: int, loser_rating: int, k_factor: int = 32) -> tuple[int, int]:
    expected_winner = 1 / (1 + math.pow(10, (loser_rating - winner_rating) / 400))
    winner_delta = round(k_factor * (1 - expected_winner))
    return winner_delta, -winner_delta


def stable_event_id(idempotency_key: str, index: int) -> str:
    digest = hashlib.sha256(f"{idempotency_key}:{index}".encode()).hexdigest()[:12]
    return f"evt_{digest}"


