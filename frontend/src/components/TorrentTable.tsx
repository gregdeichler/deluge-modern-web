
import { useVirtualizer } from '@tanstack/react-virtual'
import React from 'react'

type Props = { torrents: any[]; onSelect: (h: string) => void; selected: Set<string> }

export default function TorrentTable({ torrents, onSelect, selected }: Props) {
  const parentRef = React.useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({ count: torrents.length, getScrollElement: () => parentRef.current, estimateSize: () => 36, overscan: 15 })
  return (
    <div ref={parentRef} className="flex-1 overflow-auto">
      <div className="sticky top-0 z-10 grid grid-cols-[1fr_100px_120px_90px_90px_80px] gap-2 px-3 py-2 text-xs text-zinc-400 bg-zinc-900 border-b border-zinc-800">
        <span>Name</span><span>Size</span><span>Progress</span><span>Down</span><span>Up</span><span>State</span>
      </div>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map(v => {
          const t = torrents[v.index]
          const isSel = selected.has(t.hash)
          return (
            <div key={t.hash} onClick={() => onSelect(t.hash)} style={{ transform: `translateY(${v.start}px)` }}
              className={`absolute top-0 left-0 w-full grid grid-cols-[1fr_100px_120px_90px_90px_80px] gap-2 px-3 py-2 text-sm border-b border-zinc-900 hover:bg-zinc-900 cursor-pointer ${isSel ? 'bg-zinc-900 ring-1 ring-zinc-700' : ''}`}>
              <span className="truncate">{t.name}</span>
              <span>{(t.total_wanted / 1024/1024/1024).toFixed(2)} GB</span>
              <div className="flex items-center gap-2"><div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-sky-500" style={{width: `${t.progress}%`}}/></div><span className="text-xs">{t.progress.toFixed(1)}%</span></div>
              <span className="text-emerald-400">{t.download_payload_rate ? `${(t.download_payload_rate/1024).toFixed(0)} KB/s` : ''}</span>
              <span className="text-sky-400">{t.upload_payload_rate ? `${(t.upload_payload_rate/1024).toFixed(0)} KB/s` : ''}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${t.state==='Downloading'?'bg-sky-950 text-sky-300': t.state==='Seeding'?'bg-emerald-950 text-emerald-300': t.state==='Paused'?'bg-zinc-800 text-zinc-400':'bg-zinc-800'}`}>{t.state}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
