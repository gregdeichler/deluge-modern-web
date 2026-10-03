import { useEffect, useMemo, useState } from 'react'

function domainFor(host: string) {
  const cleaned = String(host || '').trim().toLowerCase().replace(/^(udp|https?):\/\//, '')
  try { return new URL(`https://${cleaned}`).hostname.replace(/^www\./, '') } catch { return '' }
}

export default function TrackerIcon({ host, size = 20 }: { host: string; size?: number }) {
  const candidates = useMemo(() => {
    const domain = domainFor(host)
    if (!domain) return []
    const root = domain.replace(/^(tracker|announce|open|udp)\./, '')
    return [...new Set([`https://${domain}/favicon.ico`, root !== domain ? `https://${root}/favicon.ico` : '', `https://icons.duckduckgo.com/ip3/${encodeURIComponent(root)}.ico`].filter(Boolean))]
  }, [host])
  const [index, setIndex] = useState(0)
  useEffect(() => setIndex(0), [host])
  const label = domainFor(host).slice(0, 2).toUpperCase() || '↗'
  if (!candidates[index]) return <span aria-label={`${host || 'Unknown'} tracker`} className="grid shrink-0 place-items-center rounded-md bg-zinc-200 text-[9px] font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300" style={{ width: size, height: size }}>{label}</span>
  return <img src={candidates[index]} onError={() => setIndex((value) => value + 1)} alt={`${host} tracker icon`} referrerPolicy="no-referrer" className="shrink-0 rounded-md bg-white object-contain" style={{ width: size, height: size }} />
}
