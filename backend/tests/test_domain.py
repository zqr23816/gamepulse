from gamepulse.domain import elo_delta, stable_event_id


def test_elo_is_zero_sum() -> None:
    winner, loser = elo_delta(1500, 1500)
    assert (winner, loser) == (16, -16)


def test_event_id_is_deterministic() -> None:
    assert stable_event_id("request-42", 0) == stable_event_id("request-42", 0)
    assert stable_event_id("request-42", 0) != stable_event_id("request-42", 1)


