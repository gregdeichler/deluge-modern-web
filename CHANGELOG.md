# Changelog

## 0.6.2

- Fixed `.torrent` uploads to consume Deluge's `{success, files}` response.
- Validate core torrent IDs and each `web.add_torrents` DeferredList result;
  rejected adds stay open with persistent inline errors. Partial batches retain
  only rejected files for retry.
- Display the configured daemon download location without overriding it when
  the optional field is blank.
- Clear conflicting input sources; retain multi-file upload support.
- Added API and component regression tests; tightened Chrome remote-add checks.

## API contract references

Verified against the installed D-STORE-V Deluge 2.1.1 version and upstream:

- [Upload implementation](https://github.com/deluge-torrent/deluge/blob/deluge-2.1.1/deluge/ui/web/server.py)
- [Web add implementation](https://github.com/deluge-torrent/deluge/blob/deluge-2.1.1/deluge/ui/web/json_api.py)
- [Core add implementation](https://github.com/deluge-torrent/deluge/blob/deluge-2.1.1/deluge/core/core.py)

The staged filename lives on the Deluge Web host. Pass it back unchanged via
`web.add_torrents`; the static UI host must not read it.
