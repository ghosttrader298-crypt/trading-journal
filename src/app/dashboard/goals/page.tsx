'use client'
import { useState, useEffect } from 'react'
import { Goal } from '@/types'
 
const GOAL_TYPES = ['WIN_RATE', 'DAILY_PNL', 'WEEKLY_PNL', 'MONTHLY_RETURN', 'MAX_DAILY_LOSS', 'DISCIPLINE_SCORE', 'MAX_TRADES_PER_DAY', 'RULE_ADHERENCE']
 
export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', goal_type: 'WIN_RATE', target_value: '', period: 'MONTHLY', start_date: '', end_date: '' })
 
  const fetchGoals = async () => {
    const res = await fetch('/api/goals')
    const { data } = await res.json()
    setGoals(data || [])
    setLoading(false)
  }
 
  useEffect(() => { fetchGoals() }, [])
 
  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, target_value: parseFloat(form.target_value) }) })
    setSaving(false)
    setShowAdd(false)
    fetchGoals()
  }
 
  const progress = (goal: Goal) => {
    if (!goal.target_value) return 0
    return Math.min((goal.current_value / goal.target_value) * 100, 100)
  }
 
  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>Goals & Challenges</h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Set targets and track your progress</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
          + Add Goal
        </button>
      </div>
 
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>Loading...</div>
      ) : goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h3 style={{ color: 'white', fontWeight: '700', marginBottom: '8px' }}>No goals yet</h3>
          <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px' }}>Set your first trading goal to start tracking progress</p>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
            Create First Goal
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {goals.map(goal => {
            const pct = progress(goal)
            return (
              <div key={goal.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', margin: '0 0 4px 0' }}>{goal.title}</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '11px', fontWeight: '600' }}>
                        {goal.goal_type.replace(/_/g, ' ')}
                      </span>
                      {goal.period && (
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#475569', fontSize: '11px' }}>
                          {goal.period}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: pct >= 100 ? '#10b981' : '#3b82f6', fontWeight: '800', fontSize: '22px' }}>
                      {pct.toFixed(0)}%
                    </div>
                    {goal.is_completed && <div style={{ color: '#10b981', fontSize: '11px' }}>✅ Completed</div>}
                  </div>
                </div>
 
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#475569', fontSize: '12px' }}>Progress</span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {goal.current_value} / {goal.target_value}
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: pct >= 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #3b82f6, #2563eb)',
                      borderRadius: '4px', transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
 
                {goal.end_date && (
                  <div style={{ color: '#475569', fontSize: '11px' }}>
                    Target: {new Date(goal.end_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
 
      {/* Add Goal Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px' }}>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '18px', marginBottom: '20px' }}>Add Goal</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Goal Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Achieve 60% win rate"
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Goal Type</label>
                  <select value={form.goal_type} onChange={e => setForm(p => ({ ...p, goal_type: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }}>
                    {GOAL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Period</label>
                  <select value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }}>
                    {['DAILY','WEEKLY','MONTHLY','YEARLY'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Target Value</label>
                <input type="number" step="any" value={form.target_value} onChange={e => setForm(p => ({ ...p, target_value: e.target.value }))} placeholder="e.g. 60 for 60%"
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[{ k: 'start_date', label: 'Start Date' }, { k: 'end_date', label: 'End Date' }].map(({ k, label }) => (
                  <div key={k}>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>{label}</label>
                    <input type="date" value={form[k as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', background: 'transparent', color: '#94a3b8', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}