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
        <span className="text-xs text-white/40 italic">{text}</span>
      </div>
    )
  }

  const mine = message.from === 'me'
  const bubbleBase =
    'bubble-enter max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 break-words text-[15px] sm:text-sm shadow-sm leading-relaxed'
  const bubbleColor = mine
    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md shadow-blue-500/20'
    : 'bg-white/[0.08] text-white rounded-bl-md border border-white/5 backdrop-blur'

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
    <div className="flex flex-col gap-2">
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
          'flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition ' +
          (mine
            ? 'bg-white/15 hover:bg-white/25'
            : 'bg-black/30 hover:bg-black/50')
        }
        title={t('chat.download')}
      >
        <FileGlyph />
        <div className="flex flex-col min-w-0">
          <span className="truncate font-medium">{message.name}</span>
          <span className="text-xs opacity-70">{formatBytes(message.size)}</span>
        </div>
      </a>
    </div>
  )
}

function FileGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}
