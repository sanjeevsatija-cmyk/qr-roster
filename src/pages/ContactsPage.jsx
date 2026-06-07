/**
 * QR Roster — Queensland Rail Mayne Link Roster PWA
 * Developed by Sanjeev Satija, Brisbane, Australia
 * First created: April 2026
 * Copyright © 2026 Sanjeev Satija. All rights reserved.
 * Unauthorised copying, modification or distribution
 * of this software is strictly prohibited.
 */
import React, { useState, useMemo } from 'react'
import contactsData from './contacts.json'

const PAGE_SIZE = 50
const TOTAL = contactsData.length

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.94 5.94l.77-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const TextIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

export default function ContactsPage() {
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page,       setPage]       = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return contactsData.filter(c => {
      if (roleFilter !== 'all' && c.role !== roleFilter) return false
      if (q && !c.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, roleFilter])

  const visible  = filtered.slice(0, page * PAGE_SIZE)
  const hasMore  = filtered.length > visible.length
  const remaining = filtered.length - visible.length

  const handleSearch = v => { setSearch(v); setPage(1) }
  const handleRole   = v => { setRoleFilter(v); setPage(1) }

  const TABS = [
    { val: 'all',    label: 'All' },
    { val: 'driver', label: 'Drivers' },
    { val: 'guard',  label: 'Guards' },
  ]

  return (
    <div>

      {/* ── Sticky header ──────────────────────────────────────────────────────── */}
      <div style={{ position:'sticky', top:0, zIndex:20, background:'var(--bg)' }}>
        <div style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
            <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>
              <span style={{ color:'var(--acc)' }}>QR</span> <span style={{ color:'var(--text)' }}>Contacts</span>
            </h1>
            <span style={{ fontSize:'0.7rem', color:'var(--muted)' }}>
              {filtered.length !== TOTAL
                ? `${filtered.length} / ${TOTAL}`
                : `${TOTAL} contacts`}
            </span>
          </div>

          {/* Search */}
          <input
            type="search"
            placeholder="Search by name…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ marginBottom: 10 }}
            onFocus={e => { e.target.style.borderColor = 'var(--acc)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {/* Role filter pills */}
          <div style={{ display:'flex', gap:6 }}>
            {TABS.map(({ val, label }) => {
              const active = roleFilter === val
              return (
                <button
                  key={val}
                  onClick={() => handleRole(val)}
                  className={active ? '' : 'glass-card-inner'}
                  style={active
                    ? { padding:'5px 14px', borderRadius:20, border:'1px solid var(--acc)', background:'rgba(249,168,212,0.12)', color:'var(--acc)', fontWeight:600, fontSize:'0.8rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif', transition:'border-color 0.15s' }
                    : { padding:'5px 14px', borderRadius:20, color:'var(--muted)', fontWeight:400, fontSize:'0.8rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif', transition:'border-color 0.15s' }
                  }>
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Contact list ───────────────────────────────────────────────────────── */}
      <div style={{ padding:'8px 12px' }}>
        {visible.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'var(--muted)', fontSize:'0.88rem' }}>
            No contacts found
          </div>
        ) : (
          visible.map((contact, i) => {
            const isDriver = contact.role === 'driver'
            return (
              <div
                key={i}
                className="glass-card"
                style={{
                  marginBottom: 7,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>

                {/* Name + role badge */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: 'var(--text)',
                    marginBottom: 4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {contact.name}
                  </div>
                  <span style={isDriver
                    ? { fontSize:'0.65rem', padding:'1px 8px', borderRadius:20, background:'rgba(249,168,212,0.1)', color:'var(--acc)', border:'1px solid rgba(249,168,212,0.3)' }
                    : { fontSize:'0.65rem', padding:'1px 8px', borderRadius:20, background:'rgba(147,197,253,0.1)', color:'#93C5FD', border:'1px solid rgba(147,197,253,0.3)' }
                  }>
                    {isDriver ? 'Driver' : 'Guard'}
                  </span>
                </div>

                {/* Action buttons */}
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <a
                    href={`tel:${contact.phone}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '7px 12px',
                      borderRadius: 8,
                      background: 'rgba(110,231,183,0.1)',
                      border: '1px solid rgba(110,231,183,0.3)',
                      color: 'var(--mint)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      fontFamily: 'DM Sans, sans-serif',
                      whiteSpace: 'nowrap',
                    }}>
                    <PhoneIcon /> Call
                  </a>
                  <a
                    href={`sms:${contact.phone}`}
                    className="glass-card-inner"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '7px 12px',
                      borderRadius: 8,
                      color: 'var(--muted)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      fontFamily: 'DM Sans, sans-serif',
                      whiteSpace: 'nowrap',
                    }}>
                    <TextIcon /> Text
                  </a>
                </div>
              </div>
            )
          })
        )}

        {hasMore && (
          <button
            className="btn-secondary"
            style={{ marginTop:4, marginBottom:8 }}
            onClick={() => setPage(p => p + 1)}>
            Show {Math.min(PAGE_SIZE, remaining)} more&nbsp;
            <span style={{ color:'var(--muted)', fontWeight:400 }}>
              ({remaining} remaining)
            </span>
          </button>
        )}
      </div>

    </div>
  )
}
