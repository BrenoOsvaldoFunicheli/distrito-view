from datetime import datetime

from pydantic import BaseModel


class ProposalStageCreate(BaseModel):
    label: str
    key: str | None = None
    position: int | None = None


class ProposalStageUpdate(BaseModel):
    label: str | None = None


class ProposalStageReorderItem(BaseModel):
    id: int
    position: int


class ProposalStageReorderRequest(BaseModel):
    items: list[ProposalStageReorderItem]


class ProposalStageResponse(BaseModel):
    id: int
    key: str
    label: str
    position: int
    is_terminal: bool
    is_protected: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
