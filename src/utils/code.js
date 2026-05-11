// Generates a friendly room code in the format XXX-XXX using a safe alphabet
// (no easily confused characters like 0/O, 1/I/L). Derives bytes from
// `crypto.randomUUID()` (or `crypto.getRandomValues` fallback) so the code is
// uniformly distributed and short enough to read aloud.

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ' // 31 chars, ambiguous removed
const PREFIX = 'dg-' // Trystero room id namespacing

function randomBytes(length) {
  const buf = new Uint8Array(length)
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    crypto.getRandomValues(buf)
  } else {
    for (let i = 0; i < length; i++) {
      buf[i] = Math.floor(Math.random() * 256)
    }
  }
  return buf
}

export function generateRoomCode() {
  const bytes = randomBytes(6)
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
    if (i === 2) out += '-'
  }
  return out
}

export function normalizeCode(raw) {
  if (!raw) return ''
  const clean = raw
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-+/g, '-')
  return clean
}

export function isValidCode(code) {
  return /^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(normalizeCode(code))
}

// Trystero room id derived from the human-friendly code so both sides land
// in the same WebRTC room.
export function codeToRoomId(code) {
  return PREFIX + normalizeCode(code).toLowerCase()
}
