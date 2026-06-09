"""Catálogo de áreas funcionais para controle de acesso por grupo."""

AREAS: tuple[str, ...] = (
    "dashboard",
    "pessoas",
    "clientes",
    "contratos",
    "propostas",
    "farol",
    "capacidade",
    "gantt",
)

AREA_LABELS: dict[str, str] = {
    "dashboard": "Dashboard",
    "pessoas": "Pessoas e Alocações",
    "clientes": "Clientes",
    "contratos": "Contratos",
    "propostas": "Propostas Técnicas",
    "farol": "Farol",
    "capacidade": "Capacidade",
    "gantt": "Gantt Projetos",
}

DEFAULT_GROUP_NAME = "Acesso total"
