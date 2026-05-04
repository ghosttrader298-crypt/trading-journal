'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      console.log('🔍 Login response:', data)
      console.log('🔍 Role path (data.role):', data.role)
      console.log('🔍 Role path (data.data?.role):', data.data?.role)

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Block non-admin users
      if (data.data?.role === 'USER' || data.role === 'USER') {
        setError('Access denied. Admin credentials required.')
        await fetch('/api/auth/logout', { method: 'POST' })
        setLoading(false)
        return
      }

  router.push(data.redirectTo || '/admin/dashboard')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050810',
      position: 'relative',
      overflow: 'hidden',
      padding: '20px',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'linear-gradient(rgba(239,68,68,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.8) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
      }} />

      {/* Red glow top */}
      <div style={{
        position: 'absolute', top: '-100px', left: '50%',
        transform: 'translateX(-50%)',
        width: '500px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(239,68,68,0.12), transparent)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      {/* Red glow bottom */}
      <div style={{
        position: 'absolute', bottom: '-100px', right: '20%',
        width: '300px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(220,38,38,0.08), transparent)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '16px', marginBottom: '16px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            boxShadow: '0 0 30px rgba(239,68,68,0.4)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '26px', fontWeight: '800', color: 'white',
            margin: '0 0 4px 0', letterSpacing: '-0.5px',
          }}>
            Ghost Trader
          </h1>
          <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>
            Admin Panel
          </p>
        </div>

        {/* Warning banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
        }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
          <p style={{ color: '#fca5a5', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
            Restricted access. This area is for authorized administrators only.
            All actions are logged and monitored.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '20px',
          padding: '32px',
        }}>
          <h2 style={{
            fontSize: '18px', fontWeight: '700', color: 'white',
            margin: '0 0 4px 0',
          }}>
            Administrator Sign In
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 24px 0' }}>
            Enter your admin credentials to continue
          </p>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 14px', borderRadius: '10px', marginBottom: '18px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: '13px',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '600',
                color: '#94a3b8', marginBottom: '7px',
              }}>
                Admin Email
              </label>
              <input
                type="email"
                placeholder="admin@ghosttrader.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                style={{
                  width: '100%', padding: '11px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '10px', color: 'white',
                  fontSize: '14px', outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(239,68,68,0.6)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(239,68,68,0.2)')}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '600',
                color: '#94a3b8', marginBottom: '7px',
              }}>
                Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '11px 44px 11px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '10px', color: 'white',
                    fontSize: '14px', outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(239,68,68,0.6)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(239,68,68,0.2)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#64748b',
                    display: 'flex', alignItems: 'center', padding: '4px',
                  }}>
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading
                  ? 'rgba(239,68,68,0.4)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none', borderRadius: '10px',
                color: 'white', fontSize: '15px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(239,68,68,0.35)',
                letterSpacing: '0.3px',
              }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                    <path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : '🔐 Sign In to Admin Panel'}
            </button>
          </form>

          {/* Back to user login */}
          <div style={{
            textAlign: 'center', marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(239,68,68,0.1)',
          }}>
            <a href="/auth/login" style={{
              color: '#475569', fontSize: '13px',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#94a3b8')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = '#475569')}
            >
              ← Back to User Login
            </a>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', fontSize: '11px',
          color: '#1e293b', marginTop: '20px',
        }}>
          Ghost Trader Admin • Authorized Access Only
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}