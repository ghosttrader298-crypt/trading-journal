'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState({ display_name: '', timezone: 'UTC', preferred_currency: 'USD', default_broker: '', risk_tolerance: 1 })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (user) setProfile({ display_name: user.display_name || '', timezone: user.timezone || 'UTC', preferred_currency: user.preferred_currency || 'USD', default_broker: user.default_broker || '', risk_tolerance: user.risk_tolerance || 1 })
  }, [user])

  const saveProfile = async () => {
    setSaving(true); setMsg(''); setErr('')
    const res = await fetch('/api/user/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
    setSaving(false)
    if (res.ok) { setMsg('Profile updated successfully'); await refreshUser() }
    else setErr('Failed to update profile')
  }

  const changePassword = async () => {
    if (passwords.new !== passwords.confirm) { setErr('Passwords do not match'); return }
    setPwSaving(true); setMsg(''); setErr('')
    const res = await fetch('/api/user/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: passwords.current, new_password: passwords.new }) })
    setPwSaving(false)
    if (res.ok) { setMsg('Password changed successfully'); setPasswords({ current: '', new: '', confirm: '' }) }
    else { const d = await res.json(); setErr(d.error || 'Failed to change password') }
  }

  const inputStyle = { width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { color: '#94a3b8', fontSize: '12px', fontWeight: '600' as const, display: 'block' as const, marginBottom: '6px' }

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>Settings</h1>
        <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Manage your profile and preferences</p>
      </div>

      {msg && <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: '14px' }}>{msg}</div>}
      {err && <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '14px' }}>{err}</div>}

      {/* Profile */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>👤 Profile</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} placeholder="Your trader name" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Timezone</label>
              <select value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
                style={{ ...inputStyle, background: '#0a0f1e' }}>
                {['UTC','America/New_York','America/Chicago','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Asia/Singapore','Australia/Sydney'].map(tz => <option key={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Preferred Currency</label>
              <select value={profile.preferred_currency} onChange={e => setProfile(p => ({ ...p, preferred_currency: e.target.value }))}
                style={{ ...inputStyle, background: '#0a0f1e' }}>
                {['USD','EUR','GBP','JPY','AUD','CAD','CHF','NGN'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Default Broker</label>
              <input value={profile.default_broker} onChange={e => setProfile(p => ({ ...p, default_broker: e.target.value }))} placeholder="e.g. IC Markets" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Risk Tolerance % ({profile.risk_tolerance}%)</label>
              <input type="range" min="0.5" max="5" step="0.5" value={profile.risk_tolerance}
                onChange={e => setProfile(p => ({ ...p, risk_tolerance: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: '#3b82f6', marginTop: '10px' }} />
            </div>
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving}
          style={{ marginTop: '20px', padding: '11px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Password */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>🔒 Change Password</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { k: 'current', label: 'Current Password' },
            { k: 'new', label: 'New Password' },
            { k: 'confirm', label: 'Confirm New Password' },
          ].map(({ k, label }) => (
            <div key={k}>
              <label style={labelStyle}>{label}</label>
              <input type="password" value={passwords[k as keyof typeof passwords]}
                onChange={e => setPasswords(p => ({ ...p, [k]: e.target.value }))}
                placeholder="••••••••" style={inputStyle} />
            </div>
          ))}
        </div>
        <button onClick={changePassword} disabled={pwSaving}
          style={{ marginTop: '20px', padding: '11px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
          {pwSaving ? 'Updating...' : 'Change Password'}
        </button>
      </div>
    </div>
  )
}