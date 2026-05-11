// File transfer helpers. Trystero handles WebRTC chunking and progress
// internally, so this module only carries the size cap and a byte formatter
// used by the UI.

export const MAX_FILE_BYTES = 500 * 1024 * 1024 // 500 MB hard limit

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}
