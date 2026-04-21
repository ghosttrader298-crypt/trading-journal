'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
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
    const result = await login(email, password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
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
        padding: '20px',
      }}
    >
      {/* Grid background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.08,
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '25%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            boxShadow: '0 0 30px rgba(59,130,246,0.5)',
            marginBottom: '16px',
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
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 4px 0' }}>
            Welcome back
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 28px 0' }}>
            Sign in to your trading dashboard
          </p>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '10px',
              marginBottom: '20px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
              fontSize: '14px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.7)'}
                onBlur={e => e.target.style.borderColor = 'rgba(59,130,246,0.25)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.7)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(59,130,246,0.25)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
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
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <Link href="/auth/forgot-password" style={{ color: '#3b82f6', fontSize: '13px', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(59,130,246,0.35)',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', marginTop: '24px', marginBottom: 0 }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>
              Create account
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#1e293b', marginTop: '24px' }}>
          © 2024 Ghost Trader. All rights reserved.
        </p>
      </div>
    </div>
  )
}