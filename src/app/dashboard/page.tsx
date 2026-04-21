'use client'
import { useState, useMemo } from 'react'
import { useAccounts } from '@/hooks/useAccounts'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useTrades } from '@/hooks/useTrades'
import { useAuth } from '@/context/AuthContext'

function StatCard({ label, value, sub, color = '#3b82f6', icon }: any) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)',
      borderRadius: '16px', padding: '20px', transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: '800', color, marginBottom: '4px' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#475569' }}>{sub}</div>}
    </div>
  )
}

function CalendarView({ trades }: { trades: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December']
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    trades.forEach(t => {
      if (t.closed_at) {
        const date = t.closed_at.split('T')[0]
        if (!map[date]) map[date] = []
        map[date].push(t)
      }
    })
    return map
  }, [trades])

  const selectedTrades = selectedDay ? (tradesByDate[selectedDay] || []) : []

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 340px' : '1fr', gap: '20px' }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '16px', padding: '24px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px', margin: 0 }}>
            {monthNames[month]} {year}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setCurrentDate(new Date(year, month - 1))}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
              ‹
            </button>
            <button onClick={() => setCurrentDate(new Date())}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}>
              Today
            </button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1))}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
              ›
            </button>
          </div>
        </div>

        {/* Day names */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {dayNames.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#475569', padding: '4px' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {/* Empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayTrades = tradesByDate[dateStr] || []
            const dayPnl = dayTrades.reduce((sum: number, t: any) => sum + (t.pnl_amount || 0), 0)
            const isToday = dateStr === new Date().toISOString().split('T')[0]
            const isSelected = selectedDay === dateStr
            const hasTrades = dayTrades.length > 0

            let bg = 'transparent'
            let border = '1px solid transparent'
            if (hasTrades) {
              bg = dayPnl >= 0 ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.12)'
              border = `1px solid ${dayPnl >= 0 ? 'rgba(59,130,246,0.25)' : 'rgba(239,68,68,0.25)'}`
            }
            if (isSelected) {
              bg = dayPnl >= 0 ? 'rgba(59,130,246,0.25)' : 'rgba(239,68,68,0.25)'
              border = `1px solid ${dayPnl >= 0 ? '#3b82f6' : '#ef4444'}`
            }

            return (
              <div key={day}
                onClick={() => hasTrades && setSelectedDay(isSelected ? null : dateStr)}
                style={{
                  borderRadius: '8px', padding: '6px 4px', minHeight: '52px',
                  background: bg, border,
                  cursor: hasTrades ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  outline: isToday ? '2px solid rgba(59,130,246,0.5)' : 'none',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: isToday ? '800' : '500', color: isToday ? '#3b82f6' : '#94a3b8', marginBottom: '4px' }}>
                  {day}
                </div>
                {hasTrades && (
                  <>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: dayPnl >= 0 ? '#3b82f6' : '#ef4444' }}>
                      {dayPnl >= 0 ? '+' : ''}${dayPnl.toFixed(0)}
                    </div>
                    <div style={{ fontSize: '9px', color: '#475569' }}>{dayTrades.length}t</div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
          {[
            { color: '#3b82f6', label: 'Profit day' },
            { color: '#ef4444', label: 'Loss day' },
            { color: '#1e293b', label: 'No trades' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }} />
              <span style={{ fontSize: '11px', color: '#475569' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side panel */}
      {selectedDay && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '16px', padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ color: 'white', fontWeight: '700', margin: 0, fontSize: '14px' }}>{selectedDay}</h4>
            <button onClick={() => setSelectedDay(null)}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '18px' }}>
              ×
            </button>
          </div>

          {/* Day summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {[
              { label: 'Trades', value: selectedTrades.length },
              { label: 'Day PnL', value: `$${selectedTrades.reduce((s: number, t: any) => s + (t.pnl_amount || 0), 0).toFixed(2)}` },
              { label: 'Wins', value: selectedTrades.filter((t: any) => (t.pnl_amount || 0) > 0).length },
              { label: 'Losses', value: selectedTrades.filter((t: any) => (t.pnl_amount || 0) < 0).length },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(59,130,246,0.05)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ color: '#475569', fontSize: '11px', marginBottom: '4px' }}>{label}</div>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Trades list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {selectedTrades.map((trade: any) => (
              <div key={trade.id} style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px',
                border: `1px solid ${(trade.pnl_amount || 0) >= 0 ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>{trade.symbol}</span>
                    <span style={{
                      marginLeft: '8px', fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px',
                      background: trade.direction === 'BUY' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                      color: trade.direction === 'BUY' ? '#3b82f6' : '#ef4444',
                    }}>
                      {trade.direction}
                    </span>
                  </div>
                  <span style={{
                    fontWeight: '700', fontSize: '14px',
                    color: (trade.pnl_amount || 0) >= 0 ? '#3b82f6' : '#ef4444',
                  }}>
                    {(trade.pnl_amount || 0) >= 0 ? '+' : ''}${(trade.pnl_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#475569' }}>{trade.market_type}</span>
                  {trade.session && <span style={{ fontSize: '11px', color: '#475569' }}>• {trade.session}</span>}
                  {trade.discipline_score && (
                    <span style={{ fontSize: '11px', color: '#475569' }}>• Disc: {trade.discipline_score}/10</span>
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

export default function DashboardPage() {
  const { user } = useAuth()
  const { activeAccount } = useAccounts()
  const { analytics, loading: analyticsLoading } = useAnalytics(activeAccount?.id)
  const { trades, loading: tradesLoading } = useTrades({ account_id: activeAccount?.id })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (analyticsLoading || tradesLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ color: '#3b82f6', fontSize: '14px' }}>Loading dashboard...</div>
      </div>
    )
  }

  const winStreak = (() => {
    let streak = 0
    const sorted = [...trades].filter(t => t.status === 'CLOSED').sort((a, b) =>
      new Date(b.closed_at!).getTime() - new Date(a.closed_at!).getTime()
    )
    for (const t of sorted) {
      if ((t.pnl_amount || 0) > 0) streak++
      else break
    }
    return streak
  })()

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: '0 0 4px 0' }}>
          {greeting()}, {user?.display_name || user?.email?.split('@')[0]} 👋
        </h1>
        <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
          {activeAccount ? `Viewing: ${activeAccount.name}` : 'No account selected'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard
          label="Total PnL"
          value={`${(analytics?.total_pnl || 0) >= 0 ? '+' : ''}$${(analytics?.total_pnl || 0).toFixed(2)}`}
          sub={`${analytics?.total_trades || 0} trades logged`}
          color={(analytics?.total_pnl || 0) >= 0 ? '#3b82f6' : '#ef4444'}
          icon="💰"
        />
        <StatCard
          label="Win Rate"
          value={`${(analytics?.win_rate || 0).toFixed(1)}%`}
          sub={`${analytics?.winning_trades || 0}W / ${analytics?.losing_trades || 0}L`}
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
          value={`${(analytics?.avg_discipline_score || 0).toFixed(1)}/10`}
          sub="average score"
          color="#a855f7"
          icon="🧠"
        />
        <StatCard
          label="Profit Factor"
          value={(analytics?.profit_factor || 0).toFixed(2)}
          sub="gross profit / loss"
          color="#3b82f6"
          icon="📊"
        />
        <StatCard
          label="Max Drawdown"
          value={`${(analytics?.max_drawdown || 0).toFixed(1)}%`}
          sub="peak to trough"
          color={(analytics?.max_drawdown || 0) > 10 ? '#ef4444' : '#94a3b8'}
          icon="📉"
        />
      </div>

      {/* Calendar */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '16px' }}>
          📅 Performance Calendar
        </h2>
        <CalendarView trades={trades} />
      </div>

      {/* Bottom charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
        {/* Equity Curve */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '16px', padding: '20px',
        }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
            📈 Equity Curve
          </h3>
          {analytics?.equity_curve && analytics.equity_curve.length > 0 ? (
            <div style={{ position: 'relative', height: '160px' }}>
              <svg width="100%" height="160" viewBox={`0 0 400 160`} preserveAspectRatio="none">
                {(() => {
                  const data = analytics.equity_curve
                  const vals = data.map(d => d.equity)
                  const min = Math.min(...vals)
                  const max = Math.max(...vals)
                  const range = max - min || 1
                  const points = data.map((d, i) => {
                    const x = (i / (data.length - 1)) * 400
                    const y = 160 - ((d.equity - min) / range) * 140 - 10
                    return `${x},${y}`
                  }).join(' ')
                  const lastVal = vals[vals.length - 1]
                  const color = lastVal >= 0 ? '#3b82f6' : '#ef4444'
                  return (
                    <>
                      <defs>
                        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
                          <stop offset="100%" stopColor={color} stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <polygon
                        points={`0,160 ${points} 400,160`}
                        fill="url(#equityGrad)"
                      />
                      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
                    </>
                  )
                })()}
              </svg>
            </div>
          ) : (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '13px' }}>
              No closed trades yet
            </div>
          )}
        </div>

        {/* PnL by Session */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '16px', padding: '20px',
        }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
            🌐 PnL by Session
          </h3>
          {analytics?.pnl_by_session && Object.keys(analytics.pnl_by_session).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(analytics.pnl_by_session).map(([session, pnl]) => {
                const maxVal = Math.max(...Object.values(analytics.pnl_by_session).map(Math.abs))
                const pct = maxVal > 0 ? (Math.abs(pnl) / maxVal) * 100 : 0
                return (
                  <div key={session}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>{session}</span>
                      <span style={{ color: pnl >= 0 ? '#3b82f6' : '#ef4444', fontSize: '12px', fontWeight: '700' }}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px', width: `${pct}%`,
                        background: pnl >= 0 ? '#3b82f6' : '#ef4444',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '13px' }}>
              No session data yet
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '16px', padding: '20px',
      }}>
        <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
          🤖 AI Insights
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {[
            analytics?.revenge_trades && analytics.revenge_trades > 0
              ? { icon: '⚠️', text: `${analytics.revenge_trades} revenge trade${analytics.revenge_trades > 1 ? 's' : ''} detected. Take a break before the next session.`, color: '#ef4444' }
              : { icon: '✅', text: 'No revenge trades detected. Great emotional discipline!', color: '#10b981' },
            analytics?.win_rate
              ? { icon: '📊', text: `Your win rate is ${analytics.win_rate.toFixed(1)}%. ${analytics.win_rate >= 50 ? 'Above 50% — keep your edge consistent.' : 'Below 50% — focus on setup quality over quantity.'}`, color: '#3b82f6' }
              : { icon: '📊', text: 'Log your first trades to get win rate insights.', color: '#3b82f6' },
            analytics?.avg_discipline_score
              ? { icon: '🧠', text: `Discipline avg: ${analytics.avg_discipline_score.toFixed(1)}/10. ${analytics.avg_discipline_score >= 7 ? 'Excellent consistency!' : 'Work on following your rules more strictly.'}`, color: '#a855f7' }
              : { icon: '🧠', text: 'Rate your discipline on each trade to track psychology.', color: '#a855f7' },
          ].map((insight, i) => (
            <div key={i} style={{
              background: `${insight.color}10`, border: `1px solid ${insight.color}25`,
              borderRadius: '12px', padding: '14px',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{insight.icon}</div>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}