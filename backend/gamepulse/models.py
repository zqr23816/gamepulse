from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class EventInput(BaseModel):
    type: str = Field(min_length=3, max_length=80)
    player_id: str = Field(alias="playerId", min_length=3, max_length=80)
    payload: dict[str, Any] = Field(default_factory=dict)


class EventBatch(BaseModel):
    events: list[EventInput] = Field(min_length=1, max_length=100)


class BatchReceipt(BaseModel):
    accepted: int
    event_ids: list[str] = Field(alias="eventIds")
    replayed: bool


class PlayerRank(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    rank: int
    id: str
    display_name: str = Field(alias="displayName")
    rating: int
    wins: int
    losses: int

