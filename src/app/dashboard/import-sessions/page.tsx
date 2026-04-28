'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAccounts } from '@/hooks/useAccounts'
import { useRouter } from 'next/navigation'

interface ImportSession {
  id: string
  session_name: string
  file_name: string
  broker_name: string
  description: string
  imported_rows: number
  duplicate_rows: number
  error_rows: number
  total_rows: number
  created_at: string
  account_id: string
}

interface SessionAnalytics {
  total_trades: number
  win_rate: number
  total_pnl: number
  profit_factor: number
  avg_risk_reward: number
  max_drawdown: number
  winning_trades: number
  losing_trades: number
  avg_discipline_score: number
  revenge_trades: number
}

function generateSessionInsight(analytics: SessionAnalytics, sessionName: string): string {
  const pnl = analytics.total_pnl || 0
  const wr = analytics.win_rate || 0
  const pf = analytics.profit_factor || 0
  const dd = analytics.max_drawdown || 0
  const revenge = analytics.revenge_trades || 0
  const lines: string[] = []

  if (pnl >= 0) {
    lines.push(`"${sessionName}" is profitable at $${pnl.toFixed(2)}.`)
  } else {
    lines.push(`"${sessionName}" is in a loss of $${Math.abs(pnl).toFixed(2)}.`)
  }

  if (wr >= 60) lines.push(`Win rate of ${wr.toFixed(1)}% is strong.`)
  else if (wr >= 50) lines.push(`Win rate of ${wr.toFixed(1)}% is acceptable — focus on R:R.`)
  else lines.push(`Win rate of ${wr.toFixed(1)}% is below 50% — improve setup selection.`)

  if (pf >= 2) lines.push('Excellent profit factor — winners far exceed losers.')
  else if (pf >= 1.5) lines.push('Good profit factor — strategy has an edge.')
  else if (pf >= 1) lines.push('Marginal profit factor — cut losses faster.')
  else if (pf > 0) lines.push('Negative edge — this session needs a strategy review.')

  if (revenge > 0) lines.push(`⚠️ ${revenge} revenge trade${revenge > 1 ? 's' : ''} detected.`)
  if (dd > 15) lines.push(`Max drawdown of ${dd.toFixed(1)}% is high — reduce position sizes.`)

  return lines.join(' ')
}

