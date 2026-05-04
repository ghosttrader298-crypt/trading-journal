'use client'
import { useState, useEffect } from 'react'

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', body: '',
    announcement_type: 'INFO',
    audience: 'ALL',
  })

  const fetchAnnouncements = async () => {
    const res = await fetch('/api/admin/announcements')
    const { data } = await res.json()
    setAnnouncements(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const handleSend = async () => {
    if (!form.title || !form.body) return
    setSaving(true)
    await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setForm({ title: '', body: '', announcement_type: 'INFO', audience: 'ALL' })
    fetchAnnouncements()
  }

  const typeColors: Record<string, string> = {
    INFO: '#3b82f6', WARNING: '#f59e0b', CRITICAL: '#ef4444', FEATURE: '#10b981',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(239,68,68,0.15)',
    borderRadius: '8px', color: 'white', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>
          📢 Announcements
        </h1>
        <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
          Send announcements to platform users
        </p>
      </div>

      {/* Compose */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: '16px', padding: '24px', marginBottom: '24px',
      }}>
        <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>
          New Announcement
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Title</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Announcement title..." style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Type</label>
              <select value={form.announcement_type} onChange={e => setForm(p => ({ ...p, announcement_type: e.target.value }))}
                style={{ ...inputStyle, background: '#0a0f1e' }}>
                {['INFO', 'WARNING', 'CRITICAL', 'FEATURE'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Audience</label>
              <select value={form.audience} onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
                style={{ ...inputStyle, background: '#0a0f1e' }}>
                {['ALL', 'PRO', 'FREE', 'ENTERPRISE'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Message</label>
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              placeholder="Write your announcement..." rows={4}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <button onClick={handleSend} disabled={saving || !form.title || !form.body}
            style={{
              padding: '12px 24px', borderRadius: '10px', border: 'none',
              background: saving || !form.title || !form.body
                ? 'rgba(239,68,68,0.3)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white', fontWeight: '700', fontSize: '14px',
              cursor: saving || !form.title || !form.body ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-start',
            }}>
            {saving ? 'Sending...' : '📢 Send Announcement'}
          </button>
        </div>
      </div>

      {/* History */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: '16px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(239,68,68,0.1)',
          background: 'rgba(239,68,68,0.05)',
        }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', margin: 0 }}>
            Announcement History
          </h3>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>Loading...</div>
        ) : announcements.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>No announcements yet</div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(239,68,68,0.06)',
              borderLeft: `4px solid ${typeColors[ann.announcement_type] || '#475569'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ color: 'white', fontWeight: '700', fontSize: '14px', margin: '0 0 6px 0' }}>
                    {ann.title}
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0', lineHeight: '1.6' }}>
                    {ann.body}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                      background: `${typeColors[ann.announcement_type]}20`,
                      color: typeColors[ann.announcement_type],
                    }}>{ann.announcement_type}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                      background: 'rgba(255,255,255,0.05)', color: '#475569',
                    }}>{ann.audience}</span>
                  </div>
                </div>
                <span style={{ color: '#475569', fontSize: '11px', flexShrink: 0 }}>
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}