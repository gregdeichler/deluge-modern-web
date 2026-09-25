import { useVirtualizer } from '@tanstack/react-virtual'
import React, { useMemo } from 'react'
import { ALL_COLUMNS, ColumnId, SortKey, SortDir } from '../stores/torrents'

type Props = {
  torrents: any[]
  onSelect: (h: string) => void
  selected: Set<string>
  sortKey: SortKey
  sortDir: SortDir
  onSort: (k: SortKey) => void
  visibleColumns: ColumnId[]
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatEta(s: number): string {
  if (!s || s < 0) return ''
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}h ${m}m`
}

export default function TorrentTable({ torrents, onSelect, selected, sortKey, sortDir, onSort, visibleColumns }: Props) {
  const parentRef = React.useRef<HTMLDivElement>(null)
  const cols = useMemo(() => ALL_COLUMNS.filter((c) => visibleColumns.includes(c.id)), [visibleColumns])
  const gridCols = useMemo(() => cols.map((c) => c.width).join(' '), [cols])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...torrents].sort((a, b) => {
      const ka = a[sortKey]
      const kb = b[sortKey]
      if (ka == null && kb == null) return 0
      if (ka == null) return 1
      if (kb == null) return -1
      if (typeof ka === 'string' && typeof kb === 'string') {
        return ka.localeCompare(kb) * dir
      }
      return (ka > kb ? 1 : ka < kb ? -1 : 0) * dir
    })
  }, [torrents, sortKey, sortDir])

  const rowVirtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 38,
    overscan: 20,
  })

  const header = (c: typeof ALL_COLUMNS[number]) => {
    const isSorted = c.sortKey === sortKey
    return (
      <button key={c.id} onClick={() => c.sortKey && onSort(c.sortKey)} className={`flex items-center gap-1 text-left hover:text-white ${c.sortKey ? 'cursor-pointer' : 'cursor-default'}`}>
        {c.label}
        {isSorted && <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </button>
    )
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-auto">
      <div className="sticky top-0 z-10 grid gap-2 px-3 py-2 text-[11px] uppercase tracking-wider text-zinc-400 bg-zinc-900 border-b border-zinc-800" style={{ gridTemplateColumns: gridCols }}>
        {cols.map(header)}
      </div>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((v) => {
          const t = sorted[v.index]
          const isSel = selected.has(t.hash)
          return (
            <div key={t.hash} onClick={() => onSelect(t.hash)} style={{ transform: `translateY(${v.start}px)`, gridTemplateColumns: gridCols }} className={`absolute top-0 left-0 w-full grid gap-2 px-3 py-2 text-sm border-b border-zinc-900/80 hover:bg-zinc-900 cursor-pointer ${isSel ? 'bg-zinc-900 ring-1 ring-zinc-700' : ''}`}>
              {cols.map((col) => {
                switch (col.id) {
                  case 'name':
                    return <span key={col.id} className="truncate font-medium" title={t.name}>{t.name}</span>
                  case 'size':
                    return <span key={col.id} className="text-zinc-400">{formatSize(t.total_wanted)}</span>
                  case 'progress':
                    return (
                      <div key={col.id} className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full transition-all" style={{ width: `${t.progress}%`, backgroundColor: t.state === 'Seeding' ? '#10b981' : t.state === 'Downloading' ? '#0ea5e9' : '#52525b' }} />
                        </div>
                        <span className="text-xs w-10 text-right">{t.progress.toFixed(1)}%</span>
                      </div>
                    )
                  case 'down':
                    return <span key={col.id} className="text-emerald-400 tabular-nums">{t.download_payload_rate ? `${(t.download_payload_rate / 1024).toFixed(0)} KB/s` : ''}</span>
                  case 'up':
                    return <span key={col.id} className="text-sky-400 tabular-nums">{t.upload_payload_rate ? `${(t.upload_payload_rate / 1024).toFixed(0)} KB/s` : ''}</span>
                  case 'state':
                    return <span key={col.id} className={`text-xs px-2 py-0.5 rounded-full w-fit ${t.state === 'Downloading' ? 'bg-sky-950 text-sky-300 border border-sky-900' : t.state === 'Seeding' ? 'bg-emerald-950 text-emerald-300 border border-emerald-900' : t.state === 'Paused' ? 'bg-zinc-800 text-zinc-400' : t.state === 'Error' ? 'bg-red-950 text-red-300 border border-red-900' : 'bg-zinc-800 text-zinc-400'}`}>{t.state}</span>
                  case 'eta':
                    return <span key={col.id} className="tabular-nums text-zinc-400">{formatEta(t.eta)}</span>
                  case 'ratio':
                    return <span key={col.id} className="tabular-nums">{t.ratio?.toFixed(2)}</span>
                  case 'tracker':
                    return <span key={col.id} className="truncate text-zinc-500 text-xs">{t.tracker_host}</span>
                  case 'added':
                    return <span key={col.id} className="text-xs text-zinc-500">{t.time_added ? new Date(t.time_added * 1000).toLocaleDateString() : ''}</span>
                  case 'seeds':
                    return <span key={col.id} className="text-xs">{t.num_seeds ?? ''}</span>
                  case 'peers':
                    return <span key={col.id} className="text-xs">{t.num_peers ?? ''}</span>
                  default:
                    return null
                }
              })}
            </div>
          )
        })}
      </div>
      {sorted.length === 0 && <div className="p-12 text-center text-sm text-zinc-600">No torrents match filters</div>}
    </div>
  )
}
