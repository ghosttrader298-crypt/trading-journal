'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '20%' }
  if (score === 2) return { label: 'Fair', color: '#f59e0b', width: '40%' }
  if (score === 3) return { label: 'Good', color: '#3b82f6', width: '65%' }
  if (score === 4) return { label: 'Strong', color: '#10b981', width: '85%' }
  return { label: 'Very Strong', color: '#10b981', width: '100%' }
}

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

const inputWithIconStyle: React.CSSProperties = {
  ...inputStyle,
  paddingRight: '44px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#94a3b8',
  marginBottom: '8px',
}

export default function RegisterPage() {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('All fields are required')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const result = await register(email, password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      // Show success screen before redirect happens
      setSuccess(true)
      setLoading(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.15) 0%, #050810 60%)',
        padding: '20px',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '20px',
          padding: '48px 36px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
        }}>
          {/* Success icon */}
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(16,185,129,0.15)',
            border: '2px solid rgba(16,185,129,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: '800',
            color: 'white',
            margin: '0 0 12px 0',
          }}>
            Account Created!
          </h2>

          <p style={{
            color: '#94a3b8',
            fontSize: '15px',
            lineHeight: '1.6',
            margin: '0 0 8px 0',
          }}>
            Welcome to Ghost Trader, <strong style={{ color: 'white' }}>{email}</strong>
          </p>

          <p style={{
            color: '#64748b',
            fontSize: '14px',
            margin: '0 0 32px 0',
          }}>
            Your account has been created successfully. Redirecting you to login...
          </p>

          {/* Loading dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '32px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'bounce 1.2s infinite',
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>

          {/* Manual link in case redirect is slow */}
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Not redirected?{' '}
            <Link href="/auth/login" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>
              Click here to sign in
            </Link>
          </p>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-8px); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.15) 0%, #050810 60%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
      }}
    >
      {/* Grid background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.08,
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', top: '10%', right: '20%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>

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
            Create your trading account
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
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 4px 0' }}>
            Get started
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 28px 0' }}>
            Join thousands of disciplined traders
          </p>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 14px', borderRadius: '10px', marginBottom: '20px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: '14px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.7)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(59,130,246,0.25)')}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputWithIconStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.7)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(59,130,246,0.25)')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '4px' }}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {password && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Password strength</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: strength.color }}>{strength.label}</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height: '100%', borderRadius: '4px', width: strength.width, background: strength.color, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={inputWithIconStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.7)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(59,130,246,0.25)')}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '4px' }}>
                  {showConfirm ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
                {confirmPassword && password === confirmPassword && (
                  <div style={{ position: 'absolute', right: '44px', top: '50%', transform: 'translateY(-50%)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </div>
              {confirmPassword && (
                <p style={{ fontSize: '12px', marginTop: '6px', color: password === confirmPassword ? '#10b981' : '#ef4444' }}>
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none', borderRadius: '10px', color: 'white',
                fontSize: '15px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(59,130,246,0.35)',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4"/>
                    <path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', marginTop: '24px', marginBottom: 0 }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}