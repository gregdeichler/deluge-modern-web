
import { useQuery } from '@tanstack/react-query'
import { core } from '../api/client'
import { useState, useEffect } from 'react'

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: ()=>void }) {
  const { data: cfg, isLoading } = useQuery({ queryKey: ['config'], queryFn: () => core.get_config(), enabled: open })
  const [local, setLocal] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(()=>{ if(cfg) setLocal(cfg) }, [cfg])

  if (!open) return null

  const save = async () => {
    setSaving(true)
    try {
      // Only send changed keys to avoid overwriting unrelated
      await core.set_config(local)
      onClose()
    } catch(e:any){ alert(e.message) } finally { setSaving(false) }
  }

  const Field = ({ label, k, type='text' }: { label: string; k: string; type?: string }) => (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-zinc-400">{label}</span>
      <input type={type} value={local[k] ?? ''} onChange={e=>setLocal({...local, [k]: type==='number' ? Number(e.target.value) : e.target.value})} className="w-56 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm"/>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[640px] max-h-[80vh] overflow-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>
        {isLoading ? <div className="text-xs text-zinc-500">Loading config...</div> : (
          <div className="space-y-1 divide-y divide-zinc-800/50">
            <div className="pb-3">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Downloads</p>
              <Field label="Download location" k="download_location" />
              <Field label="Move completed" k="move_completed_path" />
              <Field label="Copy of .torrent" k="torrentfiles_location" />
            </div>
            <div className="py-3">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Bandwidth</p>
              <Field label="Max download speed (KiB/s)" k="max_download_speed" type="number" />
              <Field label="Max upload speed (KiB/s)" k="max_upload_speed" type="number" />
              <Field label="Max connections" k="max_connections_global" type="number" />
              <Field label="Max upload slots" k="max_upload_slots_global" type="number" />
            </div>
            <div className="py-3">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Queue</p>
              <Field label="Max active downloading" k="queue_new_to_top" />
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-sm text-zinc-400">Download queue size</span>
                <input type="number" value={local['max_active_downloading'] ?? ''} onChange={e=>setLocal({...local, max_active_downloading: Number(e.target.value)})} className="w-56 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm"/>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-sm text-zinc-400">Seed queue size</span>
                <input type="number" value={local['max_active_seeding'] ?? ''} onChange={e=>setLocal({...local, max_active_seeding: Number(e.target.value)})} className="w-56 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm"/>
              </div>
            </div>
          </div>
        )}
        <div className="pt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-full text-sm bg-zinc-800">Cancel</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-full text-sm bg-white text-black font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        </div>
        <p className="text-[11px] text-zinc-600 mt-3">Calls core.get_config / core.set_config via /json. Some keys need deluged restart (see Deluge docs).</p>
      </div>
    </div>
  )
}
