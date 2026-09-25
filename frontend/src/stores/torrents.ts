
import { create } from 'zustand'

interface State {
  filter: string
  search: string
  trackerFilter: string | null
  labelFilter: string | null
  selected: Set<string>
  setFilter: (f: string) => void
  setSearch: (s: string) => void
  setTrackerFilter: (t: string | null) => void
  setLabelFilter: (l: string | null) => void
  toggleSelect: (h: string) => void
  selectOnly: (h: string) => void
  clearSelect: () => void
  selectMany: (hashes: string[]) => void
}

export const useStore = create<State>((set, get) => ({
  filter: 'All',
  search: '',
  trackerFilter: null,
  labelFilter: null,
  selected: new Set(),
  setFilter: (f) => set({ filter: f }),
  setSearch: (s) => set({ search: s }),
  setTrackerFilter: (t) => set({ trackerFilter: t }),
  setLabelFilter: (l) => set({ labelFilter: l }),
  toggleSelect: (h) => { const s = new Set(get().selected); s.has(h) ? s.delete(h) : s.add(h); set({ selected: s }) },
  selectOnly: (h) => set({ selected: new Set([h]) }),
  clearSelect: () => set({ selected: new Set() }),
  selectMany: (hashes) => set({ selected: new Set(hashes) }),
}))
