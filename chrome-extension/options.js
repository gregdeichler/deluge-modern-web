const fields = ['baseUrl', 'password', 'downloadPath', 'paused', 'sequential']
const status = document.querySelector('#status')

const current = await chrome.storage.local.get({ baseUrl: '', password: '', downloadPath: '', paused: false, sequential: false })
for (const id of fields) {
  const input = document.querySelector(`#${id}`)
  if (input.type === 'checkbox') input.checked = Boolean(current[id])
  else input.value = current[id]
}

document.querySelector('#settings').addEventListener('submit', async (event) => {
  event.preventDefault()
  status.textContent = 'Requesting access…'
  try {
    const baseUrl = new URL(document.querySelector('#baseUrl').value)
    if (!['http:', 'https:'].includes(baseUrl.protocol)) throw new Error('Use an HTTP or HTTPS URL')
    const originPattern = `${baseUrl.origin}/*`
    const granted = await chrome.permissions.request({ origins: [originPattern] })
    if (!granted) throw new Error('Chrome did not grant access to that Deluge server')
    const saved = {
      baseUrl: baseUrl.href.replace(/\/$/, ''),
      password: document.querySelector('#password').value,
      downloadPath: document.querySelector('#downloadPath').value.trim(),
      paused: document.querySelector('#paused').checked,
      sequential: document.querySelector('#sequential').checked
    }
    await chrome.storage.local.set(saved)
    const response = await chrome.runtime.sendMessage({ type: 'add', value: '' })
    // An empty add intentionally validates settings up to input validation.
    status.textContent = response?.error === 'Enter a magnet or torrent URL' ? 'Saved. Ready to add torrents.' : (response?.ok ? 'Saved.' : `Saved. ${response?.error || ''}`)
  } catch (error) {
    status.textContent = error.message
  }
})
