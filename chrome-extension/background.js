const MENU_LINK = 'deluge-modern-add-link'
const MENU_PAGE = 'deluge-modern-add-page'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: MENU_LINK, title: 'Add link to Deluge', contexts: ['link'] })
  chrome.contextMenus.create({ id: MENU_PAGE, title: 'Add page URL to Deluge', contexts: ['page'] })
})

function normalizeBaseUrl(value) {
  const parsed = new URL(value)
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Deluge URL must use HTTP or HTTPS')
  return parsed.href.replace(/\/$/, '')
}

async function settings() {
  const value = await chrome.storage.local.get({ baseUrl: '', password: '', downloadPath: '', paused: false, sequential: false })
  if (!value.baseUrl) throw new Error('Open extension settings and enter your Deluge Web URL')
  return { ...value, baseUrl: normalizeBaseUrl(value.baseUrl) }
}

let rpcId = 1
async function rpc(config, method, params = []) {
  const response = await fetch(`${config.baseUrl}/json`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: rpcId++, method, params })
  })
  if (!response.ok) throw new Error(`Deluge returned HTTP ${response.status}`)
  const body = await response.json()
  if (body.error) throw new Error(body.error.message || JSON.stringify(body.error))
  return body.result
}

async function ensureSession(config) {
  const active = await rpc(config, 'auth.check_session').catch(() => false)
  if (active) return
  if (!config.password) throw new Error('Deluge session expired and no password is saved')
  const loggedIn = await rpc(config, 'auth.login', [config.password])
  if (!loggedIn) throw new Error('Deluge rejected the saved password')
  const connected = await rpc(config, 'web.connected').catch(() => false)
  if (!connected) {
    const hosts = await rpc(config, 'web.get_hosts').catch(() => [])
    if (hosts.length) await rpc(config, 'web.connect', [hosts[0][0]])
  }
}

function addOptions(config) {
  return {
    ...(config.downloadPath ? { download_location: config.downloadPath } : {}),
    ...(config.paused ? { add_paused: true } : {}),
    ...(config.sequential ? { sequential_download: true } : {})
  }
}

export async function addToDeluge(value) {
  const target = value.trim()
  if (!target) throw new Error('Enter a magnet or torrent URL')
  const config = await settings()
  await ensureSession(config)
  const method = target.toLowerCase().startsWith('magnet:') ? 'core.add_torrent_magnet' : 'core.add_torrent_url'
  const result = await rpc(config, method, [target, addOptions(config)])
  if (typeof result !== 'string' || !result.trim()) throw new Error('Deluge did not accept the torrent (invalid, duplicate, or rejected)')
  return result
}

async function notify(title, message) {
  await chrome.notifications.create({ type: 'basic', iconUrl: 'icon.svg', title, message })
}

chrome.contextMenus.onClicked.addListener((info) => {
  const target = info.menuItemId === MENU_LINK ? info.linkUrl : info.pageUrl
  if (!target) return
  addToDeluge(target)
    .then(() => notify('Added to Deluge', target.slice(0, 180)))
    .catch((error) => notify('Deluge add failed', error.message))
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'add') return false
  addToDeluge(String(message.value || ''))
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => sendResponse({ ok: false, error: error.message }))
  return true
})
