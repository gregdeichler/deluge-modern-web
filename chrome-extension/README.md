# Deluge Modern Remote Add

This unpacked Manifest V3 extension sends magnets and torrent URLs directly to Deluge Web. It uses Deluge's normal `auth.login`, `auth.check_session`, `core.add_torrent_magnet`, and `core.add_torrent_url` RPC methods; no separate remote-add API or inbound port is required.

## Install

1. Serve Deluge Web through HTTPS or connect the browser to the same private network/VPN. Do not expose an unencrypted Deluge login to the public internet.
2. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select this `chrome-extension` directory.
3. Open the extension's **Options**, enter the complete externally reachable Deluge Web base URL and password, then save.
4. Right-click a magnet/torrent link and choose **Add link to Deluge**, or use the toolbar popup.

The password is stored in Chrome's local extension storage on this browser. The extension requests network permission only for the configured Deluge origin. Torrent URLs are fetched by the Deluge host, which is normally what you want for a remote server.
