
import { useQuery } from '@tanstack/react-query'
import { core, delugeRPC } from '../api/client'
import { useState } from 'react'

const FILE_KEYS = ['files','file_priorities','file_progress']
const PEER_KEYS = ['peers'] // via get_torrent_status? actually web UI uses core.get_torrent_status with peers

function FilesTab({ hash }: { hash: string }) {
  const { data } = useQuery({
    queryKey: ['files', hash],
    queryFn: async () => core.get_torrent_status(hash, FILE_KEYS),
    refetchInterval: 2000
  })
  if (!data) return <div className="p-4 text-xs text-zinc-500">Loading...</div>
  const files = data.files || []
  return (
    <div className="divide-y divide-zinc-900">
      {files.map((f:any,i:number)=>(
        <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs">
          <span className="flex-1 truncate" title={f.path}>{f.path}</span>
          <span className="text-zinc-500">{(f.size/1024/1024).toFixed(1)} MB</span>
          <span className="w-16"><div className="h-1 bg-zinc-800 rounded-full"><div className="h-full bg-sky-500" style={{width:`${(data.file_progress?.[i]||0)*100}%`}}/></div></span>
          <select value={data.file_priorities?.[i] ?? 1} onChange={async e=>{
            const p = Number(e.target.value)
            await delugeRPC('core.set_torrent_file_priorities', [hash, { [i]: p }])
          }} className="bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5">
            <option value={0}>Skip</option><option value={1}>Low</option><option value={4}>Normal</option><option value={7}>High</option>
          </select>
        </div>
      ))}
    </div>
  )
}

function PeersTab({ hash }: { hash: string }) {
  const { data } = useQuery({
    queryKey: ['peers', hash],
    queryFn: async () => core.get_torrent_status(hash, ['peers']),
    refetchInterval: 2000
  })
  const peers = data?.peers || []
  return (
    <div className="p-2">
      <div className="grid grid-cols-[1fr_80px_80px_80px] text-[11px] text-zinc-500 px-2 py-1"><span>Peer</span><span>Down</span><span>Up</span><span>Client</span></div>
      {peers.map((p:any,i:number)=>(
        <div key={i} className="grid grid-cols-[1fr_80px_80px_80px] text-xs px-2 py-1 border-b border-zinc-900/50"><span className="truncate">{p.ip}:{p.port}</span><span>{(p.down_speed/1024).toFixed(0)} KB/s</span><span>{(p.up_speed/1024).toFixed(0)}</span><span className="truncate">{p.client}</span></div>
      ))}
      {peers.length===0 && <div className="p-4 text-xs text-zinc-500">No peers</div>}
    </div>
  )
}

export default function DetailsDrawer({ hash, onClose }: { hash: string | null; onClose: ()=>void }) {
  const [tab, setTab] = useState<'files'|'peers'|'trackers'|'options'>('files')
  const { data: status } = useQuery({
    queryKey: ['status', hash],
    queryFn: async () => hash ? core.get_torrent_status(hash, ['name','tracker_host','trackers','total_wanted','state','progress','save_path','comment']) : null,
    enabled: !!hash,
    refetchInterval: 3000
  })

  if (!hash) return null

  return (
    <div className="h-[320px] border-t border-zinc-800 bg-zinc-900 flex flex-col">
      <div className="h-10 flex items-center justify-between px-3 border-b border-zinc-800">
        <div className="flex gap-1">
          {(['files','peers','trackers','options'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-full text-xs capitalize ${tab===t ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>{t}</button>
          ))}
        </div>
        <div className="flex items-center gap-3"><span className="text-xs truncate max-w-[420px]">{status?.name}</span><button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button></div>
      </div>
      <div className="flex-1 overflow-auto">
        {tab==='files' && <FilesTab hash={hash}/>}
        {tab==='peers' && <PeersTab hash={hash}/>}
        {tab==='trackers' && <div className="p-3 text-xs space-y-2">{(status?.trackers||[]).map((tr:any,i:number)=><div key={i} className="flex justify-between border-b border-zinc-800 py-1"><span className="truncate">{tr.url}</span><span className="text-zinc-500">{tr.tier}</span></div>)}</div>}
        {tab==='options' && <div className="p-3 text-xs text-zinc-400">Save path: {status?.save_path}<br/>Comment: {status?.comment}</div>}
      </div>
    </div>
  )
}
