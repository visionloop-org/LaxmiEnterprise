import { useEffect } from 'react'

const ICONS = {
  error: (
    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const BG = {
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  success: 'bg-green-50 border-green-200',
  info: 'bg-blue-50 border-blue-200',
}

const TEXT = {
  error: 'text-red-800',
  warning: 'text-yellow-800',
  success: 'text-green-800',
  info: 'text-blue-800',
}

export default function Toast({ notification, onDismiss }) {
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [notification, onDismiss])

  if (!notification) return null

  const { type = 'info', message } = notification

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full animate-slide-in">
      <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${BG[type]}`}>
        <div className="flex-shrink-0 mt-0.5">{ICONS[type]}</div>
        <p className={`flex-1 text-sm font-medium leading-snug ${TEXT[type]}`}>{message}</p>
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 ${TEXT[type]} hover:opacity-60 transition-opacity`}
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
