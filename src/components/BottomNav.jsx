import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/', label: 'Roster',
    icon: active => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?'#F59E0B':'#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  },
  { path: '/jobcard', label: 'Job Card',
    icon: active => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?'#F59E0B':'#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  },
  { path: '/swap', label: 'Swap',
    icon: active => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?'#F59E0B':'#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
  },
  { path: '/leave', label: 'Leave',
    icon: active => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?'#F59E0B':'#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  },
  { path: '/contacts', label: 'Contacts',
    icon: active => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?'#F59E0B':'#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <nav className="bottom-nav">
      {TABS.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', padding:'8px 0 4px' }}>
            {tab.icon(active)}
            <span style={{ fontSize:'0.65rem', fontWeight: active?600:400, color: active?'#F59E0B':'#64748B', fontFamily:'DM Sans,sans-serif' }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
