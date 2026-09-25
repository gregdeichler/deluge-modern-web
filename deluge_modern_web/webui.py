
import os
from deluge.plugins.webui_common import WebPluginBase
from deluge.ui.web.server import DelugeWeb
import deluge.component as component

STATIC_PATH = os.path.join(os.path.dirname(__file__), 'data', 'dist')

class WebUI(WebPluginBase):
    scripts = []  # we serve full SPA instead

    def enable(self):
        # Mount our built SPA as /modern and redirect /
        web = component.get('DelugeWeb')
        # Twisted resource mounting - if you use drop-in replacement, just copy dist/* to deluge/ui/web/js/
        # This is placeholder for plugin serve logic
        print(f"[modern-web] Enable: built files expected at {STATIC_PATH}")
