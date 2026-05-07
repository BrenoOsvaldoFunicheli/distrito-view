from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.dependencies import get_current_user
from app.routers import (
    allocations,
    auth,
    clients,
    contracts,
    dashboard,
    farol,
    people,
    proposal_stages,
    proposals,
    roles,
)

app = FastAPI(title="Distrito", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth e health sem proteção
app.include_router(auth.router, prefix="/api/v1")

# Demais rotas exigem autenticação
PROTECTED_DEPS = [Depends(get_current_user)]
app.include_router(clients.router, prefix="/api/v1", dependencies=PROTECTED_DEPS)
app.include_router(roles.router, prefix="/api/v1", dependencies=PROTECTED_DEPS)
app.include_router(people.router, prefix="/api/v1", dependencies=PROTECTED_DEPS)
app.include_router(contracts.router, prefix="/api/v1", dependencies=PROTECTED_DEPS)
app.include_router(allocations.router, prefix="/api/v1", dependencies=PROTECTED_DEPS)
app.include_router(proposals.router, prefix="/api/v1", dependencies=PROTECTED_DEPS)
app.include_router(proposal_stages.router, prefix="/api/v1", dependencies=PROTECTED_DEPS)
app.include_router(dashboard.router, prefix="/api/v1", dependencies=PROTECTED_DEPS)
app.include_router(farol.router, prefix="/api/v1", dependencies=PROTECTED_DEPS)


@app.get("/health")
def health():
    return {"status": "ok"}
