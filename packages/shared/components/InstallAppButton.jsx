import { useState, useEffect } from 'react'

/**
 * InstallAppButton Component
 * 
 * Intercepts the browser `beforeinstallprompt` event and provides a 1-click
 * installation button to install Laxmi Enterprise as a standalone Progressive Web App.
 * Also provides instructions for iOS Safari users and shows installed status.
 */
export default function InstallAppButton({
  label = 'Install App',
  compact = false,
  variant = 'primary', // 'primary' | 'outline' | 'amber' | 'slate'
  className = '',
  style = {}
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)

  const isIOS = typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream

  useEffect(() => {
    // 1. Check if already running as installed standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        (typeof window !== 'undefined' && window.navigator && window.navigator.standalone === true) ||
        (typeof document !== 'undefined' && document.referrer.includes('android-app://'))
      
      if (isStandaloneMode) {
        setIsInstalled(true)
      }
    }

    checkStandalone()

    // 2. Listen for native browser PWA install event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // 3. Listen for successful app installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      console.log('🎉 Laxmi Enterprise installed successfully as PWA!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isInstalled) {
      alert('✓ Laxmi Enterprise is already installed on your device.')
      return
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true)
          setIsInstallable(false)
        }
        setDeferredPrompt(null)
      } catch (err) {
        console.error('Error triggering PWA install prompt:', err)
      }
      return
    }

    if (isIOS) {
      setShowIOSModal(true)
      return
    }

    // Generic fallback instructions for desktop / other browsers
    alert(
      'To install this app on your device:\n\n' +
      '• In Chrome / Edge: Click the Install icon (⊕ or 📲) in the right side of the address bar.\n' +
      '• In Android Chrome: Tap the three dots (⋮) and select "Install app" or "Add to Home screen".\n' +
      '• In iOS Safari: Tap Share (⎋) and select "Add to Home Screen (⊞)".'
    )
  }

  // If already installed, show a subtle green "✓ Installed" badge
  if (isInstalled) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: '600',
          backgroundColor: 'rgba(6, 78, 59, 0.4)',
          color: '#6ee7b7',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          ...style
        }}
        title="Laxmi Enterprise is running in installed app mode"
      >
        <span style={{ color: '#10b981' }}>●</span> App Installed
      </span>
    )
  }

  // Style presets
  const variantStyles = {
    primary: {
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: 'none',
    },
    amber: {
      backgroundColor: '#f59e0b',
      color: '#0f172a',
      border: 'none',
      fontWeight: '700'
    },
    slate: {
      backgroundColor: '#1e293b',
      color: '#38bdf8',
      border: '1px solid rgba(56, 189, 248, 0.4)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#38bdf8',
      border: '1px solid #0284c7',
    }
  }

  const selectedVariant = variantStyles[variant] || variantStyles.primary

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`pwa-install-btn ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: compact ? '4px 8px' : '6px 12px',
          borderRadius: '8px',
          fontSize: compact ? '11px' : '12px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          ...selectedVariant,
          ...style
        }}
        title="Install Laxmi Enterprise to your Home Screen or Desktop"
      >
        <span style={{ fontSize: compact ? '13px' : '15px' }}>📲</span>
        <span>{label}</span>
        {isInstallable && (
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981'
            }}
          />
        )}
      </button>

      {/* iOS Safari Instructions Modal */}
      {showIOSModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 99999
          }}
          onClick={() => setShowIOSModal(false)}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              color: '#f8fafc',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>📲</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Install on iPad / iPhone</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '16px' }}>
              Apple iOS Safari does not show automatic install popups. Follow these simple steps to install Laxmi Enterprise directly to your home screen:
            </p>

            <ol style={{ paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8', color: '#e2e8f0', marginBottom: '20px' }}>
              <li>Tap the <strong>Share</strong> button at the bottom or top bar in Safari: <span style={{ padding: '2px 6px', background: '#1e293b', borderRadius: '4px' }}>⎋ Share</span></li>
              <li>Scroll down the action sheet and tap: <strong style={{ color: '#38bdf8' }}>"Add to Home Screen" (⊞)</strong></li>
              <li>Tap <strong>"Add"</strong> in the top right corner.</li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
