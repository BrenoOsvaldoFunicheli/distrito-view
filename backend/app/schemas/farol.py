from datetime import date, datetime

from pydantic import BaseModel


class FarolCriterionCreate(BaseModel):
    label: str
    kind: str = "manual"
    show_color: bool = True
    show_text: bool = False
    group_id: int | None = None
    weights: dict[str, float] | None = None


class FarolCriterionUpdate(BaseModel):
    label: str | None = None
    kind: str | None = None
    show_color: bool | None = None
    show_text: bool | None = None
    group_id: int | None = None
    weights: dict[str, float] | None = None


class FarolCriterionReorderItem(BaseModel):
    id: int
    position: int


class FarolCriterionReorderRequest(BaseModel):
    items: list[FarolCriterionReorderItem]


class FarolCriterionResponse(BaseModel):
    id: int
    label: str
    kind: str
    show_color: bool
    show_text: bool
    position: int
    group_id: int | None
    weights: dict[str, float] | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FarolGroupCreate(BaseModel):
    label: str


class FarolGroupUpdate(BaseModel):
    label: str | None = None


class FarolGroupReorderItem(BaseModel):
    id: int
    position: int


class FarolGroupReorderRequest(BaseModel):
    items: list[FarolGroupReorderItem]


class FarolGroupResponse(BaseModel):
    id: int
    label: str
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FarolCellUpdate(BaseModel):
    color: str | None = None
    text_value: str | None = None
    notes: str | None = None


class FarolBoardClient(BaseModel):
    id: int
    name: str


class FarolBoardCell(BaseModel):
    criterion_id: int
    client_id: int
    color: str
    text_value: str | None
    notes: str | None
    computed: bool = False


class FarolBoardResponse(BaseModel):
    week_start: date
    groups: list["FarolGroupResponse"]
    criteria: list[FarolCriterionResponse]
    clients: list[FarolBoardClient]
    cells: list[FarolBoardCell]


class FarolHistoryEntry(BaseModel):
    week_start: date
    color: str
    text_value: str | None
    notes: str | None
    computed: bool


class FarolTrendWeek(BaseModel):
    week_start: date
    green: int
    yellow: int
    red: int
    none: int


class FarolTrendResponse(BaseModel):
    weeks: list[FarolTrendWeek]
