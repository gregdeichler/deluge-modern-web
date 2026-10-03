type Props = {
  count: number
  open: boolean
  busy: boolean
  onClose: () => void
  onConfirm: (removeData: boolean) => void
}

export default function RemoveTorrentModal({ count, open, busy, onClose, onConfirm }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="remove-title">
      <div className="w-[480px] max-w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-6 shadow-2xl">
        <h2 id="remove-title" className="text-lg font-semibold">Remove {count} torrent{count === 1 ? '' : 's'}?</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Choose whether the downloaded files should remain on disk. Removing data cannot be undone.</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button disabled={busy} onClick={onClose} className="px-4 py-2 rounded-full text-sm bg-zinc-200 dark:bg-zinc-800 disabled:opacity-50">Cancel</button>
          <button disabled={busy} onClick={() => onConfirm(false)} className="px-4 py-2 rounded-full text-sm bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50">Keep downloaded data</button>
          <button disabled={busy} onClick={() => onConfirm(true)} className="px-4 py-2 rounded-full text-sm bg-red-700 text-white hover:bg-red-600 disabled:opacity-50">{busy ? 'Removing…' : 'Remove downloaded data'}</button>
        </div>
      </div>
    </div>
  )
}
