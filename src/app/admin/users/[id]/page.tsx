'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [trades, setTrades] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [journals, setJournals] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true)
      try {
        // Fetch all user data via admin API
        const [userRes, tradesRes, sessionsRes, analyticsRes, journalsRes, goalsRes] = await Promise.all([
          fetch(`/api/admin/users/${userId}/data`),
          fetch(`/api/admin/users/${userId}/data?type=trades`),
          fetch(`/api/admin/users/${userId}/data?type=sessions`),
          fetch(`/api/admin/users/${userId}/data?type=analytics`),
          fetch(`/api/admin/users/${userId}/data?type=journals`),
          fetch(`/api/admin/users/${userId}/data?type=goals`),
        ])

        const [userData, tradesData, sessionsData, analyticsData, journalsData, goalsData] = await Promise.all([
          userRes.json(), tradesRes.json(), sessionsRes.json(),
          analyticsRes.json(), journalsRes.json(), goalsRes.json(),
        ])

        setUser(userData.data)
        setTrades(tradesData.data || [])
        setSessions(sessionsData.data || [])
        setAnalytics(analyticsData.data)
        setJournals(journalsData.data || [])
        setGoals(goalsData.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadUserData()
  }, [userId])

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'trades', label: `📋 Trades (${trades.length})` },
    { id: 'sessions', label: `📦 Sessions (${sessions.length})` },
    { id: 'journal', label: `📓 Journal (${journals.length})` },
    { id: 'goals', label: `🎯 Goals (${goals.length})` },
  ]

  const safeNum = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0)

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
        Loading user data...
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>
        User not found
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/admin/users')}
          style={{
            padding: '8px 14px', borderRadius: '8px',
            border: '1px solid rgba(239,68,68,0.2)',
            background: 'transparent', color: '#94a3b8',
            fontSize: '13px', cursor: 'pointer',
          }}>
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '18px', fontWeight: '700',
          }}>
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ color: 'white', fontWeight: '800', fontSize: '20px', margin: 0 }}>
              {user.display_name || user.email?.split('@')[0]}
            </h1>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ color: '#475569', fontSize: '13px' }}>{user.email}</span>
              <span style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700',
                background: user.status === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: user.status === 'ACTIVE' ? '#10b981' : '#ef4444',
              }}>
                {user.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '20px',
        background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px',
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
              background: activeTab === tab.id ? 'rgba(239,68,68,0.15)' : 'transparent',
              color: activeTab === tab.id ? '#f87171' : '#64748b',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px', marginBottom: '20px',
          }}>
            {[
              { label: 'Total Trades', value: safeNum(analytics.total_trades), icon: '📋', color: 'white' },
              { label: 'Win Rate', value: `${safeNum(analytics.win_rate).toFixed(1)}%`, icon: '🎯', color: safeNum(analytics.win_rate) >= 50 ? '#10b981' : '#f59e0b' },
              { label: 'Total PnL', value: `$${safeNum(analytics.total_pnl).toFixed(2)}`, icon: '💰', color: safeNum(analytics.total_pnl) >= 0 ? '#3b82f6' : '#ef4444' },
              { label: 'Profit Factor', value: safeNum(analytics.profit_factor).toFixed(2), icon: '⚡', color: '#a855f7' },
              { label: 'Max Drawdown', value: `${safeNum(analytics.max_drawdown).toFixed(1)}%`, icon: '📉', color: safeNum(analytics.max_drawdown) > 10 ? '#ef4444' : '#94a3b8' },
              { label: 'Revenge Trades', value: safeNum(analytics.revenge_trades), icon: '😤', color: safeNum(analytics.revenge_trades) > 0 ? '#ef4444' : '#10b981' },
              { label: 'Discipline Avg', value: `${safeNum(analytics.avg_discipline_score).toFixed(1)}/10`, icon: '🧠', color: '#a855f7' },
              { label: 'Import Sessions', value: sessions.length, icon: '📦', color: '#f59e0b' },
            ].map(kpi => (
              <div key={kpi.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(239,68,68,0.1)',
                borderRadius: '12px', padding: '14px',
              }}>
                <div style={{ fontSize: '18px', marginBottom: '6px' }}>{kpi.icon}</div>
                <div style={{ color: '#475569', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {kpi.label}
                </div>
                <div style={{ color: kpi.color, fontWeight: '800', fontSize: '20px' }}>
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>

          {/* User details */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(239,68,68,0.1)',
            borderRadius: '14px', padding: '20px',
          }}>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
              Account Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'User ID', value: user.id },
                { label: 'Role', value: user.role },
                { label: 'Status', value: user.status },
                { label: 'Timezone', value: user.timezone || 'UTC' },
                { label: 'Currency', value: user.preferred_currency || 'USD' },
                { label: 'Risk Tolerance', value: `${user.risk_tolerance || 1}%` },
                { label: 'Registered', value: new Date(user.created_at).toLocaleString() },
                { label: 'Last Login', value: user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '10px 12px',
                }}>
                  <div style={{ color: '#475569', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px' }}>
                    {label}
                  </div>
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', wordBreak: 'break-all' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trades Tab */}
      {activeTab === 'trades' && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(239,68,68,0.1)',
          borderRadius: '14px', overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '100px 80px 70px 90px 90px 90px 100px',
            padding: '10px 14px', background: 'rgba(239,68,68,0.05)',
            borderBottom: '1px solid rgba(239,68,68,0.1)',
          }}>
            {['Symbol', 'Market', 'Dir', 'Entry', 'Exit', 'PnL', 'Date'].map(h => (
              <div key={h} style={{ color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                {h}
              </div>
            ))}
          </div>
          {trades.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>No trades</div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {trades.map(trade => (
                <div key={trade.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 80px 70px 90px 90px 90px 100px',
                  padding: '11px 14px',
                  borderBottom: '1px solid rgba(239,68,68,0.06)',
                  alignItems: 'center',
                }}>
                  <div style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>{trade.symbol}</div>
                  <div style={{ color: '#475569', fontSize: '12px' }}>{trade.market_type}</div>
                  <div style={{
                    fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', width: 'fit-content',
                    background: trade.direction === 'BUY' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                    color: trade.direction === 'BUY' ? '#3b82f6' : '#ef4444',
                  }}>{trade.direction}</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>{trade.entry_price || '-'}</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>{trade.exit_price || '-'}</div>
                  <div style={{
                    fontWeight: '700', fontSize: '13px',
                    color: (trade.pnl_amount || 0) >= 0 ? '#3b82f6' : '#ef4444',
                  }}>
                    {trade.pnl_amount != null
                      ? `${trade.pnl_amount >= 0 ? '+' : ''}$${trade.pnl_amount.toFixed(2)}`
                      : '-'}
                  </div>
                  <div style={{ color: '#475569', fontSize: '11px' }}>
                    {trade.opened_at ? new Date(trade.opened_at).toLocaleDateString() : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sessions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(239,68,68,0.1)',
              borderRadius: '14px', color: '#475569',
            }}>No import sessions</div>
          ) : sessions.map((session: any) => (
            <div key={session.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(239,68,68,0.1)',
              borderRadius: '12px', padding: '16px',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: '10px',
            }}>
              <div>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
                  {session.session_name || session.file_name}
                </div>
                <div style={{ color: '#475569', fontSize: '12px' }}>
                  📁 {session.file_name} • 📅 {new Date(session.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '20px',
                  background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
                  color: '#60a5fa', fontWeight: '700', fontSize: '13px',
                }}>
                  {session.imported_rows} trades
                </span>
                <span style={{
                  padding: '4px 10px', borderRadius: '20px',
                  background: 'rgba(16,185,129,0.1)',
                  color: '#10b981', fontSize: '11px', fontWeight: '600',
                }}>
                  ✓ {session.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Journal Tab */}
      {activeTab === 'journal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {journals.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(239,68,68,0.1)',
              borderRadius: '14px', color: '#475569',
            }}>No journal entries</div>
          ) : journals.map((entry: any) => (
            <div key={entry.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(239,68,68,0.1)',
              borderRadius: '12px', padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>
                  {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {entry.mood_before && <span style={{ fontSize: '18px' }}>
                    {['😤', '😟', '😐', '😊', '🔥'][entry.mood_before - 1]}
                  </span>}
                </div>
              </div>
              {entry.plan && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Plan</div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                    {entry.plan.slice(0, 200)}{entry.plan.length > 200 ? '...' : ''}
                  </p>
                </div>
              )}
              {entry.lessons && (
                <div>
                  <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Lessons</div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                    {entry.lessons.slice(0, 200)}{entry.lessons.length > 200 ? '...' : ''}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {goals.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(239,68,68,0.1)',
              borderRadius: '14px', color: '#475569',
              gridColumn: '1 / -1',
            }}>No goals set</div>
          ) : goals.map((goal: any) => {
            const pct = goal.target_value > 0
              ? Math.min((goal.current_value / goal.target_value) * 100, 100)
              : 0
            return (
              <div key={goal.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(239,68,68,0.1)',
                borderRadius: '12px', padding: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h4 style={{ color: 'white', fontWeight: '700', fontSize: '14px', margin: 0 }}>
                    {goal.title}
                  </h4>
                  <span style={{ color: '#3b82f6', fontWeight: '800', fontSize: '18px' }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '8px' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px', width: `${pct}%`,
                    background: pct >= 100 ? '#10b981' : '#3b82f6',
                  }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                    background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
                  }}>
                    {goal.goal_type.replace(/_/g, ' ')}
                  </span>
                  {goal.period && (
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                      background: 'rgba(255,255,255,0.05)', color: '#475569',
                    }}>
                      {goal.period}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}