# Goodly Backend — Cloud Run Dockerfile (multi-stage, production-hardened)
# Build: docker build -t goodly-api .
# Run: docker run -p 8080:8080 --env-file backend/.env goodly-api
#
# NOTE: Uses Python 3.11 for Cloud Run compatibility (3.14 not yet available
# in official slim images). Local dev uses 3.14 — the codebase is compatible
# with both. The requirements.txt pins work across 3.11–3.14.

# ── Build stage ───────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ── Runtime stage ─────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r goodly && useradd -r -g goodly goodly

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /home/goodly/.local

# Copy backend code
COPY backend/ .

# Set Python path for user-installed packages
ENV PATH=/home/goodly/.local/bin:$PATH

# Security: run as non-root
USER goodly

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Expose port
EXPOSE 8080

# Run with production settings
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080", "--timeout-keep-alive", "65", "--limit-concurrency", "100", "--backlog", "2048"]
