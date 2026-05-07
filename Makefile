.PHONY: help install migrate seed backend frontend dev reset-db

help:
	@echo "Targets:"
	@echo "  install    - Install backend and frontend dependencies"
	@echo "  migrate    - Run backend database migrations"
	@echo "  seed       - Seed the database"
	@echo "  backend    - Run backend (port 8000)"
	@echo "  frontend   - Run frontend (port 3000)"
	@echo "  dev        - Run backend and frontend in parallel"
	@echo "  reset-db   - Delete DB, migrate and re-seed"

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
