BACKEND_PORT ?= 8001
FRONTEND_PORT ?= 3001
WORKERS ?= 4

PID_DIR ?= .pids
LOG_DIR ?= logs

.PHONY: help install migrate seed backend frontend dev reset-db build backend-prod frontend-prod prod prod-start stop status logs

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
	@echo "  prod           - Build then run backend + frontend in production mode (foreground)"
	@echo ""
	@echo "Background (nohup) targets:"
	@echo "  prod-start     - Build then start backend + frontend in background (PIDs em $(PID_DIR)/, logs em $(LOG_DIR)/)"
	@echo "  stop           - Mata os processos iniciados via prod-start"
	@echo "  status         - Mostra status dos processos prod-start"
	@echo "  logs           - tail -f dos logs de backend e frontend"
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

prod-start: build
	@mkdir -p $(PID_DIR) $(LOG_DIR)
	@if [ -f $(PID_DIR)/backend.pid ] && kill -0 $$(cat $(PID_DIR)/backend.pid) 2>/dev/null; then \
		echo "backend já rodando (PID $$(cat $(PID_DIR)/backend.pid)). Use 'make stop' antes."; exit 1; \
	fi
	@if [ -f $(PID_DIR)/frontend.pid ] && kill -0 $$(cat $(PID_DIR)/frontend.pid) 2>/dev/null; then \
		echo "frontend já rodando (PID $$(cat $(PID_DIR)/frontend.pid)). Use 'make stop' antes."; exit 1; \
	fi
	@echo "Subindo backend (porta $(BACKEND_PORT))..."
	@cd backend && nohup uv run uvicorn app.main:app --host 0.0.0.0 --port $(BACKEND_PORT) --workers $(WORKERS) >> ../$(LOG_DIR)/backend.log 2>&1 & echo $$! > ../$(PID_DIR)/backend.pid
	@echo "  PID $$(cat $(PID_DIR)/backend.pid) -> $(LOG_DIR)/backend.log"
	@echo "Subindo frontend (porta $(FRONTEND_PORT))..."
	@cd frontend && nohup npm run start -- -p $(FRONTEND_PORT) >> ../$(LOG_DIR)/frontend.log 2>&1 & echo $$! > ../$(PID_DIR)/frontend.pid
	@echo "  PID $$(cat $(PID_DIR)/frontend.pid) -> $(LOG_DIR)/frontend.log"
	@echo ""
	@echo "Pronto. backend: http://localhost:$(BACKEND_PORT)  frontend: http://localhost:$(FRONTEND_PORT)"
	@echo "Use 'make status', 'make logs' ou 'make stop'."

stop:
	@for name in backend frontend; do \
		pidfile=$(PID_DIR)/$$name.pid; \
		if [ -f $$pidfile ]; then \
			pid=$$(cat $$pidfile); \
			if kill -0 $$pid 2>/dev/null; then \
				echo "Matando $$name (PID $$pid)..."; \
				kill $$pid 2>/dev/null || true; \
				for i in 1 2 3 4 5; do \
					kill -0 $$pid 2>/dev/null || break; \
					sleep 1; \
				done; \
				if kill -0 $$pid 2>/dev/null; then \
					echo "  ainda vivo, mandando SIGKILL"; \
					kill -9 $$pid 2>/dev/null || true; \
				fi; \
			else \
				echo "$$name não estava rodando (PID $$pid)."; \
			fi; \
			rm -f $$pidfile; \
		else \
			echo "$$name sem PID registrado."; \
		fi; \
	done
	@pkill -f "uvicorn app.main" 2>/dev/null || true
	@pkill -f "next-server" 2>/dev/null || true
	@echo "Stop concluído."

status:
	@for name in backend frontend; do \
		pidfile=$(PID_DIR)/$$name.pid; \
		if [ -f $$pidfile ]; then \
			pid=$$(cat $$pidfile); \
			if kill -0 $$pid 2>/dev/null; then \
				echo "$$name: RODANDO (PID $$pid)"; \
			else \
				echo "$$name: PARADO (PID $$pid não existe)"; \
			fi; \
		else \
			echo "$$name: sem PID registrado"; \
		fi; \
	done
	@echo ""
	@echo "Portas:"
	@(ss -tlnp 2>/dev/null | grep -E ":$(BACKEND_PORT)|:$(FRONTEND_PORT)") || echo "  (nada escutando em $(BACKEND_PORT)/$(FRONTEND_PORT))"

logs:
	@mkdir -p $(LOG_DIR)
	@touch $(LOG_DIR)/backend.log $(LOG_DIR)/frontend.log
	@tail -f $(LOG_DIR)/backend.log $(LOG_DIR)/frontend.log
