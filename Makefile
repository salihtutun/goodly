# Goodly — Visibility OS for Startups
# Makefile for common development and deployment commands

.PHONY: help install test test-unit test-integration test-all coverage lint format clean build deploy

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Setup ──────────────────────────────────────────────

install: ## Install all dependencies (backend + frontend)
	cd backend && pip install -r requirements.txt
	cd backend && pip install pytest pytest-cov pytest-asyncio pytest-mock mongomock
	cd frontend && npm install --legacy-peer-deps

# ── Testing ────────────────────────────────────────────

test: ## Run all tests with coverage
	cd backend && python -m pytest ../tests/unit/ ../tests/integration/ -v --tb=short --cov=. --cov-report=term

test-unit: ## Run unit tests only
	cd backend && python -m pytest ../tests/unit/ -v --tb=short

test-integration: ## Run integration tests only
	cd backend && python -m pytest ../tests/integration/ -v --tb=short

test-all: ## Run all tests including backend/tests/
	cd backend && python -m pytest ../tests/unit/ ../tests/integration/ ./tests/ -v --tb=short --cov=. --cov-report=term

coverage: ## Generate HTML coverage report
	cd backend && python -m pytest ../tests/unit/ ../tests/integration/ -q --cov=. --cov-report=html:../tests/reports/coverage
	@echo "Coverage report: tests/reports/coverage/index.html"

# ── Code Quality ───────────────────────────────────────

lint: ## Lint backend and frontend
	cd backend && ruff check . --ignore=E501
	cd frontend && npx eslint src/ --ext .jsx,.js --no-error-on-unmatched-pattern || true

format: ## Format code
	cd backend && ruff format .
	cd frontend && npx prettier --write "src/**/*.{js,jsx,css}"

# ── Build ──────────────────────────────────────────────

build-backend: ## Build backend Docker image
	docker build -t goodly-api .

build-frontend: ## Build frontend for production
	cd frontend && npm run build

build: build-backend build-frontend ## Build everything

# ── Run ────────────────────────────────────────────────

run-backend: ## Run backend locally
	cd backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload

run-frontend: ## Run frontend locally
	cd frontend && npm run dev

# ── Deploy ─────────────────────────────────────────────

deploy: ## Deploy to Google Cloud Run
	gcloud builds submit --config=cloudbuild.yaml

deploy-backend: ## Deploy backend only
	gcloud run deploy goodly-api --source=./backend --region=us-central1 --allow-unauthenticated

# ── Database ───────────────────────────────────────────

db-backup: ## Backup MongoDB
	./scripts/backup-mongo.sh

db-seed: ## Seed admin and demo users
	cd backend && python -c "from server import on_startup; import asyncio; asyncio.run(on_startup())"

# ── Cleanup ────────────────────────────────────────────

clean: ## Remove build artifacts and caches
	rm -rf frontend/build frontend/dist
	rm -rf backend/__pycache__ backend/**/__pycache__
	rm -rf tests/__pycache__ tests/**/__pycache__
	rm -rf .pytest_cache .coverage htmlcov
	rm -rf tests/reports/coverage
	find . -name "*.pyc" -delete
