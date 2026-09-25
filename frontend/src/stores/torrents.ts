
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SortKey = 'name' | 'total_wanted' | 'progress' | 'download_payload_rate' | 'upload_payload_rate' | 'state' | 'eta' | 'ratio' | 'queue' | 'tracker_host' | 'time_added'
export type SortDir = 'asc' | 'desc'

export type ColumnId = 'name'|'size'|'progress'|'down'|'up'|'state'|'eta'|'ratio'|'tracker'|'added'|'seeds'|'peers'

export interface ColumnDef {
  id: ColumnId
  label: string
  defaultVisible: boolean
  sortKey?: SortKey
  width: string // tailwind grid col width
  minWidth?: number
}

export const ALL_COLUMNS: ColumnDef[] = [
  { id: 'name', label: 'Name', defaultVisible: true, sortKey: 'name', width: '1fr' },
  { id: 'size', label: 'Size', defaultVisible: true, sortKey: 'total_wanted', width: '100px' },
  { id: 'progress', label: 'Progress', defaultVisible: true, sortKey: 'progress', width: '140px' },
  { id: 'down', label: 'Down', defaultVisible: true, sortKey: 'download_payload_rate', width: '90px' },
  { id: 'up', label: 'Up', defaultVisible: true, sortKey: 'upload_payload_rate', width: '90px' },
  { id: 'state', label: 'State', defaultVisible: true, sortKey: 'state', width: '100px' },
  { id: 'eta', label: 'ETA', defaultVisible: true, sortKey: 'eta', width: '80px' },
  { id: 'ratio', label: 'Ratio', defaultVisible: true, sortKey: 'ratio', width: '70px' },
  { id: 'tracker', label: 'Tracker', defaultVisible: false, sortKey: 'tracker_host', width: '140px' },
  { id: 'added', label: 'Added', defaultVisible: false, sortKey: 'time_added', width: '110px' },
  { id: 'seeds', label: 'Seeds', defaultVisible: false, sortKey: 'tracker_host', width: '70px' },
  { id: 'peers', label: 'Peers', defaultVisible: false, sortKey: 'tracker_host', width: '70px' },
]

interface State {
  theme: 'dark' | 'light'
  setTheme: (t: 'dark' | 'light') => void
  toggleTheme: () => void
  filter: string
  search: string
  trackerFilter: string | null
  labelFilter: string | null
  sortKey: SortKey
  sortDir: SortDir
  visibleColumns: ColumnId[]
  selected: Set<string>
  setFilter: (f: string) => void
  setSearch: (s: string) => void
  setTrackerFilter: (t: string | null) => void
  setLabelFilter: (l: string | null) => void
  setSort: (k: SortKey) => void
  setSortExplicit: (k: SortKey, d: SortDir) => void
  toggleColumn: (id: ColumnId) => void
  setVisibleColumns: (ids: ColumnId[]) => void
  toggleSelect: (h: string) => void
  selectOnly: (h: string) => void
  clearSelect: () => void
  selectMany: (hashes: string[]) => void
}

export const useStore = create<State>()(persist((set, get) => ({
  theme: 'dark',
  setTheme: (t) => set({ theme: t }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  filter: 'All',
  search: '',
  trackerFilter: null,
  labelFilter: null,
  sortKey: 'name',
  sortDir: 'asc',
  visibleColumns: ALL_COLUMNS.filter(c=>c.defaultVisible).map(c=>c.id),
  selected: new Set() as Set<string>,
  setFilter: (f) => set({ filter: f }),
  setSearch: (s) => set({ search: s }),
  setTrackerFilter: (t) => set({ trackerFilter: t }),
  setLabelFilter: (l) => set({ labelFilter: l }),
  setSort: (k) => {
    const { sortKey, sortDir } = get()
    if (sortKey===k) set({ sortDir: sortDir==='asc' ? 'desc' : 'asc' })
    else set({ sortKey: k, sortDir: 'asc' })
  },
  setSortExplicit: (k,d) => set({ sortKey: k, sortDir: d }),
  toggleColumn: (id) => {
    const cur = get().visibleColumns
    const next = cur.includes(id) ? cur.filter(c=>c!==id) : [...cur, id]
    // always keep at least name
    if (!next.includes('name')) next.unshift('name' as ColumnId)
    set({ visibleColumns: next })
  },
  setVisibleColumns: (ids) => set({ visibleColumns: ids.length ? ids : ['name'] as ColumnId[] }),
  toggleSelect: (h) => { const s = new Set(get().selected); s.has(h) ? s.delete(h) : s.add(h); set({ selected: s }) },
  selectOnly: (h) => set({ selected: new Set([h]) }),
  clearSelect: () => set({ selected: new Set() }),
  selectMany: (hashes) => set({ selected: new Set(hashes) }),
}), {
  name: 'deluge-modern-store',
  partialize: (s) => ({
    sortKey: s.sortKey, sortDir: s.sortDir, visibleColumns: s.visibleColumns,
    filter: s.filter, theme: s.theme
  }),
  // custom serializer for Set
  storage: {
    getItem: (name) => {
      const v = localStorage.getItem(name)
      return v ? JSON.parse(v) : null
    },
    setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
    removeItem: (name) => localStorage.removeItem(name),
  }
}))
