'use client'
import { useState } from 'react'
import { useAccounts } from '@/hooks/useAccounts'
import { useJournal } from '@/hooks/useJournal'

const MOODS = ['😤', '😟', '😐', '😊', '🔥']

export default function JournalPage() {
  const { activeAccount } = useAccounts()
  const { entries, loading, saveEntry, deleteEntry } = useJournal(activeAccount?.id)
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    market_conditions: '', plan: '', what_went_well: '', mistakes: '', lessons: '',
    mood_before: 3, mood_after: 3,
  })

  const selectedEntry = entries.find(e => e.id === selected)

  const handleSave = async () => {
    setSaving(true)
    await saveEntry({ ...form, account_id: activeAccount?.id })
    setSaving(false)
    setEditing(false)
  }

  const startNew = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      market_conditions: '', plan: '', what_went_well: '', mistakes: '', lessons: '',
      mood_before: 3, mood_after: 3,
    })
    setSelected(null)
    setEditing(true)
  }

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>Daily Journal</h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Document your trading mindset daily</p>
        </div>
        <button onClick={startNew}
          style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
          + New Entry
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        {/* Entry list */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '16px', height: 'fit-content' }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>Entries</h3>
          {loading ? (
            <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : entries.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No entries yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {entries.map(entry => (
                <button key={entry.id} onClick={() => { setSelected(entry.id); setEditing(false) }}
                  style={{
                    padding: '12px', borderRadius: '10px', border: 'none', textAlign: 'left', cursor: 'pointer',
                    background: selected === entry.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                    borderLeft: `3px solid ${selected === entry.id ? '#3b82f6' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ color: 'white', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>
                    {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {entry.mood_before && <span style={{ fontSize: '14px' }}>{MOODS[(entry.mood_before || 3) - 1]}</span>}
                    <span style={{ color: '#475569', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.plan?.slice(0, 40) || 'No plan written'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content area */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '28px' }}>
          {editing ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px', margin: 0 }}>New Journal Entry</h3>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }} />
              </div>

              {/* Mood selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {[
                  { label: 'Mood Before Trading', key: 'mood_before' },
                  { label: 'Mood After Trading', key: 'mood_after' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>{label}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {MOODS.map((mood, i) => (
                        <button key={i} onClick={() => setForm(p => ({ ...p, [key]: i + 1 }))}
                          style={{
                            width: '36px', height: '36px', borderRadius: '8px', border: 'none', fontSize: '20px', cursor: 'pointer',
                            background: form[key as keyof typeof form] === i + 1 ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                            outline: form[key as keyof typeof form] === i + 1 ? '2px solid #3b82f6' : 'none',
                          }}>{mood}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Text fields */}
              {[
                { key: 'market_conditions', label: 'Market Conditions', placeholder: 'Describe today\'s market...' },
                { key: 'plan', label: 'Trading Plan', placeholder: 'What is your plan for today?' },
                { key: 'what_went_well', label: 'What Went Well', placeholder: 'Positives from today...' },
                { key: 'mistakes', label: 'Mistakes Made', placeholder: 'What mistakes did you make?' },
                { key: 'lessons', label: 'Lessons Learned', placeholder: 'What did you learn today?' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>{label}</label>
                  <textarea value={form[key as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder} rows={3}
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              ))}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditing(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', background: 'transparent', color: '#94a3b8', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </>
          ) : selectedEntry ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ color: 'white', fontWeight: '700', fontSize: '18px', margin: '0 0 4px 0' }}>
                    {new Date(selectedEntry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {selectedEntry.mood_before && (
                      <span style={{ fontSize: '13px', color: '#475569' }}>
                        Before: {MOODS[(selectedEntry.mood_before || 3) - 1]}
                      </span>
                    )}
                    {selectedEntry.mood_after && (
                      <span style={{ fontSize: '13px', color: '#475569' }}>
                        After: {MOODS[(selectedEntry.mood_after || 3) - 1]}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => deleteEntry(selectedEntry.id)}
                    style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>

              {[
                { label: 'Market Conditions', value: selectedEntry.market_conditions },
                { label: 'Trading Plan', value: selectedEntry.plan },
                { label: 'What Went Well', value: selectedEntry.what_went_well },
                { label: 'Mistakes', value: selectedEntry.mistakes },
                { label: 'Lessons Learned', value: selectedEntry.lessons },
              ].filter(s => s.value).map(({ label, value }) => (
                <div key={label} style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#3b82f6', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{label}</h4>
                  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>{value}</p>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📓</div>
              <h3 style={{ color: 'white', fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>No entry selected</h3>
              <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px' }}>Select an entry from the list or create a new one</p>
              <button onClick={startNew}
                style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                Write Today&apos;s Entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}