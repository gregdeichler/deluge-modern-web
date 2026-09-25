# Deluge Modern Web UI

Drop-in replacement for the aged ExtJS Deluge Web UI. Built with Vite + React + TypeScript + TanStack Query/Virtual + Zustand + Tailwind.

## v0.4 - New
- Column customization + sorting: Click headers to sort, Columns button to show/hide. Persists in localStorage.
- Docker ready: Multi-stage Dockerfile + docker-compose.yml
- Code review: Full audit in CODE_REVIEW.md

## Features
- Search (/) + Command palette (Cmd+K)
- Tracker sidebar with counts
- Label sidebar
- Add Torrent modal (magnet, URL, .torrent upload)
- Details drawer: Files with priority, Peers, Trackers
- Settings modal: core.get_config / set_config
- Virtualized table

## Dev
cd frontend && npm install && npm run dev

## Docker
docker-compose up --build
Modern UI at http://localhost:8112/static/modern/
