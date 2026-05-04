'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  display_name: string | null
  role: string
  status: string
  created_at: string
  last_login_at: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<any>(null)
  const router = useRouter()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    params.set('limit', '50')
    const res = await fetch(`/api/admin/users?${params}`)
    const { data, count } = await res.json()
    setUsers(data || [])
    setCount(count || 0)
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300)
    return () => clearTimeout(t)
  }, [fetchUsers])

  const handleAction = async (userId: string, action: string) => {
    setActionLoading(userId + action)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    setActionLoading(null)
    setConfirmModal(null)
    if (res.ok) {
      if (action === 'reset_password' && data.temp_password) {
        alert(`Temporary password: ${data.temp_password}\n\nShare this with the user securely.`)
      }
      fetchUsers()
    }
  }

  const handleDelete = async (userId: string) => {
    setActionLoading(userId + 'delete')
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    setActionLoading(null)
    setConfirmModal(null)
    fetchUsers()
  }

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>
            User Management
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            {count} registered users
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          placeholder="Search email or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', padding: '9px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          {['ALL', 'ACTIVE', 'SUSPENDED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                background: statusFilter === s ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                color: statusFilter === s ? '#f87171' : '#64748b',
              }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(239,68,68,0.12)',
        borderRadius: '16px', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 100px 120px 180px',
          padding: '12px 16px',
          background: 'rgba(239,68,68,0.05)',
          borderBottom: '1px solid rgba(239,68,68,0.1)',
        }}>
          {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
            <div key={h} style={{ color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>
            No users found
          </div>
        ) : (
          users.map(user => (
            <div key={user.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 100px 120px 180px',
              padding: '14px 16px',
              borderBottom: '1px solid rgba(239,68,68,0.06)',
              alignItems: 'center',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* User info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  background: user.status === 'SUSPENDED'
                    ? 'rgba(239,68,68,0.2)'
                    : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '13px', fontWeight: '700',
                }}>
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'white', fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.display_name || user.email?.split('@')[0]}
                  </div>
                  <div style={{ color: '#475569', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Role */}
              <div>
                <span style={{
                  padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700',
                  background: user.role === 'SUPER_ADMIN' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.1)',
                  color: user.role === 'SUPER_ADMIN' ? '#f87171' : '#60a5fa',
                }}>
                  {user.role === 'SUPER_ADMIN' ? 'ADMIN' : user.role === 'VIEW_ONLY_ADMIN' ? 'VIEW' : 'USER'}
                </span>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: user.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                }} />
                <span style={{
                  color: user.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                  fontSize: '12px', fontWeight: '600',
                }}>
                  {user.status}
                </span>
              </div>

              {/* Joined */}
              <div style={{ color: '#475569', fontSize: '12px' }}>
                {new Date(user.created_at).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {/* View data */}
                <button
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                  style={{
                    padding: '5px 9px', borderRadius: '6px',
                    border: '1px solid rgba(59,130,246,0.3)',
                    background: 'rgba(59,130,246,0.08)',
                    color: '#60a5fa', fontSize: '11px', fontWeight: '600',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                  👁 View
                </button>

                {/* Suspend/Unsuspend */}
                {user.role === 'USER' && (
                  <button
                    onClick={() => setConfirmModal({
                      title: user.status === 'ACTIVE' ? 'Suspend User' : 'Reactivate User',
                      message: `Are you sure you want to ${user.status === 'ACTIVE' ? 'suspend' : 'reactivate'} ${user.email}?`,
                      action: () => handleAction(user.id, user.status === 'ACTIVE' ? 'suspend' : 'unsuspend'),
                    })}
                    disabled={actionLoading === user.id + 'suspend' || actionLoading === user.id + 'unsuspend'}
                    style={{
                      padding: '5px 9px', borderRadius: '6px',
                      border: `1px solid ${user.status === 'ACTIVE' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                      background: user.status === 'ACTIVE' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                      color: user.status === 'ACTIVE' ? '#f59e0b' : '#10b981',
                      fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                    }}>
                    {user.status === 'ACTIVE' ? '🚫 Suspend' : '✅ Activate'}
                  </button>
                )}

                {/* Delete */}
                {user.role === 'USER' && (
                  <button
                    onClick={() => setConfirmModal({
                      title: 'Delete User',
                      message: `Delete ${user.email}? This will permanently remove all their data.`,
                      danger: true,
                      action: () => handleDelete(user.id),
                    })}
                    style={{
                      padding: '5px 9px', borderRadius: '6px',
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.08)',
                      color: '#ef4444', fontSize: '11px', fontWeight: '600',
                      cursor: 'pointer',
                    }}>
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#0a0f1e', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%',
          }}>
            <h3 style={{ color: 'white', fontWeight: '800', fontSize: '18px', marginBottom: '12px' }}>
              {confirmModal.title}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmModal(null)}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#94a3b8',
                  fontWeight: '600', cursor: 'pointer',
                }}>
                Cancel
              </button>
              <button onClick={confirmModal.action}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
                  background: confirmModal.danger
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', fontWeight: '700', cursor: 'pointer',
                }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}