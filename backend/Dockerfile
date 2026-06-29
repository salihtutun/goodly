# Goodly API + embedded MongoDB for Render (single-container deploy on free tier).
FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl gnupg ca-certificates \
    && curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor \
    && echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" \
       > /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends mongodb-org \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x /app/start-render.sh

ENV MONGO_URL=mongodb://127.0.0.1:27017
ENV DB_NAME=goodly
ENV PORT=10000

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f "http://localhost:${PORT}/api/health" || exit 1

CMD ["/app/start-render.sh"]
