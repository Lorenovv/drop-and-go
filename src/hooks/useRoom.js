import { useCallback, useEffect, useRef, useState } from 'react'
import Peer from 'peerjs'
import { codeToPeerId } from '../utils/code.js'
import { PEER_CONFIG } from '../utils/peerConfig.js'
import {
  createReceiver,
  sendFile,
  MAX_FILE_BYTES,
} from '../utils/fileTransfer.js'

// Possible status values:
// - 'idle'         : initial state, before Peer is constructed
// - 'initializing' : Peer is registering with the signaling server
// - 'waiting'      : (host only) signaling open, waiting for guest
// - 'connecting'   : (guest only) attempting to open DataConnection
// - 'connected'    : DataConnection is open both ways
// - 'reconnecting' : (guest only) lost the connection, retrying
// - 'closed'       : remote side ended the session
// - 'error'        : fatal error (room not found, signaling failed, etc.)

const TYPING_DEBOUNCE_MS = 1500
const GUEST_RECONNECT_DELAY_MS = 1500
const GUEST_MAX_RECONNECT_ATTEMPTS = 5

export function useRoom({ mode, code }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [peerTyping, setPeerTyping] = useState(false)
  // Map of transferId -> { id, name, size, sent, total } for outgoing transfers
  const [outgoing, setOutgoing] = useState({})
  // Map of transferId -> { id, name, size, received, total } for incoming
  const [incoming, setIncoming] = useState({})

  const peerRef = useRef(null)
  const connectionRef = useRef(null)
  const receiverRef = useRef(createReceiver())
  const typingTimerRef = useRef(null)
  const peerTypingTimerRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const closedByUserRef = useRef(false)
  // Forward ref so `setConnection` can call `tryReconnect` even though it's
  // declared later in the hook body.
  const tryReconnectRef = useRef(() => {})

  const appendMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  const setConnection = useCallback(
    (conn) => {
      connectionRef.current = conn
      if (!conn) return

      conn.on('open', () => {
        reconnectAttemptsRef.current = 0
        setStatus('connected')
      })

      conn.on('data', (data) => {
        if (!data || typeof data !== 'object') return
        switch (data.type) {
          case 'text':
            appendMessage({
              id: data.id || crypto.randomUUID(),
              type: 'text',
              from: 'peer',
              content: String(data.content ?? ''),
              ts: Date.now(),
            })
            break
          case 'typing':
            setPeerTyping(true)
            if (peerTypingTimerRef.current) {
              clearTimeout(peerTypingTimerRef.current)
            }
            peerTypingTimerRef.current = setTimeout(
              () => setPeerTyping(false),
              TYPING_DEBOUNCE_MS + 500,
            )
            break
          case 'clear':
            setMessages([
              {
                id: crypto.randomUUID(),
                type: 'system',
                key: 'chat.cleared',
                ts: Date.now(),
              },
            ])
            break
          case 'file-meta': {
            const t = receiverRef.current.handleMeta(data)
            if (t) {
              setIncoming((prev) => ({
                ...prev,
                [t.id]: {
                  id: t.id,
                  name: t.name,
                  size: t.size,
                  received: 0,
                  total: t.size,
                },
              }))
            }
            break
          }
          case 'file-chunk': {
            const t = receiverRef.current.handleChunk(data)
            if (t) {
              setIncoming((prev) => ({
                ...prev,
                [t.id]: {
                  id: t.id,
                  name: t.name,
                  size: t.size,
                  received: t.received,
                  total: t.size,
                },
              }))
            }
            break
          }
          case 'file-end': {
            const t = receiverRef.current.handleEnd(data)
            if (t) {
              setIncoming((prev) => {
                const next = { ...prev }
                delete next[data.id]
                return next
              })
              appendMessage({
                id: t.id,
                type: 'file',
                from: 'peer',
                name: t.name,
                size: t.size,
                mime: t.mime,
                url: t.url,
                ts: Date.now(),
              })
            }
            break
          }
          default:
            break
        }
      })

      conn.on('close', () => {
        connectionRef.current = null
        if (closedByUserRef.current) return
        if (mode === 'guest') {
          tryReconnectRef.current()
        } else {
          setStatus('waiting')
        }
      })

      conn.on('error', (err) => {
        console.warn('DataConnection error:', err)
      })
    },
    [appendMessage, mode],
  )

  const tryReconnect = useCallback(() => {
    if (closedByUserRef.current) return
    if (reconnectAttemptsRef.current >= GUEST_MAX_RECONNECT_ATTEMPTS) {
      setStatus('closed')
      return
    }
    setStatus('reconnecting')
    reconnectAttemptsRef.current += 1
    setTimeout(() => {
      const peer = peerRef.current
      if (!peer || peer.destroyed) {
        setStatus('closed')
        return
      }
      const conn = peer.connect(codeToPeerId(code), { reliable: true })
      setConnection(conn)
    }, GUEST_RECONNECT_DELAY_MS)
  }, [code, setConnection])

  // Keep the forward ref in sync so `setConnection`'s close handler can call
  // the latest `tryReconnect`. Done in an effect so React's strict mode
  // ("no ref writes during render") is satisfied.
  useEffect(() => {
    tryReconnectRef.current = tryReconnect
  }, [tryReconnect])

  useEffect(() => {
    if (!mode || (mode === 'guest' && !code)) return undefined

    closedByUserRef.current = false
    setStatus('initializing')
    setError(null)

    const peerId = mode === 'host' ? codeToPeerId(code) : undefined
    const peer = new Peer(peerId, PEER_CONFIG)
    peerRef.current = peer

    peer.on('open', () => {
      if (mode === 'host') {
        setStatus('waiting')
      } else {
        const conn = peer.connect(codeToPeerId(code), { reliable: true })
        setStatus('connecting')
        setConnection(conn)
      }
    })

    peer.on('connection', (conn) => {
      if (mode !== 'host') return
      // Replace any prior connection
      if (connectionRef.current && connectionRef.current.open) {
        try {
          connectionRef.current.close()
        } catch {
          // ignore
        }
      }
      setConnection(conn)
    })

    peer.on('error', (err) => {
      console.warn('Peer error:', err)
      const type = err && err.type
      if (type === 'unavailable-id' && mode === 'host') {
        setError('ROOM_BUSY')
        setStatus('error')
        return
      }
      if (
        (type === 'peer-unavailable' || type === 'invalid-id') &&
        mode === 'guest'
      ) {
        setError('ROOM_NOT_FOUND')
        setStatus('error')
        return
      }
      if (type === 'network' || type === 'disconnected') {
        if (mode === 'guest') {
          tryReconnectRef.current()
          return
        }
      }
      if (type === 'server-error' || type === 'socket-error') {
        setError('SIGNALING_ERROR')
        setStatus('error')
      }
    })

    peer.on('disconnected', () => {
      // Signaling lost — PeerJS will auto-reconnect to its signaling server.
      // The DataConnection's `close` handler is what drives our UI status
      // transitions, so we just nudge the signaling layer back up here.
      try {
        peer.reconnect()
      } catch {
        // ignore
      }
    })

    const onBeforeUnload = () => {
      closedByUserRef.current = true
      try {
        if (connectionRef.current) connectionRef.current.close()
        peer.destroy()
      } catch {
        // ignore
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    const receiver = receiverRef.current

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      closedByUserRef.current = true
      try {
        if (connectionRef.current) connectionRef.current.close()
      } catch {
        // ignore
      }
      try {
        peer.destroy()
      } catch {
        // ignore
      }
      peerRef.current = null
      connectionRef.current = null
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      if (peerTypingTimerRef.current) clearTimeout(peerTypingTimerRef.current)
      receiver.abortAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, code])

  const sendText = useCallback(
    (text) => {
      const conn = connectionRef.current
      if (!conn || !conn.open) return false
      const trimmed = String(text ?? '').trim()
      if (!trimmed) return false
      const id = crypto.randomUUID()
      conn.send({ type: 'text', id, content: trimmed })
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
    const conn = connectionRef.current
    if (!conn || !conn.open) return
    if (typingTimerRef.current) return // debounce
    conn.send({ type: 'typing' })
    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null
    }, TYPING_DEBOUNCE_MS)
  }, [])

  const sendFiles = useCallback(
    async (files) => {
      const conn = connectionRef.current
      if (!conn || !conn.open) return
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
        try {
          const localUrl = URL.createObjectURL(file)
          appendMessage({
            id: transferId,
            type: 'file',
            from: 'me',
            name: file.name,
            size: file.size,
            mime: file.type || 'application/octet-stream',
            url: localUrl,
            ts: Date.now(),
          })
          await sendFile(conn, file, (sent, total) => {
            setOutgoing((prev) => ({
              ...prev,
              [transferId]: {
                id: transferId,
                name: file.name,
                size: file.size,
                sent,
                total,
              },
            }))
          })
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
    const conn = connectionRef.current
    if (conn && conn.open) {
      conn.send({ type: 'clear' })
    }
    setMessages([])
  }, [])

  const endSession = useCallback(() => {
    closedByUserRef.current = true
    try {
      if (connectionRef.current) connectionRef.current.close()
    } catch {
      // ignore
    }
    try {
      if (peerRef.current) peerRef.current.destroy()
    } catch {
      // ignore
    }
    setStatus('closed')
  }, [])

  return {
    status,
    error,
    messages,
    peerTyping,
    outgoing,
    incoming,
    sendText,
    sendTyping,
    sendFiles,
    clearChat,
    endSession,
  }
}
