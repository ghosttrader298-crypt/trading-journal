'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AuthProvider } from '@/context/AuthContext'

const adminNav = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '⊞' },
  { label: 'Users', href: '/admin/users', icon: '👥' },
  { label: 'Announcements', href: '/admin/announcements', icon: '📢' },
  { label: 'Support Tickets', href: '/admin/tickets', icon: '🎫' },
]

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) return
    if (!loading && !user) router.push('/auth/login')
    if (!loading && user && user.role === 'USER') router.push('/dashboard')
  }, [user, loading, router, isLoginPage])

  if (isLoginPage) return <>{children}</>

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#050810',
      }}>
        <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600' }}>
          Loading Admin Panel...
        </div>
      </div>
    )
  }

  if (!user || user.role === 'USER') return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050810' }}>

      {/* Admin Sidebar */}
      <div style={{
        width: '240px', height: '100vh', position: 'fixed', left: 0, top: 0,
        background: 'rgba(5,8,16,0.97)',
        borderRight: '1px solid rgba(239,68,68,0.15)',
        display: 'flex', flexDirection: 'column', zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px', borderBottom: '1px solid rgba(239,68,68,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 15px rgba(239,68,68,0.4)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>Ghost Trader</div>
              <div style={{ color: '#ef4444', fontSize: '10px', fontWeight: '700', letterSpacing: '1px' }}>
                ADMIN PANEL
              </div>
            </div>
          </div>

          {/* Admin badge */}
          <div style={{
            marginTop: '12px', padding: '6px 10px', borderRadius: '8px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700' }}>
              {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'View Only Admin'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {adminNav.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <button key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px', border: 'none',
                  marginBottom: '2px', cursor: 'pointer', textAlign: 'left',
                  background: isActive ? 'rgba(239,68,68,0.12)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? '#ef4444' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span style={{
                  fontSize: '13px', fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#f87171' : '#94a3b8',
                }}>{item.label}</span>
                {isActive && (
                  <div style={{
                    marginLeft: 'auto', width: '6px', height: '6px',
                    borderRadius: '50%', background: '#ef4444',
                  }} />
                )}
              </button>
            )
          })}

          {/* Back to dashboard */}
          <div style={{ borderTop: '1px solid rgba(239,68,68,0.1)', marginTop: '12px', paddingTop: '12px' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', border: 'none',
                background: 'rgba(59,130,246,0.08)', cursor: 'pointer', textAlign: 'left',
              }}>
              <span style={{ fontSize: '16px' }}>↩</span>
              <span style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600' }}>
                User Dashboard
              </span>
            </button>
          </div>
        </nav>

        {/* Admin user info */}
        <div style={{ padding: '14px', borderTop: '1px solid rgba(239,68,68,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '13px', fontWeight: '700',
            }}>
              {user.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: 'white', fontSize: '12px', fontWeight: '600',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.display_name || user.email?.split('@')[0]}
              </div>
              <div style={{ color: '#475569', fontSize: '10px' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={logout} style={{
            width: '100%', padding: '7px', borderRadius: '8px',
            border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.05)',
            color: '#ef4444', fontSize: '12px', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{
          height: '56px', display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: '12px',
          background: 'rgba(5,8,16,0.9)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(239,68,68,0.1)',
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{
            padding: '4px 12px', borderRadius: '6px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700', letterSpacing: '1px' }}>
              ⚠ ADMIN MODE
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ color: '#475569', fontSize: '12px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <main style={{ flex: 1, padding: '28px', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  )
}