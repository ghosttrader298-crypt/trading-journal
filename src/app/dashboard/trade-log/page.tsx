'use client'
import { useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAccounts } from '@/hooks/useAccounts'
import { useTrades } from '@/hooks/useTrades'
import { Trade } from '@/types'

const MARKET_TYPES = ['ALL', 'FOREX', 'CRYPTO', 'STOCKS', 'FUTURES', 'OPTIONS']
const DIRECTIONS = ['ALL', 'BUY', 'SELL']
const SESSIONS = ['ASIAN', 'LONDON', 'NEW_YORK', 'OVERLAP']
const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1']

function generateMQLCode(apiKey: string, version: 4 | 5): string {
  const endpoint = typeof window !== 'undefined'
    ? `${window.location.origin}/api/ea-sync`
    : 'https://your-domain.com/api/ea-sync'
  return `//+------------------------------------------------------------------+
//| Ghost Trader EA — Auto Sync v1.0                                  |
//+------------------------------------------------------------------+
#property copyright "Ghost Trader"
#property version   "1.0"
#property strict

input string ApiKey = "${apiKey}";
input string ServerUrl = "${endpoint}";
input string AccountId = "YOUR_ACCOUNT_ID_HERE";
input int    SyncIntervalSeconds = 30;

datetime lastSync = 0;

int OnInit() {
   Print("Ghost Trader EA initialized. Syncing to: ", ServerUrl);
   return(INIT_SUCCEEDED);
}

void OnTick() {
   if(TimeCurrent() - lastSync < SyncIntervalSeconds) return;
   lastSync = TimeCurrent();
   SyncTrades();
}

void SyncTrades() {
   int total = OrdersHistoryTotal();
   string jsonBody = "{";
   jsonBody += "\\"account_id\\": \\"" + AccountId + "\\",";
   jsonBody += "\\"trades\\": [";
   for(int i = 0; i < MathMin(total, 50); i++) {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;
      if(i > 0) jsonBody += ",";
      jsonBody += "{";
      jsonBody += "\\"ticket\\": \\"" + IntegerToString(OrderTicket()) + "\\",";
      jsonBody += "\\"symbol\\": \\"" + OrderSymbol() + "\\",";
      jsonBody += "\\"direction\\": \\"" + (OrderType() == 0 ? "BUY" : "SELL") + "\\",";
      jsonBody += "\\"entry_price\\": " + DoubleToString(OrderOpenPrice(), 5) + ",";
      jsonBody += "\\"exit_price\\": " + DoubleToString(OrderClosePrice(), 5) + ",";
      jsonBody += "\\"stop_loss\\": " + DoubleToString(OrderStopLoss(), 5) + ",";
      jsonBody += "\\"take_profit\\": " + DoubleToString(OrderTakeProfit(), 5) + ",";
      jsonBody += "\\"lots\\": " + DoubleToString(OrderLots(), 2) + ",";
      jsonBody += "\\"profit\\": " + DoubleToString(OrderProfit(), 2) + ",";
      jsonBody += "\\"commission\\": " + DoubleToString(OrderCommission(), 2) + ",";
      jsonBody += "\\"open_time\\": \\"" + TimeToString(OrderOpenTime()) + "\\",";
      jsonBody += "\\"close_time\\": \\"" + TimeToString(OrderCloseTime()) + "\\",";
      jsonBody += "\\"comment\\": \\"" + OrderComment() + "\\"";
      jsonBody += "}";
   }
   jsonBody += "]}";
   char data[];
   char result[];
   string headers = "Content-Type: application/json\\r\\nx-api-key: " + ApiKey;
   StringToCharArray(jsonBody, data, 0, StringLen(jsonBody));
   int res = WebRequest("POST", ServerUrl, headers, 5000, data, result, headers);
   if(res == 200) {
      Print("Ghost Trader: Sync successful");
   } else {
      Print("Ghost Trader: Sync failed, code: ", res);
   }
}
`
}

function TradeLogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeAccount } = useAccounts()

  // Read session filter from URL
  const sessionFilter = searchParams.get('session') || undefined

  const { trades, loading, createTrade, deleteTrade, refetch } = useTrades({
    account_id: sessionFilter ? undefined : activeAccount?.id,
    import_session_id: sessionFilter,
  })

  // Filter & sort state
  const [marketFilter, setMarketFilter] = useState('ALL')
  const [dirFilter, setDirFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)

  // Add trade modal state
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

  // Import/EA state
  const [showImportModal, setShowImportModal] = useState(false)
  const [showEAModal, setShowEAModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [eaKey, setEaKey] = useState<string | null>(null)
  const [eaKeyLoading, setEaKeyLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Session import fields
  const [importSessionName, setImportSessionName] = useState('')
  const [importBrokerName, setImportBrokerName] = useState('')
  const [importDescription, setImportDescription] = useState('')

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

  const handleFileSelect = (file: File) => {
    setImportFile(file)
    setImportResult(null)
    if (!importSessionName) {
      setImportSessionName(file.name.replace('.csv', '').replace(/_/g, ' '))
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(l => l.trim()).slice(0, 6)
      const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || []
      const rows = lines.slice(1).map(line =>
        line.split(',').map(c => c.trim().replace(/"/g, ''))
      )
      setImportPreview([headers, ...rows])
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!importFile || !activeAccount?.id) return
    setImporting(true)
    const fd = new FormData()
    fd.append('file', importFile)
    fd.append('account_id', activeAccount.id)
    fd.append('session_name', importSessionName || `My Trade Log ${new Date().toLocaleDateString()}`)
    fd.append('broker_name', importBrokerName)
    fd.append('description', importDescription)
    const res = await fetch('/api/import/csv', { method: 'POST', body: fd })
    const data = await res.json()
    setImporting(false)
    if (res.ok) {
      setImportResult(data.data)
      refetch?.()
    } else {
      setImportResult({ error: data.error })
    }
  }

  const resetImportModal = () => {
    setShowImportModal(false)
    setImportFile(null)
    setImportPreview([])
    setImportResult(null)
    setImportSessionName('')
    setImportBrokerName('')
    setImportDescription('')
  }

  const loadEAKey = async () => {
    const res = await fetch('/api/user/ea-key')
    const data = await res.json()
    setEaKey(data.data?.ea_api_key || null)
  }

  const generateEAKey = async () => {
    setEaKeyLoading(true)
    const res = await fetch('/api/user/ea-key', { method: 'POST' })
    const data = await res.json()
    setEaKey(data.data?.ea_api_key)
    setEaKeyLoading(false)
  }

  const handleSave = async () => {
    if (!form.symbol) return
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

  const setF = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: '8px', color: 'white', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
  }

  const selectStyle: React.CSSProperties = { ...inputStyle, background: '#0a0f1e' }

  return (
    <div style={{ maxWidth: '1400px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: 'white', fontWeight: '800', fontSize: '20px', margin: '0 0 4px 0' }}>Trade Log</h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Track and analyse every trade</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowImportModal(true)}
            style={{
              padding: '9px 14px', borderRadius: '10px',
              border: '1px solid rgba(59,130,246,0.3)',
              background: 'rgba(59,130,246,0.08)',
              color: '#60a5fa', fontWeight: '600', fontSize: '13px',
              cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            📥 Import CSV
          </button>
          <button onClick={() => { setShowEAModal(true); loadEAKey() }}
            style={{
              padding: '9px 14px', borderRadius: '10px',
              border: '1px solid rgba(168,85,247,0.3)',
              background: 'rgba(168,85,247,0.08)',
              color: '#c084fc', fontWeight: '600', fontSize: '13px',
              cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            🤖 EA Auto-Sync
          </button>
          <button onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 16px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white', fontWeight: '700', fontSize: '13px',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            + Add Trade
          </button>
        </div>
      </div>

      {/* Session filter banner */}
      {sessionFilter && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderRadius: '12px', marginBottom: '16px',
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>🔍</span>
            <div>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>
                Viewing Import Session trades only
              </span>
              <span style={{ color: '#475569', fontSize: '12px', marginLeft: '8px' }}>
                {trades.length} trades in this session
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/trade-log')}
            style={{
              padding: '6px 14px', borderRadius: '8px',
              border: '1px solid rgba(59,130,246,0.3)',
              background: 'transparent', color: '#60a5fa',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            }}>
            ✕ Clear Filter
          </button>
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { label: 'Total', value: stats.total },
          { label: 'Wins', value: stats.wins, color: '#10b981' },
          { label: 'Losses', value: stats.losses, color: '#ef4444' },
          { label: 'Win Rate', value: `${stats.win_rate}%`, color: '#3b82f6' },
          { label: 'PnL', value: `${stats.total_pnl >= 0 ? '+' : ''}$${stats.total_pnl.toFixed(2)}`, color: stats.total_pnl >= 0 ? '#3b82f6' : '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: '10px', padding: '10px 14px', flexShrink: 0,
          }}>
            <div style={{ color: '#475569', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
            <div style={{ color: color || 'white', fontWeight: '700', fontSize: '16px' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input placeholder="Search symbol or strategy..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '9px 14px', borderRadius: '8px',
            border: '1px solid rgba(59,130,246,0.2)',
            background: 'rgba(255,255,255,0.05)', color: 'white',
            fontSize: '13px', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
          {MARKET_TYPES.map(m => (
            <button key={m} onClick={() => setMarketFilter(m)}
              style={{
                padding: '6px 10px', borderRadius: '8px', border: 'none',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer', flexShrink: 0,
                background: marketFilter === m ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: marketFilter === m ? '#60a5fa' : '#64748b',
              }}>{m}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {DIRECTIONS.map(d => (
            <button key={d} onClick={() => setDirFilter(d)}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                background: dirFilter === d
                  ? (d === 'BUY' ? 'rgba(59,130,246,0.2)' : d === 'SELL' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)')
                  : 'rgba(255,255,255,0.05)',
                color: dirFilter === d
                  ? (d === 'BUY' ? '#60a5fa' : d === 'SELL' ? '#f87171' : '#60a5fa')
                  : '#64748b',
              }}>{d}</button>
          ))}
        </div>
      </div>

      {/* Trade list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Loading trades...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <div style={{ color: 'white', fontWeight: '600', marginBottom: '8px' }}>No trades yet</div>
          <div style={{ color: '#475569', fontSize: '13px' }}>Add your first trade or import a CSV to get started</div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="trade-table" style={{ overflowX: 'auto' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', overflow: 'hidden', minWidth: '640px' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '100px 80px 70px 80px 90px 90px 90px 80px 100px',
                padding: '12px 16px', borderBottom: '1px solid rgba(59,130,246,0.1)',
                background: 'rgba(59,130,246,0.05)',
              }}>
                {['Symbol', 'Market', 'Dir', 'Session', 'Entry', 'Exit', 'PnL', 'Disc.', 'Date'].map(h => (
                  <div key={h} style={{ color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>
              {filtered.map(trade => (
                <div key={trade.id}
                  onClick={() => setSelectedTrade(trade)}
                  style={{
                    display: 'grid', gridTemplateColumns: '100px 80px 70px 80px 90px 90px 90px 80px 100px',
                    padding: '13px 16px', borderBottom: '1px solid rgba(59,130,246,0.07)',
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
                  }}>{trade.direction}</div>
                  <div style={{ color: '#475569', fontSize: '12px' }}>{trade.session || '-'}</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>{trade.entry_price || '-'}</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>{trade.exit_price || '-'}</div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: (trade.pnl_amount || 0) >= 0 ? '#3b82f6' : '#ef4444' }}>
                    {trade.pnl_amount != null ? `${trade.pnl_amount >= 0 ? '+' : ''}$${trade.pnl_amount.toFixed(2)}` : '-'}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>{trade.discipline_score ? `${trade.discipline_score}/10` : '-'}</div>
                  <div style={{ color: '#475569', fontSize: '11px' }}>
                    {trade.opened_at ? new Date(trade.opened_at).toLocaleDateString() : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="trade-cards" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(trade => (
              <div key={trade.id}
                onClick={() => setSelectedTrade(trade)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${(trade.pnl_amount || 0) >= 0 ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  borderRadius: '12px', padding: '14px', cursor: 'pointer',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ color: 'white', fontWeight: '800', fontSize: '16px' }}>{trade.symbol}</span>
                    <span style={{
                      marginLeft: '8px', fontSize: '10px', fontWeight: '700',
                      padding: '2px 7px', borderRadius: '4px',
                      background: trade.direction === 'BUY' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                      color: trade.direction === 'BUY' ? '#3b82f6' : '#ef4444',
                    }}>{trade.direction}</span>
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '16px', color: (trade.pnl_amount || 0) >= 0 ? '#3b82f6' : '#ef4444' }}>
                    {trade.pnl_amount != null ? `${trade.pnl_amount >= 0 ? '+' : ''}$${trade.pnl_amount.toFixed(2)}` : '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[
                    { label: trade.market_type },
                    { label: trade.session || '' },
                    { label: trade.discipline_score ? `Disc: ${trade.discipline_score}/10` : '' },
                    { label: trade.opened_at ? new Date(trade.opened_at).toLocaleDateString() : '' },
                  ].filter(i => i.label).map((item, i) => (
                    <span key={i} style={{ color: '#475569', fontSize: '12px' }}>{item.label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Trade Detail Drawer */}
      {selectedTrade && (
        <>
          <div onClick={() => setSelectedTrade(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 }} />
          <div style={{
            position: 'fixed', right: 0, top: 0, height: '100vh',
            width: 'min(400px, 100vw)',
            background: '#0a0f1e', borderLeft: '1px solid rgba(59,130,246,0.2)',
            zIndex: 200, overflowY: 'auto', padding: '20px',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ color: 'white', fontWeight: '800', fontSize: '18px', margin: '0 0 4px 0' }}>{selectedTrade.symbol}</h3>
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

            <div style={{
              padding: '16px', borderRadius: '12px', marginBottom: '16px', textAlign: 'center',
              background: (selectedTrade.pnl_amount || 0) >= 0 ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${(selectedTrade.pnl_amount || 0) >= 0 ? 'rgba(59,130,246,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: (selectedTrade.pnl_amount || 0) >= 0 ? '#3b82f6' : '#ef4444' }}>
                {(selectedTrade.pnl_amount || 0) >= 0 ? '+' : ''}${(selectedTrade.pnl_amount || 0).toFixed(2)}
              </div>
              <div style={{ color: '#475569', fontSize: '12px' }}>Profit / Loss</div>
            </div>

            {[
              {
                title: 'Price Levels', items: [
                  { label: 'Entry', value: selectedTrade.entry_price },
                  { label: 'Stop Loss', value: selectedTrade.stop_loss },
                  { label: 'Take Profit', value: selectedTrade.take_profit },
                  { label: 'Exit', value: selectedTrade.exit_price },
                  { label: 'R:R', value: selectedTrade.risk_reward },
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
                  { label: 'Confidence', value: selectedTrade.confidence_before ? `${selectedTrade.confidence_before}/10` : null },
                  { label: 'Discipline', value: selectedTrade.discipline_score ? `${selectedTrade.discipline_score}/10` : null },
                  { label: 'Fear', value: selectedTrade.fear_score ? `${selectedTrade.fear_score}/10` : null },
                  { label: 'Greed', value: selectedTrade.greed_score ? `${selectedTrade.greed_score}/10` : null },
                  { label: 'Revenge', value: selectedTrade.is_revenge_trade ? '⚠️ Yes' : '✅ No' },
                  { label: 'FOMO', value: selectedTrade.is_fomo_trade ? '⚠️ Yes' : '✅ No' },
                ]
              }
            ].map(section => (
              <div key={section.title} style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#3b82f6', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  {section.title}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {section.items.filter(i => i.value !== null && i.value !== undefined && i.value !== '').map(item => (
                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ color: '#475569', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{String(item.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {selectedTrade.lessons_learned && (
              <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ color: '#3b82f6', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Lessons</div>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>{selectedTrade.lessons_learned}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Trade Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} className="modal-backdrop">
          <div style={{
            background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', padding: '24px',
          }} className="modal-desktop">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'white', fontWeight: '800', fontSize: '18px', margin: 0 }}>Add Trade</h2>
              <button onClick={() => { setShowAddModal(false); setAddStep(1) }}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px' }}>
              {[{ n: 1, label: 'Basic' }, { n: 2, label: 'Strategy' }, { n: 3, label: 'Psychology' }].map(({ n, label }) => (
                <button key={n} onClick={() => setAddStep(n)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    background: addStep === n ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: addStep === n ? '#60a5fa' : '#64748b',
                  }}>{n}. {label}</button>
              ))}
            </div>

            {addStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Symbol *</label>
                    <input value={form.symbol as string} onChange={e => setF('symbol', e.target.value.toUpperCase())}
                      placeholder="EURUSD..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Market *</label>
                    <select value={form.market_type as string} onChange={e => setF('market_type', e.target.value)} style={selectStyle}>
                      {['FOREX', 'CRYPTO', 'STOCKS', 'FUTURES', 'OPTIONS'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Direction *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['BUY', 'SELL'].map(d => (
                      <button key={d} onClick={() => setF('direction', d)}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                          fontWeight: '700', cursor: 'pointer', fontSize: '14px',
                          background: form.direction === d ? (d === 'BUY' ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.05)',
                          color: form.direction === d ? (d === 'BUY' ? '#60a5fa' : '#f87171') : '#64748b',
                        }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { k: 'entry_price', label: 'Entry Price' },
                    { k: 'exit_price', label: 'Exit Price' },
                    { k: 'stop_loss', label: 'Stop Loss' },
                    { k: 'take_profit', label: 'Take Profit' },
                    { k: 'pnl_amount', label: 'PnL ($)' },
                    { k: 'fees', label: 'Fees ($)' },
                  ].map(({ k, label }) => (
                    <div key={k}>
                      <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>{label}</label>
                      <input type="number" step="any"
                        value={form[k as keyof typeof form] as any || ''}
                        onChange={e => setF(k, e.target.value ? parseFloat(e.target.value) : undefined)}
                        style={inputStyle} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Opened At</label>
                    <input type="datetime-local" value={form.opened_at as string} onChange={e => setF('opened_at', e.target.value)} style={{ ...inputStyle, fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Closed At</label>
                    <input type="datetime-local" value={form.closed_at as string} onChange={e => setF('closed_at', e.target.value)} style={{ ...inputStyle, fontSize: '12px' }} />
                  </div>
                </div>
              </div>
            )}

            {addStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { k: 'strategy_name', label: 'Strategy Name', placeholder: 'e.g. Breakout...' },
                  { k: 'setup_type', label: 'Setup Type', placeholder: 'e.g. Double Top...' },
                ].map(({ k, label, placeholder }) => (
                  <div key={k}>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>{label}</label>
                    <input value={form[k as keyof typeof form] as string || ''} onChange={e => setF(k, e.target.value)}
                      placeholder={placeholder} style={inputStyle} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Timeframe</label>
                    <select value={form.timeframe as string || 'H1'} onChange={e => setF('timeframe', e.target.value)} style={selectStyle}>
                      {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Session</label>
                    <select value={form.session as string || 'LONDON'} onChange={e => setF('session', e.target.value)} style={selectStyle}>
                      {SESSIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                {[
                  { k: 'reason_for_entry', label: 'Reason for Entry' },
                  { k: 'reason_for_exit', label: 'Reason for Exit' },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>{label}</label>
                    <textarea value={form[k as keyof typeof form] as string || ''} onChange={e => setF(k, e.target.value)} rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                ))}
              </div>
            )}

            {addStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { k: 'confidence_before', label: 'Confidence Before' },
                  { k: 'discipline_score', label: 'Discipline Score' },
                  { k: 'fear_score', label: 'Fear Score' },
                  { k: 'greed_score', label: 'Greed Score' },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>{label} (1-10)</label>
                      <span style={{ color: '#3b82f6', fontWeight: '700', fontSize: '14px' }}>{form[k as keyof typeof form] as number}</span>
                    </div>
                    <input type="range" min="1" max="10"
                      value={form[k as keyof typeof form] as number || 5}
                      onChange={e => setF(k, parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#3b82f6' }} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[{ k: 'is_revenge_trade', label: 'Revenge Trade' }, { k: 'is_fomo_trade', label: 'FOMO Trade' }].map(({ k, label }) => (
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
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Emotional State</label>
                  <select value={form.emotional_state as string || 'Focused'} onChange={e => setF('emotional_state', e.target.value)} style={selectStyle}>
                    {['Focused', 'Confident', 'Nervous', 'Excited', 'Fearful', 'Greedy', 'Calm', 'Frustrated'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Lessons Learned</label>
                  <textarea value={form.lessons_learned as string || ''} onChange={e => setF('lessons_learned', e.target.value)} rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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

      {/* CSV Import Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{
            background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: '20px', width: '100%', maxWidth: '620px',
            maxHeight: '90vh', overflowY: 'auto', padding: '28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: 'white', fontWeight: '800', fontSize: '20px', margin: '0 0 4px 0' }}>📥 Import CSV</h2>
                <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Supports MT4, MT5, cTrader and generic broker exports</p>
              </div>
              <button onClick={resetImportModal}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['MT4', 'MT5', 'cTrader', 'TradingView', 'Generic CSV'].map(f => (
                <span key={f} style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa',
                }}>{f}</span>
              ))}
            </div>

            {!importResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                    Session Name *
                  </label>
                  <input
                    value={importSessionName}
                    onChange={e => setImportSessionName(e.target.value)}
                    placeholder="e.g. My Trade Log 1, My Trade Log 2..."
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                      Broker (optional)
                    </label>
                    <input
                      value={importBrokerName}
                      onChange={e => setImportBrokerName(e.target.value)}
                      placeholder="e.g. IC Markets, FTMO..."
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                      Notes (optional)
                    </label>
                    <input
                      value={importDescription}
                      onChange={e => setImportDescription(e.target.value)}
                      placeholder="e.g. Phase 1 challenge..."
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {!importResult && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
                onClick={() => document.getElementById('csv-file-input')?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#3b82f6' : importFile ? 'rgba(16,185,129,0.5)' : 'rgba(59,130,246,0.25)'}`,
                  borderRadius: '14px', padding: '28px', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? 'rgba(59,130,246,0.08)' : importFile ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s', marginBottom: '16px',
                }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{importFile ? '✅' : '📂'}</div>
                <div style={{ color: importFile ? '#10b981' : 'white', fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>
                  {importFile ? importFile.name : 'Drop your CSV file here'}
                </div>
                <div style={{ color: '#475569', fontSize: '13px' }}>
                  {importFile ? `${(importFile.size / 1024).toFixed(1)} KB • Click to change` : 'or click to browse — .csv files only'}
                </div>
                <input id="csv-file-input" type="file" accept=".csv" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
              </div>
            )}

            {importPreview.length > 0 && !importResult && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Preview — first {importPreview.length - 1} rows
                </div>
                <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(59,130,246,0.08)' }}>
                        {importPreview[0]?.slice(0, 8).map((h: string, i: number) => (
                          <th key={i} style={{ padding: '8px 10px', color: '#60a5fa', fontWeight: '700', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(1).map((row: string[], i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
                          {row.slice(0, 8).map((cell: string, j: number) => (
                            <td key={j} style={{ padding: '7px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{cell || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importResult && (
              <div style={{
                padding: '20px', borderRadius: '14px', marginBottom: '20px',
                background: importResult.error ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                border: `1px solid ${importResult.error ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
              }}>
                {importResult.error ? (
                  <div style={{ color: '#ef4444', fontWeight: '600' }}>❌ {importResult.error}</div>
                ) : (
                  <>
                    <div style={{ color: '#10b981', fontWeight: '800', fontSize: '18px', marginBottom: '4px' }}>✅ Import Complete</div>
                    <div style={{ color: '#475569', fontSize: '13px', marginBottom: '16px' }}>
                      Session: <strong style={{ color: '#60a5fa' }}>{importResult.session_name}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'Format Detected', value: importResult.format_detected },
                        { label: 'Total Rows', value: importResult.total_rows },
                        { label: 'Imported', value: importResult.imported, color: '#10b981' },
                        { label: 'Duplicates Skipped', value: importResult.duplicates, color: '#f59e0b' },
                        { label: 'Errors', value: importResult.errors, color: importResult.errors > 0 ? '#ef4444' : '#94a3b8' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
                          <div style={{ color: color || 'white', fontWeight: '700', fontSize: '18px' }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => router.push('/dashboard/import-sessions')}
                      style={{
                        marginTop: '14px', width: '100%', padding: '10px', borderRadius: '10px',
                        border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)',
                        color: '#60a5fa', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                      }}>
                      📦 View Import Sessions →
                    </button>
                  </>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={resetImportModal}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', background: 'transparent', color: '#94a3b8', fontWeight: '600', cursor: 'pointer' }}>
                {importResult ? 'Close' : 'Cancel'}
              </button>
              {!importResult && (
                <button onClick={handleImport} disabled={!importFile || importing}
                  style={{
                    flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                    background: !importFile || importing ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white', fontWeight: '700', cursor: !importFile || importing ? 'not-allowed' : 'pointer',
                  }}>
                  {importing ? '⏳ Importing...' : `📥 Import ${importFile ? 'Trades' : 'File'}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EA Auto-Sync Modal */}
      {showEAModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{
            background: '#0a0f1e', border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: '20px', width: '100%', maxWidth: '580px',
            maxHeight: '90vh', overflowY: 'auto', padding: '28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: 'white', fontWeight: '800', fontSize: '20px', margin: '0 0 4px 0' }}>🤖 EA Auto-Sync</h2>
                <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Auto-import trades from MT4/MT5 in real-time</p>
              </div>
              <button onClick={() => setShowEAModal(false)}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>

            <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
              <div style={{ color: '#c084fc', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>How it works</div>
              {[
                { n: '1', text: 'Generate your unique API key below' },
                { n: '2', text: 'Download the Ghost Trader EA file (.mq4 or .mq5)' },
                { n: '3', text: 'Install EA on your MT4/MT5 chart' },
                { n: '4', text: 'Paste your API key into the EA settings' },
                { n: '5', text: 'Every trade syncs automatically every 30 seconds' },
              ].map(({ n, text }) => (
                <div key={n} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#c084fc', fontSize: '11px', fontWeight: '700',
                  }}>{n}</div>
                  <span style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Your EA API Key
              </div>
              {!eaKey ? (
                <button onClick={loadEAKey}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '10px',
                    border: '1px dashed rgba(168,85,247,0.4)',
                    background: 'rgba(168,85,247,0.05)',
                    color: '#c084fc', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                  }}>
                  🔑 Load / Generate API Key
                </button>
              ) : (
                <div>
                  <div style={{
                    display: 'flex', gap: '8px', alignItems: 'center',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,85,247,0.25)',
                    borderRadius: '10px', padding: '12px 14px', marginBottom: '10px',
                  }}>
                    <code style={{ flex: 1, color: '#c084fc', fontSize: '12px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {eaKey}
                    </code>
                    <button onClick={() => { navigator.clipboard.writeText(eaKey); alert('Copied!') }}
                      style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '6px', padding: '6px 10px', color: '#c084fc', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>
                      Copy
                    </button>
                  </div>
                  <button onClick={generateEAKey} disabled={eaKeyLoading}
                    style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
                    {eaKeyLoading ? 'Generating...' : '↻ Generate new key (invalidates old key)'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>Download EA File</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'MT4 EA', ext: '.ex4', icon: '📊', version: 4 as const },
                  { label: 'MT5 EA', ext: '.ex5', icon: '📈', version: 5 as const },
                ].map(({ label, ext, icon, version }) => (
                  <button key={ext}
                    onClick={() => {
                      const mqlCode = generateMQLCode(eaKey || 'YOUR_API_KEY_HERE', version)
                      const blob = new Blob([mqlCode], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `GhostTraderEA${version === 4 ? '.mq4' : '.mq5'}`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    style={{
                      padding: '14px', borderRadius: '10px',
                      border: '1px solid rgba(59,130,246,0.2)',
                      background: 'rgba(59,130,246,0.05)',
                      color: 'white', cursor: 'pointer', textAlign: 'center',
                    }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>{label}</div>
                    <div style={{ color: '#475569', fontSize: '11px' }}>Download {ext}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ color: '#475569', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>API Endpoint</div>
              <code style={{ color: '#94a3b8', fontSize: '12px', display: 'block', wordBreak: 'break-all' }}>
                POST {typeof window !== 'undefined' ? window.location.origin : ''}/api/ea-sync
              </code>
              <code style={{ color: '#475569', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                Header: x-api-key: your_ea_key
              </code>
            </div>

            <button onClick={() => setShowEAModal(false)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', background: 'transparent', color: '#94a3b8', fontWeight: '600', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 641px) {
          .trade-table { display: block; }
          .trade-cards { display: none !important; }
          .modal-backdrop { align-items: center !important; padding: 20px !important; }
          .modal-desktop { border-radius: 20px !important; max-width: 580px; }
        }
        @media (max-width: 640px) {
          .trade-table { display: none !important; }
          .trade-cards { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

export default function TradeLogPage() {
  return (
    <Suspense fallback={<div style={{ color: '#3b82f6', padding: '40px', textAlign: 'center' }}>Loading...</div>}>
      <TradeLogContent />
    </Suspense>
  )
}