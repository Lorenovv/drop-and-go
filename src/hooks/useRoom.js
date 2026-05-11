import { useCallback, useEffect, useRef, useState } from 'react'
import { getRelaySockets, joinRoom, selfId } from '@trystero-p2p/nostr'
import { codeToRoomId } from '../utils/code.js'
import { MAX_FILE_BYTES } from '../utils/fileTransfer.js'

// useRoom — owns the WebRTC session for either side of a 1:1 chat.
//
// Returns a stable interface independent of the underlying P2P library so the
// pages don't need to know about Trystero / PeerJS / etc.
//
// `status` values:
// - 'idle'         : not yet initialized (e.g. invalid code)
// - 'initializing' : joining the discovery network
// - 'waiting'      : (host) joined the room, no peer yet
// - 'connecting'   : (guest) joined the room, waiting for the host to appear
// - 'connected'    : peer is in the room and the data channel is open
// - 'reconnecting' : peer left briefly, waiting for them to come back
// - 'closed'       : peer ended the session
// - 'error'        : fatal error (room not found / signaling failed)

const TYPING_DEBOUNCE_MS = 1500
// How long a guest waits for the host to appear in the room before deciding
// the room is dead. The torrent-tracker strategy normally peers up in 1-3s, so
// 18s is generous without making real outages feel slow.
const GUEST_INITIAL_TIMEOUT_MS = 18000
// How long we wait for a peer to come back after they disconnect before
// declaring the session closed. Brief network blips (Wi-Fi handoff, screen
// lock) usually recover well inside this window.
const PEER_RECONNECT_GRACE_MS = 8000

// Unique app identifier so we don't collide with anyone else using Trystero
// nostr relays. Tied to the protocol version.
const APP_ID = 'drop-and-go-v1'

// Curated Nostr relays known to be globally reachable and stable. Trystero's
// default list is ~70 mostly-niche relays of varying quality, and it picks
// only 5 via a deterministic shuffle — when one side's network can't reach
// a few of those 5 (cellular carriers often block obscure hosts), peers can
// end up with zero overlap and never discover each other. We replace the
// default selection with this list and subscribe to *all* of them, so peers
// only need a single working relay in common to meet.
const RELAY_URLS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.primal.net',
  'wss://nostr.mom',
  'wss://offchain.pub',
  'wss://relay.snort.social',
  'wss://nostr-pub.wellorder.net',
  'wss://nostr.bitcoiner.social',
  'wss://relay.nostr.bg',
  'wss://nostr.fmt.wiz.biz',
  'wss://relay.current.fyi',
]

