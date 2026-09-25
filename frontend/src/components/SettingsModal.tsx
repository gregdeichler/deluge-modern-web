import { useQuery } from '@tanstack/react-query'
import { core } from '../api/client'
import { useState, useEffect } from 'react'

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: cfg, isLoading, error } = useQuery({
    queryKey: ['config'],
    queryFn: () => core.get_config(),
    enabled: open,
  })
  const [local, setLocal] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (cfg) setLocal(cfg)
  }, [cfg])

  if (!open) return null

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await core.set_config(local)
      onClose()
    } catch (e: any) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, k, type = 'text', hint }: { label: string; k: string; type?: string; hint?: string }) => (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="flex-1">
        <span className="text-sm text-zinc-300">{label}</span>
        {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
      </div>
      <input type={type} value={local[k] ?? ''} onChange={(e) => setLocal({ ...local, [k]: type === 'number' ? Number(e.target.value) : e.target.value })} className="w-64 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-700" />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-[720px] max-w-full max-h-[85vh] overflow-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-zinc-900 p-6 pb-4 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="text-xs text-zinc-500">core.get_config / set_config</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {isLoading && <div className="text-xs text-zinc-500">Loading config...</div>}
          {error && <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg p-3">{(error as any).message}</div>}
          {cfg && (
            <>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Downloads</p>
                <Field label="Download location" k="download_location" hint="Base path" />
                <Field label="Move completed to" k="move_completed_path" />
                <Field label="Copy .torrent files to" k="torrentfiles_location" />
              </div>
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Bandwidth</p>
                <Field label="Max download speed (KiB/s)" k="max_download_speed" type="number" hint="-1 = unlimited" />
                <Field label="Max upload speed (KiB/s)" k="max_upload_speed" type="number" />
                <Field label="Max connections (global)" k="max_connections_global" type="number" />
                <Field label="Max upload slots (global)" k="max_upload_slots_global" type="number" />
              </div>
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Queue</p>
                <Field label="Max active downloading" k="max_active_downloading" type="number" />
                <Field label="Max active seeding" k="max_active_seeding" type="number" />
                <Field label="Max active checking" k="max_active_checking" type="number" />
              </div>
            </>
          )}
          {saveError && <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg p-3">{saveError}</div>}
        </div>
        <div className="sticky bottom-0 bg-zinc-900 p-4 border-t border-zinc-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-full text-sm bg-zinc-800 hover:bg-zinc-700">Cancel</button>
          <button onClick={save} disabled={saving || isLoading} className="px-5 py-2 rounded-full text-sm bg-white text-black font-medium disabled:opacity-50 hover:bg-zinc-200">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}
