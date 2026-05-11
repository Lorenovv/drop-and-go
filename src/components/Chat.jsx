import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Message from './Message.jsx'
import ProgressBar from './ProgressBar.jsx'

export default function Chat({
  disabled,
  messages,
  peerTyping,
  outgoing,
  incoming,
  onSendText,
  onSendFiles,
  onTyping,
  onClear,
}) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)
  const prevMessagesLen = useRef(0)
  const audioCtxRef = useRef(null)

  const outgoingList = Object.values(outgoing)
  const incomingList = Object.values(incoming)

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, outgoingList.length, incomingList.length, peerTyping])

  useEffect(() => {
    if (messages.length > prevMessagesLen.current) {
      const last = messages[messages.length - 1]
      if (last && last.from === 'peer' && document.hidden) {
        try {
          if (!audioCtxRef.current) {
            const Ctx = window.AudioContext || window.webkitAudioContext
            if (Ctx) audioCtxRef.current = new Ctx()
          }
          const ctx = audioCtxRef.current
          if (ctx) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.value = 880
            gain.gain.setValueAtTime(0.0001, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(
              0.15,
              ctx.currentTime + 0.01,
            )
            gain.gain.exponentialRampToValueAtTime(
              0.0001,
              ctx.currentTime + 0.25,
            )
            osc.connect(gain).connect(ctx.destination)
            osc.start()
            osc.stop(ctx.currentTime + 0.3)
          }
          if (navigator.vibrate) navigator.vibrate(60)
        } catch {
          // ignore
        }
      }
    }
    prevMessagesLen.current = messages.length
  }, [messages])

  const submit = useCallback(
    (e) => {
      if (e) e.preventDefault()
      if (disabled) return
      const ok = onSendText(text)
      if (ok) setText('')
    },
    [disabled, onSendText, text],
  )

  const handleFiles = useCallback(
    (files) => {
      if (!files || files.length === 0) return
      onSendFiles(Array.from(files))
    },
    [onSendFiles],
  )

  const onPickFile = useCallback(
    (e) => {
      handleFiles(e.target.files)
      e.target.value = ''
    },
    [handleFiles],
  )

  const onPaste = useCallback(
    (e) => {
      if (disabled) return
      const items = e.clipboardData?.files
      if (items && items.length > 0) {
        e.preventDefault()
        handleFiles(items)
      }
    },
    [disabled, handleFiles],
  )

  const onDragOver = useCallback(
    (e) => {
      if (disabled) return
      e.preventDefault()
      setDragOver(true)
    },
    [disabled],
  )

  const onDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      if (disabled) return
      handleFiles(e.dataTransfer.files)
    },
    [disabled, handleFiles],
  )

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        submit()
      } else if (onTyping) {
        onTyping()
      }
    },
    [onTyping, submit],
  )

  return (
    <section
      className={
        'relative flex flex-col rounded-3xl glass-strong overflow-hidden min-h-[320px] sm:min-h-[420px] ' +
        (disabled ? 'opacity-60 pointer-events-none select-none' : '')
      }
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {dragOver && !disabled && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-500/15 border-2 border-dashed border-blue-300/70 rounded-3xl text-blue-100 text-lg font-medium pointer-events-none backdrop-blur-md">
          {t('chat.dropHere')}
        </div>
      )}

      <div
        ref={scrollRef}
        className="chat-scroll flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-2"
      >
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-white/30 text-sm">
            {t('chat.placeholder')}
          </div>
        )}
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}

        {peerTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-white/10 px-3 py-2 text-sm text-white/70 inline-flex items-center gap-1 backdrop-blur">
              <span>{t('chat.typing')}</span>
              <span className="inline-flex gap-0.5 ml-1">
                <span className="typing-dot">.</span>
                <span className="typing-dot">.</span>
                <span className="typing-dot">.</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {(outgoingList.length > 0 || incomingList.length > 0) && (
        <div className="px-3 sm:px-4 pb-2 space-y-1.5">
          {outgoingList.map((tx) => (
            <ProgressBar
              key={'out-' + tx.id}
              label={t('chat.sending')}
              name={tx.name}
              current={tx.sent}
              total={tx.total}
            />
          ))}
          {incomingList.map((tx) => (
            <ProgressBar
              key={'in-' + tx.id}
              label={t('chat.receiving')}
              name={tx.name}
              current={tx.received}
              total={tx.total}
            />
          ))}
        </div>
      )}

      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-white/10 bg-black/30 px-2 py-2"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-xl px-2.5 py-2 text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
          aria-label={t('chat.attach')}
          title={t('chat.attach')}
        >
          <PaperclipIcon />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={onPickFile}
        />
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (onTyping) onTyping()
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={t('chat.placeholder')}
          // `min-w-0` lets the input shrink below its intrinsic 20-char
          // width so the row stays inside the chat panel on small phones,
          // where the buttons + gaps already eat ~150 px of the row.
          className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm placeholder:text-white/30 outline-none focus:border-blue-400 transition"
        />
        <button
          type="submit"
          className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-400 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!text.trim()}
          aria-label={t('chat.send')}
        >
          <SendIcon />
          <span className="hidden sm:inline">{t('chat.send')}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t('chat.clearConfirm'))) onClear()
          }}
          className="shrink-0 rounded-xl px-2.5 py-2 text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
          aria-label={t('chat.clear')}
          title={t('chat.clear')}
        >
          <FireIcon />
        </button>
      </form>
    </section>
  )
}

function PaperclipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 12 12 20.5a5 5 0 1 1-7.07-7.07L13 5.36a3.5 3.5 0 0 1 4.95 4.95l-8.06 8.06a2 2 0 0 1-2.83-2.83l7.36-7.36"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12 4 4l3 8-3 8 17-8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M7 12h13" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function FireIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3s4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C10.5 7 11 5 12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 16a3 3 0 0 0 6 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}
