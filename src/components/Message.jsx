import { useTranslation } from 'react-i18next'
import { formatBytes } from '../utils/fileTransfer.js'

function isImage(mime) {
  return typeof mime === 'string' && mime.startsWith('image/')
}

export default function Message({ message }) {
  const { t } = useTranslation()

  if (message.type === 'system') {
    const text = message.key ? t(message.key) : (message.content ?? '')
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-[color:var(--color-fg-faint)] italic">
          {text}
        </span>
      </div>
    )
  }

  const mine = message.from === 'me'
  const bubbleBase =
    'max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 break-words text-[15px] leading-snug shadow-[0_8px_24px_-18px_rgba(0,0,0,0.7)]'
  const bubbleColor = mine
    ? 'bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] rounded-br-md'
    : 'glass text-[color:var(--color-fg)] rounded-bl-md'

  return (
    <div className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
      <div className={bubbleBase + ' ' + bubbleColor}>
        {message.type === 'text' && (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        {message.type === 'file' && (
          <FilePayload message={message} mine={mine} t={t} />
        )}
      </div>
    </div>
  )
}

function FilePayload({ message, mine, t }) {
  const showImage = isImage(message.mime) && message.url
  return (
    <div className="flex flex-col gap-2 min-w-[180px]">
      {showImage && (
        <a
          href={message.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-xl"
        >
          <img
            src={message.url}
            alt={message.name}
            className="max-h-64 max-w-full object-contain rounded-xl"
          />
        </a>
      )}
      <a
        href={message.url}
        download={message.name}
        className={
          'flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition ' +
          (mine
            ? 'bg-black/15 hover:bg-black/25'
            : 'bg-white/5 hover:bg-white/10')
        }
        title={t('chat.download')}
      >
        <FileIcon />
        <div className="flex flex-col min-w-0">
          <span className="truncate font-medium">{message.name}</span>
          <span className="text-xs opacity-70 mono">
            {formatBytes(message.size)}
          </span>
        </div>
      </a>
    </div>
  )
}

function FileIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  )
}