// Trystero ships with public STUN only. Mobile carriers usually put devices
// behind symmetric NAT, so STUN alone is not enough — without TURN the ICE
// negotiation fails silently and the connection just hangs. We hand it the
// Open Relay Project's free TURN endpoints (the same set the old PeerJS
// config used) so we have UDP, TLS, and TCP fallbacks for hostile networks.
const TURN_SERVERS = [
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turns:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

// Snapshot how many of our Trystero relay sockets are actually open. Used to
// distinguish "the network can't reach signalling at all" from "signalling is
// fine but no peer is in the room".
function summarizeRelays() {
  let sockets = {}
  try {
    sockets = getRelaySockets() || {}
  } catch {
    sockets = {}
  }
  const urls = Object.keys(sockets)
  const openCount = urls.filter((u) => sockets[u]?.readyState === 1).length
  return { openCount, totalCount: urls.length, urls }
}

export function useRoom({ mode, code }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [peerTyping, setPeerTyping] = useState(false)
  // Map of transferId -> { id, name, size, sent, total } for outgoing transfers
  const [outgoing, setOutgoing] = useState({})
  // Map of transferId -> { id, name, size, received, total } for incoming
  const [incoming, setIncoming] = useState({})

  const roomRef = useRef(null)
  const actionsRef = useRef(null)
  const peerIdRef = useRef(null)
  const typingTimerRef = useRef(null)
  const peerTypingTimerRef = useRef(null)
  const initialTimerRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const closedByUserRef = useRef(false)

  const appendMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  const clearInitialTimer = useCallback(() => {
    if (initialTimerRef.current) {
      clearTimeout(initialTimerRef.current)
      initialTimerRef.current = null
    }
  }, [])

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mode || !code) return undefined

    closedByUserRef.current = false
    setStatus('initializing')
    setError(null)
    setMessages([])
    setPeerTyping(false)
    setOutgoing({})
    setIncoming({})
    peerIdRef.current = null

    const roomId = codeToRoomId(code)
    console.info('[useRoom] joining', { mode, roomId, relays: RELAY_URLS.length })

    let room
    try {
      room = joinRoom(
        {
          appId: APP_ID,
          turnConfig: TURN_SERVERS,
          relayConfig: { urls: RELAY_URLS },
        },
        roomId,
      )
    } catch (err) {
      console.warn('joinRoom failed:', err)
      setError('SIGNALING_ERROR')
      setStatus('error')
      return undefined
    }
    roomRef.current = room

    // Once we've actually subscribed to peer events, transition to the
    // mode-specific waiting state. The room is "live" at this point, but no
    // peer has appeared yet.
    setStatus(mode === 'host' ? 'waiting' : 'connecting')

    // Log relay state shortly after joinRoom returns so we can see, for both
    // host and guest, whether the device actually managed to subscribe to any
    // signalling relay. If nothing comes online, no QR / no code can ever
    // help.
    const relayProbeTimer = setTimeout(() => {
      const summary = summarizeRelays()
      console.info('[useRoom] relay state @ 5s', summary)
    }, 5000)

    if (mode === 'guest') {
      initialTimerRef.current = setTimeout(() => {
        if (peerIdRef.current) return
        // No host has shown up before the timeout. Snapshot the relay state
        // so we can distinguish "signalling is dead on this network" (no
        // relays open) from "signalling is fine but no host in this room"
        // (some relays open, but nobody's listening on the room id).
        const summary = summarizeRelays()
        console.warn('[useRoom] guest timeout', summary)
        setError(summary.openCount === 0 ? 'SIGNALING_ERROR' : 'ROOM_NOT_FOUND')
        setStatus('error')
      }, GUEST_INITIAL_TIMEOUT_MS)
    }

    const [sendText, getText] = room.makeAction('text')
    const [sendTyping, getTyping] = room.makeAction('typing')
    const [sendClear, getClear] = room.makeAction('clear')
    const [sendFileRaw, getFileRaw, onFileProgress] = room.makeAction('file')

    actionsRef.current = {
      sendText,
      sendTyping,
      sendClear,
      sendFileRaw,
    }

    // Mark the session as connected. Normally driven by Trystero's
    // `onPeerJoin`, but the host side has occasionally seen the handshake
    // event get missed while still receiving real action data over the
    // already-open DataChannel — leaving the UI stuck in "waiting" while
    // messages from the guest land in the chat. Any inbound action implies
    // an active peer, so action callbacks call this too as a safety net.
    const markPeerActive = (peerId) => {
      if (peerIdRef.current && peerId !== peerIdRef.current) return
      const wasNew = !peerIdRef.current
      peerIdRef.current = peerId
      clearInitialTimer()
      clearReconnectTimer()
      setStatus('connected')
      if (wasNew) {
        console.info('[useRoom] peer active', peerId)
      }
    }

    getText((data, peerId) => {
      if (!data || typeof data !== 'object') return
      if (peerIdRef.current && peerId !== peerIdRef.current) return
      markPeerActive(peerId)
      appendMessage({
        id: data.id || crypto.randomUUID(),
        type: 'text',
        from: 'peer',
        content: String(data.content ?? ''),
        ts: Date.now(),
      })
    })

    getTyping((_data, peerId) => {
      if (peerIdRef.current && peerId !== peerIdRef.current) return
      markPeerActive(peerId)
      setPeerTyping(true)
      if (peerTypingTimerRef.current) {
        clearTimeout(peerTypingTimerRef.current)
      }
      peerTypingTimerRef.current = setTimeout(
        () => setPeerTyping(false),
        TYPING_DEBOUNCE_MS + 500,
      )
    })

    getClear((_data, peerId) => {
      if (peerIdRef.current && peerId !== peerIdRef.current) return
      markPeerActive(peerId)
      setMessages([
        {
          id: crypto.randomUUID(),
          type: 'system',
          key: 'chat.cleared',
          ts: Date.now(),
        },
      ])
    })

    getFileRaw((data, peerId, metadata) => {
      if (peerIdRef.current && peerId !== peerIdRef.current) return
      markPeerActive(peerId)
      const meta = metadata || {}
      const blob = new Blob([data], {
        type: meta.mime || 'application/octet-stream',
      })
      const url = URL.createObjectURL(blob)
      setIncoming((prev) => {
        const next = { ...prev }
        delete next[meta.id]
        return next
      })
      appendMessage({
        id: meta.id || crypto.randomUUID(),
        type: 'file',
        from: 'peer',
        name: meta.name || 'file',
        size: meta.size || blob.size,
        mime: meta.mime || blob.type,
        url,
        ts: Date.now(),
      })
    })

    onFileProgress((percent, peerId, metadata) => {
      if (peerIdRef.current && peerId !== peerIdRef.current) return
      const meta = metadata || {}
      if (!meta.id || !meta.name || !meta.size) return
      const received = Math.round(meta.size * percent)
      setIncoming((prev) => ({
        ...prev,
        [meta.id]: {
          id: meta.id,
          name: meta.name,
          size: meta.size,
          received,
          total: meta.size,
        },
      }))
    })

    room.onPeerJoin((peerId) => {
      // Third peer joining a 1:1 room — ignore for now. Trystero broadcasts
      // will still reach them, but we won't surface them to the UI.
      if (peerIdRef.current && peerId !== peerIdRef.current) return
      markPeerActive(peerId)
    })

    room.onPeerLeave((peerId) => {
      if (peerId !== peerIdRef.current) return
      // Give the peer a short window to come back (Wi-Fi handoff etc).
      setStatus('reconnecting')
      clearReconnectTimer()
      reconnectTimerRef.current = setTimeout(() => {
        peerIdRef.current = null
        setStatus('closed')
      }, PEER_RECONNECT_GRACE_MS)
    })

    const onBeforeUnload = () => {
      closedByUserRef.current = true
      try {
        room.leave()
      } catch {
        // ignore
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      closedByUserRef.current = true
      clearTimeout(relayProbeTimer)
      clearInitialTimer()
      clearReconnectTimer()
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      if (peerTypingTimerRef.current) clearTimeout(peerTypingTimerRef.current)
      try {
        room.leave()
      } catch {
        // ignore
      }
      roomRef.current = null
      actionsRef.current = null
      peerIdRef.current = null
    }
  }, [mode, code, appendMessage, clearInitialTimer, clearReconnectTimer])

  const sendText = useCallback(
    (text) => {
      const actions = actionsRef.current
      if (!actions || !peerIdRef.current) return false
      const trimmed = String(text ?? '').trim()
      if (!trimmed) return false
      const id = crypto.randomUUID()
      actions.sendText({ id, content: trimmed }, peerIdRef.current)
      appendMessage({
        id,
        type: 'text',
        from: 'me',
        content: trimmed,
        ts: Date.now(),
      })
      return true
    },
    [appendMessage],
  )

  const sendTyping = useCallback(() => {
    const actions = actionsRef.current
    if (!actions || !peerIdRef.current) return
    if (typingTimerRef.current) return // debounce
    actions.sendTyping(1, peerIdRef.current)
    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null
    }, TYPING_DEBOUNCE_MS)
  }, [])

  const sendFiles = useCallback(
    async (files) => {
      const actions = actionsRef.current
      if (!actions || !peerIdRef.current) return
      for (const file of files) {
        if (file.size > MAX_FILE_BYTES) {
          appendMessage({
            id: crypto.randomUUID(),
            type: 'system',
            key: 'chat.fileTooLarge',
            ts: Date.now(),
          })
          continue
        }
        const transferId = crypto.randomUUID()
        const metadata = {
          id: transferId,
          name: file.name,
          size: file.size,
          mime: file.type || 'application/octet-stream',
        }
        setOutgoing((prev) => ({
          ...prev,
          [transferId]: {
            id: transferId,
            name: file.name,
            size: file.size,
            sent: 0,
            total: file.size,
          },
        }))
        const localUrl = URL.createObjectURL(file)
        appendMessage({
          id: transferId,
          type: 'file',
          from: 'me',
          name: file.name,
          size: file.size,
          mime: metadata.mime,
          url: localUrl,
          ts: Date.now(),
        })
        try {
          await actions.sendFileRaw(
            file,
            peerIdRef.current,
            metadata,
            (percent) => {
              const sent = Math.round(file.size * percent)
              setOutgoing((prev) => ({
                ...prev,
                [transferId]: {
                  id: transferId,
                  name: file.name,
                  size: file.size,
                  sent,
                  total: file.size,
                },
              }))
            },
          )
        } catch (err) {
          console.warn('sendFile failed:', err)
        } finally {
          setOutgoing((prev) => {
            const next = { ...prev }
            delete next[transferId]
            return next
          })
        }
      }
    },
    [appendMessage],
  )

  const clearChat = useCallback(() => {
    const actions = actionsRef.current
    if (actions && peerIdRef.current) {
      actions.sendClear(1, peerIdRef.current)
    }
    setMessages([])
  }, [])

  const endSession = useCallback(() => {
    closedByUserRef.current = true
    try {
      if (roomRef.current) roomRef.current.leave()
    } catch {
      // ignore
    }
    peerIdRef.current = null
    setStatus('closed')
  }, [])

  return {
    status,
    error,
    messages,
    peerTyping,
    outgoing,
    incoming,
    selfId,
    sendText,
    sendTyping,
    sendFiles,
    clearChat,
    endSession,
  }
}
