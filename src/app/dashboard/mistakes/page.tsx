'use client'
import { useState, useEffect } from 'react'

interface Mistake { id: string; mistake_type: string; description: string; created_at: string }

const MISTAKE_TYPES = ['Early Entry', 'Late Exit', 'No Confirmation', 'Revenge Trade', 'FOMO', 'Oversizing', 'Moved Stop Loss', 'No Stop Loss', 'Overtrading', 'Other']

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ mistake_type: 'Early Entry', description: '' })
  const [saving, setSaving] = useState(false)

  const fetchMistakes = async () => {
    const res = await fetch('/api/mistakes')
    const { data } = await res.json()
    setMistakes(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchMistakes() }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/mistakes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setShowAdd(false)
    fetchMistakes()
  }

  const counts = MISTAKE_TYPES.reduce((acc, type) => {
    acc[type] = mistakes.filter(m => m.mistake_type === type).length
    return acc
  }, {} as Record<string, number>)

  const mostCommon = Object.entries(counts).sort(([,a],[,b]) => b - a)[0]

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>Mistake Tracker</h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Track and eliminate recurring trading mistakes</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
          + Log Mistake
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Mistakes', value: mistakes.length, color: '#ef4444', icon: '⚠️' },
          { label: 'Most Common', value: mostCommon?.[0] || 'None', color: '#f59e0b', icon: '🔄' },
          { label: 'This Month', value: mistakes.filter(m => new Date(m.created_at) > new Date(Date.now() - 30 * 86400000)).length, color: '#3b82f6', icon: '📅' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
            <div style={{ color, fontWeight: '800', fontSize: '20px' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Frequency chart */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>Mistake Frequency</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(counts).filter(([,v]) => v > 0).sort(([,a],[,b]) => b - a).map(([type, count]) => (
            <div key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>{type}</span>
                <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '13px' }}>{count}x</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                <div style={{ height: '100%', width: `${(count / (mostCommon?.[1] || 1)) * 100}%`, background: '#ef4444', borderRadius: '3px' }} />
              </div>
            </div>
          ))}
          {Object.values(counts).every(v => v === 0) && (
            <div style={{ textAlign: 'center', color: '#475569', padding: '20px' }}>No mistakes logged yet</div>
          )}
        </div>
      </div>

      {/* Mistakes list */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(59,130,246,0.1)', background: 'rgba(59,130,246,0.05)' }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', margin: 0 }}>Recent Mistakes</h3>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>Loading...</div>
        ) : mistakes.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <div style={{ color: 'white', fontWeight: '600' }}>No mistakes logged yet</div>
            <div style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>Great discipline! Log any mistakes to track patterns.</div>
          </div>
        ) : (
          mistakes.map(mistake => (
            <div key={mistake.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(59,130,246,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '12px', fontWeight: '700', marginRight: '10px' }}>
                  {mistake.mistake_type}
                </span>
                {mistake.description && <span style={{ color: '#94a3b8', fontSize: '13px' }}>{mistake.description}</span>}
              </div>
              <span style={{ color: '#475569', fontSize: '11px' }}>{new Date(mistake.created_at).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '18px', marginBottom: '20px' }}>Log Mistake</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Mistake Type</label>
              <select value={form.mistake_type} onChange={e => setForm(p => ({ ...p, mistake_type: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}>
                {MISTAKE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                placeholder="What happened? What will you do differently?"
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', background: 'transparent', color: '#94a3b8', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Log Mistake'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}