
import { useQuery } from '@tanstack/react-query'
import { core, auth, web } from './api/client'
import TorrentTable from './components/TorrentTable'
import { useStore } from './stores/torrents'
import { useState } from 'react'

const KEYS = ['name','hash','state','progress','total_wanted','download_payload_rate','upload_payload_rate','eta','ratio','tracker_host','save_path','total_done']

export default function App() {
  const { filter, selected, setFilter, selectOnly } = useStore()
  const [pw, setPw] = useState('deluge')
  const [loggedIn, setLoggedIn] = useState(false)

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

  if (!loggedIn) return (
    <div className="h-screen flex items-center justify-center">
      <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 w-80">
        <h1 className="font-semibold mb-4">Deluge Modern</h1>
        <input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="Password (default: deluge)" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg mb-3"/>
        <button onClick={login} className="w-full py-2 bg-white text-black rounded-lg font-medium">Login to /json</button>
        <p className="text-xs text-zinc-500 mt-3">Make sure deluge-web is running on :8112 and Vite proxy is configured.</p>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col">
      <header className="h-12 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-6"><span className="font-bold tracking-tight">deluge</span><span className="text-xs text-zinc-500">modern ui • {data?.length||0} torrents</span></div>
        <div className="flex items-center gap-2"><button className="px-3 py-1.5 bg-white text-black rounded-full text-sm font-medium">+ Add Torrent</button></div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r border-zinc-800 bg-zinc-900/50 p-3 space-y-4">
          <div><p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">States</p>
            {['All','Downloading','Seeding','Paused','Error','Checking'].map(s=> <button key={s} onClick={()=>setFilter(s)} className={`w-full text-left px-2 py-1.5 rounded text-sm ${filter===s?'bg-zinc-800 text-white':'text-zinc-400 hover:text-white'}`}>{s}</button>)}
          </div>
        </aside>
        <main className="flex-1 flex flex-col bg-zinc-950">
          <TorrentTable torrents={data||[]} selected={selected} onSelect={selectOnly} />
          <footer className="h-8 flex items-center justify-between px-3 text-xs text-zinc-500 border-t border-zinc-800">Down: {(data||[]).reduce((a,b)=>a+b.download_payload_rate,0)/1024|0} KB/s • Up: {(data||[]).reduce((a,b)=>a+b.upload_payload_rate,0)/1024|0} KB/s • Selected: {selected.size}</footer>
        </main>
      </div>
    </div>
  )
}
