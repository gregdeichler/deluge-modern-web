import { useEffect, useState, useMemo, useRef } from 'react'

type Action = { id: string; label: string; hotkey?: string; run: () => void; section: string }

type Props = {
  open: boolean
  onClose: () => void
  torrents: any[]
  actions: Action[]
  onPickTorrent: (hash: string) => void
}

export default function CommandPalette({ open, onClose, torrents, actions, onPickTorrent }: Props) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open ])

  const items = useMemo(() => {
    const all: (Action & { hash?: string })[] = [
      ...actions,
      ...torrents.map((t) => ({
        id: `torrent-${t.hash}`,
        label: t.name,
        section: 'Torrents',
        hash: t.hash,
        run: () => onPickTorrent(t.hash),
      })),
    ]
    if (!q) return all.slice(0, 40)
    const low = q.toLowerCase()
    return all.filter((a) => a.label.toLowerCase().includes(low)).slice(0, 40)
  }, [q, torrents, actions, onPickTorrent])

  useEffect(() => {
    setActive(0)
  }, [q])

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const runItem = (i: number) => {
    const item = items[i]
    if (!item) return
    onClose()
    item.run()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-[640px] max-w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-zinc-500 dark:text-zinc-500">⌘K</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
              else if (e.key === 'Enter') { e.preventDefault(); runItem(active) }
            }}
            placeholder="Search torrents, actions, settings..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
          <span className="text-[11px] text-zinc-600 dark:text-zinc-600 hidden md:inline">ESC to close</span>
        </div>
        <div ref={listRef} className="max-h-[380px] overflow-auto p-2">
          {['Actions', 'Torrents'].map((section) => {
            const sec = items.map((it, i) => ({ it, i })).filter(({ it }) => it.section === section)
            if (sec.length === 0) return null
            return (
              <div key={section} className="mb-2">
                <p className="text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500 px-2 py-1">{section}</p>
                {sec.map(({ it, i }) => (
                  <button
                    key={it.id}
                    data-idx={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => runItem(i)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm flex justify-between items-center transition-colors ${i === active ? 'bg-zinc-200 dark:bg-zinc-800' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                  >
                    <span className="truncate pr-2">{it.label}</span>
                    {it.hotkey && <span className="text-xs text-zinc-500 dark:text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{it.hotkey}</span>}
                  </button>
                ))}
              </div>
            )
          })}
          {items.length === 0 && <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-500">No results for &quot;{q}&quot;</div>}
        </div>
      </div>
    </div>
  )
}