export default function ImportSessionsPage() {
  const { accounts, activeAccount } = useAccounts()
  const router = useRouter()
  const [sessions, setSessions] = useState<ImportSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sessionAnalytics, setSessionAnalytics] = useState<Record<string, SessionAnalytics>>({})
  const [loadingAnalytics, setLoadingAnalytics] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeAccount?.id) params.set('account_id', activeAccount.id)
    const res = await fetch(`/api/import/sessions?${params}`)
    const { data } = await res.json()
    setSessions(data || [])
    setLoading(false)
  }, [activeAccount?.id])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const loadSessionAnalytics = async (sessionId: string) => {
    if (selectedSession === sessionId) {
      setSelectedSession(null)
      return
    }
    setSelectedSession(sessionId)
    if (sessionAnalytics[sessionId]) return
    setLoadingAnalytics(sessionId)
    const res = await fetch(`/api/analytics?import_session_id=${sessionId}`)
    const { data } = await res.json()
    setSessionAnalytics(prev => ({ ...prev, [sessionId]: data }))
    setLoadingAnalytics(null)
  }

  const deleteSession = async (sessionId: string, sessionName: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!confirm(`Delete "${sessionName}" and all ${session?.imported_rows} trades?\n\nThis cannot be undone.`)) return
    setDeleting(sessionId)
    await fetch(`/api/import/sessions?session_id=${sessionId}`, { method: 'DELETE' })
    setDeleting(null)
    if (selectedSession === sessionId) setSelectedSession(null)
    fetchSessions()
  }

  const startRename = (session: ImportSession) => {
    setEditingName(session.id)
    setEditNameValue(session.session_name)
  }

  const saveRename = async (sessionId: string) => {
    if (!editNameValue.trim()) return
    setSavingName(true)
    await fetch('/api/import/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, session_name: editNameValue.trim() }),
    })
    setSavingName(false)
    setEditingName(null)
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, session_name: editNameValue.trim() } : s))
  }

  const analytics = selectedSession ? sessionAnalytics[selectedSession] : null
  const selectedSessionData = sessions.find(s => s.id === selectedSession)
  const sessionColors = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

  return (
    <div style={{ maxWidth: '1300px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>
            📦 Import Sessions
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Each import is isolated — its own trades, analytics, and AI insights
          </p>
        </div>
        <button onClick={() => router.push('/dashboard/trade-log')}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
          📥 Import New CSV
        </button>
      </div>

      {/* Summary bar */}
      {sessions.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Sessions', value: sessions.length, icon: '📦' },
            { label: 'Total Trades', value: sessions.reduce((s, x) => s + x.imported_rows, 0), icon: '📋' },
            { label: 'Latest Import', value: new Date(sessions[0]?.created_at).toLocaleDateString(), icon: '📅' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: '12px', padding: '14px 18px',
            }}>
              <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                {icon} {label}
              </div>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '20px' }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '20px',
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📦</div>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '20px', marginBottom: '8px' }}>No import sessions yet</h3>
          <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>
            Import your first CSV to create a named session. Each import keeps its data completely separate.
          </p>
          <button onClick={() => router.push('/dashboard/trade-log')}
            style={{
              padding: '12px 28px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer',
            }}>
            Import Your First CSV
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedSession ? '1fr 400px' : '1fr',
          gap: '20px', alignItems: 'start',
        }}>

          {/* Sessions list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sessions.map((session, index) => {
              const isSelected = selectedSession === session.id
              const isDeleting = deleting === session.id
              const isEditing = editingName === session.id
              const account = accounts.find(a => a.id === session.account_id)
              const color = sessionColors[index % sessionColors.length]

              return (
               <div key={session.id} style={{
  background: isSelected ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
  borderTop: `1px solid ${isSelected ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.12)'}`,
  borderRight: `1px solid ${isSelected ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.12)'}`,
  borderBottom: `1px solid ${isSelected ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.12)'}`,
  borderLeft: `4px solid ${color}`,
  borderRadius: '16px', padding: '20px',
  transition: 'all 0.2s',
}}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Session name with number badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                          background: `${color}20`, border: `1px solid ${color}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color, fontWeight: '800', fontSize: '13px',
                        }}>
                          {index + 1}
                        </div>

                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                            <input
                              value={editNameValue}
                              onChange={e => setEditNameValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveRename(session.id)
                                if (e.key === 'Escape') setEditingName(null)
                              }}
                              autoFocus
                              style={{
                                flex: 1, padding: '6px 10px',
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(59,130,246,0.4)',
                                borderRadius: '8px', color: 'white',
                                fontSize: '15px', fontWeight: '700', outline: 'none',
                              }}
                            />
                            <button onClick={() => saveRename(session.id)} disabled={savingName}
                              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                              {savingName ? '...' : 'Save'}
                            </button>
                            <button onClick={() => setEditingName(null)}
                              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <h3 style={{ color: 'white', fontWeight: '800', fontSize: '16px', margin: 0 }}>
                              {session.session_name}
                            </h3>
                            <button onClick={() => startRename(session)}
                              title="Rename session"
                              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '14px', padding: '2px' }}>
                              ✏️
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Meta info */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <span style={{ color: '#475569', fontSize: '12px' }}>📁 {session.file_name}</span>
                        {session.broker_name && <span style={{ color: '#475569', fontSize: '12px' }}>🏦 {session.broker_name}</span>}
                        {account && <span style={{ color: '#475569', fontSize: '12px' }}>💳 {account.name}</span>}
                        <span style={{ color: '#475569', fontSize: '12px' }}>
                          📅 {new Date(session.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Trade count badges */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '5px 12px', borderRadius: '20px',
                          background: `${color}15`, border: `1px solid ${color}30`,
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                          <span style={{ color, fontWeight: '700', fontSize: '13px' }}>{session.imported_rows} trades</span>
                        </div>
                        {session.duplicate_rows > 0 && (
                          <div style={{
                            padding: '5px 12px', borderRadius: '20px',
                            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                            color: '#f59e0b', fontSize: '12px', fontWeight: '600',
                          }}>
                            {session.duplicate_rows} duplicates skipped
                          </div>
                        )}
                        {session.error_rows > 0 && (
                          <div style={{
                            padding: '5px 12px', borderRadius: '20px',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            color: '#ef4444', fontSize: '12px', fontWeight: '600',
                          }}>
                            {session.error_rows} errors
                          </div>
                        )}
                      </div>

                      {session.description && (
                        <p style={{ color: '#475569', fontSize: '12px', margin: '10px 0 0 0', fontStyle: 'italic' }}>
                          "{session.description}"
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => loadSessionAnalytics(session.id)}
                        style={{
                          padding: '8px 16px', borderRadius: '8px', border: 'none',
                          background: isSelected ? `${color}30` : `${color}15`,
                          color, fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>
                        {loadingAnalytics === session.id ? '⏳ Loading...' : isSelected ? '▲ Hide Stats' : '📊 View Stats'}
                      </button>
                      <button onClick={() => router.push(`/dashboard/trade-log?session=${session.id}`)}
                        style={{
                          padding: '8px 16px', borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'transparent', color: '#94a3b8',
                          fontWeight: '600', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>
                        🔍 View Trades
                      </button>
                      <button onClick={() => deleteSession(session.id, session.session_name)}
                        disabled={isDeleting}
                        style={{
                          padding: '8px 16px', borderRadius: '8px',
                          border: '1px solid rgba(239,68,68,0.2)',
                          background: 'transparent', color: '#ef4444',
                          fontWeight: '600', fontSize: '12px', cursor: 'pointer',
                          whiteSpace: 'nowrap', opacity: isDeleting ? 0.5 : 1,
                        }}>
                        {isDeleting ? '⏳ Deleting...' : '🗑️ Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Analytics side panel */}
          {selectedSession && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '16px', padding: '22px',
              position: 'sticky', top: '80px',
            }}>
              <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: 'white', fontWeight: '800', fontSize: '15px', margin: '0 0 4px 0' }}>
                    📊 Session Analytics
                  </h3>
                  <button onClick={() => setSelectedSession(null)}
                    style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '18px' }}>×</button>
                </div>
                <p style={{ color: '#475569', fontSize: '12px', margin: 0, fontWeight: '600' }}>
                  {selectedSessionData?.session_name}
                </p>
              </div>

              {loadingAnalytics === selectedSession ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#3b82f6', fontSize: '13px' }}>
                  Loading analytics...
                </div>
              ) : analytics ? (
                <>
                  {/* KPI grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                    {[
                      { label: 'Trades', value: analytics.total_trades, icon: '📋' },
                      { label: 'Win Rate', value: `${(analytics.win_rate || 0).toFixed(1)}%`, icon: '🎯', color: (analytics.win_rate || 0) >= 50 ? '#10b981' : '#f59e0b' },
                      { label: 'Total PnL', value: `$${(analytics.total_pnl || 0).toFixed(2)}`, icon: '💰', color: (analytics.total_pnl || 0) >= 0 ? '#3b82f6' : '#ef4444' },
                      { label: 'Profit Factor', value: (analytics.profit_factor || 0).toFixed(2), icon: '⚡', color: (analytics.profit_factor || 0) >= 1.5 ? '#10b981' : '#f59e0b' },
                      { label: 'Avg R:R', value: (analytics.avg_risk_reward || 0).toFixed(2), icon: '⚖️' },
                      { label: 'Max Drawdown', value: `${(analytics.max_drawdown || 0).toFixed(1)}%`, icon: '📉', color: (analytics.max_drawdown || 0) > 10 ? '#ef4444' : '#94a3b8' },
                      { label: 'Discipline', value: `${(analytics.avg_discipline_score || 0).toFixed(1)}/10`, icon: '🧠', color: '#a855f7' },
                      { label: 'Revenge Trades', value: analytics.revenge_trades || 0, icon: '😤', color: (analytics.revenge_trades || 0) > 0 ? '#ef4444' : '#10b981' },
                    ].map(({ label, value, icon, color }) => (
                      <div key={label} style={{
                        background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px',
                        border: '1px solid rgba(59,130,246,0.06)',
                      }}>
                        <div style={{ fontSize: '14px', marginBottom: '3px' }}>{icon}</div>
                        <div style={{ color: '#475569', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{label}</div>
                        <div style={{ color: color || 'white', fontWeight: '800', fontSize: '16px' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Win/Loss bar */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#10b981', fontSize: '11px', fontWeight: '700' }}>✓ {analytics.winning_trades} W</span>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>{analytics.total_trades} total</span>
                      <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700' }}>{analytics.losing_trades} L ✗</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(239,68,68,0.25)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${analytics.total_trades > 0 ? (analytics.winning_trades / analytics.total_trades) * 100 : 0}%`,
                        background: 'linear-gradient(90deg, #10b981, #059669)',
                        borderRadius: '4px', transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>

                  {/* AI insight */}
                  <div style={{
                    borderRadius: '12px', padding: '14px', marginBottom: '14px',
                    background: (analytics.total_pnl || 0) >= 0 ? 'rgba(59,130,246,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${(analytics.total_pnl || 0) >= 0 ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                    <div style={{ color: '#3b82f6', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      🤖 AI Insight
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, lineHeight: '1.7' }}>
                      {generateSessionInsight(analytics, selectedSessionData?.session_name || '')}
                    </p>
                  </div>
{/* CTA buttons */}
<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
  <button
    onClick={() => router.push(`/dashboard/analytics?session=${selectedSession}`)}
    style={{
      width: '100%', padding: '10px', borderRadius: '10px',
      border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    }}>
    View Full Analytics →
  </button>
  <button
    onClick={() => router.push(`/dashboard/psychology?session=${selectedSession}`)}
    style={{
      width: '100%', padding: '10px', borderRadius: '10px',
      border: '1px solid rgba(168,85,247,0.3)',
      background: 'rgba(168,85,247,0.08)',
      color: '#c084fc', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    }}>
    🧠 View Psychology →
  </button>
  <button
    onClick={() => router.push(`/dashboard/ai-coach?session=${selectedSession}`)}
    style={{
      width: '100%', padding: '10px', borderRadius: '10px',
      border: '1px solid rgba(59,130,246,0.2)',
      background: 'transparent', color: '#60a5fa',
      fontWeight: '600', fontSize: '13px', cursor: 'pointer',
    }}>
    🤖 Ask AI Coach About This Session
  </button>
</div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#475569' }}>No analytics data yet</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}