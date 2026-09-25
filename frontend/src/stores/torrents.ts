
import { create } from 'zustand'

type Torrent = { hash: string; name: string; state: string; progress: number; total_wanted: number; download_payload_rate: number; upload_payload_rate: number; eta: number; ratio: number; tracker_host?: string }

interface State {
  filter: string
  selected: Set<string>
  setFilter: (f: string) => void
  toggleSelect: (h: string) => void
  selectOnly: (h: string) => void
  clearSelect: () => void
}

export const useStore = create<State>((set, get) => ({
  filter: 'All',
  selected: new Set(),
  setFilter: (f) => set({ filter: f }),
  toggleSelect: (h) => { const s = new Set(get().selected); s.has(h) ? s.delete(h) : s.add(h); set({ selected: s }) },
  selectOnly: (h) => set({ selected: new Set([h]) }),
  clearSelect: () => set({ selected: new Set() })
}))
