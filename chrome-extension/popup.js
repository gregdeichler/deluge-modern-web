const form = document.querySelector('#add')
const status = document.querySelector('#status')
document.querySelector('#options').addEventListener('click', () => chrome.runtime.openOptionsPage())
form.addEventListener('submit', async (event) => {
  event.preventDefault()
  status.textContent = 'Adding…'
  const response = await chrome.runtime.sendMessage({ type: 'add', value: document.querySelector('#value').value })
  status.textContent = response?.ok ? 'Added to Deluge.' : (response?.error || 'Add failed.')
  if (response?.ok) document.querySelector('#value').value = ''
})
