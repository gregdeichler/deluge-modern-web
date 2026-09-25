
import { useQuery } from '@tanstack/react-query'
import { core, auth, web } from './api/client'
import TorrentTable from './components/TorrentTable'
import AddTorrentModal from './components/AddTorrentModal'
import DetailsDrawer from './components/DetailsDrawer'
import { useStore } from './stores/torrents'
import { useState } from 'react'

const KEYS = ['name','hash','state','progress','total_wanted','download_payload_rate','upload_payload_rate','eta','ratio','tracker_host','save_path','total_done']

export default function App() {
  const { filter, selected, setFilter, selectOnly, toggleSelect } = useStore()
  const [pw, setPw] = useState('deluge')
  const [loggedIn, setLoggedIn] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [detailHash, setDetailHash] = useState<string|null>(null)

  const login = async () => { await auth.login(pw); const c = await web.connected(); if(!c){ const hosts = await web.get_hosts(); if(hosts.length) await web.connect(hosts[0][0]) } setLoggedIn(true) }

  const { data } = useQuery({
    queryKey: ['torrents', filter],
    queryFn: async () => {
      const f: any = {}
      if (filter !== 'All') f.state = filter
      const res = await core.get_torrents_status(f, KEYS)
      return Object.values(res) as any[]
    },
    enabled: loggedIn
  })

  const selectedList = Array.from(selected)

  const handleAction = async (action: 'pause'|'resume'|'remove') => {
    if (selectedList.length===0) return
    if (action==='pause') await core.pause(selectedList)
    if (action==='resume') await core.resume(selectedList)
    if (action==='remove' && confirm(`Remove ${selectedList.length} torrent(s)?`)) {
      for (const h of selectedList) await core.remove(h, false)
    }
  }

  if (!loggedIn) return (
    <div className="h-screen flex items-center justify-center">
      <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 w-80">
        <h1 className="font-semibold mb-4">Deluge Modern</h1>
        <input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="Password (default: deluge)" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg mb-3"/>
        <button onClick={login} className="w-full py-2 bg-white text-black rounded-lg font-medium">Login to /json</button>
        <p className="text-xs text-zinc-500 mt-3">Vite proxy -> localhost:8112. Check vite.config.ts</p>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col">
      <header className="h-12 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-6">
          <span className="font-bold tracking-tight">deluge</span>
          <span className="text-xs text-zinc-500">modern ui • {data?.length||0} torrents • {selected.size} selected</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>handleAction('pause')} className="px-3 py-1.5 bg-zinc-800 rounded-full text-sm">Pause</button>
          <button onClick={()=>handleAction('resume')} className="px-3 py-1.5 bg-zinc-800 rounded-full text-sm">Resume</button>
          <button onClick={()=>handleAction('remove')} className="px-3 py-1.5 bg-red-950 text-red-300 rounded-full text-sm">Remove</button>
          <button onClick={()=>setShowAdd(true)} className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-medium">+ Add Torrent</button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r border-zinc-800 bg-zinc-900/50 p-3 space-y-4">
          <div><p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">States</p>
            {['All','Downloading','Seeding','Paused','Error','Checking'].map(s=> <button key={s} onClick={()=>setFilter(s)} className={`w-full text-left px-2 py-1.5 rounded text-sm ${filter===s?'bg-zinc-800 text-white':'text-zinc-400 hover:text-white'}`}>{s}</button>)}
          </div>
          <div className="text-[11px] text-zinc-600">Double-click row for details.<br/>Shift+click to multi-select.</div>
        </aside>
        <main className="flex-1 flex flex-col bg-zinc-950">
          <div onDoubleClick={()=>{ if(selectedList[0]) setDetailHash(selectedList[0]) }} className="flex-1 flex flex-col overflow-hidden">
            <TorrentTable torrents={data||[]} selected={selected} onSelect={(h)=>{ selectOnly(h); setDetailHash(h) }} />
          </div>
          {detailHash && <DetailsDrawer hash={detailHash} onClose={()=>setDetailHash(null)} />}
          <footer className="h-8 flex items-center justify-between px-3 text-xs text-zinc-500 border-t border-zinc-800">Down: {(data||[]).reduce((a,b)=>a+b.download_payload_rate,0)/1024|0} KB/s • Up: {(data||[]).reduce((a,b)=>a+b.upload_payload_rate,0)/1024|0} KB/s • Selected: {selected.size} • Double-click to inspect files/peers</footer>
        </main>
      </div>
      <AddTorrentModal open={showAdd} onClose={()=>setShowAdd(false)} />
    </div>
  )
}
