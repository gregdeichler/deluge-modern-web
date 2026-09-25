
let rpcId = 1

export type FilterDict = Record<string, any>
export class DelugeError extends Error {
  code?: number
  constructor(msg: string, code?: number){ super(msg); this.code=code }
}

export async function delugeRPC<T = any>(method: string, params: any[] = [], signal?: AbortSignal): Promise<T> {
  const res = await fetch('/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ method, params, id: rpcId++ }),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(()=> '')
    throw new DelugeError(`HTTP ${res.status} ${method}: ${text.slice(0,300)}`, res.status)
  }
  const json = await res.json()
  if (json.error) {
    throw new DelugeError(json.error.message || JSON.stringify(json.error), json.error.code)
  }
  return json.result as T
}

// Auth
export const auth = {
  login: (pass: string) => delugeRPC<string>('auth.login', [pass]),
  check: () => delugeRPC<boolean>('auth.check_session'),
  logout: () => delugeRPC('auth.delete_session'),
}

// Web
export const web = {
  connected: () => delugeRPC<boolean>('web.connected'),
  get_hosts: () => delugeRPC<[string,string,number,string][]>('web.get_hosts'),
  connect: (hostId: string) => delugeRPC('web.connect', [hostId]),
  disconnect: () => delugeRPC('web.disconnect'),
  update_ui: (keys: string[], filter: FilterDict) => delugeRPC('web.update_ui', [keys, filter]),
}

// Core
export const core = {
  get_torrents_status: (filter: FilterDict, keys: string[]) =>
    delugeRPC<Record<string, any>>('core.get_torrents_status', [filter, keys]),
  get_torrent_status: (hash: string, keys: string[]) =>
    delugeRPC<Record<string, any>>('core.get_torrent_status', [hash, keys]),
  get_config: () => delugeRPC<Record<string, any>>('core.get_config'),
  get_config_values: (keys: string[]) => delugeRPC<Record<string, any>>('core.get_config_values', [keys]),
  set_config: (cfg: Record<string, any>) => delugeRPC('core.set_config', [cfg]),
  pause: (hashes: string[]) => delugeRPC('core.pause_torrent', [hashes]),
  resume: (hashes: string[]) => delugeRPC('core.resume_torrent', [hashes]),
  remove: (hash: string, remove_data=false) => delugeRPC('core.remove_torrent', [hash, remove_data]),
  add_magnet: (magnet: string, opts: any) => delugeRPC('core.add_torrent_magnet', [magnet, opts]),
  add_url: (url: string, opts: any) => delugeRPC('core.add_torrent_url', [url, opts]),
  set_torrent_options: (hashes: string[], opts: any) => delugeRPC('core.set_torrent_options', [hashes, opts]),
  move_storage: (hashes: string[], dest: string) => delugeRPC('core.move_storage', [hashes, dest]),
  set_file_priorities: (hash: string, prios: Record<number, number>) => delugeRPC('core.set_torrent_file_priorities', [hash, prios]),
  // Label plugin - optional, will fail gracefully if not enabled
  get_labels: async (): Promise<string[]> => {
    try { return await delugeRPC<string[]>('label.get_labels') } catch { return [] }
  },
  get_torrent_labels: async (hash: string): Promise<string[]> => {
    try { return await delugeRPC<string[]>('label.get_torrent_labels', [hash]) } catch { return [] }
  },
  set_torrent_label: (hash: string, label: string) => delugeRPC('label.set_torrent', [hash, label]),
}
