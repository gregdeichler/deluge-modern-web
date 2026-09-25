#!/bin/bash
set -e
if [ "$DELUGE_WEB_UI" = "modern" ]; then
  SITE=$(python3 -c "import deluge, os; print(os.path.dirname(deluge.__file__))")
  echo "[modern] Replacing $SITE/ui/web with modern build"
  mkdir -p "$SITE/ui/web/static/modern"
  if [ -d "/app/deluge_modern_web/data/dist" ]; then
    cp -r /app/deluge_modern_web/data/dist/* "$SITE/ui/web/static/modern/" 2>/dev/null || true
    cat > "$SITE/ui/web/index.html" <<'HTML'
<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/static/modern/index.html"></head><body>Redirecting to Modern UI...</body></html>
HTML
  fi
fi
deluged -d -L info &
DELUGED_PID=$!
sleep 2
deluge-web -d -L info &
WEB_PID=$!
trap "kill $DELUGED_PID $WEB_PID; exit" TERM INT
wait $DELUGED_PID $WEB_PID
