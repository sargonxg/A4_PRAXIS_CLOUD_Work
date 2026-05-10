from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

EpisodeStrand = Literal["situation", "work"]


class EpisodeState(BaseModel):
    id: str
    case_id: str
    episode_id: str
    owner_uid: str
    strand: EpisodeStrand
    episode_type: str
    title: str
    valid_from: datetime
    valid_to: datetime | None = None
    graph_snapshot_id: str | None = None
    metadata: dict = Field(default_factory=dict)
