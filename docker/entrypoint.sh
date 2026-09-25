#!/bin/bash
set -e
mkdir -p /config /downloads
if [ "$DELUGE_WEB_UI" = "modern" ]; then
  SITE=$(python3 -c "import deluge, os; print(os.path.dirname(deluge.__file__))")
  # deluge-web only serves fixed subpaths (js/css/images/icons/themes/...).
  # themes/ is a full Twisted static.File tree, so the SPA (index.html +
  # assets/) is served intact from /themes/modern/.
  echo "[modern] Installing UI to $SITE/ui/web/themes/modern"
  mkdir -p "$SITE/ui/web/themes/modern"
  if [ -d "/app/deluge_modern_web/data/dist" ]; then
    cp -r /app/deluge_modern_web/data/dist/. "$SITE/ui/web/themes/modern/" || true
    cat > "$SITE/ui/web/index.html" <<'HTML'
<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/themes/modern/index.html"></head><body>Redirecting to Modern UI...</body></html>
HTML
  else
    echo "[modern] WARNING: /app/deluge_modern_web/data/dist not found, skipping UI install"
  fi
fi
deluged -d -c /config -L info &
DELUGED_PID=$!
sleep 2
deluge-web -d -c /config -L info &
WEB_PID=$!
trap "kill $DELUGED_PID $WEB_PID 2>/dev/null; exit" TERM INT
# If either process dies, shut the container down instead of running half-dead.
wait -n $DELUGED_PID $WEB_PID
echo "[modern] a deluge process exited, shutting down"
kill $DELUGED_PID $WEB_PID 2>/dev/null || true
exit 1
