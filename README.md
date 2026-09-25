
# Deluge Modern Web UI

Drop-in replacement for the aged ExtJS Deluge Web UI.

## Stack
- Vite + React + TypeScript + TanStack Query/Virtual + Zustand + Tailwind
- Talks directly to Deluge's existing `POST /json` API (auth.login, web.connected, core.get_torrents_status etc)

## Dev
1. Run deluge: `docker run -p 8112:8112 linuxserver/deluge`
2. `cd frontend && npm install && npm run dev` -> http://localhost:3000 (proxies /json)
3. Login with password `deluge`

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
Currently implements:
- auth.login / check_session / delete_session
- web.connected / get_hosts / connect
- core.get_torrents_status with filters
- pause/resume/remove

TODO:
- Add torrent dialog (magnet/file/url + options)
- Files tab with priorities
- Peers / Trackers tables
- Settings page (core.get_config)
- Dark/light + command palette

Inspired by Flood.
