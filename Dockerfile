# Multi-stage build for Deluge Modern Web UI
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends libtorrent-rasterbar-dev && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir deluge[all]

# Built SPA; the entrypoint installs it into deluge's web dir at container start.
COPY --from=frontend-builder /app/deluge_modern_web/data/dist /app/deluge_modern_web/data/dist
COPY deluge_modern_web/ /app/deluge_modern_web/
COPY setup.py /app/
WORKDIR /app
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 8112 58846 58946 58946/udp
ENV DELUGE_WEB_UI=modern
ENTRYPOINT ["/entrypoint.sh"]
