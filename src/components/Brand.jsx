import { Link } from 'react-router-dom'

/**
 * The Drop&Go wordmark. The ampersand is set in italic serif as a small
 * design moment — the rest stays in the sans body face so reading "Drop" and
 * "Go" feels grounded and the "&" carries the warmth.
 */
export default function Brand({ size = 'sm', as = 'link', className = '' }) {
  const scale = {
    xs: 'text-base sm:text-lg',
    sm: 'text-xl',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-6xl sm:text-7xl md:text-8xl',
  }[size]

  const content = (
    <span
      className={
        'inline-flex items-baseline gap-0.5 tracking-tight ' + scale + ' '
      }
    >
      <span className="font-semibold text-[color:var(--color-fg)]">Drop</span>
      <span className="display-italic text-[color:var(--color-accent)] -mx-0.5 leading-none">
        &amp;
      </span>
      <span className="font-semibold text-[color:var(--color-fg)]">Go</span>
    </span>
  )

  if (as === 'link') {
    return (
      <Link
        to="/"
        className={
          'inline-block rounded-md focus-visible:outline-2 focus-visible:outline-[color:var(--color-accent)] ' +
          className
        }
        aria-label="Drop&Go — на главную"
      >
        {content}
      </Link>
    )
  }

  return <span className={className}>{content}</span>
}
