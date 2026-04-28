'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAccounts } from '@/hooks/useAccounts'
import { useSearchParams, useRouter } from 'next/navigation'

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK_PROMPTS = [
  'Analyze my performance',
  'My biggest weakness?',
  'Improve win rate',
  'Am I overrisking?',
  'Review my psychology',
  'Best trading session?',
]

function AICoachContent() {
  const { activeAccount } = useAccounts()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session') || undefined

  // Load analytics for the selected session OR active account
  const { analytics } = useAnalytics(
    sessionId ? undefined : activeAccount?.id,
    30
  )

  // Load session-specific analytics if session param exists
  const [sessionAnalytics, setSessionAnalytics] = useState<any>(null)
  const [sessionName, setSessionName] = useState<string>('')

  useEffect(() => {
    if (sessionId) {
      // Fetch analytics for this specific session
      fetch(`/api/analytics?import_session_id=${sessionId}`)
        .then(r => r.json())
        .then(d => setSessionAnalytics(d.data))

      // Fetch session name
      fetch('/api/import/sessions')
        .then(r => r.json())
        .then(d => {
          const session = d.data?.find((s: any) => s.id === sessionId)
          if (session) setSessionName(session.session_name || session.file_name)
        })
    }
  }, [sessionId])

  const activeAnalytics = sessionId ? sessionAnalytics : analytics

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: sessionId
        ? `Hello! I'm your Ghost Trader AI Coach. I'm ready to analyze your import session data. Once you ask me something, I'll pull the stats from that specific session and give you targeted insights.`
        : `Hello! I'm your Ghost Trader AI Coach. I have access to your trading data and can help you analyze performance, improve psychology, and build better trading habits. What would you like to work on?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const msg = text || input
    if (!msg.trim() || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          import_session_id: sessionId || null,
          session_name: sessionName || null,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.data?.response || data.error || 'Sorry, I could not respond right now.',
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)' }}>

      {/* Header */}
      <div style={{ marginBottom: '14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ color: 'white', fontWeight: '800', fontSize: '20px', margin: '0 0 2px 0' }}>
              🤖 AI Coach
            </h1>
            <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>
              Powered by Groq • Personalised to your trading data
            </p>
          </div>

          {/* Session selector */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {sessionId && (
              <div style={{
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '600' }}>
                  📦 {sessionName || 'Import Session'}
                </span>
                <button
                  onClick={() => router.push('/dashboard/ai-coach')}
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '14px' }}>
                  ×
                </button>
              </div>
            )}
            <button
              onClick={() => router.push('/dashboard/import-sessions')}
              style={{
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid rgba(59,130,246,0.2)',
                background: 'rgba(59,130,246,0.05)',
                color: '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>
              Switch Session →
            </button>
          </div>
        </div>
      </div>

      {/* Session banner */}
      {sessionId && sessionName && (
        <div style={{
          padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', flexShrink: 0,
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '16px' }}>📦</span>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>
            AI is analyzing <strong style={{ color: 'white' }}>{sessionName}</strong> — all insights are specific to this import session
          </span>
        </div>
      )}

      {/* Stats bar */}
      {activeAnalytics && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px', flexShrink: 0 }}>
          {[
            { label: 'Win Rate', value: `${(activeAnalytics.win_rate || 0).toFixed(1)}%` },
            { label: 'Total PnL', value: `$${(activeAnalytics.total_pnl || 0).toFixed(2)}` },
            { label: 'Total Trades', value: activeAnalytics.total_trades || 0 },
            { label: 'Revenge Trades', value: activeAnalytics.revenge_trades || 0, alert: (activeAnalytics.revenge_trades || 0) > 0 },
            { label: 'Avg Discipline', value: `${(activeAnalytics.avg_discipline_score || 0).toFixed(1)}/10` },
          ].map(({ label, value, alert }) => (
            <div key={label} style={{
              padding: '7px 12px', borderRadius: '8px', flexShrink: 0,
              background: alert ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${alert ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.15)'}`,
            }}>
              <span style={{ color: '#475569', fontSize: '11px' }}>{label}: </span>
              <span style={{ color: alert ? '#ef4444' : 'white', fontWeight: '700', fontSize: '13px' }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick prompts */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', flexShrink: 0 }}>
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => send(p)}
            style={{
              padding: '5px 10px', borderRadius: '16px',
              border: '1px solid rgba(59,130,246,0.25)',
              background: 'rgba(59,130,246,0.05)',
              color: '#60a5fa', fontSize: '11px', cursor: 'pointer',
              fontWeight: '500', whiteSpace: 'nowrap',
            }}>
            {p}
          </button>
        ))}
        {sessionId && (
          <button onClick={() => send(`Analyze all trades in ${sessionName} and give me a full performance review`)}
            style={{
              padding: '5px 10px', borderRadius: '16px',
              border: '1px solid rgba(168,85,247,0.3)',
              background: 'rgba(168,85,247,0.08)',
              color: '#c084fc', fontSize: '11px', cursor: 'pointer',
              fontWeight: '600', whiteSpace: 'nowrap',
            }}>
            📦 Full Session Review
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '16px', padding: '16px', marginBottom: '12px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', gap: '10px', alignItems: 'flex-start',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
          }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
              background: msg.role === 'assistant'
                ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                : 'rgba(255,255,255,0.1)',
            }}>
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div style={{
              maxWidth: '78%', padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
              color: '#e2e8f0', fontSize: '13px', lineHeight: '1.6',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}>🤖</div>
            <div style={{
              padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6',
                    animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={sessionId
            ? `Ask about ${sessionName}...`
            : 'Ask your AI coach anything about your trading...'}
          style={{
            flex: 1, padding: '12px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none',
          }}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          style={{
            padding: '12px 16px', borderRadius: '10px', border: 'none',
            background: loading || !input.trim() ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white', fontWeight: '700', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
          Send →
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

export default function AICoachPage() {
  return (
    <Suspense fallback={<div style={{ color: '#3b82f6', padding: '40px' }}>Loading...</div>}>
      <AICoachContent />
    </Suspense>
  )
}