'use client'
import { useState, useEffect } from 'react'

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTickets = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    const res = await fetch(`/api/admin/tickets?${params}`)
    const { data } = await res.json()
    setTickets(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [statusFilter])

  const handleResolve = async (ticketId: string) => {
    setSaving(true)
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED', admin_reply: reply }),
    })
    setSaving(false)
    setSelected(null)
    setReply('')
    fetchTickets()
  }

  const priorityColors: Record<string, string> = {
    URGENT: '#ef4444', HIGH: '#f59e0b', NORMAL: '#3b82f6', LOW: '#475569',
  }
  const statusColors: Record<string, string> = {
    OPEN: '#ef4444', PENDING: '#f59e0b', RESOLVED: '#10b981', CLOSED: '#475569',
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>
          🎫 Support Tickets
        </h1>
        <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
          Manage user support requests
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {['ALL', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{
              padding: '7px 14px', borderRadius: '8px', border: 'none',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              background: statusFilter === s ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
              color: statusFilter === s ? '#f87171' : '#64748b',
            }}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(239,68,68,0.1)',
          borderRadius: '16px', color: '#475569',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎫</div>
          No tickets found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tickets.map(ticket => (
            <div key={ticket.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(239,68,68,0.1)',
              borderRadius: '12px', padding: '16px',
              borderLeft: `4px solid ${statusColors[ticket.status] || '#475569'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h4 style={{ color: 'white', fontWeight: '700', fontSize: '14px', margin: 0 }}>
                      {ticket.subject}
                    </h4>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700',
                      background: `${priorityColors[ticket.priority]}20`,
                      color: priorityColors[ticket.priority],
                    }}>{ticket.priority}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700',
                      background: `${statusColors[ticket.status]}20`,
                      color: statusColors[ticket.status],
                    }}>{ticket.status}</span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0', lineHeight: '1.6' }}>
                    {ticket.body.slice(0, 200)}{ticket.body.length > 200 ? '...' : ''}
                  </p>
                  <span style={{ color: '#475569', fontSize: '11px' }}>
                    📅 {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
                {ticket.status === 'OPEN' || ticket.status === 'PENDING' ? (
                  <button
                    onClick={() => setSelected(ticket)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px',
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.1)', color: '#f87171',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0,
                    }}>
                    Reply & Resolve
                  </button>
                ) : (
                  ticket.admin_reply && (
                    <div style={{
                      maxWidth: '200px', padding: '8px 12px', borderRadius: '8px',
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.2)',
                    }}>
                      <div style={{ color: '#10b981', fontSize: '10px', fontWeight: '700', marginBottom: '4px' }}>
                        Admin Reply
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                        {ticket.admin_reply}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{
            background: '#0a0f1e', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '16px', padding: '28px', maxWidth: '500px', width: '100%',
          }}>
            <h3 style={{ color: 'white', fontWeight: '800', fontSize: '18px', marginBottom: '8px' }}>
              Reply to Ticket
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', marginBottom: '16px' }}>
              {selected.subject}
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
              padding: '12px', marginBottom: '16px',
            }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                {selected.body}
              </p>
            </div>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Your reply to the user..."
              rows={4}
              style={{
                width: '100%', padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px', color: 'white', fontSize: '14px',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                marginBottom: '16px',
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setSelected(null); setReply('') }}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#94a3b8',
                  fontWeight: '600', cursor: 'pointer',
                }}>
                Cancel
              </button>
              <button onClick={() => handleResolve(selected.id)} disabled={saving}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', fontWeight: '700', cursor: 'pointer',
                }}>
                {saving ? 'Saving...' : '✓ Resolve Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}