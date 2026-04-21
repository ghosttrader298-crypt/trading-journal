'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '⊞' },
  { label: 'Trade Log', href: '/dashboard/trade-log', icon: '📋' },
  { label: 'Daily Journal', href: '/dashboard/journal', icon: '📓' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
  { label: 'Psychology', href: '/dashboard/psychology', icon: '🧠' },
  { label: 'Goals & Challenges', href: '/dashboard/goals', icon: '🎯' },
  { label: 'AI Coach', href: '/dashboard/ai-coach', icon: '🤖' },
  { label: 'Mistake Tracker', href: '/dashboard/mistakes', icon: '⚠️' },
  { label: 'Reports', href: '/dashboard/reports', icon: '📄' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(59,130,246,0.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px' }}>
                Ghost Trader
              </div>
              <div style={{ color: '#3b82f6', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Pro Dashboard
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '10px', marginBottom: '2px',
                textDecoration: 'none', transition: 'all 0.15s ease',
                background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
              }}
            >
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span style={{
                  fontSize: '13px', fontWeight: isActive ? '600' : '500',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                }}>
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '700', color: 'white',
          }}>
            {user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'G'}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.display_name || user?.email?.split('@')[0]}
              </div>
              <div style={{ color: '#475569', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          )}
        </div>
        <button onClick={logout} style={{
          width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)',
          background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontSize: '12px',
          fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div style={{
        width: collapsed ? '64px' : '240px', height: '100vh',
        background: 'rgba(5,8,16,0.95)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(59,130,246,0.1)',
        transition: 'width 0.2s ease', flexShrink: 0,
        position: 'fixed', left: 0, top: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column',
      }} className="hidden-mobile">
        <button onClick={() => setCollapsed(!collapsed)} style={{
          position: 'absolute', right: '-12px', top: '72px',
          width: '24px', height: '24px', borderRadius: '50%',
          background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.3)',
          color: '#3b82f6', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '10px', zIndex: 1,
        }}>
          {collapsed ? '›' : '‹'}
        </button>
        <SidebarContent />
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed', top: '16px', left: '16px', zIndex: 100,
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
          color: 'white', cursor: 'pointer', display: 'none',
          alignItems: 'center', justifyContent: 'center', fontSize: '18px',
        }}
        className="show-mobile"
      >
        ☰
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 60 }}
        />
      )}

      {/* Mobile drawer */}
      <div style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', width: '240px',
        background: 'rgba(5,8,16,0.98)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(59,130,246,0.1)',
        zIndex: 70, transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }} className="show-mobile">
        <SidebarContent />
      </div>

      <style>{`
        .hidden-mobile { display: flex !important; flex-direction: column; }
        .show-mobile { display: none !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  )
}