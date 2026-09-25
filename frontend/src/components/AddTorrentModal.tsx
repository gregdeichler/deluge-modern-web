import { useState } from 'react'
import { core, web } from '../api/client'

export default function AddTorrentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [magnet, setMagnet] = useState('')
  const [url, setUrl] = useState('')
  const [path, setPath] = useState('')
  const [paused, setPaused] = useState(false)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)
  const [uploadedName, setUploadedName] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const reset = () => {
    setMagnet('')
    setUrl('')
    setUploadedPath(null)
    setUploadedName('')
    setPaused(false)
  }

  const add = async () => {
    setLoading(true)
    try {
      const opts: any = {}
      if (path) opts.download_location = path
      if (paused) opts.add_paused = true
      if (magnet.trim()) {
        await core.add_magnet(magnet.trim(), opts)
      } else if (url.trim()) {
        await core.add_url(url.trim(), opts)
      } else if (uploadedPath) {
        // File was staged via POST /upload; register it through the web API like stock WebUI
        await web.add_torrents([{ path: uploadedPath, options: opts }])
      }
      reset()
      onClose()
    } catch (e: any) {
      alert(`Add failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-[560px] max-w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold mb-1">Add Torrent</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">Magnet, URL, or .torrent file. Uses same /upload and web.add_torrents as stock WebUI.</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Magnet link</label>
            <textarea value={magnet} onChange={(e) => setMagnet(e.target.value)} placeholder="magnet:?xt=urn:btih:..." className="mt-1 w-full h-24 px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-mono focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700" />
          </div>
          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="mt-1 w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700" />
          </div>
          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">.torrent file</label>
            <div className="mt-1 flex items-center gap-2">
              <label className="px-3 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-full text-sm cursor-pointer">
                Choose file
                <input type="file" accept=".torrent,application/x-bittorrent" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const fd = new FormData()
                  fd.append('file', f)
                  fd.append('filename', f.name)
                  try {
                    const res = await fetch('/upload', { method: 'POST', body: fd, credentials: 'include' })
                    const json = await res.json()
                    // deluge-web returns a JSON array of staged temp paths
                    const staged = Array.isArray(json) ? json[0] : json
                    if (typeof staged !== 'string') throw new Error('unexpected /upload response')
                    setUploadedPath(staged)
                    setUploadedName(f.name)
                  } catch (err: any) {
                    alert(`Upload failed: ${err.message}`)
                  }
                }} />
              </label>
              {uploadedName && <span className="text-xs text-emerald-600 dark:text-emerald-400 truncate max-w-[280px]" title={uploadedPath || ''}>{uploadedName}</span>}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Download path (optional)</label>
            <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/data/completed" className="mt-1 w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700" />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} className="rounded" />
            Start paused
          </label>
          <div className="pt-2 flex justify-end gap-2">
            <button onClick={() => { reset(); onClose() }} className="px-4 py-2 rounded-full text-sm bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700">Cancel</button>
            <button disabled={loading || (!magnet.trim() && !url.trim() && !uploadedPath)} onClick={add} className="px-5 py-2 rounded-full text-sm bg-zinc-900 text-white dark:bg-white dark:text-black font-medium disabled:opacity-50 hover:bg-zinc-700 dark:hover:bg-zinc-200">{loading ? 'Adding...' : 'Add'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
