
import { useQuery } from '@tanstack/react-query'
import { core, auth, web } from './api/client'
import TorrentTable from './components/TorrentTable'
import AddTorrentModal from './components/AddTorrentModal'
import DetailsDrawer from './components/DetailsDrawer'
import SettingsModal from './components/SettingsModal'
import CommandPalette from './components/CommandPalette'
import { useStore } from './stores/torrents'
import { useState, useMemo, useEffect } from 'react'

const KEYS = ['name','hash','state','progress','total_wanted','download_payload_rate','upload_payload_rate','eta','ratio','tracker_host','save_path','total_done','label','labels']

export default function App() {
  const { filter, search, trackerFilter, labelFilter, selected, setFilter, setSearch, setTrackerFilter, setLabelFilter, selectOnly } = useStore()
  const [pw, setPw] = useState('deluge')
  const [loggedIn, setLoggedIn] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [detailHash, setDetailHash] = useState<string|null>(null)

  const login = async () => { await auth.login(pw); const c = await web.connected(); if(!c){ const hosts = await web.get_hosts(); if(hosts.length) await web.connect(hosts[0][0]) } setLoggedIn(true) }

  const { data: rawTorrents } = useQuery({
    queryKey: ['torrents', filter],
    queryFn: async () => {
      const f: any = {}
      if (filter !== 'All') f.state = filter
      const res = await core.get_torrents_status(f, KEYS)
      return Object.values(res) as any[]
    },
    enabled: loggedIn,
    refetchInterval: 1500
  })

  // Derived: tracker counts, filtered list
  const trackers = useMemo(()=>{
    const m = new Map<string, number>()
    rawTorrents?.forEach((t:any)=>{ const h = t.tracker_host || 'No tracker'; m.set(h, (m.get(h)||0)+1) })
    return Array.from(m.entries()).sort((a,b)=>b[1]-a[1])
  }, [rawTorrents])

  const labels = useMemo(()=>{
    const m = new Map<string, number>()
    rawTorrents?.forEach((t:any)=>{ const labs = t.label ? [t.label] : (t.labels||[]); labs.forEach((l:string)=> m.set(l, (m.get(l)||0)+1)) })
    return Array.from(m.entries()).sort((a,b)=>b[1]-a[1])
  }, [rawTorrents])

  const filtered = useMemo(()=>{
    let list = rawTorrents || []
    if (search) { const s = search.toLowerCase(); list = list.filter((t:any)=> t.name.toLowerCase().includes(s) || t.hash.toLowerCase().includes(s)) }
    if (trackerFilter) list = list.filter((t:any)=> (t.tracker_host||'No tracker')===trackerFilter)
    if (labelFilter) list = list.filter((t:any)=> (t.label===labelFilter) || (t.labels||[]).includes(labelFilter))
    return list
  }, [rawTorrents, search, trackerFilter, labelFilter])

  const selectedList = Array.from(selected)

  const handleAction = async (action: 'pause'|'resume'|'remove') => {
    if (selectedList.length===0) return
    if (action==='pause') await core.pause(selectedList)
    if (action==='resume') await core.resume(selectedList)
    if (action==='remove' && confirm(`Remove ${selectedList.length} torrent(s)?`)) {
      for (const h of selectedList) await core.remove(h, false)
    }
  }

  // Hotkeys
  useEffect(()=>{
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); setShowPalette(v=>!v) }
      if (e.key==='/' && !showAdd && !showSettings && !showPalette){ e.preventDefault(); (document.getElementById('search-input') as HTMLInputElement)?.focus() }
    }
    window.addEventListener('keydown', onKey); return ()=>window.removeEventListener('keydown', onKey)
  }, [])

  if (!loggedIn) return (
    <div className="h-screen flex items-center justify-center">
      <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 w-80">
        <h1 className="font-semibold mb-4">Deluge Modern</h1>
        <input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="Password (default: deluge)" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg mb-3"/>
        <button onClick={login} className="w-full py-2 bg-white text-black rounded-lg font-medium">Login to /json</button>
      </div>
    </div>
  )

  const paletteActions = [
    { id: 'palette', label: 'Toggle Command Palette', hotkey: '⌘K', section: 'Actions', run: ()=>setShowPalette(v=>!v) },
    { id: 'add', label: 'Add Torrent...', hotkey: 'A', section: 'Actions', run: ()=>setShowAdd(true) },
    { id: 'settings', label: 'Open Settings', section: 'Actions', run: ()=>setShowSettings(true) },
    { id: 'pause', label: `Pause selected (${selected.size})`, section: 'Actions', run: ()=>handleAction('pause') },
    { id: 'resume', label: `Resume selected (${selected.size})`, section: 'Actions', run: ()=>handleAction('resume') },
    { id: 'remove', label: `Remove selected (${selected.size})`, section: 'Actions', run: ()=>handleAction('remove') },
    { id: 'clear', label: 'Clear selection', section: 'Actions', run: ()=>{ setTrackerFilter(null); setLabelFilter(null); setFilter('All'); setSearch('') } },
  ]

  return (
    <div className="h-screen flex flex-col">
      <header className="h-12 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-tight">deluge</span>
          <div className="relative">
            <input id="search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search torrents... (/)" className="w-[320px] pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-full text-sm placeholder:text-zinc-600"/>
            <span className="absolute left-3 top-1.5 text-zinc-600">⌕</span>
          </div>
          <span className="text-xs text-zinc-500">{filtered.length}/{rawTorrents?.length||0}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setShowPalette(true)} className="px-3 py-1.5 bg-zinc-800 rounded-full text-xs">⌘K</button>
          <button onClick={()=>setShowSettings(true)} className="px-3 py-1.5 bg-zinc-800 rounded-full text-sm">Settings</button>
          <button onClick={()=>setShowAdd(true)} className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-medium">+ Add</button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-3 space-y-5 overflow-auto">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">States</p>
            <div className="space-y-1">
              {['All','Downloading','Seeding','Paused','Error','Checking','Queued'].map(s=> <button key={s} onClick={()=>setFilter(s)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex justify-between ${filter===s?'bg-zinc-800 text-white':'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}><span>{s}</span><span className="text-xs text-zinc-600">{s==='All' ? rawTorrents?.length||0 : rawTorrents?.filter((t:any)=>t.state===s).length||0}</span></button>)}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2"><p className="text-[11px] uppercase tracking-widest text-zinc-500">Trackers</p><button onClick={()=>setTrackerFilter(null)} className="text-[11px] text-zinc-500 hover:text-white">clear</button></div>
            <div className="space-y-1 max-h-48 overflow-auto">
              {trackers.map(([host,count])=>(
                <button key={host} onClick={()=>setTrackerFilter(trackerFilter===host ? null : host)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex justify-between ${trackerFilter===host ? 'bg-sky-950 text-sky-200 border border-sky-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
                  <span className="truncate pr-2">{host}</span><span className="text-xs text-zinc-600">{count}</span>
                </button>
              ))}
              {trackers.length===0 && <p className="text-xs text-zinc-600 px-2">No trackers yet</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2"><p className="text-[11px] uppercase tracking-widest text-zinc-500">Labels</p><button onClick={()=>setLabelFilter(null)} className="text-[11px] text-zinc-500 hover:text-white">clear</button></div>
            <div className="space-y-1">
              {labels.map(([label,count])=>(
                <button key={label} onClick={()=>setLabelFilter(labelFilter===label ? null : label)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex justify-between ${labelFilter===label ? 'bg-amber-950 text-amber-200 border border-amber-800' : 'text-zinc-400 hover:text-white'}`}><span>{label}</span><span className="text-xs text-zinc-600">{count}</span></button>
              ))}
              {labels.length===0 && <p className="text-xs text-zinc-600 px-2">No labels (enable Label plugin)</p>}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/50">
            <p className="text-[11px] text-zinc-600">Hotkeys: / search • ⌘K palette • double-click row for files</p>
          </div>
        </aside>
        <main className="flex-1 flex flex-col bg-zinc-950">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900/30">
            <span className="text-xs text-zinc-500">{selected.size} selected</span>
            <div className="h-4 w-px bg-zinc-800"/>
            <button onClick={()=>handleAction('pause')} className="px-3 py-1 rounded-full text-xs bg-zinc-800 hover:bg-zinc-700">Pause</button>
            <button onClick={()=>handleAction('resume')} className="px-3 py-1 rounded-full text-xs bg-zinc-800 hover:bg-zinc-700">Resume</button>
            <button onClick={()=>handleAction('remove')} className="px-3 py-1 rounded-full text-xs bg-red-950 text-red-300 hover:bg-red-900">Remove</button>
            {(trackerFilter || labelFilter || search) && <button onClick={()=>{setSearch(''); setTrackerFilter(null); setLabelFilter(null)}} className="ml-auto text-xs text-zinc-500 hover:text-white">Clear filters ✕</button>}
          </div>
          <div className="flex-1 flex flex-col overflow-hidden" onDoubleClick={()=>{ const h = Array.from(selected)[0]; if(h) setDetailHash(h) }}>
            <TorrentTable torrents={filtered} selected={selected} onSelect={(h)=>{ selectOnly(h); setDetailHash(h) }} />
          </div>
          {detailHash && <DetailsDrawer hash={detailHash} onClose={()=>setDetailHash(null)} />}
          <footer className="h-8 flex items-center justify-between px-3 text-xs text-zinc-500 border-t border-zinc-800">Down: {(filtered||[]).reduce((a,b)=>a+b.download_payload_rate,0)/1024|0} KB/s • Up: {(filtered||[]).reduce((a,b)=>a+b.upload_payload_rate,0)/1024|0} • Filters: {[filter!== 'All' && filter, trackerFilter, labelFilter, search && `"${search}"`].filter(Boolean).join(' • ') || 'none'}</footer>
        </main>
      </div>
      <AddTorrentModal open={showAdd} onClose={()=>setShowAdd(false)} />
      <SettingsModal open={showSettings} onClose={()=>setShowSettings(false)} />
      <CommandPalette open={showPalette} onClose={()=>setShowPalette(false)} torrents={filtered||[]} actions={paletteActions} />
    </div>
  )
}
