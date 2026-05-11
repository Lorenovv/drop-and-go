import { formatBytes } from '../utils/fileTransfer.js'

export default function ProgressBar({ label, name, current, total }) {
  const safeTotal = total > 0 ? total : 1
  const percent = Math.min(100, Math.round((current / safeTotal) * 100))
  return (
    <div className="rounded-xl glass px-3 py-2 text-xs text-white/80">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="truncate">
          <span className="opacity-60 mr-1">{label}:</span>
          <span className="font-medium">{name}</span>
        </span>
        <span className="tabular-nums shrink-0 text-white/70">
          {formatBytes(current)} / {formatBytes(total)} · {percent}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 transition-[width] duration-150"
          style={{ width: percent + '%' }}
        />
      </div>
    </div>
  )
}
