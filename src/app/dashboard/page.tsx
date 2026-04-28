'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useAccounts } from '@/hooks/useAccounts'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useTrades } from '@/hooks/useTrades'
import { useAuth } from '@/context/AuthContext'
import { useSearchParams, useRouter } from 'next/navigation'
import { Trade } from '@/types'

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, color, icon,
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon?: string
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(59,130,246,0.15)',
      borderRadius: '14px', padding: '18px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '10px',
      }}>
        <span style={{
          color: '#475569', fontSize: '11px', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{label}</span>
        {icon && <span style={{ fontSize: '18px' }}>{icon}</span>}
      </div>
      <div style={{
        color: color || 'white', fontWeight: '800',
        fontSize: '24px', marginBottom: '4px',
      }}>{value}</div>
      {sub && <div style={{ color: '#475569', fontSize: '12px' }}>{sub}</div>}
    </div>
  )
}

// ── CalendarView ──────────────────────────────────────────────────────────────
function CalendarView({ trades }: { trades: Trade[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const tradesByDate = useMemo(() => {
    const map: Record<string, Trade[]> = {}
    trades.forEach(t => {
      const dateStr = t.closed_at?.split('T')[0] || t.opened_at?.split('T')[0]
      if (dateStr) {
        if (!map[dateStr]) map[dateStr] = []
        map[dateStr].push(t)
      }
    })
    return map
  }, [trades])

  const selectedTrades = selectedDay ? (tradesByDate[selectedDay] || []) : []
  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 320px' : '1fr', gap: '16px' }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '16px', padding: '20px',
      }}>
        {/* Calendar header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
        }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', margin: 0 }}>
            {monthNames[month]} {year}
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1))}
              style={{
                padding: '5px 10px', borderRadius: '6px',
                border: '1px solid rgba(59,130,246,0.2)',
                background: 'transparent', color: '#94a3b8', cursor: 'pointer',
              }}>‹</button>
            <button
              onClick={() => setCurrentDate(new Date())}
              style={{
                padding: '5px 10px', borderRadius: '6px',
                border: '1px solid rgba(59,130,246,0.2)',
                background: 'transparent', color: '#94a3b8',
                cursor: 'pointer', fontSize: '11px',
              }}>Today</button>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1))}
              style={{
                padding: '5px 10px', borderRadius: '6px',
                border: '1px solid rgba(59,130,246,0.2)',
                background: 'transparent', color: '#94a3b8', cursor: 'pointer',
              }}>›</button>
          </div>
        </div>

        {/* Day headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px', marginBottom: '6px',
        }}>
          {dayNames.map(d => (
            <div key={d} style={{
              color: '#475569', fontSize: '11px', fontWeight: '600',
              textAlign: 'center', padding: '4px 0',
            }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayTrades = tradesByDate[dateStr] || []
            const dayPnl = dayTrades.reduce((s, t) => s + (t.pnl_amount || 0), 0)
            const isToday = dateStr === today
            const isSelected = selectedDay === dateStr
            const hasTrades = dayTrades.length > 0

            return (
              <div
                key={day}
                onClick={() => hasTrades && setSelectedDay(isSelected ? null : dateStr)}
                style={{
                  borderRadius: '8px', padding: '6px 4px', minHeight: '48px',
                  background: hasTrades
                    ? (dayPnl >= 0 ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)')
                    : 'rgba(255,255,255,0.02)',
                  border: isSelected
                    ? `2px solid ${dayPnl >= 0 ? '#3b82f6' : '#ef4444'}`
                    : isToday
                      ? '2px solid rgba(59,130,246,0.5)'
                      : '1px solid rgba(255,255,255,0.04)',
                  cursor: hasTrades ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontWeight: isToday ? '800' : '500',
                  color: isToday ? '#3b82f6' : '#94a3b8',
                  marginBottom: '2px',
                }}>{day}</div>
                {hasTrades && (
                  <>
                    <div style={{
                      fontSize: '9px', fontWeight: '700',
                      color: dayPnl >= 0 ? '#3b82f6' : '#ef4444',
                    }}>
                      {dayPnl >= 0 ? '+' : ''}${Math.abs(dayPnl) >= 1000
                        ? (dayPnl / 1000).toFixed(1) + 'k'
                        : dayPnl.toFixed(0)}
                    </div>
                    <div style={{ fontSize: '9px', color: '#475569' }}>
                      {dayTrades.length}t
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', gap: '16px', marginTop: '12px',
          paddingTop: '12px', borderTop: '1px solid rgba(59,130,246,0.1)',
        }}>
          {[
            { color: 'rgba(59,130,246,0.3)', label: 'Profit day' },
            { color: 'rgba(239,68,68,0.3)', label: 'Loss day' },
            { color: 'rgba(255,255,255,0.03)', label: 'No trades' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }} />
              <span style={{ color: '#475569', fontSize: '11px' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '16px', padding: '16px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px',
          }}>
            <h4 style={{ color: 'white', fontWeight: '700', fontSize: '13px', margin: 0 }}>
              {selectedDay}
            </h4>
            <button
              onClick={() => setSelectedDay(null)}
              style={{
                background: 'none', border: 'none',
                color: '#475569', cursor: 'pointer', fontSize: '16px',
              }}>×</button>
          </div>

          {/* Day summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Trades', value: selectedTrades.length },
              {
                label: 'Day PnL',
                value: `${selectedTrades.reduce((s, t) => s + (t.pnl_amount || 0), 0) >= 0 ? '+' : ''}$${selectedTrades.reduce((s, t) => s + (t.pnl_amount || 0), 0).toFixed(2)}`,
              },
              { label: 'Wins', value: selectedTrades.filter(t => (t.pnl_amount || 0) > 0).length },
              { label: 'Losses', value: selectedTrades.filter(t => (t.pnl_amount || 0) < 0).length },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'rgba(59,130,246,0.05)',
                borderRadius: '8px', padding: '8px',
              }}>
                <div style={{ color: '#475569', fontSize: '10px', marginBottom: '3px' }}>{label}</div>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Trade list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
            {selectedTrades.map(trade => (
              <div key={trade.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${(trade.pnl_amount || 0) >= 0 ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}`,
                borderRadius: '8px', padding: '10px',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: '700',
                      padding: '1px 6px', borderRadius: '4px',
                      background: trade.direction === 'BUY'
                        ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                      color: trade.direction === 'BUY' ? '#3b82f6' : '#ef4444',
                    }}>{trade.direction}</span>
                    <span style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>
                      {trade.symbol}
                    </span>
                  </div>
                  <span style={{
                    fontWeight: '700', fontSize: '13px',
                    color: (trade.pnl_amount || 0) >= 0 ? '#3b82f6' : '#ef4444',
                  }}>
                    {trade.pnl_amount != null
                      ? `${trade.pnl_amount >= 0 ? '+' : ''}$${trade.pnl_amount.toFixed(2)}`
                      : '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <span style={{ color: '#475569', fontSize: '11px' }}>{trade.market_type}</span>
                  {trade.session && (
                    <span style={{ color: '#475569', fontSize: '11px' }}>• {trade.session}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── DashboardContent ──────────────────────────────────────────────────────────
function DashboardContent() {
  const { user } = useAuth()
  const { activeAccount } = useAccounts()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session') || undefined

  const [sessionName, setSessionName] = useState('')

  // Fetch session name when session ID changes
  useEffect(() => {
    if (!sessionId) {
      setSessionName('')
      return
    }
    fetch('/api/import/sessions')
      .then(r => r.json())
      .then(d => {
        const s = d.data?.find((x: any) => x.id === sessionId)
        setSessionName(s?.session_name || s?.file_name || 'Import Session')
      })
      .catch(() => setSessionName('Import Session'))
  }, [sessionId])

  // Analytics — session mode OR account mode
  const { analytics, loading: analyticsLoading } = useAnalytics(
    sessionId ? undefined : activeAccount?.id,
    30,
    sessionId
  )

  // Trades — THIS IS THE KEY FIX: pass import_session_id when in session mode
 const { trades, loading: tradesLoading } = useTrades({
  account_id: sessionId ? undefined : activeAccount?.id,
  import_session_id: sessionId,
  limit: 500,
})

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const safeNum = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0)

  const winStreak = useMemo(() => {
    let streak = 0
    const sorted = [...trades]
      .filter(t => t.status === 'CLOSED' && t.closed_at)
      .sort((a, b) =>
        new Date(b.closed_at!).getTime() - new Date(a.closed_at!).getTime()
      )
    for (const t of sorted) {
      if ((t.pnl_amount || 0) > 0) streak++
      else break
    }
    return streak
  }, [trades])

  if (analyticsLoading || tradesLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: '400px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '600' }}>
            Loading dashboard...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: '0 0 4px 0' }}>
          {greeting()}, {user?.display_name || user?.email?.split('@')[0]} 👋
        </h1>
        <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
          {sessionId && sessionName
            ? `📦 Viewing: ${sessionName}`
            : activeAccount
              ? `Viewing: ${activeAccount.name}`
              : 'No account selected'
          } • {new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      {/* Session active banner */}
      {sessionId && sessionName && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.25)',
          flexWrap: 'wrap', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>📦</span>
            <div>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>
                Dashboard filtered by: {sessionName}
              </span>
              <span style={{ color: '#475569', fontSize: '12px', marginLeft: '8px' }}>
                {trades.length} trades in this session
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push(`/dashboard/analytics?session=${sessionId}`)}
              style={{
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid rgba(59,130,246,0.3)',
                background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>
              📊 Full Analytics
            </button>
            <button
              onClick={() => router.push(`/dashboard/psychology?session=${sessionId}`)}
              style={{
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid rgba(168,85,247,0.3)',
                background: 'rgba(168,85,247,0.08)', color: '#c084fc',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>
              🧠 Psychology
            </button>
            <button
              onClick={() => router.push(`/dashboard/ai-coach?session=${sessionId}`)}
              style={{
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid rgba(16,185,129,0.3)',
                background: 'rgba(16,185,129,0.08)', color: '#10b981',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>
              🤖 AI Coach
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#94a3b8',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px', marginBottom: '28px',
      }}>
        <StatCard
          label="Total PnL"
          value={`${safeNum(analytics?.total_pnl) >= 0 ? '+' : ''}$${safeNum(analytics?.total_pnl).toFixed(2)}`}
          sub={`${safeNum(analytics?.total_trades)} trades logged`}
          color={safeNum(analytics?.total_pnl) >= 0 ? '#3b82f6' : '#ef4444'}
          icon="💰"
        />
        <StatCard
          label="Win Rate"
          value={`${safeNum(analytics?.win_rate).toFixed(1)}%`}
          sub={`${safeNum(analytics?.winning_trades)}W / ${safeNum(analytics?.losing_trades)}L`}
          color="#10b981"
          icon="🎯"
        />
        <StatCard
          label="Win Streak"
          value={winStreak}
          sub="consecutive wins"
          color="#f59e0b"
          icon="🔥"
        />
        <StatCard
          label="Discipline Score"
          value={`${safeNum(analytics?.avg_discipline_score).toFixed(1)}/10`}
          sub="average score"
          color="#a855f7"
          icon="🧠"
        />
        <StatCard
          label="Profit Factor"
          value={safeNum(analytics?.profit_factor).toFixed(2)}
          sub="gross profit / loss"
          color="#3b82f6"
          icon="📊"
        />
        <StatCard
          label="Max Drawdown"
          value={`${safeNum(analytics?.max_drawdown).toFixed(1)}%`}
          sub="peak to trough"
          color={safeNum(analytics?.max_drawdown) > 10 ? '#ef4444' : '#94a3b8'}
          icon="📉"
        />
      </div>

      {/* Calendar */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{
          color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '16px',
        }}>
          📅 Performance Calendar
          {sessionId && sessionName && (
            <span style={{
              color: '#475569', fontSize: '13px',
              fontWeight: '400', marginLeft: '10px',
            }}>— {sessionName}</span>
          )}
        </h2>
        <CalendarView trades={trades} />
      </div>

      {/* Charts row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '16px', marginBottom: '28px',
      }}>
        {/* Equity Curve */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '16px', padding: '20px',
        }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
            📈 Equity Curve
          </h3>
          {analytics?.equity_curve && analytics.equity_curve.length > 1 ? (
            <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none">
              {(() => {
                const data = analytics.equity_curve
                const vals = data.map((d: any) => d.equity)
                const min = Math.min(...vals)
                const max = Math.max(...vals)
                const range = max - min || 1
                const points = data.map((d: any, i: number) => {
                  const x = (i / (data.length - 1)) * 400
                  const y = 160 - ((d.equity - min) / range) * 140 - 10
                  return `${x},${y}`
                }).join(' ')
                const color = vals[vals.length - 1] >= 0 ? '#3b82f6' : '#ef4444'
                return (
                  <>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={`0,160 ${points} 400,160`} fill="url(#eqGrad)" />
                    <polyline
                      points={points} fill="none"
                      stroke={color} strokeWidth="2.5" strokeLinecap="round"
                    />
                  </>
                )
              })()}
            </svg>
          ) : (
            <div style={{
              height: '160px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#475569', fontSize: '13px',
            }}>
              {trades.length === 0 ? 'No trades in this session' : 'No closed trades yet'}
            </div>
          )}
        </div>

        {/* PnL by Session */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '16px', padding: '20px',
        }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
            🌐 PnL by Trading Session
          </h3>
          {analytics?.pnl_by_session && Object.keys(analytics.pnl_by_session).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(analytics.pnl_by_session)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([session, pnl]) => {
                  const p = pnl as number
                  const maxVal = Math.max(
                    ...Object.values(analytics.pnl_by_session).map(v => Math.abs(v as number))
                  )
                  const pct = maxVal > 0 ? (Math.abs(p) / maxVal) * 100 : 0
                  return (
                    <div key={session}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginBottom: '5px',
                      }}>
                        <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                          {session}
                        </span>
                        <span style={{
                          color: p >= 0 ? '#3b82f6' : '#ef4444',
                          fontSize: '12px', fontWeight: '700',
                        }}>
                          {p >= 0 ? '+' : ''}${p.toFixed(2)}
                        </span>
                      </div>
                      <div style={{
                        height: '6px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '3px',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: '3px',
                          width: `${pct}%`,
                          background: p >= 0 ? '#3b82f6' : '#ef4444',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div style={{
              height: '160px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#475569', fontSize: '13px',
            }}>
              {trades.length === 0
                ? 'No trades in this session'
                : 'No session data (trades have no session tag)'}
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '16px', padding: '20px', marginBottom: '28px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
        }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', margin: 0 }}>
            📋 Recent Trades
            {sessionId && sessionName && (
              <span style={{ color: '#475569', fontSize: '12px', fontWeight: '400', marginLeft: '8px' }}>
                — {sessionName}
              </span>
            )}
          </h3>
          <button
            onClick={() => router.push(
              sessionId
                ? `/dashboard/trade-log?session=${sessionId}`
                : '/dashboard/trade-log'
            )}
            style={{
              background: 'none', border: 'none',
              color: '#3b82f6', fontSize: '12px',
              cursor: 'pointer', fontWeight: '600',
            }}>
            View all {trades.length} →
          </button>
        </div>
        {trades.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '30px',
            color: '#475569', fontSize: '13px',
          }}>
            No trades in this session
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {trades.slice(0, 6).map(trade => (
              <div key={trade.id} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(59,130,246,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: '700',
                    padding: '2px 7px', borderRadius: '4px',
                    background: trade.direction === 'BUY'
                      ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                    color: trade.direction === 'BUY' ? '#3b82f6' : '#ef4444',
                  }}>{trade.direction}</span>
                  <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>
                    {trade.symbol}
                  </span>
                  <span style={{ color: '#475569', fontSize: '12px' }}>
                    {trade.market_type}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ color: '#475569', fontSize: '11px' }}>
                    {trade.opened_at
                      ? new Date(trade.opened_at).toLocaleDateString()
                      : '-'}
                  </span>
                  <span style={{
                    fontWeight: '700', fontSize: '14px',
                    color: (trade.pnl_amount || 0) >= 0 ? '#3b82f6' : '#ef4444',
                  }}>
                    {trade.pnl_amount != null
                      ? `${trade.pnl_amount >= 0 ? '+' : ''}$${trade.pnl_amount.toFixed(2)}`
                      : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '16px', padding: '20px',
      }}>
        <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
          🤖 AI Insights
          {sessionId && sessionName && (
            <span style={{
              color: '#475569', fontSize: '12px',
              fontWeight: '400', marginLeft: '8px',
            }}>— {sessionName}</span>
          )}
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '12px',
        }}>
          {[
            safeNum(analytics?.revenge_trades) > 0
              ? {
                icon: '⚠️',
                text: `${analytics!.revenge_trades} revenge trade${analytics!.revenge_trades > 1 ? 's' : ''} detected. Take a break before the next session.`,
                color: '#ef4444',
              }
              : {
                icon: '✅',
                text: 'No revenge trades detected. Great emotional discipline!',
                color: '#10b981',
              },
            {
              icon: '📊',
              text: safeNum(analytics?.total_trades) > 0
                ? `Win rate is ${safeNum(analytics?.win_rate).toFixed(1)}%. ${safeNum(analytics?.win_rate) >= 50 ? 'Above 50% — keep your edge.' : 'Below 50% — focus on setup quality.'}`
                : 'No trades found in this session.',
              color: '#3b82f6',
            },
            safeNum(analytics?.avg_discipline_score) > 0
              ? {
                icon: '🧠',
                text: `Discipline avg: ${safeNum(analytics?.avg_discipline_score).toFixed(1)}/10. ${safeNum(analytics?.avg_discipline_score) >= 7 ? 'Excellent consistency!' : 'Work on following your rules more strictly.'}`,
                color: '#a855f7',
              }
              : {
                icon: '🧠',
                text: sessionId
                  ? 'This CSV import has no discipline scores. Use Add Trade for manual entries with psychology tracking.'
                  : 'Rate discipline on each trade to track psychology trends.',
                color: '#475569',
              },
          ].map((insight, i) => (
            <div key={i} style={{
              background: `${insight.color}10`,
              border: `1px solid ${insight.color}25`,
              borderRadius: '12px', padding: '14px',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{insight.icon}</div>
              <p style={{
                color: '#94a3b8', fontSize: '13px',
                margin: 0, lineHeight: '1.5',
              }}>{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: '400px',
      }}>
        <div style={{ color: '#3b82f6', fontSize: '14px' }}>Loading dashboard...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}