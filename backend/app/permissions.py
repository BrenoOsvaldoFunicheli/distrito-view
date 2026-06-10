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
    "gestao_grupos",
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
    "gestao_grupos": "Gestão de Grupos",
}

DEFAULT_GROUP_NAME = "Acesso total"
