# Goodly — Production Dockerfile
# Multi-stage build: frontend (Node) + backend (Python)

# ---- Stage 1: Frontend Build ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* frontend/yarn.lock* ./
RUN npm install --legacy-peer-deps 2>/dev/null || yarn install --frozen-lockfile 2>/dev/null || true
COPY frontend/ ./
RUN npm run build 2>/dev/null || echo "Frontend build skipped (pre-built)"

# ---- Stage 2: Backend ----
FROM python:3.11-slim

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build from stage 1 (or pre-built)
COPY --from=frontend-build /app/frontend/build/ ./frontend/build/

# Switch to non-root user
USER app
WORKDIR /app/backend

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Expose port
EXPOSE 8080

# Run
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
