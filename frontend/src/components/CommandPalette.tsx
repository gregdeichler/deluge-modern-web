import { useEffect, useState, useMemo } from 'react'

type Action = { id: string; label: string; hotkey?: string; run: () => void; section: string }

export default function CommandPalette({ open, onClose, torrents, actions }: { open: boolean; onClose: () => void; torrents: any[]; actions: Action[] }) {
  const [q, setQ] = useState('')

  useEffect(() => {
    if (open) setQ('')
  }, [open])

  const filtered = useMemo(() => {
    const all = [...actions, ...torrents.map((t) => ({ id: `torrent-${t.hash}`, label: t.name, section: 'Torrents', run: () => {}, hash: t.hash } as any))]
    if (!q) return all.slice(0, 40)
    const low = q.toLowerCase()
    return all.filter((a: any) => a.label.toLowerCase().includes(low)).slice(0, 40)
  }, [q, torrents, actions])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-[640px] max-w-full rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-zinc-800">
          <span className="text-zinc-500">⌘K</span>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search torrents, actions, settings..." className="flex-1 bg-transparent outline-none text-sm placeholder:text-zinc-600" />
          <span className="text-[11px] text-zinc-600 hidden md:inline">ESC to close</span>
        </div>
        <div className="max-h-[380px] overflow-auto p-2">
          {['Actions', 'Torrents'].map((section) => (
            <div key={section} className="mb-2">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 px-2 py-1">{section}</p>
              {filtered.filter((f: any) => f.section === section).map((a: any) => (
                <button key={a.id} onClick={() => { onClose(); a.run() }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-800 text-sm flex justify-between items-center transition-colors">
                  <span className="truncate pr-2">{a.label}</span>
                  {a.hotkey && <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{a.hotkey}</span>}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <div className="p-8 text-center text-sm text-zinc-500">No results for &quot;{q}&quot;</div>}
        </div>
      </div>
    </div>
  )
}
