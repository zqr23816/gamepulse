import os
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status

from .domain import elo_delta
from .models import BatchReceipt, EventBatch, PlayerRank
from .repository import Repository


def create_app(database_path: str | None = None) -> FastAPI:
    repository = Repository(database_path or os.getenv("GAMEPULSE_DB", "data/gamepulse.db"))
    api_key = os.getenv("GAMEPULSE_API_KEY", "gamepulse-demo-key")

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        repository.initialize()
        repository.seed()
        yield

    app = FastAPI(title="GamePulse API", version="1.0.0", lifespan=lifespan)
    app.state.repository = repository

    def authorize(x_api_key: str = Header(alias="X-API-Key")) -> None:
        if x_api_key != api_key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid API key")

    @app.get("/api/v1/health", tags=["operations"])
    def health() -> dict:
        return {"status": "ok", "service": "gamepulse-api", "version": "1.0.0"}

    @app.post("/api/v1/events/batch", response_model=BatchReceipt, status_code=202, dependencies=[Depends(authorize)], tags=["telemetry"])
    def ingest(batch: EventBatch, request: Request, idempotency_key: str = Header(alias="Idempotency-Key")) -> dict:
        return request.app.state.repository.ingest_events(idempotency_key, batch.events)

    @app.get("/api/v1/leaderboard", response_model=list[PlayerRank], dependencies=[Depends(authorize)], tags=["competitive"])
    def leaderboard(request: Request, limit: int = Query(default=20, ge=1, le=100)) -> list[dict]:
        return request.app.state.repository.leaderboard(limit)

    @app.post("/api/v1/matches/simulate", status_code=201, dependencies=[Depends(authorize)], tags=["competitive"])
    def simulate_match(request: Request) -> dict:
        board = request.app.state.repository.leaderboard(2)
        winner, loser = board[0], board[1]
        winner_delta, loser_delta = elo_delta(winner["rating"], loser["rating"])
        match_id = f"match_{uuid.uuid4().hex[:12]}"
        request.app.state.repository.record_match(match_id, winner["id"], loser["id"], winner_delta, loser_delta)
        return {"id": match_id, "winner": winner["display_name"], "winnerDelta": winner_delta, "loserDelta": loser_delta}

    return app


app = create_app()

