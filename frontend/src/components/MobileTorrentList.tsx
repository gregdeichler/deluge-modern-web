import { formatBytes, formatRate } from '../utils/format'
import TrackerIcon from './TrackerIcon'

type Props = {
  torrents: any[]
  selected: Set<string>
  onToggle: (hash: string) => void
  onOpen: (hash: string) => void
}

function stateTone(state: string) {
  if (state === 'Downloading') return 'text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-950'
  if (state === 'Seeding') return 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950'
  if (state === 'Error') return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950'
  return 'text-zinc-600 bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800'
}

export default function MobileTorrentList({ torrents, selected, onToggle, onOpen }: Props) {
  if (!torrents.length) return <div className="grid flex-1 place-items-center px-8 text-center text-sm text-zinc-500">No torrents match the current filters.</div>

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-40 pt-2 md:hidden">
      <div className="space-y-2">
        {torrents.map((torrent) => {
          const checked = selected.has(torrent.hash)
          const progress = Number(torrent.progress || 0)
          return (
            <article key={torrent.hash} className={`rounded-2xl border bg-white p-3 shadow-sm dark:bg-zinc-900 ${checked ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-zinc-200 dark:border-zinc-800'}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => onToggle(torrent.hash)} aria-label={`${checked ? 'Deselect' : 'Select'} ${torrent.name}`} aria-pressed={checked} className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm ${checked ? 'border-sky-500 bg-sky-500 text-white' : 'border-zinc-300 dark:border-zinc-700'}`}>{checked ? '✓' : ''}</button>
                <button onClick={() => onOpen(torrent.hash)} className="min-w-0 flex-1 text-left">
                  <span className="line-clamp-2 text-[15px] font-semibold leading-5">{torrent.name}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {torrent.tracker_host && <span className="hidden min-[390px]:inline-flex"><TrackerIcon host={torrent.tracker_host} size={18} /></span>}
                    <span className={`rounded-full px-2 py-0.5 ${stateTone(torrent.state)}`}>{torrent.state}</span>
                    <span>{formatBytes(torrent.total_wanted)}</span>
                    {torrent.eta > 0 && torrent.state === 'Downloading' && <span>{Math.ceil(torrent.eta / 60)}m left</span>}
                  </span>
                </button>
                <button onClick={() => onOpen(torrent.hash)} aria-label={`Open details for ${torrent.name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-xl text-zinc-500 dark:bg-zinc-800">›</button>
              </div>
              <button onClick={() => onOpen(torrent.hash)} className="mt-3 block w-full text-left">
                <div className="mb-1 flex items-center justify-between text-xs tabular-nums"><span className="text-zinc-500">{progress.toFixed(1)}%</span><span className="text-zinc-500">Ratio {Number(torrent.ratio || 0).toFixed(2)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"><div className={`h-full rounded-full ${torrent.state === 'Seeding' ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
                <div className="mt-2 flex gap-4 text-xs tabular-nums"><span className="text-emerald-600 dark:text-emerald-400">↓ {formatRate(torrent.download_payload_rate)}</span><span className="text-sky-600 dark:text-sky-400">↑ {formatRate(torrent.upload_payload_rate)}</span></div>
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
