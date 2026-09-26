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
5. Tests: `npm test`

## Deploy in front of an existing Deluge (recommended for production)

Build a static artifact. It contains only HTML, CSS, and JavaScript; it does not
start Deluge or own any torrent configuration or download data.

```bash
cd frontend
npm ci
BUILD_SHA="$(git rev-parse HEAD)" npm run build
# output: ../deluge_modern_web/data/dist/
```

Serve that directory from the same origin that proxies these exact paths to the
existing Deluge Web service:

- `POST /json` — Deluge JSON-RPC and session authentication
- `POST /upload` — `.torrent` file staging

The browser must see the UI and both API paths on one HTTPS hostname so Deluge's
session cookie remains same-origin. Cache hashed `/assets/*` files as immutable;
serve `index.html` with `no-cache` and fall back to it for client-side routes.

A static-only Docker image is also available:

```bash
docker build --target static-ui --build-arg BUILD_SHA="$(git rev-parse HEAD)" -t deluge-modern-web:local .
docker run --rm -p 8113:8080 deluge-modern-web:local
```

It deliberately does not proxy `/json` or `/upload`; configure those paths in
the site's existing reverse proxy. `GET /healthz` tests the static container.

CI runs the typecheck, API tests, and production build, then publishes a static
artifact and SHA-256 checksum for every push to `main`.

## Bundled demonstration deployment

This option starts a new, independent Deluge daemon. Do not use it to replace
the UI of an existing production Deluge installation.

```bash
docker compose --profile bundled up -d --build deluge-modern
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
