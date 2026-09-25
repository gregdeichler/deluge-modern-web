import { useQuery } from '@tanstack/react-query'
import { core, delugeRPC } from '../api/client'
import { useState } from 'react'

const FILE_KEYS = ['files', 'file_priorities', 'file_progress']

function FilesTab({ hash }: { hash: string }) {
  const { data, refetch, error } = useQuery({
    queryKey: ['files', hash],
    queryFn: async () => core.get_torrent_status(hash, FILE_KEYS),
    refetchInterval: 2000,
  })
  if (error) {
    return <div className="p-4 text-xs text-red-600 dark:text-red-400">{(error as any).message}</div>
  }
  if (!data) {
    return <div className="p-4 text-xs text-zinc-500">Loading files...</div>
  }
  const files = data.files || []
  if (files.length === 0) {
    return <div className="p-4 text-xs text-zinc-500">No files (magnet metadata not yet fetched)</div>
  }
  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-900">
      {files.map((f: any, i: number) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-zinc-200/30 dark:hover:bg-zinc-800/30">
          <span className="flex-1 truncate" title={f.path}>{f.path}</span>
          <span className="text-zinc-500 tabular-nums">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
          <span className="w-20">
            <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 transition-all" style={{ width: `${(data.file_progress?.[i] || 0) * 100}%` }} />
            </div>
          </span>
          <select value={data.file_priorities?.[i] ?? 1} onChange={async (e) => {
            const p = Number(e.target.value)
            try {
              await delugeRPC('core.set_torrent_file_priorities', [hash, { [i]: p }])
              refetch()
            } catch (err: any) {
              alert(err.message)
            }
          }} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs">
            <option value={0}>Skip</option>
            <option value={1}>Low</option>
            <option value={4}>Normal</option>
            <option value={7}>High</option>
          </select>
        </div>
      ))}
    </div>
  )
}

function PeersTab({ hash }: { hash: string }) {
  const { data, error } = useQuery({
    queryKey: ['peers', hash],
    queryFn: async () => core.get_torrent_status(hash, ['peers']),
    refetchInterval: 2000,
  })
  if (error) {
    return <div className="p-4 text-xs text-red-600 dark:text-red-400">{(error as any).message}</div>
  }
  const peers = data?.peers || []
  return (
    <div className="p-2">
      <div className="grid grid-cols-[1fr_80px_80px_100px] text-[11px] text-zinc-500 px-2 py-1 uppercase tracking-wider">
        <span>Peer</span><span>Down</span><span>Up</span><span>Client</span>
      </div>
      {peers.map((p: any, i: number) => (
        <div key={i} className="grid grid-cols-[1fr_80px_80px_100px] text-xs px-2 py-1.5 border-b border-zinc-200/50 dark:border-zinc-900/50 hover:bg-zinc-200/20 dark:hover:bg-zinc-800/20">
          <span className="truncate">{p.ip}:{p.port}</span>
          <span className="tabular-nums">{(p.down_speed / 1024).toFixed(0)} KB/s</span>
          <span className="tabular-nums">{(p.up_speed / 1024).toFixed(0)}</span>
          <span className="truncate">{p.client}</span>
        </div>
      ))}
      {peers.length === 0 && <div className="p-6 text-center text-xs text-zinc-500">No peers connected</div>}
    </div>
  )
}

function TrackersTab({ hash }: { hash: string }) {
  const { data } = useQuery({
    queryKey: ['trackers', hash],
    queryFn: () => core.get_torrent_status(hash, ['trackers', 'tracker_status']),
    refetchInterval: 5000,
  })
  const trackers = data?.trackers || []
  return (
    <div className="p-3 text-xs">
      <div className="space-y-1">
        {trackers.map((tr: any, i: number) => (
          <div key={i} className="flex justify-between items-center border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 bg-zinc-100/50 dark:bg-zinc-900/50">
            <span className="truncate pr-4">{tr.url}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800">{tr.tier}</span>
          </div>
        ))}
        {trackers.length === 0 && <div className="text-zinc-500">No trackers</div>}
      </div>
      {data?.tracker_status && <div className="mt-3 p-2 bg-zinc-100 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400">{data.tracker_status}</div>}
    </div>
  )
}

export default function DetailsDrawer({ hash, onClose }: { hash: string | null; onClose: () => void }) {
  const [tab, setTab] = useState<'files' | 'peers' | 'trackers' | 'options'>('files')
  const { data: status } = useQuery({
    queryKey: ['status', hash],
    queryFn: async () => {
      if (!hash) return null
      return core.get_torrent_status(hash, ['name', 'tracker_host', 'save_path', 'comment', 'total_wanted', 'total_done', 'num_pieces', 'piece_length', 'time_added', 'seeding_time'])
    },
    enabled: !!hash,
    refetchInterval: 3000,
  })

  if (!hash) return null

  return (
    <div className="h-[340px] border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex flex-col shrink-0">
      <div className="h-11 flex items-center justify-between px-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex gap-1">
          {(['files', 'peers', 'trackers', 'options'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-xs capitalize transition-colors ${tab === t ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-medium' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}>{t}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs truncate max-w-[420px] hidden md:block text-zinc-700 dark:text-zinc-300" title={status?.name}>{status?.name}</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center">✕</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950">
        {tab === 'files' && <FilesTab hash={hash} />}
        {tab === 'peers' && <PeersTab hash={hash} />}
        {tab === 'trackers' && <TrackersTab hash={hash} />}
        {tab === 'options' && (
          <div className="p-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
            <div>Save path: <span className="text-zinc-900 dark:text-white">{status?.save_path}</span></div>
            <div>Size: {status?.total_wanted ? (status.total_wanted / 1024 / 1024 / 1024).toFixed(2) + ' GB' : ''} • Pieces: {status?.num_pieces} x {status?.piece_length ? (status.piece_length / 1024).toFixed(0) + ' KB' : ''}</div>
            <div>Comment: {status?.comment || '—'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
