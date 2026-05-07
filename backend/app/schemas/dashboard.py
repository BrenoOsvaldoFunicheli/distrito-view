from datetime import date

from pydantic import BaseModel


class UnallocatedPerson(BaseModel):
    person_id: int
    person_name: str
    person_email: str
    roles: list[str]
    current_allocation_ends: date | None
    current_percentage: int
    days_until_unallocated: int | None
    next_allocation_start: date | None = None
    next_allocation_contract_name: str | None = None
    next_allocation_client_name: str | None = None
    next_allocation_role_name: str | None = None


class UpcomingNeed(BaseModel):
    contract_id: int
    contract_name: str
    client_name: str
    start_date: date
    end_date: date
    role_name: str
    contract_role_id: int
    needed_quantity: int
    filled_quantity: int
    allocation_percentage: int
    days_until_start: int
    is_future_contract: bool = False


class AllocationSummary(BaseModel):
    person_id: int
    person_name: str
    person_email: str
    person_company: str
    roles: list[str]
    current_allocation_percentage: int
    allocations: list[dict]


class TimelineEntry(BaseModel):
    person_id: int
    person_name: str
    person_company: str
    allocations: list[dict]


class UtilizationStats(BaseModel):
    total_people: int
    fully_allocated: int
    partially_allocated: int
    on_bench: int
    provisioned: int = 0
    average_utilization: float
