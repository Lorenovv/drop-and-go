// File transfer helpers. PeerJS DataChannel can stall on single messages that
// exceed ~16 MiB, so we split files into chunks and stream them as a sequence
// of `file-chunk` messages bracketed by `file-meta` / `file-end` envelopes.

export const CHUNK_SIZE = 64 * 1024 // 64 KiB per chunk
export const MAX_FILE_BYTES = 500 * 1024 * 1024 // 500 MB hard limit

let _idCounter = 0

export function nextTransferId() {
  _idCounter += 1
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 8) +
    '-' +
    _idCounter.toString(36)
  )
}

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

export async function readFileAsArrayBuffer(file) {
  return await file.arrayBuffer()
}

/**
 * Stream a file over a PeerJS DataConnection as chunks. Returns the transfer
 * id and total chunk count. Invokes `onProgress(sent, total)` after each chunk.
 *
 * Wire format:
 *   { type: 'file-meta',  id, name, size, mime, totalChunks }
 *   { type: 'file-chunk', id, index, data: ArrayBuffer }
 *   { type: 'file-end',   id }
 */
export async function sendFile(connection, file, onProgress) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('FILE_TOO_LARGE')
  }
  const id = nextTransferId()
  const buffer = await readFileAsArrayBuffer(file)
  const totalChunks = Math.max(1, Math.ceil(buffer.byteLength / CHUNK_SIZE))

  connection.send({
    type: 'file-meta',
    id,
    name: file.name,
    size: file.size,
    mime: file.type || 'application/octet-stream',
    totalChunks,
  })

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, buffer.byteLength)
    const slice = buffer.slice(start, end)
    connection.send({ type: 'file-chunk', id, index: i, data: slice })
    if (onProgress) onProgress(end, buffer.byteLength)
    // Yield to the event loop to keep the UI responsive and let the
    // underlying DataChannel drain its send buffer between chunks.
    if (i % 8 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  connection.send({ type: 'file-end', id })
  return { id, totalChunks }
}

/**
 * Re-assembles incoming chunked file transfers. Call `handleMeta`, `handleChunk`
 * and `handleEnd` from the connection's `data` handler.
 */
export function createReceiver() {
  const transfers = new Map()

  function handleMeta(msg) {
    transfers.set(msg.id, {
      id: msg.id,
      name: msg.name,
      size: msg.size,
      mime: msg.mime,
      totalChunks: msg.totalChunks,
      received: 0,
      chunks: new Array(msg.totalChunks),
    })
    return transfers.get(msg.id)
  }

  function handleChunk(msg) {
    const t = transfers.get(msg.id)
    if (!t) return null
    if (!t.chunks[msg.index]) {
      t.chunks[msg.index] = msg.data
      t.received += msg.data.byteLength
    }
    return t
  }

  function handleEnd(msg) {
    const t = transfers.get(msg.id)
    if (!t) return null
    const blob = new Blob(t.chunks, { type: t.mime })
    const url = URL.createObjectURL(blob)
    transfers.delete(msg.id)
    return { ...t, blob, url }
  }

  function abortAll() {
    transfers.clear()
  }

  return { handleMeta, handleChunk, handleEnd, abortAll }
}
