
from setuptools import setup, find_packages
setup(
  name='deluge-modern-web',
  version='0.1.0',
  description='Modern Web UI for Deluge (React replacement)',
  packages=find_packages(),
  include_package_data=True,
  entry_points={'deluge.plugin.core': ['ModernWeb = deluge_modern_web:CorePluginClass','ModernWeb = deluge_modern_web.core:Core'], 'deluge.plugin.webui': ['ModernWeb = deluge_modern_web.webui:WebUI']},
  package_data={'deluge_modern_web': ['data/dist/*','data/dist/**/*']}
)
