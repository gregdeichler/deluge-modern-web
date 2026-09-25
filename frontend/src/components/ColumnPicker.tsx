import { ALL_COLUMNS, useStore } from '../stores/torrents'
import { useState } from 'react'

export default function ColumnPicker() {
  const { visibleColumns, toggleColumn, setVisibleColumns } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="px-3 py-1.5 rounded-full text-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700">Columns ▾</button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-2xl p-2 z-20">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 px-2 py-1">Visible columns</p>
          {ALL_COLUMNS.map((c) => (
            <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-sm cursor-pointer">
              <input type="checkbox" checked={visibleColumns.includes(c.id)} onChange={() => toggleColumn(c.id)} className="rounded" />
              {c.label}
            </label>
          ))}
          <div className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
            <button onClick={() => setVisibleColumns(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))} className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-800 rounded">Reset</button>
            <button onClick={() => setOpen(false)} className="text-xs px-2 py-1 bg-zinc-900 text-white dark:bg-white dark:text-black rounded">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
