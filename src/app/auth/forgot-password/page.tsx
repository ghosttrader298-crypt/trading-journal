'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Step = 'email' | 'otp' | 'reset' | 'done'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(59,130,246,0.25)',
  borderRadius: '10px',
  color: 'white',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#94a3b8',
  marginBottom: '8px',
}

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  border: 'none',
  borderRadius: '10px',
  color: 'white',
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
  letterSpacing: '0.3px',
}

const btnDisabledStyle: React.CSSProperties = {
  ...btnStyle,
  background: 'rgba(59,130,246,0.5)',
  cursor: 'not-allowed',
  boxShadow: 'none',
}

const iconBoxStyle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '10px',
  background: 'rgba(59,130,246,0.12)',
  border: '1px solid rgba(59,130,246,0.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [devOtp, setDevOtp] = useState('')

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) { setError('Email is required'); return }
    setLoading(true)
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (data.dev_otp) setDevOtp(data.dev_otp)
    setLoading(false)
    setStep('otp')
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const otpString = otp.join('')
    if (otpString.length !== 6) { setError('Enter the 6-digit code'); return }
    setLoading(true)
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: otpString }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setStep('reset')
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: otp.join(''), new_password: newPassword }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setStep('done')
    setTimeout(() => router.push('/auth/login'), 3000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.15) 0%, #050810 60%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '40px 20px',
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute', top: '15%', left: '20%', width: '280px', height: '280px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.18), transparent)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            boxShadow: '0 0 30px rgba(59,130,246,0.5)', marginBottom: '16px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            Ghost Trader
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Professional Trading Intelligence
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '20px',
          padding: '36px',
        }}>

          {/* ── STEP: EMAIL ── */}
          {step === 'email' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div style={iconBoxStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 2px 0' }}>Reset Password</h2>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Enter your email to receive a reset code</p>
                </div>
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 14px', borderRadius: '10px', marginBottom: '20px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', fontSize: '14px',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    autoComplete="email" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.7)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(59,130,246,0.25)')}
                  />
                </div>
                <button type="submit" disabled={loading} style={loading ? btnDisabledStyle : btnStyle}>
                  {loading ? 'Sending code...' : 'Send Reset Code'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', marginTop: '24px', marginBottom: 0 }}>
                Remember it?{' '}
                <Link href="/auth/login" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {/* ── STEP: OTP ── */}
          {step === 'otp' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div style={iconBoxStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 2px 0' }}>Enter Code</h2>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>6-digit code sent to {email}</p>
                </div>
              </div>

              {devOtp && (
                <div style={{
                  padding: '12px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center',
                  background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd', fontSize: '14px',
                }}>
                  Dev OTP: <strong style={{ letterSpacing: '0.1em' }}>{devOtp}</strong>
                </div>
              )}

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 14px', borderRadius: '10px', marginBottom: '20px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', fontSize: '14px',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleOtpSubmit}>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i} id={`otp-${i}`}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      style={{
                        width: '48px', height: '56px', textAlign: 'center',
                        fontSize: '22px', fontWeight: '700', borderRadius: '12px', outline: 'none',
                        background: digit ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${digit ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.2)'}`,
                        color: 'white', transition: 'all 0.15s ease',
                      }}
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading} style={loading ? btnDisabledStyle : btnStyle}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              <button
                onClick={() => setStep('email')}
                style={{
                  width: '100%', marginTop: '12px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px', background: 'none', border: 'none',
                  cursor: 'pointer', color: '#64748b', fontSize: '14px', padding: '8px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to email
              </button>
            </div>
          )}

          {/* ── STEP: RESET ── */}
          {step === 'reset' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div style={iconBoxStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 2px 0' }}>New Password</h2>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Choose a strong password</p>
                </div>
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 14px', borderRadius: '10px', marginBottom: '20px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', fontSize: '14px',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleResetSubmit}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle}>New Password</label>
                  <input
                    type="password" placeholder="Min. 8 characters"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.7)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(59,130,246,0.25)')}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Confirm Password</label>
                  <input
                    type="password" placeholder="Repeat your password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.7)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(59,130,246,0.25)')}
                  />
                  {confirmPassword && (
                    <p style={{ fontSize: '12px', marginTop: '6px', color: newPassword === confirmPassword ? '#22c55e' : '#ef4444' }}>
                      {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>
                <button type="submit" disabled={loading} style={loading ? btnDisabledStyle : btnStyle}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 20px',
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'white', margin: '0 0 8px 0' }}>
                Password Reset!
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>
                Your password has been updated successfully.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                color: '#3b82f6', fontSize: '13px',
              }}>
                <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(59,130,246,0.3)" strokeWidth="4"/>
                  <path fill="#3b82f6" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Redirecting to login...
              </div>
            </div>
          )}

        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#1e293b', marginTop: '24px' }}>
          © 2024 Ghost Trader. All rights reserved.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  )
}