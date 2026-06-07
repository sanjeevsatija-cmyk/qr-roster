/**
 * QR Roster — Queensland Rail Mayne Link Roster PWA
 * Developed by Sanjeev Satija, Brisbane, Australia
 * First created: April 2026
 * Copyright © 2026 Sanjeev Satija. All rights reserved.
 * Unauthorised copying, modification or distribution
 * of this software is strictly prohibited.
 */
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useRoster } from '../contexts/RosterContext'
import ShiftPill from '../components/ShiftPill'

export default function JobCardPage() {
  const location = useLocation()
  const { searchJobCards, findJobCard } = useRoster()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)

  const preShift = location.state?.shift
  const preDay   = location.state?.day

  useEffect(() => {
    if (preShift) {
      const found = findJobCard(preShift, preDay)
      if (found) setSelected(found)
    }
  }, [preShift, preDay])

  useEffect(() => {
    setResults(query.length >= 3 ? searchJobCards(query) : [])
  }, [query])

  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ marginBottom:14 }}>
        <h2 style={{ margin:'0 0 3px', fontSize:'1rem', fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>
          <span style={{ color:'var(--text)' }}>Job</span> <span style={{ color:'var(--acc)' }}>Cards</span>
        </h2>
        <p style={{ margin:0, fontSize:'0.73rem', color:'var(--muted)' }}>Search by shift code (e.g. EB076, CS1342)</p>
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:14 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Type shift code…" value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          style={{
            paddingLeft:36,
            background:'var(--surface2)',
            border:'1px solid var(--border)',
            borderRadius:12,
            color:'var(--text)',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--acc)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          autoCapitalize="characters" autoCorrect="off" spellCheck={false} />
      </div>

      {/* Search results */}
      {!selected && results.map((card, i) => (
        <button key={i} onClick={() => setSelected(card)}
          className="glass-card"
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,168,212,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '' }}
          style={{ display:'block', width:'100%', textAlign:'left', borderRadius:10, padding:'10px 14px', marginBottom:5, cursor:'pointer' }}>
          <span className="shift-code" style={{ fontSize:'0.77rem', color:'var(--text)', fontFamily:'JetBrains Mono, monospace' }}>{card.header}</span>
        </button>
      ))}

      {/* No results */}
      {query.length >= 3 && results.length === 0 && !selected && (
        <p style={{ color:'var(--muted)', fontSize:'0.85rem', textAlign:'center', padding:20 }}>No job cards found for "{query}"</p>
      )}

      {/* Pre-shift not found */}
      {preShift && !selected && !query && (
        <div style={{ background:'rgba(249,168,212,0.06)', border:'1px solid rgba(249,168,212,0.2)', borderRadius:10, padding:12, marginBottom:12 }}>
          <p style={{ color:'var(--acc)', fontSize:'0.8rem', margin:0 }}>
            Searching for: <span className="shift-code" style={{ color:'var(--acc2)' }}>{preShift}</span>
          </p>
          <p style={{ color:'#FCA5A5', fontSize:'0.75rem', margin:'4px 0 0' }}>No match found — try searching manually.</p>
        </div>
      )}

      {/* Empty state */}
      {!query && !selected && !preShift && (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🚂</div>
          <p style={{ color:'var(--muted)', fontSize:'0.85rem' }}>Tap a shift on the Roster page<br/>or search by code above</p>
        </div>
      )}

      {/* Job card detail */}
      {selected && (() => {
        // Parse S/O location and times from header
        // e.g. "MON EB117 S/O BHAB 14:20-23:12 (08:52)"
        const soMatch = selected.header.match(/S\/O\s+(\w+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/i)
        const signOnLocation = soMatch ? soMatch[1] : ''
        const signOnTime     = soMatch ? soMatch[2].replace(':','') : ''
        const signOffTime    = soMatch ? soMatch[3].replace(':','') : ''

        const allLegs = [
          // Inject sign-on as first entry
          ...(signOnLocation ? [{ depart: signOnTime, trainNo: `SIGN ON ${signOnLocation}`, centralArrive:'', centralDepart:'', arrive:'', remarks:'', _signOn: true }] : []),
          ...selected.legs,
          // Inject sign-off as last entry
          ...(signOffTime ? [{ depart: signOffTime, trainNo: `SIGN OFF ${signOnLocation}`, centralArrive:'', centralDepart:'', arrive:'', remarks:'', _signOff: true }] : []),
        ]

        return (
        <div className="fade-in">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div className="shift-code" style={{ fontSize:'0.78rem', color:'var(--acc)', fontFamily:'JetBrains Mono, monospace', marginBottom:2 }}>{selected.header}</div>
              <div style={{ fontSize:'0.68rem', color:'var(--muted)' }}>{selected.legs.length} legs</div>
            </div>
            <button onClick={() => { setSelected(null); setQuery('') }}
              className="glass-card-inner"
              style={{ color:'var(--muted)', border:'none', borderRadius:8, padding:'5px 12px', fontSize:'0.78rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
              ← Back
            </button>
          </div>

          <div className="glass-card" style={{ padding:'12px 14px' }}>
            {allLegs.map((leg, i) => (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'52px 1fr', gap:10,
                paddingBottom: i < allLegs.length-1 ? 12 : 0,
                marginBottom: i < allLegs.length-1 ? 12 : 0,
                borderBottom: i < allLegs.length-1 ? '1px solid var(--border)' : 'none',
                background: leg._signOn || leg._signOff ? 'rgba(110,231,183,0.06)' : 'transparent',
                border: leg._signOn || leg._signOff ? '1px solid rgba(110,231,183,0.15)' : 'none',
                borderRadius: leg._signOn || leg._signOff ? 6 : 0,
                padding: leg._signOn || leg._signOff ? '6px 8px' : undefined,
                marginLeft: leg._signOn || leg._signOff ? -8 : 0,
                marginRight: leg._signOn || leg._signOff ? -8 : 0,
              }}>
                <div style={{ paddingTop:2 }}>
                  {leg.depart
                    ? <span className="time-display" style={{ fontSize:'0.85rem', color: leg._signOn || leg._signOff ? 'var(--mint)' : 'var(--gold2)', fontWeight:600 }}>{leg.depart}</span>
                    : <span style={{ fontSize:'0.75rem', color:'var(--muted)' }}>—</span>
                  }
                </div>
                <div>
                  {leg.trainNo && <div className="shift-code" style={{ fontSize:'0.77rem', color: leg._signOn || leg._signOff ? 'var(--mint)' : 'var(--text)', fontFamily:'JetBrains Mono, monospace', marginBottom:2 }}>{leg.trainNo}</div>}
                  {(leg.centralArrive || leg.centralDepart) && (
                    <div className="time-display" style={{ fontSize:'0.7rem', color:'var(--muted)', marginBottom:2 }}>
                      {leg.centralArrive && `↓ Cen ${leg.centralArrive}`}
                      {leg.centralArrive && leg.centralDepart && '  '}
                      {leg.centralDepart && `↑ ${leg.centralDepart}`}
                    </div>
                  )}
                  {leg.arrive && <div className="time-display" style={{ fontSize:'0.7rem', color:'var(--muted)' }}>Arr {leg.arrive}</div>}
                  {leg.remarks && <div style={{ fontSize:'0.7rem', color:'#93C5FD', marginTop:3, lineHeight:1.4 }}>{leg.remarks}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        )
      })()}
    </div>
  )
}
