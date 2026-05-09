import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoster, hasJobCard } from '../contexts/RosterContext'
import ShiftPill from '../components/ShiftPill'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function todayLabel() {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]
}

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('qr_theme') !== 'light')
  const toggle = () => setDark(prev => {
    const next = !prev
    localStorage.setItem('qr_theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    return next
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [])
  return [dark, toggle]
}

export default function RosterPage() {
  const { personalRoster, startingLink, resetAll } = useRoster()
  const navigate = useNavigate()
  const currentRef = useRef(null)
  const [selectedShift, setSelectedShift] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [dark, toggleDark] = useDarkMode()

  useEffect(() => {
    if (currentRef.current) {
      setTimeout(() => currentRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 100)
    }
  }, [personalRoster.length])

  const today = todayLabel()

  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>
            <span style={{ color:'#F59E0B' }}>QR</span> Roster
          </h1>
          <p style={{ margin:0, fontSize:'0.72rem', color:'var(--muted)' }}>Starting link: {startingLink}</p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={toggleDark}
            style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:'1rem' }}
            title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setShowSettings(true)}
            style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'var(--muted)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      {personalRoster.map((entry) => {
        const isSwapped = entry.swapInfo && entry.swapInfo.swapLink !== 'AL'
        const isWholeAL = entry.swapInfo?.swapLink === 'AL'
        return (
          <div key={entry.weekKey} ref={entry.isCurrent ? currentRef : null}
            className={`card fade-in ${entry.isCurrent ? 'current-week-border' : ''}`}
            style={{ marginBottom:8, padding:12, opacity: entry.isPast ? 0.5 : 1 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.73rem', color:'#F59E0B', background:'#1A1500', border:'1px solid #92620A', borderRadius:5, padding:'1px 7px' }}>
                  Link {entry.linkNum}
                </span>
                {entry.isCurrent && <span style={{ fontSize:'0.63rem', color:'#34D399', background:'#0A2417', border:'1px solid #065F46', borderRadius:4, padding:'1px 5px' }}>THIS WEEK</span>}
                {isSwapped && <span style={{ fontSize:'0.63rem', color:'#60A5FA', background:'#0C1A2E', border:'1px solid #1E3A5F', borderRadius:4, padding:'1px 5px' }}>↔ Link {entry.swapInfo.swapLink}{entry.swapInfo.driverName ? ` · ${entry.swapInfo.driverName}` : ''}</span>}
                {isWholeAL && <span style={{ fontSize:'0.63rem', color:'#6EE7B7', background:'#0A2417', border:'1px solid #065F46', borderRadius:4, padding:'1px 5px' }}>AL — Full Week</span>}
              </div>
              <span style={{ fontSize:'0.7rem', color:'var(--muted)', fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>{entry.dateFormatted}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
              {DAYS.map(day => {
                const shift = entry.days[day] || ''
                const isToday = entry.isCurrent && day === today
                return (
                  <div key={day} onClick={() => shift && setSelectedShift({ entry, day, shift })}
                    style={{ background: isToday ? 'var(--today-bg)' : 'transparent', border: isToday ? '2px solid var(--today-bdr)' : '1px solid transparent', borderRadius:5, padding:'3px 2px', cursor: shift ? 'pointer' : 'default' }}>
                    <div style={{ fontSize:'0.58rem', color: isToday ? 'var(--today-txt)' : 'var(--muted)', textAlign:'center', fontWeight: isToday ? 600 : 400 }}>{day}</div>
                    <div style={{ fontSize:'0.62rem', color: isToday ? 'var(--today-txt)' : 'var(--muted)', textAlign:'center', marginBottom:3, fontFamily:'JetBrains Mono,monospace', fontWeight: isToday ? 700 : 400 }}>{entry.dayDates[day]}</div>
                    <div style={{ textAlign:'center' }}><ShiftPill shift={shift} compact /></div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {selectedShift && (
        <div onClick={() => setSelectedShift(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'flex-end' }}>
          <div className="slide-up" onClick={e => e.stopPropagation()}
            style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderRadius:'16px 16px 0 0', padding:'20px', width:'100%', paddingBottom:'calc(20px + env(safe-area-inset-bottom,0px))' }}>
            <div style={{ width:36, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 16px' }}/>
            <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginBottom:6 }}>
              {selectedShift.day} {selectedShift.entry.dayDates[selectedShift.day]} · {selectedShift.entry.dateFormatted} · Link {selectedShift.entry.linkNum}
            </div>
            <div style={{ marginBottom:16 }}><ShiftPill shift={selectedShift.shift} /></div>
            <div style={{ display:'flex', gap:8 }}>
              {hasJobCard(selectedShift.shift) && (
                <button className="btn-primary" style={{ flex:1 }}
                  onClick={() => { navigate('/jobcard', { state:{ shift:selectedShift.shift, day:selectedShift.day } }); setSelectedShift(null) }}>
                  View Job Card →
                </button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedShift(null)}
                style={{ flex: hasJobCard(selectedShift.shift) ? '0 0 80px' : 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div onClick={() => setShowSettings(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'flex-end' }}>
          <div className="slide-up" onClick={e => e.stopPropagation()}
            style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderRadius:'16px 16px 0 0', padding:'20px', width:'100%', paddingBottom:'calc(20px + env(safe-area-inset-bottom,0px))' }}>
            <div style={{ width:36, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 16px' }}/>
            <h3 style={{ margin:'0 0 16px', fontSize:'0.95rem', fontWeight:600 }}>Settings</h3>
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:'0.8rem', color:'var(--muted)', margin:'0 0 4px' }}>Starting Link</p>
              <p style={{ fontFamily:'JetBrains Mono,monospace', color:'#F59E0B', margin:0 }}>Link {startingLink}</p>
            </div>
            <button className="btn-secondary" style={{ borderColor:'#7F1D1D', color:'#EF4444', marginBottom:8 }}
              onClick={() => { if (confirm('Reset all data? Cannot be undone.')) { resetAll(); setShowSettings(false) } }}>
              Reset All Data
            </button>
            <button className="btn-ghost" onClick={() => setShowSettings(false)} style={{ width:'100%', textAlign:'center' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
