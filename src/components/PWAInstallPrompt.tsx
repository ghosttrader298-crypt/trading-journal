'use client'
import { useState, useEffect } from 'react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show prompt after 30 seconds or on second visit
      const visitCount = parseInt(localStorage.getItem('gt_visits') || '0') + 1
      localStorage.setItem('gt_visits', String(visitCount))
      if (visitCount >= 2) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
    }
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  if (!showPrompt || installed) return null

  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, width: 'calc(100% - 40px)', maxWidth: '400px',
      background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.3)',
      borderRadius: '16px', padding: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px',
        }}>
          📈
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>
            Install Ghost Trader
          </div>
          <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '14px', lineHeight: '1.5' }}>
            Add to your home screen for quick access to your trading journal
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleInstall}
              style={{
                flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              }}>
              Install App
            </button>
            <button onClick={() => setShowPrompt(false)}
              style={{
                padding: '9px 14px', borderRadius: '8px',
                border: '1px solid rgba(59,130,246,0.2)',
                background: 'transparent', color: '#64748b',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer',
              }}>
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}