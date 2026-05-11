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

  // Auto-scroll to bottom on new message
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, outgoingList.length, incomingList.length, peerTyping])

  // Play a soft beep on new peer messages when tab is hidden, using
  // Web Audio API so we don't need to ship an audio file.
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
      // reset so picking same file again triggers change
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
        'relative flex flex-col rounded-[1.75rem] glass overflow-hidden min-h-[26rem] ' +
        (disabled ? 'opacity-50 pointer-events-none select-none' : '')
      }
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {dragOver && !disabled && (
        <div className="absolute inset-2 z-10 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[color:var(--color-accent)] bg-[color:var(--color-accent-dim)] text-[color:var(--color-fg)] text-base font-medium pointer-events-none backdrop-blur">
          <DropIcon />
          <span className="mt-2">{t('chat.dropHere')}</span>
        </div>
      )}

      <div
        ref={scrollRef}
        className="chat-scroll flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-2.5"
      >
        {messages.length === 0 && (
          <div className="h-full min-h-[16rem] flex flex-col items-center justify-center text-center gap-2 text-[color:var(--color-fg-faint)]">
            <span className="display text-3xl text-[color:var(--color-fg-soft)]">
              {t('chat.emptyTitle')}
            </span>
            <span className="text-sm">{t('chat.emptySub')}</span>
          </div>
        )}
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}

        {peerTyping && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-md px-3 py-2 text-sm text-[color:var(--color-fg-muted)] inline-flex items-center gap-1">
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
        <div className="px-4 sm:px-5 pb-3 space-y-2">
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
        className="flex items-center gap-2 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg-soft)]/60 px-3 py-3"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 grid place-items-center w-10 h-10 rounded-full text-[color:var(--color-fg-muted)] hover:bg-white/5 hover:text-[color:var(--color-fg)] transition cursor-pointer"
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
          className="flex-1 rounded-full bg-transparent px-4 py-2.5 text-[15px] placeholder:text-[color:var(--color-fg-faint)] outline-none"
        />
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t('chat.clearConfirm'))) onClear()
          }}
          className="shrink-0 grid place-items-center w-10 h-10 rounded-full text-[color:var(--color-fg-muted)] hover:bg-white/5 hover:text-[color:var(--color-fg)] transition cursor-pointer"
          aria-label={t('chat.clear')}
          title={t('chat.clear')}
        >
          <TrashIcon />
        </button>
        <button
          type="submit"
          className="shrink-0 grid place-items-center w-10 h-10 rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] hover:brightness-110 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 shadow-[0_10px_24px_-12px_rgba(255,122,82,0.6)]"
          disabled={!text.trim()}
          aria-label={t('chat.send')}
          title={t('chat.send')}
        >
          <SendIcon />
        </button>
      </form>
    </section>
  )
}

function DropIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v14" />
      <path d="m6 11 6 6 6-6" />
      <path d="M4 21h16" />
    </svg>
  )
}

function PaperclipIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 1 1-2.83-2.83l8.49-8.49" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 11 18-8-8 18-2-8z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  )
}
