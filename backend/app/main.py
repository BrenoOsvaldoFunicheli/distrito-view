from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.dependencies import get_current_user, require_area
from app.routers import (
    allocations,
    auth,
    clients,
    contracts,
    dashboard,
    farol,
    people,
    projects,
    proposal_stages,
    proposals,
    roles,
    user_groups,
)

app = FastAPI(title="Distrito", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth e health sem proteção por área (auth tem require_admin nas rotas internas)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(user_groups.router, prefix="/api/v1")

# Catálogo compartilhado: livre para qualquer logado
app.include_router(roles.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])

# Rotas protegidas por área funcional
app.include_router(
    clients.router, prefix="/api/v1", dependencies=[Depends(require_area("clientes"))]
)
app.include_router(
    contracts.router, prefix="/api/v1", dependencies=[Depends(require_area("contratos"))]
)
app.include_router(
    projects.router, prefix="/api/v1", dependencies=[Depends(require_area("contratos"))]
)
app.include_router(
    people.router, prefix="/api/v1", dependencies=[Depends(require_area("pessoas"))]
)
app.include_router(
    allocations.router, prefix="/api/v1", dependencies=[Depends(require_area("pessoas"))]
)
app.include_router(
    proposals.router, prefix="/api/v1", dependencies=[Depends(require_area("propostas"))]
)
app.include_router(
    proposal_stages.router,
    prefix="/api/v1",
    dependencies=[Depends(require_area("propostas"))],
)
app.include_router(
    dashboard.router, prefix="/api/v1", dependencies=[Depends(require_area("dashboard"))]
)
app.include_router(
    farol.router, prefix="/api/v1", dependencies=[Depends(require_area("farol"))]
)


@app.get("/health")
def health():
    return {"status": "ok"}
