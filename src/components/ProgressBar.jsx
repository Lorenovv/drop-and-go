import { formatBytes } from '../utils/fileTransfer.js'

export default function ProgressBar({ label, name, current, total }) {
  const safeTotal = total > 0 ? total : 1
  const percent = Math.min(100, Math.round((current / safeTotal) * 100))
  return (
    <div className="glass rounded-xl px-3 py-2.5 text-xs text-[color:var(--color-fg-soft)]">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="truncate">
          <span className="text-[color:var(--color-fg-faint)] mr-1.5 uppercase tracking-widest text-[10px]">
            {label}
          </span>
          <span className="font-medium text-[color:var(--color-fg)]">
            {name}
          </span>
        </span>
        <span className="mono tabular-nums shrink-0 text-[color:var(--color-fg-muted)]">
          {formatBytes(current)} / {formatBytes(total)} · {percent}%
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-[color:var(--color-accent)] transition-[width] duration-150"
          style={{ width: percent + '%' }}
        />
      </div>
    </div>
  )
}
