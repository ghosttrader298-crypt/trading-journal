'use client'
import { useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAccounts } from '@/hooks/useAccounts'
import { useTrades } from '@/hooks/useTrades'
import { Trade } from '@/types'

const MARKET_TYPES = ['ALL', 'FOREX', 'CRYPTO', 'STOCKS', 'FUTURES', 'OPTIONS']
const DIRECTIONS = ['ALL', 'BUY', 'SELL']
const SESSIONS = ['ASIAN', 'LONDON', 'NEW_YORK', 'OVERLAP']
const TIMEFRAMES = ['M1','M5','M15','M30','H1','H4','D1','W1']

function TradeLogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeAccount } = useAccounts()
  const { trades, loading, createTrade, updateTrade, deleteTrade } = useTrades({ account_id: activeAccount?.id })

  const [marketFilter, setMarketFilter] = useState('ALL')
  const [dirFilter, setDirFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [showAddModal, setShowAddModal] = useState(searchParams.get('add') === '1')
  const [addStep, setAddStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Trade> & { account_id?: string }>({
    symbol: '', market_type: 'FOREX', direction: 'BUY', status: 'CLOSED',
    position_size: undefined, leverage: 1, risk_percent: undefined,
    entry_price: undefined, stop_loss: undefined, take_profit: undefined, exit_price: undefined,
    pnl_amount: undefined, fees: 0,
    strategy_name: '', setup_type: '', timeframe: 'H1', session: 'LONDON',
    reason_for_entry: '', reason_for_exit: '',
    confidence_before: 5, fear_score: 3, greed_score: 3, discipline_score: 7,
    emotional_state: 'Focused', is_revenge_trade: false, is_fomo_trade: false,
    lessons_learned: '',
    opened_at: new Date().toISOString().slice(0, 16),
    closed_at: new Date().toISOString().slice(0, 16),
  })

  const filtered = useMemo(() => {
    return trades.filter(t => {
      if (marketFilter !== 'ALL' && t.market_type !== marketFilter) return false
      if (dirFilter !== 'ALL' && t.direction !== dirFilter) return false
      if (search && !t.symbol.toLowerCase().includes(search.toLowerCase()) &&
        !(t.strategy_name || '').toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [trades, marketFilter, dirFilter, search])

  const stats = useMemo(() => {
    const closed = filtered.filter(t => t.status === 'CLOSED')
    const wins = closed.filter(t => (t.pnl_amount || 0) > 0)
    const total_pnl = closed.reduce((s, t) => s + (t.pnl_amount || 0), 0)
    return {
      total: filtered.length,
      wins: wins.length,
      losses: closed.length - wins.length,
      win_rate: closed.length > 0 ? ((wins.length / closed.length) * 100).toFixed(1) : '0.0',
      total_pnl,
    }
  }, [filtered])

  const handleSave = async () => {
    if (!form.symbol || !form.account_id && !activeAccount?.id) return
    setSaving(true)
    const payload = { ...form, account_id: form.account_id || activeAccount?.id }
    const result = await createTrade(payload)
    setSaving(false)
    if (!result.error) {
      setShowAddModal(false)
      setAddStep(1)
      router.replace('/dashboard/trade-log')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trade?')) return
    await deleteTrade(id)
    setSelectedTrade(null)
  }

  const f = (v: any) => form[v as keyof typeof form]
  const setF = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div style={{ maxWidth: '1400px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>Trade Log</h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Track and analyse every trade</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
          }}>
          + Add Trade
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total },
          { label: 'Wins', value: stats.wins, color: '#10b981' },
          { label: 'Losses', value: stats.losses, color: '#ef4444' },
          { label: 'Win Rate', value: `${stats.win_rate}%`, color: '#3b82f6' },
          { label: 'Total PnL', value: `${stats.total_pnl >= 0 ? '+' : ''}$${stats.total_pnl.toFixed(2)}`, color: stats.total_pnl >= 0 ? '#3b82f6' : '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: '10px', padding: '12px 18px',
          }}>
            <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
            <div style={{ color: color || 'white', fontWeight: '700', fontSize: '18px' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search symbol or strategy..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)',
            background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '13px', outline: 'none', minWidth: '220px',
          }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          {MARKET_TYPES.map(m => (
            <button key={m} onClick={() => setMarketFilter(m)}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                background: marketFilter === m ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: marketFilter === m ? '#60a5fa' : '#64748b',
              }}>{m}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {DIRECTIONS.map(d => (
            <button key={d} onClick={() => setDirFilter(d)}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                background: dirFilter === d ? (d === 'BUY' ? 'rgba(59,130,246,0.2)' : d === 'SELL' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)') : 'rgba(255,255,255,0.05)',
                color: dirFilter === d ? (d === 'BUY' ? '#60a5fa' : d === 'SELL' ? '#f87171' : '#60a5fa') : '#64748b',
              }}>{d}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '100px 80px 70px 80px 90px 90px 90px 80px 100px',
            padding: '12px 16px', borderBottom: '1px solid rgba(59,130,246,0.1)',
            background: 'rgba(59,130,246,0.05)',
          }}>
            {['Symbol','Market','Dir','Session','Entry','Exit','PnL','Disc.','Date'].map(h => (
              <div key={h} style={{ color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>Loading trades...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              <div style={{ color: 'white', fontWeight: '600', marginBottom: '8px' }}>No trades yet</div>
              <div style={{ color: '#475569', fontSize: '13px' }}>Add your first trade to get started</div>
            </div>
          ) : (
            filtered.map(trade => (
              <div key={trade.id}
                onClick={() => setSelectedTrade(trade)}
                style={{
                  display: 'grid', gridTemplateColumns: '100px 80px 70px 80px 90px 90px 90px 80px 100px',
                  padding: '14px 16px', borderBottom: '1px solid rgba(59,130,246,0.07)',
                  cursor: 'pointer', transition: 'background 0.15s',
                  background: selectedTrade?.id === trade.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = selectedTrade?.id === trade.id ? 'rgba(59,130,246,0.08)' : 'transparent')}
              >
                <div style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>{trade.symbol}</div>
                <div style={{ color: '#475569', fontSize: '12px' }}>{trade.market_type}</div>
                <div style={{
                  fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', width: 'fit-content',
                  background: trade.direction === 'BUY' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                  color: trade.direction === 'BUY' ? '#3b82f6' : '#ef4444',
                }}>
                  {trade.direction}
                </div>
                <div style={{ color: '#475569', fontSize: '12px' }}>{trade.session || '-'}</div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>{trade.entry_price || '-'}</div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>{trade.exit_price || '-'}</div>
                <div style={{
                  fontWeight: '700', fontSize: '13px',
                  color: (trade.pnl_amount || 0) >= 0 ? '#3b82f6' : '#ef4444',
                }}>
                  {trade.pnl_amount !== null && trade.pnl_amount !== undefined
                    ? `${trade.pnl_amount >= 0 ? '+' : ''}$${trade.pnl_amount.toFixed(2)}`
                    : '-'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>{trade.discipline_score ? `${trade.discipline_score}/10` : '-'}</div>
                <div style={{ color: '#475569', fontSize: '11px' }}>
                  {trade.opened_at ? new Date(trade.opened_at).toLocaleDateString() : '-'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trade Detail Drawer */}
      {selectedTrade && (
        <div style={{
          position: 'fixed', right: 0, top: 0, height: '100vh', width: '400px',
          background: '#0a0f1e', borderLeft: '1px solid rgba(59,130,246,0.2)',
          zIndex: 200, overflowY: 'auto', padding: '24px',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ color: 'white', fontWeight: '800', fontSize: '18px', margin: '0 0 4px 0' }}>
                {selectedTrade.symbol}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
                  background: selectedTrade.direction === 'BUY' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                  color: selectedTrade.direction === 'BUY' ? '#3b82f6' : '#ef4444',
                }}>{selectedTrade.direction}</span>
                <span style={{ fontSize: '11px', color: '#475569' }}>{selectedTrade.market_type}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleDelete(selectedTrade.id)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>
                Delete
              </button>
              <button onClick={() => setSelectedTrade(null)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', background: 'transparent', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
          </div>

          {/* PnL */}
          <div style={{
            padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center',
            background: (selectedTrade.pnl_amount || 0) >= 0 ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${(selectedTrade.pnl_amount || 0) >= 0 ? 'rgba(59,130,246,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: (selectedTrade.pnl_amount || 0) >= 0 ? '#3b82f6' : '#ef4444' }}>
              {(selectedTrade.pnl_amount || 0) >= 0 ? '+' : ''}${(selectedTrade.pnl_amount || 0).toFixed(2)}
            </div>
            <div style={{ color: '#475569', fontSize: '13px' }}>Profit / Loss</div>
          </div>

          {/* Sections */}
          {[
            {
              title: 'Price Levels', items: [
                { label: 'Entry', value: selectedTrade.entry_price },
                { label: 'Stop Loss', value: selectedTrade.stop_loss },
                { label: 'Take Profit', value: selectedTrade.take_profit },
                { label: 'Exit', value: selectedTrade.exit_price },
                { label: 'Risk/Reward', value: selectedTrade.risk_reward },
                { label: 'Fees', value: selectedTrade.fees },
              ]
            },
            {
              title: 'Strategy', items: [
                { label: 'Strategy', value: selectedTrade.strategy_name },
                { label: 'Setup', value: selectedTrade.setup_type },
                { label: 'Timeframe', value: selectedTrade.timeframe },
                { label: 'Session', value: selectedTrade.session },
              ]
            },
            {
              title: 'Psychology', items: [
                { label: 'Confidence Before', value: selectedTrade.confidence_before ? `${selectedTrade.confidence_before}/10` : null },
                { label: 'Discipline', value: selectedTrade.discipline_score ? `${selectedTrade.discipline_score}/10` : null },
                { label: 'Fear Score', value: selectedTrade.fear_score ? `${selectedTrade.fear_score}/10` : null },
                { label: 'Greed Score', value: selectedTrade.greed_score ? `${selectedTrade.greed_score}/10` : null },
                { label: 'Revenge Trade', value: selectedTrade.is_revenge_trade ? '⚠️ Yes' : '✅ No' },
                { label: 'FOMO Trade', value: selectedTrade.is_fomo_trade ? '⚠️ Yes' : '✅ No' },
              ]
            }
          ].map(section => (
            <div key={section.title} style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#3b82f6', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                {section.title}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {section.items.filter(i => i.value !== null && i.value !== undefined && i.value !== '').map(item => (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ color: '#475569', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{String(item.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {selectedTrade.lessons_learned && (
            <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ color: '#3b82f6', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Lessons Learned</div>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>{selectedTrade.lessons_learned}</p>
            </div>
          )}
        </div>
      )}

      {/* Add Trade Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{
            background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '20px',
            width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: 'white', fontWeight: '800', fontSize: '20px', margin: 0 }}>Add Trade</h2>
              <button onClick={() => { setShowAddModal(false); setAddStep(1) }}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>

            {/* Step tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px' }}>
              {[{ n: 1, label: 'Basic' }, { n: 2, label: 'Strategy' }, { n: 3, label: 'Psychology' }].map(({ n, label }) => (
                <button key={n} onClick={() => setAddStep(n)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    background: addStep === n ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: addStep === n ? '#60a5fa' : '#64748b',
                  }}>{n}. {label}</button>
              ))}
            </div>

            {/* Step 1: Basic */}
            {addStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Symbol *</label>
                    <input value={form.symbol as string} onChange={e => setF('symbol', e.target.value.toUpperCase())}
                      placeholder="EURUSD, BTCUSD..."
                      style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Market *</label>
                    <select value={form.market_type as string} onChange={e => setF('market_type', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}>
                      {['FOREX','CRYPTO','STOCKS','FUTURES','OPTIONS'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Direction *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['BUY', 'SELL'].map(d => (
                        <button key={d} onClick={() => setF('direction', d)}
                          style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '13px',
                            background: form.direction === d ? (d === 'BUY' ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.05)',
                            color: form.direction === d ? (d === 'BUY' ? '#60a5fa' : '#f87171') : '#64748b',
                          }}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Status</label>
                    <select value={form.status as string} onChange={e => setF('status', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}>
                      {['OPEN','CLOSED','CANCELLED'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {[
                  [{ k: 'entry_price', label: 'Entry Price' }, { k: 'exit_price', label: 'Exit Price' }],
                  [{ k: 'stop_loss', label: 'Stop Loss' }, { k: 'take_profit', label: 'Take Profit' }],
                  [{ k: 'pnl_amount', label: 'PnL Amount ($)' }, { k: 'position_size', label: 'Position Size' }],
                  [{ k: 'risk_percent', label: 'Risk %' }, { k: 'fees', label: 'Fees ($)' }],
                ].map((row, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {row.map(({ k, label }) => (
                      <div key={k}>
                        <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>{label}</label>
                        <input type="number" step="any" value={form[k as keyof typeof form] as any || ''} onChange={e => setF(k, e.target.value ? parseFloat(e.target.value) : undefined)}
                          style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Opened At</label>
                    <input type="datetime-local" value={form.opened_at as string} onChange={e => setF('opened_at', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Closed At</label>
                    <input type="datetime-local" value={form.closed_at as string} onChange={e => setF('closed_at', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Strategy */}
            {addStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { k: 'strategy_name', label: 'Strategy Name', placeholder: 'e.g. Breakout, Reversal...' },
                  { k: 'setup_type', label: 'Setup Type', placeholder: 'e.g. Double Top, Flag...' },
                ].map(({ k, label, placeholder }) => (
                  <div key={k}>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>{label}</label>
                    <input value={form[k as keyof typeof form] as string || ''} onChange={e => setF(k, e.target.value)} placeholder={placeholder}
                      style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Timeframe</label>
                    <select value={form.timeframe as string || 'H1'} onChange={e => setF('timeframe', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}>
                      {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Session</label>
                    <select value={form.session as string || 'LONDON'} onChange={e => setF('session', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}>
                      {SESSIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                {[
                  { k: 'reason_for_entry', label: 'Reason for Entry' },
                  { k: 'reason_for_exit', label: 'Reason for Exit' },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>{label}</label>
                    <textarea value={form[k as keyof typeof form] as string || ''} onChange={e => setF(k, e.target.value)} rows={3}
                      style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Psychology */}
            {addStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { k: 'confidence_before', label: 'Confidence Before (1-10)' },
                  { k: 'discipline_score', label: 'Discipline Score (1-10)' },
                  { k: 'fear_score', label: 'Fear Score (1-10)' },
                  { k: 'greed_score', label: 'Greed Score (1-10)' },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>{label}</label>
                      <span style={{ color: '#3b82f6', fontWeight: '700', fontSize: '14px' }}>{form[k as keyof typeof form] as number}</span>
                    </div>
                    <input type="range" min="1" max="10" value={form[k as keyof typeof form] as number || 5}
                      onChange={e => setF(k, parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#3b82f6' }} />
                  </div>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { k: 'is_revenge_trade', label: 'Revenge Trade' },
                    { k: 'is_fomo_trade', label: 'FOMO Trade' },
                  ].map(({ k, label }) => (
                    <button key={k} onClick={() => setF(k, !form[k as keyof typeof form])}
                      style={{
                        padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                        background: form[k as keyof typeof form] ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                        color: form[k as keyof typeof form] ? '#ef4444' : '#64748b',
                      }}>
                      {form[k as keyof typeof form] ? '⚠️' : '✅'} {label}
                    </button>
                  ))}
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Emotional State</label>
                  <select value={form.emotional_state as string || 'Focused'} onChange={e => setF('emotional_state', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}>
                    {['Focused','Confident','Nervous','Excited','Fearful','Greedy','Calm','Frustrated'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Lessons Learned</label>
                  <textarea value={form.lessons_learned as string || ''} onChange={e => setF('lessons_learned', e.target.value)} rows={3}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              {addStep > 1 && (
                <button onClick={() => setAddStep(addStep - 1)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', background: 'transparent', color: '#94a3b8', fontWeight: '600', cursor: 'pointer' }}>
                  ← Back
                </button>
              )}
              {addStep < 3 ? (
                <button onClick={() => setAddStep(addStep + 1)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                  Next →
                </button>
              ) : (
                <button onClick={handleSave} disabled={saving || !form.symbol}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                    background: saving ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
                  }}>
                  {saving ? 'Saving...' : '✓ Save Trade'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TradeLogPage() {
  return (
    <Suspense fallback={<div style={{ color: '#3b82f6', padding: '40px' }}>Loading...</div>}>
      <TradeLogContent />
    </Suspense>
  )
}