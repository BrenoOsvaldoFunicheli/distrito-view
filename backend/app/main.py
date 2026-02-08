from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import allocations, clients, contracts, dashboard, people, roles

app = FastAPI(title="Distrito", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router, prefix="/api/v1")
app.include_router(roles.router, prefix="/api/v1")
app.include_router(people.router, prefix="/api/v1")
app.include_router(contracts.router, prefix="/api/v1")
app.include_router(allocations.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
