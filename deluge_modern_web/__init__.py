
from deluge.plugins.init import PluginBase
from .webui import WebUI as _WebUI
from .core import Core as _Core

class Core(_Core): pass
class WebUI(_WebUI): pass

class Init(PluginBase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._component_class = Core if self._component_name == 'Core' else WebUI
