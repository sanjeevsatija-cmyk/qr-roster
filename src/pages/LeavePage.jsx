/**
 * QR Roster — Queensland Rail Mayne Link Roster PWA
 * Developed by Sanjeev Satija, Brisbane, Australia
 * First created: April 2026
 * Copyright © 2026 Sanjeev Satija. All rights reserved.
 * Unauthorised copying, modification or distribution
 * of this software is strictly prohibited.
 */
import React, { useState } from 'react'
import { useRoster } from '../contexts/RosterContext'
import ShiftPill from '../components/ShiftPill'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function LeavePage() {
  const { personalRoster, markWeekAL, markDayAL, clearDayAL, clearSwap } = useRoster()
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [msg, setMsg] = useState('')

  const upcoming = personalRoster.filter(e => !e.isPast)

  const handleMarkWeekAL = () => {
    markWeekAL(selectedEntry)
    setMsg('✓ Whole week marked as Annual Leave')
  }

  const handleToggleDayAL = (day) => {
    const shift = selectedEntry.days[day]
    if (shift === 'AL' || shift === 'Annual Leave') {
      clearDayAL(selectedEntry, day)
      setMsg(`✓ ${day} AL cleared`)
    } else {
      markDayAL(selectedEntry, day)
      setMsg(`✓ ${day} marked as AL`)
    }
    // Refresh selected entry from roster
    setSelectedEntry(prev => {
      const updated = personalRoster.find(e => e.weekKey === prev.weekKey)
      return updated || prev
    })
  }

  // Sync selectedEntry when roster updates
  const syncedEntry = selectedEntry
    ? personalRoster.find(e => e.weekKey === selectedEntry.weekKey) || selectedEntry
    : null

  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ marginBottom:14 }}>
        <h2 style={{ margin:'0 0 2px', fontSize:'1rem', fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>
          <span style={{ color:'var(--text)' }}>Annual</span> <span style={{ color:'var(--acc)' }}>Leave</span>
        </h2>
        <p style={{ margin:0, fontSize:'0.73rem', color:'var(--muted)' }}>Mark AL for a whole week or individual days</p>
      </div>

      {/* AL panel */}
      {syncedEntry && (
        <div className="glass-card slide-up" style={{ padding:16, marginBottom:10, overflow:'hidden' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <span className="shift-code" style={{ color:'var(--acc)', fontSize:'0.8rem', fontFamily:'JetBrains Mono, monospace' }}>Link {syncedEntry.linkNum}</span>
              <span style={{ fontSize:'0.73rem', color:'var(--muted)', marginLeft:8 }}>{syncedEntry.dateFormatted}</span>
            </div>
            <button onClick={() => { setSelectedEntry(null); setMsg('') }}
              style={{ color:'var(--muted)', background:'none', border:'none', padding:'4px 8px', cursor:'pointer', fontSize:'0.95rem' }}>✕</button>
          </div>

          {msg && <p style={{ color:'var(--mint)', fontSize:'0.8rem', margin:'0 0 10px' }}>{msg}</p>}

          <button className="btn-primary"
            onClick={handleMarkWeekAL}
            disabled={syncedEntry.swapInfo?.swapLink === 'AL'}
            style={{ marginBottom:12, opacity: syncedEntry.swapInfo?.swapLink === 'AL' ? 0.5 : 1, cursor: syncedEntry.swapInfo?.swapLink === 'AL' ? 'not-allowed' : 'pointer' }}>
            {syncedEntry.swapInfo?.swapLink === 'AL' ? '✓ Whole Week is AL' : 'Mark Whole Week as AL'}
          </button>

          <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginBottom:8, textAlign:'center' }}>— or toggle individual days —</div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, overflowX:'auto' }}>
            {DAYS.map(day => {
              const shift = syncedEntry.days[day] || ''
              const isAL = shift === 'AL' || shift === 'Annual Leave'
              return (
                <div key={day} style={{ textAlign:'center', minWidth:0, overflow:'hidden' }}>
                  <div style={{ fontSize:'0.58rem', color:'var(--muted)', marginBottom:2 }}>{day}</div>
                  <div style={{ marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}><ShiftPill shift={shift} compact /></div>
                  <button onClick={() => handleToggleDayAL(day)}
                    className={isAL ? '' : 'glass-card-inner'}
                    style={isAL
                      ? { width:'100%', padding:'3px 2px', fontSize:'0.6rem', borderRadius:8, border:'1px solid rgba(196,181,253,0.35)', background:'rgba(196,181,253,0.12)', color:'var(--lav)', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }
                      : { width:'100%', padding:'3px 2px', fontSize:'0.6rem', borderRadius:8, border:'1px solid var(--border)', color:'var(--muted)', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }
                    }>
                    {isAL ? '✓ AL' : '+ AL'}
                  </button>
                </div>
              )
            })}
          </div>

          {syncedEntry.swapInfo && (
            <button
              className="glass-card-inner"
              style={{ marginTop:12, width:'100%', color:'#FCA5A5', borderColor:'rgba(252,165,165,0.3)', borderStyle:'solid', borderWidth:1, borderRadius:10, cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.9rem', padding:'11px 0' }}
              onClick={() => { clearSwap(syncedEntry); setMsg('✓ AL cleared') }}>
              Clear All Leave / Swap
            </button>
          )}
        </div>
      )}

      {/* Week list */}
      {upcoming.map(entry => {
        const isActive = selectedEntry?.weekKey === entry.weekKey
        const isWholeAL = entry.swapInfo?.swapLink === 'AL'
        const hasPartialAL = !isWholeAL && DAYS.some(d => entry.days[d] === 'AL' || entry.days[d] === 'Annual Leave')
        return (
          <button key={entry.weekKey} onClick={() => { setSelectedEntry(entry); setMsg('') }}
            className="glass-card"
            style={{
              display:'block', width:'100%', textAlign:'left', borderRadius:10, padding:'10px 14px', marginBottom:5, cursor:'pointer', transition:'all 0.15s',
              background: isActive ? 'rgba(249,168,212,0.1)' : undefined,
              borderColor: isActive ? 'var(--acc)' : undefined,
            }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <span className="shift-code" style={{ fontSize:'0.77rem', color:'var(--acc)', fontFamily:'JetBrains Mono, monospace' }}>Link {entry.linkNum}</span>
                {entry.isCurrent && <span style={{ fontSize:'0.62rem', color:'var(--mint)', background:'rgba(110,231,183,0.1)', border:'1px solid rgba(110,231,183,0.3)', borderRadius:20, padding:'1px 8px' }}>NOW</span>}
                {isWholeAL && <span style={{ fontSize:'0.62rem', color:'var(--lav)', background:'rgba(196,181,253,0.1)', border:'1px solid rgba(196,181,253,0.3)', borderRadius:20, padding:'1px 8px' }}>AL — Full Week</span>}
                {hasPartialAL && <span style={{ fontSize:'0.62rem', color:'var(--lav)', background:'rgba(196,181,253,0.1)', border:'1px solid rgba(196,181,253,0.3)', borderRadius:20, padding:'1px 8px' }}>AL (partial)</span>}
              </div>
              <span style={{ fontSize:'0.7rem', color:'var(--muted)', fontFamily:'JetBrains Mono,monospace' }}>{entry.dateFormatted}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
