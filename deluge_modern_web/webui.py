
import logging
import os

from deluge.plugins.pluginbase import WebPluginBase

log = logging.getLogger(__name__)

STATIC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'dist')


class WebUI(WebPluginBase):
    def enable(self):
        # Serve the built SPA at /modern/ via Twisted's static.File.
        # deluge-web's TopLevel only exposes fixed subpaths (js/css/images/...),
        # so we mount our own child for the full dist tree (index.html + assets/).
        try:
            import deluge.component as component
            from twisted.web import static

            if not os.path.isdir(STATIC_PATH):
                log.warning('ModernWeb: dist not found at %s, UI not mounted', STATIC_PATH)
                return
            top_level = component.get('DelugeWeb').top_level
            top_level.putChild(b'modern', static.File(STATIC_PATH))
            log.info('ModernWeb: serving UI at /modern/')
        except Exception as ex:
            log.warning('ModernWeb: could not mount UI: %s', ex)

    def disable(self):
        try:
            import deluge.component as component

            top_level = component.get('DelugeWeb').top_level
            top_level.children.pop(b'modern', None)
        except Exception:
            pass
