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
    'max-w-[80%] sm:max-w-[70%] rounded-2xl px-3 py-2 break-words text-sm shadow-sm'
  const bubbleColor = mine
    ? 'bg-blue-500 text-white rounded-br-sm'
    : 'bg-white/10 text-white rounded-bl-sm'

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
          className="block overflow-hidden rounded-lg"
        >
          <img
            src={message.url}
            alt={message.name}
            className="max-h-64 max-w-full object-contain rounded-lg"
          />
        </a>
      )}
      <a
        href={message.url}
        download={message.name}
        className={
          'flex items-center gap-2 rounded-lg px-2 py-1.5 transition ' +
          (mine
            ? 'bg-white/15 hover:bg-white/25'
            : 'bg-black/30 hover:bg-black/50')
        }
        title={t('chat.download')}
      >
        <span aria-hidden="true">📎</span>
        <div className="flex flex-col min-w-0">
          <span className="truncate font-medium">{message.name}</span>
          <span className="text-xs opacity-70">{formatBytes(message.size)}</span>
        </div>
      </a>
    </div>
  )
}
