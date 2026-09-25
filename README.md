# Deluge Modern Web UI

Drop-in replacement for the aged ExtJS Deluge Web UI.

## Stack
- Vite + React + TypeScript + TanStack Query/Virtual + Zustand + Tailwind
- Talks directly to Deluge's existing `POST /json` API (auth.login, web.connected, core.get_torrents_status etc)

## Features
- Virtualized torrent table with sortable, customizable columns (Flood-inspired)
- State / tracker / label sidebar filters, global search, bulk pause/resume/recheck/remove
- Multi-select: Ctrl/⌘-click to toggle, Shift-click for ranges
- Details drawer: Files tab with per-file priorities, Peers, Trackers, torrent options
- Add torrent dialog: magnet, URL, or .torrent file upload, download path, start-paused
- Settings page (core.get_config / set_config): downloads, bandwidth, queue
- Command palette (⌘K) with keyboard navigation — jump to torrents or run actions
- Dark / light theme (persisted), persisted sort/columns/filter preferences

## Dev
1. Run deluge: `docker run -p 8112:8112 linuxserver/deluge`
2. `cd frontend && npm install && npm run dev` -> http://localhost:3000 (proxies /json and /upload)
3. Login with password `deluge`
4. Type check: `npx tsc --noEmit -p tsconfig.json`

## Build as replacement
Option A - Overwrite stock WebUI (simplest):
```bash
npm run build
# dist is at deluge_modern_web/data/dist
sudo cp -r deluge_modern_web/data/dist/* /usr/lib/python3/dist-packages/deluge/ui/web/static/
# or inside venv: $(python -c "import deluge; print(...))/ui/web/...
sudo systemctl restart deluge-web
```

Option B - Plugin:
```bash
python setup.py bdist_egg
# egg appears in dist/, add via Deluge GTK/Web > Preferences > Plugins
```

## API coverage
- auth.login / check_session / delete_session
- web.connected / get_hosts / connect / add_torrents
- core.get_torrents_status / get_torrent_status with filters
- pause/resume/remove/force_recheck, add_torrent_magnet/url
- core.get_config / set_config, set_torrent_file_priorities, move_storage
- label plugin (optional): get_labels / get_torrent_labels / set_torrent

Inspired by Flood.
