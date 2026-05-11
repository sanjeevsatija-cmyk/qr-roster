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
          Job <span style={{ color:'#F59E0B' }}>Cards</span>
        </h2>
        <p style={{ margin:0, fontSize:'0.73rem', color:'#64748B' }}>Search by shift code (e.g. EB076, CS1342)</p>
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:14 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Type shift code…" value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          style={{ paddingLeft:36 }} autoCapitalize="characters" autoCorrect="off" spellCheck={false} />
      </div>

      {/* Search results */}
      {!selected && results.map((card, i) => (
        <button key={i} onClick={() => setSelected(card)}
          style={{ display:'block', width:'100%', textAlign:'left', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', marginBottom:5, cursor:'pointer' }}>
          <span className="shift-code" style={{ fontSize:'0.77rem', color:'var(--text)' }}>{card.header}</span>
        </button>
      ))}

      {/* No results */}
      {query.length >= 3 && results.length === 0 && !selected && (
        <p style={{ color:'#64748B', fontSize:'0.85rem', textAlign:'center', padding:20 }}>No job cards found for "{query}"</p>
      )}

      {/* Pre-shift not found */}
      {preShift && !selected && !query && (
        <div style={{ background:'var(--surface2)', border:'1px solid var(--amber-dim)', borderRadius:10, padding:12, marginBottom:12 }}>
          <p style={{ color:'#F59E0B', fontSize:'0.8rem', margin:0 }}>
            Searching for: <span className="shift-code">{preShift}</span>
          </p>
          <p style={{ color:'#EF4444', fontSize:'0.75rem', margin:'4px 0 0' }}>No match found — try searching manually.</p>
        </div>
      )}

      {/* Empty state */}
      {!query && !selected && !preShift && (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🚂</div>
          <p style={{ color:'#64748B', fontSize:'0.85rem' }}>Tap a shift on the Roster page<br/>or search by code above</p>
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
              <div className="shift-code" style={{ fontSize:'0.78rem', color:'#F59E0B', marginBottom:2 }}>{selected.header}</div>
              <div style={{ fontSize:'0.68rem', color:'var(--muted)' }}>{selected.legs.length} legs</div>
            </div>
            <button className="btn-ghost" onClick={() => { setSelected(null); setQuery('') }} style={{ color:'var(--muted)' }}>← Back</button>
          </div>

          <div className="card" style={{ padding:'12px 14px' }}>
            {allLegs.map((leg, i) => (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'52px 1fr', gap:10,
                paddingBottom: i < allLegs.length-1 ? 12 : 0,
                marginBottom: i < allLegs.length-1 ? 12 : 0,
                borderBottom: i < allLegs.length-1 ? '1px solid var(--border)' : 'none',
                background: leg._signOn || leg._signOff ? 'var(--surface2)' : 'transparent',
                borderRadius: leg._signOn || leg._signOff ? 6 : 0,
                padding: leg._signOn || leg._signOff ? '6px 8px' : undefined,
                marginLeft: leg._signOn || leg._signOff ? -8 : 0,
                marginRight: leg._signOn || leg._signOff ? -8 : 0,
              }}>
                <div style={{ paddingTop:2 }}>
                  {leg.depart
                    ? <span className="time-display" style={{ fontSize:'0.85rem', color: leg._signOn || leg._signOff ? '#34D399' : '#F59E0B', fontWeight:600 }}>{leg.depart}</span>
                    : <span style={{ fontSize:'0.75rem', color:'var(--muted)' }}>—</span>
                  }
                </div>
                <div>
                  {leg.trainNo && <div className="shift-code" style={{ fontSize:'0.77rem', color: leg._signOn || leg._signOff ? '#34D399' : 'var(--text)', marginBottom:2 }}>{leg.trainNo}</div>}
                  {(leg.centralArrive || leg.centralDepart) && (
                    <div className="time-display" style={{ fontSize:'0.7rem', color:'var(--muted)', marginBottom:2 }}>
                      {leg.centralArrive && `↓ Cen ${leg.centralArrive}`}
                      {leg.centralArrive && leg.centralDepart && '  '}
                      {leg.centralDepart && `↑ ${leg.centralDepart}`}
                    </div>
                  )}
                  {leg.arrive && <div className="time-display" style={{ fontSize:'0.7rem', color:'var(--muted)' }}>Arr {leg.arrive}</div>}
                  {leg.remarks && <div style={{ fontSize:'0.7rem', color:'#60A5FA', marginTop:3, lineHeight:1.4 }}>{leg.remarks}</div>}
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
