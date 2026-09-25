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

## Deploy
Docker (recommended):
```bash
docker compose up -d --build
# UI at http://<host>:8112/ (redirects to /themes/modern/)
# config persists in ./data/config, downloads in ./data/downloads
```

Manual — replace the stock WebUI:
```bash
cd frontend && npm run build   # dist lands in deluge_modern_web/data/dist
SITE=$(python3 -c "import deluge, os; print(os.path.dirname(deluge.__file__))")
# deluge-web only serves fixed subpaths; themes/ is a full static.File tree,
# so the SPA (index.html + assets/) is served intact from /themes/modern/
sudo mkdir -p $SITE/ui/web/themes/modern
sudo cp -r deluge_modern_web/data/dist/. $SITE/ui/web/themes/modern/
# redirect / to the new UI (stock index.html is a Mako template; plain HTML is fine)
echo '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/themes/modern/index.html"></head><body>Redirecting to Modern UI...</body></html>' | sudo tee $SITE/ui/web/index.html
sudo systemctl restart deluge-web
```

Plugin (serves the UI at `/modern/` alongside the stock UI):
```bash
python setup.py bdist_egg
# egg appears in dist/ — install via Deluge GTK > Preferences > Plugins,
# or copy to ~/.config/deluge/plugins/ and enable it
```

## API coverage
- auth.login / check_session / delete_session
- web.connected / get_hosts / connect / add_torrents
- core.get_torrents_status / get_torrent_status with filters
- pause/resume/remove/force_recheck, add_torrent_magnet/url
- core.get_config / set_config, set_torrent_file_priorities, move_storage
- label plugin (optional): get_labels / get_torrent_labels / set_torrent

Inspired by Flood.
