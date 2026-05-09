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
          Annual <span style={{ color:'#F59E0B' }}>Leave</span>
        </h2>
        <p style={{ margin:0, fontSize:'0.73rem', color:'#64748B' }}>Mark AL for a whole week or individual days</p>
      </div>

      {/* AL panel */}
      {syncedEntry && (
        <div className="card slide-up" style={{ padding:16, marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <span className="shift-code" style={{ color:'#F59E0B', fontSize:'0.8rem' }}>Link {syncedEntry.linkNum}</span>
              <span style={{ fontSize:'0.73rem', color:'#94A3B8', marginLeft:8 }}>{syncedEntry.dateFormatted}</span>
            </div>
            <button className="btn-ghost" onClick={() => { setSelectedEntry(null); setMsg('') }} style={{ color:'#64748B', padding:'4px 8px' }}>✕</button>
          </div>

          {msg && <p style={{ color:'#34D399', fontSize:'0.8rem', margin:'0 0 10px' }}>{msg}</p>}

          <button className="btn-primary"
            onClick={handleMarkWeekAL}
            disabled={syncedEntry.swapInfo?.swapLink === 'AL'}
            style={{ marginBottom:12 }}>
            {syncedEntry.swapInfo?.swapLink === 'AL' ? '✓ Whole Week is AL' : 'Mark Whole Week as AL'}
          </button>

          <div style={{ fontSize:'0.7rem', color:'#64748B', marginBottom:8, textAlign:'center' }}>— or toggle individual days —</div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5 }}>
            {DAYS.map(day => {
              const shift = syncedEntry.days[day] || ''
              const isAL = shift === 'AL' || shift === 'Annual Leave'
              return (
                <div key={day} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'0.58rem', color:'#64748B', marginBottom:2 }}>{day}</div>
                  <div style={{ marginBottom:4 }}><ShiftPill shift={shift} compact /></div>
                  <button onClick={() => handleToggleDayAL(day)}
                    style={{ width:'100%', padding:'3px 2px', fontSize:'0.6rem', borderRadius:5, border:`1px solid ${isAL ? '#065F46' : '#374151'}`, background: isAL ? '#0A2417' : 'var(--surface2)', color: isAL ? '#34D399' : '#64748B', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                    {isAL ? '✓ AL' : '+ AL'}
                  </button>
                </div>
              )
            })}
          </div>

          {syncedEntry.swapInfo && (
            <button className="btn-secondary"
              style={{ marginTop:12, borderColor:'#7F1D1D', color:'#EF4444' }}
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
            style={{ display:'block', width:'100%', textAlign:'left', background: isActive ? '#0A2417' : 'var(--surface)', border:`1px solid ${isActive ? '#065F46' : 'var(--border)'}`, borderRadius:10, padding:'10px 12px', marginBottom:5, cursor:'pointer', transition:'all 0.15s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <span className="shift-code" style={{ fontSize:'0.77rem', color:'#F59E0B' }}>Link {entry.linkNum}</span>
                {entry.isCurrent && <span style={{ fontSize:'0.62rem', color:'#34D399', background:'#0A2417', border:'1px solid #065F46', borderRadius:4, padding:'1px 5px' }}>NOW</span>}
                {isWholeAL && <span style={{ fontSize:'0.62rem', color:'#6EE7B7', background:'#0A2417', border:'1px solid #065F46', borderRadius:4, padding:'1px 5px' }}>AL — Full Week</span>}
                {hasPartialAL && <span style={{ fontSize:'0.62rem', color:'#6EE7B7', background:'#0A2417', border:'1px solid #065F46', borderRadius:4, padding:'1px 5px' }}>AL (partial)</span>}
              </div>
              <span style={{ fontSize:'0.7rem', color:'#64748B', fontFamily:'JetBrains Mono,monospace' }}>{entry.dateFormatted}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
