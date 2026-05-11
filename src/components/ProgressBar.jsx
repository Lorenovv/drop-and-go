import { formatBytes } from '../utils/fileTransfer.js'

export default function ProgressBar({ label, name, current, total }) {
  const safeTotal = total > 0 ? total : 1
  const percent = Math.min(100, Math.round((current / safeTotal) * 100))
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="truncate">
          <span className="opacity-60 mr-1">{label}:</span>
          <span className="font-medium">{name}</span>
        </span>
        <span className="tabular-nums shrink-0">
          {formatBytes(current)} / {formatBytes(total)} · {percent}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-blue-500 transition-[width] duration-150"
          style={{ width: percent + '%' }}
        />
      </div>
    </div>
  )
}
