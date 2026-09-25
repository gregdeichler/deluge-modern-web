import { useState } from 'react'
import { core } from '../api/client'

export default function AddTorrentModal({ open, onClose }: { open: boolean; onClose: ()=>void }) {
  const [magnet, setMagnet] = useState('')
  const [url, setUrl] = useState('')
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string>('')

  if (!open) return null
  const add = async () => {
    setLoading(true)
    try {
      const opts: any = {}
      if (path) opts.download_location = path
      if (magnet) await core.add_magnet(magnet.trim(), opts)
      else if (url) await core.add_url(url.trim(), opts)
      else if (uploadResult) {
        const files = JSON.parse(uploadResult)
        const file = Array.isArray(files) ? files[0] : files
        const { delugeRPC } = await import('../api/client')
        const tmpPath = Array.isArray(file) ? file[0] : file
        await delugeRPC('core.add_torrent_file', [tmpPath, JSON.stringify(opts)])
      }
      onClose()
      setMagnet(''); setUrl(''); setUploadResult('')
    } catch(e:any){ alert(`Add failed: ${e.message}`) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-[560px] max-w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold mb-1">Add Torrent</h2>
        <p className="text-xs text-zinc-500 mb-4">Magnet, URL, or .torrent file. Uses same /upload and core.add_* as stock WebUI.</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400">Magnet link</label>
            <textarea value={magnet} onChange={e=>setMagnet(e.target.value)} placeholder="magnet:?xt=urn:btih:..." className="mt-1 w-full h-24 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono focus:outline-none focus:border-zinc-700"/>
          </div>
          <div>
            <label className="text-xs text-zinc-400">URL</label>
            <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." className="mt-1 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-700"/>
          </div>
          <div>
            <label className="text-xs text-zinc-400">Download path (optional)</label>
            <input value={path} onChange={e=>setPath(e.target.value)} placeholder="/data/completed" className="mt-1 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-700"/>
          </div>
          <div className="pt-2 flex justify-between items-center gap-2">
            <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm cursor-pointer">
              Upload .torrent
              <input type="file" accept=".torrent,application/x-bittorrent" className="hidden" onChange={async (e)=>{
                const f = e.target.files?.[0]; if(!f) return;
                const fd = new FormData(); fd.append('file', f); fd.append('filename', f.name);
                try {
                  const res = await fetch('/upload', { method: 'POST', body: fd, credentials: 'include' });
                  const json = await res.json();
                  setUploadResult(JSON.stringify(json))
                } catch(err:any){ alert(`Upload failed: ${err.message}`) }
              }}/>
            </label>
            {uploadResult && <span className="text-xs text-emerald-400 truncate max-w-[180px]">Uploaded: {uploadResult.slice(0,80)}</span>}
            <div className="flex gap-2 ml-auto">
              <button onClick={onClose} className="px-4 py-2 rounded-full text-sm bg-zinc-800 hover:bg-zinc-700">Cancel</button>
              <button disabled={loading || (!magnet && !url && !uploadResult)} onClick={add} className="px-5 py-2 rounded-full text-sm bg-white text-black font-medium disabled:opacity-50 hover:bg-zinc-200">{loading ? 'Adding...' : 'Add'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
