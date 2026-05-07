.PHONY: help install migrate seed backend frontend dev reset-db build backend-prod frontend-prod prod

help:
	@echo "Dev targets:"
	@echo "  install        - Install backend and frontend dependencies"
	@echo "  migrate        - Run backend database migrations"
	@echo "  seed           - Seed the database"
	@echo "  backend        - Run backend with reload (port 8000)"
	@echo "  frontend       - Run frontend dev server (port 3000)"
	@echo "  dev            - Run backend and frontend in parallel"
	@echo "  reset-db       - Delete DB, migrate and re-seed"
	@echo ""
	@echo "Prod targets:"
	@echo "  build          - Build frontend for production"
	@echo "  backend-prod   - Run backend without reload, multi-worker (port 8000)"
	@echo "  frontend-prod  - Run frontend production server (port 3000)"
	@echo "  prod           - Build then run backend + frontend in production mode"

install:
	cd backend && uv sync
	cd frontend && npm install

migrate:
	cd backend && uv run alembic upgrade head

seed:
	cd backend && uv run python -m app.seed

backend:
	cd backend && uv run uvicorn app.main:app --port 8000 --reload

frontend:
	cd frontend && npm run dev

dev:
	$(MAKE) -j2 backend frontend

reset-db:
	rm -f backend/distrito.db
	$(MAKE) migrate
	$(MAKE) seed

build:
	cd frontend && npm run build

backend-prod:
	cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

frontend-prod:
	cd frontend && npm run start -- -p 3000

prod: build
	$(MAKE) -j2 backend-prod frontend-prod
