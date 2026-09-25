
let rpcId = 1
export type FilterDict = Record<string, any>

export async function delugeRPC<T = any>(method: string, params: any[] = []): Promise<T> {
  const res = await fetch('/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ method, params, id: rpcId++ })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error))
  return json.result as T
}

export const auth = {
  login: (pass: string) => delugeRPC('auth.login', [pass]),
  check: () => delugeRPC<boolean>('auth.check_session'),
  logout: () => delugeRPC('auth.delete_session')
}

export const web = {
  connected: () => delugeRPC<boolean>('web.connected'),
  get_hosts: () => delugeRPC<[string, string, number, string][] >('web.get_hosts'),
  connect: (hostId: string) => delugeRPC('web.connect', [hostId]),
  update_ui: (keys: string[], filter: FilterDict) => delugeRPC('web.update_ui', [keys, filter])
}

export const core = {
  get_torrents_status: (filter: FilterDict, keys: string[]) =>
    delugeRPC<Record<string, any>>('core.get_torrents_status', [filter, keys]),
  get_torrent_status: (hash: string, keys: string[]) =>
    delugeRPC<Record<string, any>>('core.get_torrent_status', [hash, keys]),
  pause: (hashes: string[]) => delugeRPC('core.pause_torrent', [hashes]),
  resume: (hashes: string[]) => delugeRPC('core.resume_torrent', [hashes]),
  remove: (hash: string, remove_data=false) => delugeRPC('core.remove_torrent', [hash, remove_data]),
  add_magnet: (magnet: string, opts: any) => delugeRPC('core.add_torrent_magnet', [magnet, opts]),
  add_url: (url: string, opts: any) => delugeRPC('core.add_torrent_url', [url, opts]),
  set_file_priorities: (hash: string, prios: Record<number, number>) => delugeRPC('core.set_torrent_file_priorities', [hash, prios]),
}
