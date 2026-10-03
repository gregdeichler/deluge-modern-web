import { useQuery } from '@tanstack/react-query'
import { core, auth, web, delugeRPC, setAuthFailureHandler } from './api/client'
import TorrentTable from './components/TorrentTable'
import AddTorrentModal from './components/AddTorrentModal'
import DetailsDrawer from './components/DetailsDrawer'
import SettingsModal from './components/SettingsModal'
import CommandPalette from './components/CommandPalette'
import ColumnPicker from './components/ColumnPicker'
import RemoveTorrentModal from './components/RemoveTorrentModal'
import MobileTorrentList from './components/MobileTorrentList'
import TrackerIcon from './components/TrackerIcon'
import { useStore } from './stores/torrents'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { buildLabel } from './build'

const KEYS = ['name','hash','state','progress','total_wanted','total_done','download_payload_rate','upload_payload_rate','eta','ratio','tracker_host','save_path','time_added','num_seeds','num_peers','label','labels','queue']

export default function App() {
  const { theme, toggleTheme, filter, search, trackerFilter, labelFilter, sortKey, sortDir, visibleColumns, selected, refreshInterval, setFilter, setSearch, setTrackerFilter, setLabelFilter, setSort, selectOnly, toggleSelect, selectMany, clearSelect } = useStore()
  const [pw, setPw] = useState(localStorage.getItem('deluge-pw') || '')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [detailHash, setDetailHash] = useState<string | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeBusy, setRemoveBusy] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const login = async () => {
    setLoginError(null)
    try {
      const res = await auth.login(pw)
      const c = await web.connected().catch(() => false)
      if (!c) {
        const hosts = await web.get_hosts().catch(() => [])
        if (hosts && hosts.length > 0) {
          try {
            await web.connect(hosts[0][0])
          } catch {}
        }
      }
      setLoggedIn(true)
    } catch (e: any) {
      setLoginError(e.message)
    }
  }

  useEffect(() => {
    // Older builds persisted this credential. Deluge sessions are cookie-based,
    // so retaining the raw password provides no benefit and increases risk.
    localStorage.removeItem('deluge-pw')
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // If the deluge-web session expires mid-use, drop back to the login screen.
  useEffect(() => {
    setAuthFailureHandler(() => setLoggedIn(false))
    return () => setAuthFailureHandler(null)
  }, [])

  useEffect(() => {
    auth.check().then((ok) => {
      if (ok) setLoggedIn(true)
    }).catch(() => {})
  }, [])

  const { data: rawTorrents, error, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['torrents', filter],
    queryFn: async () => {
      const f: any = {}
      if (filter !== 'All') f.state = filter
      const res = await core.get_torrents_status(f, KEYS)
      return Object.values(res) as any[]
    },
    enabled: loggedIn,
    refetchInterval: refreshInterval,
    retry: false,
  })

  const trackers = useMemo(() => {
    const m = new Map<string, number>()
    rawTorrents?.forEach((t: any) => {
      const h = t.tracker_host || 'No tracker'
      m.set(h, (m.get(h) || 0) + 1)
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [rawTorrents])

  const labels = useMemo(() => {
    const m = new Map<string, number>()
    rawTorrents?.forEach((t: any) => {
      const labs = t.label ? [t.label] : (t.labels || [])
      labs.forEach((l: string) => m.set(l, (m.get(l) || 0) + 1))
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [rawTorrents])

  const filtered = useMemo(() => {
    let list = rawTorrents || []
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((t: any) => t.name.toLowerCase().includes(s) || t.hash.toLowerCase().includes(s) || (t.tracker_host || '').toLowerCase().includes(s))
    }
    if (trackerFilter) {
      list = list.filter((t: any) => (t.tracker_host || 'No tracker') === trackerFilter)
    }
    if (labelFilter) {
      list = list.filter((t: any) => (t.label === labelFilter) || (t.labels || []).includes(labelFilter))
    }
    return list
  }, [rawTorrents, search, trackerFilter, labelFilter])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
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
  }, [filtered, sortKey, sortDir])

  const anchorRef = useRef<string | null>(null)

  const handleSelect = useCallback((h: string, e: React.MouseEvent) => {
    if (e.shiftKey && anchorRef.current) {
      const hashes = sorted.map((t: any) => t.hash)
      const a = hashes.indexOf(anchorRef.current)
      const b = hashes.indexOf(h)
      if (a !== -1 && b !== -1) {
        selectMany(hashes.slice(Math.min(a, b), Math.max(a, b) + 1))
        return
      }
    }
    if (e.metaKey || e.ctrlKey) {
      toggleSelect(h)
    } else {
      selectOnly(h)
    }
    anchorRef.current = h
  }, [sorted, selectMany, toggleSelect, selectOnly])

  const selectedList = Array.from(selected)

  const handleAction = useCallback(async (action: 'pause' | 'resume' | 'remove' | 'recheck') => {
    if (selectedList.length === 0) return
    try {
      if (action === 'pause') await core.pause(selectedList)
      if (action === 'resume') await core.resume(selectedList)
      if (action === 'remove') setRemoveOpen(true)
      if (action === 'recheck') {
        for (const h of selectedList) {
          await delugeRPC('core.force_recheck', [[h]])
        }
      }
    } catch (e: any) {
      alert(e.message)
    }
  }, [selectedList, clearSelect])

  const confirmRemove = useCallback(async (removeData: boolean) => {
    setRemoveBusy(true)
    try {
      for (const hash of selectedList) await core.remove(hash, removeData)
      clearSelect()
      setRemoveOpen(false)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setRemoveBusy(false)
    }
  }, [selectedList, clearSelect])

  useEffect(() => {
    const dragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) event.preventDefault()
    }
    const drop = (event: DragEvent) => {
      const files = Array.from(event.dataTransfer?.files || []).filter((file) => file.name.toLowerCase().endsWith('.torrent'))
      if (!files.length) return
      event.preventDefault()
      setDroppedFiles(files)
      setShowAdd(true)
    }
    window.addEventListener('dragover', dragOver)
    window.addEventListener('drop', drop)
    return () => { window.removeEventListener('dragover', dragOver); window.removeEventListener('drop', drop) }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowPalette((v) => !v)
      }
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !showAdd && !showSettings && !showPalette) {
        e.preventDefault()
        ;(document.getElementById('search-input') as HTMLInputElement)?.focus()
      }
      if (e.key === 'Escape') {
        if (showPalette) setShowPalette(false)
        else if (showAdd) setShowAdd(false)
        else if (showSettings) setShowSettings(false)
        else if (detailHash) setDetailHash(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showPalette, showAdd, showSettings, detailHash])

  if (!loggedIn) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white dark:bg-zinc-950 p-4">
        <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-[360px] shadow-2xl">
          <h1 className="font-semibold text-lg mb-1">Deluge Modern</h1>
          <p className="text-xs text-zinc-500 mb-4">Connects to /json — same auth as stock WebUI</p>
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="Deluge Web password" className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl mb-3 text-sm" onKeyDown={(e) => { if (e.key === 'Enter') login() }} />
          {loginError && <div className="text-xs text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg p-2 mb-3">{loginError}</div>}
          <button onClick={login} className="w-full py-2.5 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-full font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200">Login</button>
          <p className="text-[11px] text-zinc-600 mt-3">Uses the same account and session as Deluge Web · {buildLabel}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="min-h-12 flex items-center justify-between gap-2 px-2 sm:px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-tight">deluge</span>
          <div className="relative hidden md:block">
            <input id="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search torrents, trackers... (/)" className="w-[360px] pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-full text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700" />
            <span className="absolute left-3 top-1.5 text-zinc-600 text-sm">⌕</span>
          </div>
          <span className="text-xs text-zinc-500 hidden lg:inline">{isLoading ? 'loading...' : `${filtered.length}/${rawTorrents?.length || 0}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex"><ColumnPicker /></span>
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-full text-xs">{theme === 'dark' ? '☀' : '☾'}</button>
          <button onClick={() => setShowPalette(true)} className="hidden sm:inline-flex px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-full text-xs">⌘K</button>
          <button onClick={() => setShowSettings(true)} className="hidden sm:inline-flex px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-full text-sm">Settings</button>
          <button onClick={() => setShowAdd(true)} className="px-4 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-full text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200">+ Add</button>
          <button onClick={async () => { await auth.logout(); setLoggedIn(false) }} className="hidden sm:inline-flex px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Logout</button>
        </div>
      </header>
      <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-2.5 text-zinc-400">⌕</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search torrents" aria-label="Search torrents" className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-10 text-base outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950" />
          {search && <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-1.5 grid h-8 w-8 place-items-center rounded-full text-zinc-500">✕</button>}
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:block w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/40 p-3 space-y-5 overflow-auto shrink-0">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">States</p>
            <div className="space-y-0.5">
              {['All','Downloading','Seeding','Paused','Error','Checking','Queued'].map((s) => {
                const count = s === 'All' ? rawTorrents?.length || 0 : rawTorrents?.filter((t: any) => t.state === s).length || 0
                return (
                  <button key={s} onClick={() => setFilter(s)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex justify-between items-center ${filter === s ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'}`}>
                    <span>{s}</span><span className="text-xs text-zinc-600">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500">Trackers</p>
              {trackerFilter && <button onClick={() => setTrackerFilter(null)} className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">clear</button>}
            </div>
            <div className="space-y-0.5 max-h-52 overflow-auto">
              {trackers.slice(0, 20).map(([host, count]) => (
                <button key={host} onClick={() => setTrackerFilter(trackerFilter === host ? null : host)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex justify-between items-center ${trackerFilter === host ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-200 border border-sky-200 dark:border-sky-900' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'}`}>
                  <span className="flex min-w-0 items-center gap-2"><TrackerIcon host={host} size={18} /><span className="truncate pr-2">{host}</span></span><span className="text-xs text-zinc-600">{count}</span>
                </button>
              ))}
              {trackers.length === 0 && <p className="text-xs text-zinc-600 px-2">No trackers yet</p>}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500">Labels</p>
              {labelFilter && <button onClick={() => setLabelFilter(null)} className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">clear</button>}
            </div>
            <div className="space-y-0.5">
              {labels.map(([label, count]) => (
                <button key={label} onClick={() => setLabelFilter(labelFilter === label ? null : label)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex justify-between ${labelFilter === label ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-900' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'}`}>
                  <span>{label}</span><span className="text-xs text-zinc-600">{count}</span>
                </button>
              ))}
              {labels.length === 0 && <p className="text-xs text-zinc-600 px-2">No labels (enable Label plugin)</p>}
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-1 text-[11px] text-zinc-600">
            <p>Shortcuts: / search • ⌘K palette • dbl-click details</p>
            <p>Ctrl/⌘-click multi-select • Shift-click range</p>
            <p>Click column headers to sort • Columns menu to customize</p>
            {error && <p className="text-red-600 dark:text-red-400">Disconnected: {(error as any).message?.slice(0, 100)}</p>}
            {!error && <p className={isFetching ? 'text-amber-600' : 'text-emerald-600'}>{isFetching ? 'Refreshing…' : `Connected · ${dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'waiting'}`}</p>}
          </div>
        </aside>
        <main className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/20 dark:bg-zinc-900/20 shrink-0 overflow-x-auto">
            <span className="text-xs text-zinc-500">{selected.size} selected</span>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <button onClick={() => handleAction('pause')} className="px-3 py-1 rounded-full text-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700">Pause</button>
            <button onClick={() => handleAction('resume')} className="px-3 py-1 rounded-full text-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700">Resume</button>
            <button onClick={() => handleAction('recheck')} className="px-3 py-1 rounded-full text-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700">Recheck</button>
            <button onClick={() => handleAction('remove')} className="px-3 py-1 rounded-full text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 border border-red-200 dark:border-red-900">Remove</button>
            <div className="ml-auto flex items-center gap-2">
              {(trackerFilter || labelFilter || search || filter !== 'All') && <button onClick={() => { setSearch(''); setTrackerFilter(null); setLabelFilter(null); setFilter('All') }} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Clear filters ✕</button>}
              <span className="text-xs text-zinc-600 hidden md:inline">Sorted by {sortKey} {sortDir === 'asc' ? '↑' : '↓'}</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden" onDoubleClick={() => { const h = Array.from(selected)[0]; if (h) setDetailHash(h) }}>
            <div className="hidden min-h-0 flex-1 md:flex"><TorrentTable torrents={sorted} selected={selected} onSelect={handleSelect} sortKey={sortKey} sortDir={sortDir} onSort={setSort} visibleColumns={visibleColumns} /></div>
            <MobileTorrentList torrents={sorted} selected={selected} onToggle={toggleSelect} onOpen={setDetailHash} />
          </div>
          {detailHash && <DetailsDrawer hash={detailHash} onClose={() => setDetailHash(null)} />}
          <footer className="h-8 hidden md:flex items-center justify-between px-3 text-xs text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
            <span>Down: {filtered.reduce((a, b) => a + (b.download_payload_rate || 0), 0) / 1024 | 0} KB/s • Up: {filtered.reduce((a, b) => a + (b.upload_payload_rate || 0), 0) / 1024 | 0} • {filtered.length} torrents</span>
            <span className="hidden md:inline">{buildLabel} · Filters: {[filter !== 'All' && filter, trackerFilter, labelFilter, search && `"${search}"`].filter(Boolean).join(' • ') || 'none'}</span>
          </footer>
        </main>
      </div>
      {selected.size > 0 && <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-around rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 md:hidden">
        <button onClick={() => handleAction('pause')} className="min-h-11 px-2 text-sm font-medium">Pause</button>
        <button onClick={() => handleAction('resume')} className="min-h-11 px-2 text-sm font-medium">Resume</button>
        <button onClick={() => handleAction('recheck')} className="min-h-11 px-2 text-sm font-medium">Recheck</button>
        <button onClick={() => handleAction('remove')} className="min-h-11 px-2 text-sm font-medium text-red-600">Remove</button>
      </div>}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-zinc-200 bg-white/95 px-2 pt-1 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden" style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}>
        <button onClick={() => setShowMobileFilters(false)} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-sky-600"><span className="text-xl">☷</span>Torrents</button>
        <button onClick={() => setShowAdd(true)} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs"><span className="text-xl">＋</span>Add</button>
        <button onClick={() => setShowMobileFilters(true)} className="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs"><span className="text-xl">≡</span>Filters{(filter !== 'All' || trackerFilter || labelFilter) && <span className="absolute right-5 top-2 h-2 w-2 rounded-full bg-sky-500" />}</button>
        <button onClick={() => setShowSettings(true)} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs"><span className="text-xl">⚙</span>Settings</button>
      </nav>
      {showMobileFilters && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setShowMobileFilters(false)}>
        <section className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl dark:bg-zinc-900" onClick={(event) => event.stopPropagation()} aria-label="Torrent filters">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Filters</h2><button onClick={() => { setFilter('All'); setTrackerFilter(null); setLabelFilter(null) }} className="min-h-11 px-2 text-sm text-sky-600">Clear all</button></div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</p>
          <div className="grid grid-cols-2 gap-2">{['All','Downloading','Seeding','Paused','Error','Checking','Queued'].map((state) => <button key={state} onClick={() => setFilter(state)} className={`min-h-11 rounded-xl border px-3 text-left text-sm ${filter === state ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' : 'border-zinc-200 dark:border-zinc-700'}`}>{state}</button>)}</div>
          {trackers.length > 0 && <><p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Tracker</p><div className="space-y-2">{trackers.slice(0, 12).map(([host, count]) => <button key={host} onClick={() => setTrackerFilter(trackerFilter === host ? null : host)} className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm ${trackerFilter === host ? 'border-sky-500 bg-sky-50 dark:bg-sky-950' : 'border-zinc-200 dark:border-zinc-700'}`}><span className="flex min-w-0 items-center gap-2"><TrackerIcon host={host} size={22} /><span className="truncate">{host}</span></span><span className="text-zinc-500">{count}</span></button>)}</div></>}
          {labels.length > 0 && <><p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Label</p><div className="flex flex-wrap gap-2">{labels.map(([label, count]) => <button key={label} onClick={() => setLabelFilter(labelFilter === label ? null : label)} className={`min-h-11 rounded-full border px-4 text-sm ${labelFilter === label ? 'border-sky-500 bg-sky-50 dark:bg-sky-950' : 'border-zinc-200 dark:border-zinc-700'}`}>{label} · {count}</button>)}</div></>}
          <button onClick={() => setShowMobileFilters(false)} className="mt-6 min-h-12 w-full rounded-full bg-zinc-900 font-medium text-white dark:bg-white dark:text-black">Show {filtered.length} torrents</button>
        </section>
      </div>}
      <AddTorrentModal open={showAdd} droppedFiles={droppedFiles} onClose={() => { setShowAdd(false); setDroppedFiles([]) }} />
      <RemoveTorrentModal open={removeOpen} count={selected.size} busy={removeBusy} onClose={() => setRemoveOpen(false)} onConfirm={confirmRemove} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <CommandPalette open={showPalette} onClose={() => setShowPalette(false)} torrents={filtered || []} onPickTorrent={(h) => { selectOnly(h); setDetailHash(h) }} actions={[
        { id: 'palette', label: 'Toggle Command Palette', hotkey: '⌘K', section: 'Actions', run: () => setShowPalette((v) => !v) },
        { id: 'add', label: 'Add Torrent...', hotkey: 'A', section: 'Actions', run: () => setShowAdd(true) },
        { id: 'settings', label: 'Open Settings', section: 'Actions', run: () => setShowSettings(true) },
        { id: 'pause', label: `Pause selected (${selected.size})`, section: 'Actions', run: () => handleAction('pause') },
        { id: 'resume', label: `Resume selected (${selected.size})`, section: 'Actions', run: () => handleAction('resume') },
        { id: 'remove', label: `Remove selected (${selected.size})`, section: 'Actions', run: () => handleAction('remove') },
        { id: 'recheck', label: `Force recheck (${selected.size})`, section: 'Actions', run: () => handleAction('recheck') },
        { id: 'clear', label: 'Clear all filters', section: 'Actions', run: () => { setTrackerFilter(null); setLabelFilter(null); setFilter('All'); setSearch('') } },
      ]} />
    </div>
  )
}
