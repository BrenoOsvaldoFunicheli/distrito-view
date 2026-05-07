BACKEND_PORT ?= 8000
FRONTEND_PORT ?= 3000
WORKERS ?= 4

.PHONY: help install migrate seed backend frontend dev reset-db build backend-prod frontend-prod prod

help:
	@echo "Dev targets:"
	@echo "  install        - Install backend and frontend dependencies"
	@echo "  migrate        - Run backend database migrations"
	@echo "  seed           - Seed the database"
	@echo "  backend        - Run backend with reload (port $(BACKEND_PORT))"
	@echo "  frontend       - Run frontend dev server (port $(FRONTEND_PORT))"
	@echo "  dev            - Run backend and frontend in parallel"
	@echo "  reset-db       - Delete DB, migrate and re-seed"
	@echo ""
	@echo "Prod targets:"
	@echo "  build          - Build frontend for production"
	@echo "  backend-prod   - Run backend without reload, multi-worker (port $(BACKEND_PORT))"
	@echo "  frontend-prod  - Run frontend production server (port $(FRONTEND_PORT))"
	@echo "  prod           - Build then run backend + frontend in production mode"
	@echo ""
	@echo "Override ports:  make prod BACKEND_PORT=8001 FRONTEND_PORT=3001"

install:
	cd backend && uv sync
	cd frontend && npm install

migrate:
	cd backend && uv run alembic upgrade head

seed:
	cd backend && uv run python -m app.seed

backend:
	cd backend && uv run uvicorn app.main:app --port $(BACKEND_PORT) --reload

frontend:
	cd frontend && npm run dev -- -p $(FRONTEND_PORT)

dev:
	$(MAKE) -j2 backend frontend

reset-db:
	rm -f backend/distrito.db
	$(MAKE) migrate
	$(MAKE) seed

build:
	cd frontend && npm run build

backend-prod:
	cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port $(BACKEND_PORT) --workers $(WORKERS)

frontend-prod:
	cd frontend && npm run start -- -p $(FRONTEND_PORT)

prod: build
	$(MAKE) -j2 backend-prod frontend-prod
