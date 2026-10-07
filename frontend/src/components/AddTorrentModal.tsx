import { useEffect, useState } from 'react'
import { acceptedTorrentIndexes, core, DelugeError, requireTorrentId, uploadTorrent, web } from '../api/client'

export default function AddTorrentModal({ open, onClose, droppedFiles = [] }: { open: boolean; onClose: () => void; droppedFiles?: File[] }) {
  const [magnet, setMagnet] = useState('')
  const [url, setUrl] = useState('')
  const [path, setPath] = useState('')
  const [paused, setPaused] = useState(false)
  const [sequential, setSequential] = useState(false)
  const [uploads, setUploads] = useState<{ path: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [defaultPath, setDefaultPath] = useState('')

  useEffect(() => {
    if (!open) return
    let active = true
    setDefaultPath('')
    void core.get_config_values(['download_location']).then(config => {
      if (active && typeof config.download_location === 'string') setDefaultPath(config.download_location)
    }).catch(() => {})
    return () => { active = false }
  }, [open])

  const reset = () => {
    setMagnet('')
    setUrl('')
    setUploads([])
    setPaused(false)
    setSequential(false)
    setPath('')
    setError('')
  }

  const stageFiles = async (files: FileList | File[]) => {
    const torrents = Array.from(files).filter((file) => file.name.toLowerCase().endsWith('.torrent'))
    if (!torrents.length) return
    if (loading) return
    setMagnet('')
    setUrl('')
    setError('')
    setLoading(true)
    try {
      const staged: { path: string; name: string }[] = []
      for (const file of torrents) staged.push({ path: await uploadTorrent(file), name: file.name })
      setUploads((current) => [...current, ...staged])
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && droppedFiles.length) void stageFiles(droppedFiles)
    // A drop batch is immutable and supplied only when the modal is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, droppedFiles])

  if (!open) return null

  const add = async () => {
    setLoading(true)
    setError('')
    try {
      const opts: any = {}
      if (path.trim()) opts.download_location = path.trim()
      if (paused) opts.add_paused = true
      if (sequential) opts.sequential_download = true
      if (magnet.trim()) {
        requireTorrentId(await core.add_magnet(magnet.trim(), opts))
      } else if (url.trim()) {
        requireTorrentId(await core.add_url(url.trim(), opts))
      } else if (uploads.length) {
        // File was staged via POST /upload; register it through the web API like stock WebUI
        const result = await web.add_torrents(uploads.map(({ path: stagedPath }) => ({ path: stagedPath, options: opts })))
        const accepted = acceptedTorrentIndexes(result, uploads.length)
        if (accepted.length !== uploads.length) {
          setUploads(uploads.filter((_, index) => !accepted.includes(index)))
          throw new DelugeError(`Deluge accepted ${accepted.length} of ${uploads.length} torrents. Rejected files remain ready to retry; check for duplicates or invalid files.`)
        }
      } else {
        throw new DelugeError('Choose a magnet, URL, or torrent file.')
      }
      reset()
      onClose()
    } catch (e: any) {
      setError(`Add failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void stageFiles(event.dataTransfer.files) }}>
      <div className="w-[560px] max-w-full max-h-[100dvh] overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-4 sm:p-6 shadow-2xl">
        <h2 className="text-lg font-semibold mb-1">Add Torrent</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">Magnet, URL, or .torrent file. Uses same /upload and web.add_torrents as stock WebUI.</p>
        <div className="space-y-3">
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <p className="text-xs text-zinc-500">One source per add. Choosing another source clears the previous source.</p>
          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Magnet link</label>
            <textarea aria-label="Magnet link" disabled={loading} value={magnet} onChange={(e) => { setMagnet(e.target.value); setUrl(''); setUploads([]); setError('') }} placeholder="magnet:?xt=urn:btih:..." className="mt-1 w-full h-24 px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-mono focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700" />
          </div>
          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">URL</label>
            <input aria-label="URL" disabled={loading} value={url} onChange={(e) => { setUrl(e.target.value); setMagnet(''); setUploads([]); setError('') }} placeholder="https://..." className="mt-1 w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700" />
          </div>
          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">.torrent file</label>
            <div className="mt-1 flex items-center gap-2">
              <label className="px-3 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-full text-sm cursor-pointer">
                Choose file
                <input aria-label=".torrent file" disabled={loading} type="file" multiple accept=".torrent,application/x-bittorrent" className="hidden" onChange={(e) => { if (e.target.files) void stageFiles(e.target.files); e.target.value = '' }} />
              </label>
              {uploads.length > 0 && <span className="text-xs text-emerald-600 dark:text-emerald-400 truncate max-w-[280px]">{uploads.length === 1 ? uploads[0].name : `${uploads.length} torrents ready`}</span>}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Download path (optional)</label>
            <input aria-label="Download path" disabled={loading} value={path} onChange={(e) => setPath(e.target.value)} placeholder={defaultPath ? `Default: ${defaultPath}` : 'Use Deluge default'} className="mt-1 w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700" />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} className="rounded" />
            Start paused
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={sequential} onChange={(e) => setSequential(e.target.checked)} className="rounded" />
            Download files sequentially
          </label>
          <div className="pt-2 flex justify-end gap-2">
            <button disabled={loading} onClick={() => { reset(); onClose() }} className="px-4 py-2 rounded-full text-sm bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700">Cancel</button>
            <button disabled={loading || (!magnet.trim() && !url.trim() && !uploads.length)} onClick={add} className="px-5 py-2 rounded-full text-sm bg-zinc-900 text-white dark:bg-white dark:text-black font-medium disabled:opacity-50 hover:bg-zinc-700 dark:hover:bg-zinc-200">{loading ? 'Adding...' : 'Add'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
