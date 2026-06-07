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

export default function SwapPage() {
  const { personalRoster, recordSwap, clearSwap, swapLog, recordDaySwap, clearDaySwap, daySwaps } = useRoster()
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [swapLinkInput, setSwapLinkInput] = useState('')
  const [driverName, setDriverName] = useState('')
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [showLog, setShowLog] = useState(false)

  // Individual day swap form state
  const [dsMyDay,     setDsMyDay]     = useState('Mon')
  const [dsTheirLink, setDsTheirLink] = useState('')
  const [dsTheirDay,  setDsTheirDay]  = useState('Mon')
  const [dsTheirName, setDsTheirName] = useState('')
  const [dsError,     setDsError]     = useState('')
  const [dsSaved,     setDsSaved]     = useState('')

  // Current + future weeks only
  const upcoming = personalRoster.filter(e => !e.isPast)

  const handleSelect = (entry) => {
    setSelectedEntry(entry)
    setSwapLinkInput(entry.swapInfo?.swapLink !== 'AL' ? (entry.swapInfo?.swapLink || '') : '')
    setDriverName(entry.swapInfo?.driverName || '')
    setError(''); setSavedMsg('')
    setDsMyDay('Mon'); setDsTheirLink(''); setDsTheirDay('Mon'); setDsTheirName('')
    setDsError(''); setDsSaved('')
  }

  const handleSwap = () => {
    const n = parseInt(swapLinkInput)
    if (isNaN(n) || n < 1 || n > 440) { setError('Enter a valid link number (1–440)'); return }
    recordSwap(selectedEntry, n, driverName)
    setSavedMsg(`✓ Swapped to Link ${n}`)
    setError('')
  }

  const handleClear = () => {
    clearSwap(selectedEntry)
    setSwapLinkInput(''); setDriverName('')
    setSavedMsg('✓ Swap cleared')
  }

  return (
    <div style={{ padding:'16px 16px 0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <h2 style={{ margin:'0 0 2px', fontSize:'1rem', fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>
            <span style={{ color:'var(--text)' }}>Swap</span> <span style={{ color:'var(--acc)' }}>Manager</span>
          </h2>
          <p style={{ margin:0, fontSize:'0.73rem', color:'var(--muted)' }}>Select a week to record a swap</p>
        </div>
        <button onClick={() => setShowLog(v => !v)}
          className="glass-card-inner"
          style={{ color:'var(--muted)', border:'none', borderRadius:8, padding:'5px 12px', fontSize:'0.75rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
          {showLog ? 'Hide Log' : 'Swap Log'}
        </button>
      </div>

      {/* Swap Log */}
      {showLog && (
        <div className="glass-card fade-in" style={{ padding:14, marginBottom:12 }}>
          <div style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text)', marginBottom:8 }}>Swap Log</div>
          {swapLog.length === 0
            ? <p style={{ color:'var(--muted)', fontSize:'0.78rem', margin:0 }}>No swaps recorded yet.</p>
            : swapLog.slice(0, 20).map((log, i) => (
              <div key={i} style={{ borderBottom: i < swapLog.length-1 ? '1px solid var(--border)' : 'none', paddingBottom:8, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span className="shift-code" style={{ fontSize:'0.72rem', color:'var(--acc)', fontFamily:'JetBrains Mono, monospace' }}>
                    Link {log.myLink} → {log.swapLink}
                    {log.driverName ? ` (${log.driverName})` : ''}
                  </span>
                  <span style={{ fontSize:'0.68rem', color:'var(--muted)' }}>{log.weekDate}</span>
                </div>
                <div style={{ fontSize:'0.68rem', color:'var(--muted)', marginTop:2 }}>{log.timestamp}</div>
              </div>
            ))
          }
        </div>
      )}

      {/* Swap form */}
      {selectedEntry && (
        <div className="glass-card slide-up" style={{ padding:16, marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <span className="shift-code" style={{ color:'var(--acc)', fontSize:'0.8rem', fontFamily:'JetBrains Mono, monospace' }}>Link {selectedEntry.linkNum}</span>
              <span style={{ fontSize:'0.73rem', color:'var(--muted)', marginLeft:8 }}>{selectedEntry.dateFormatted}</span>
            </div>
            <button onClick={() => setSelectedEntry(null)}
              style={{ color:'var(--muted)', background:'none', border:'none', padding:'4px 8px', cursor:'pointer', fontSize:'0.95rem' }}>✕</button>
          </div>

          {/* Current shifts */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 }}>
            {DAYS.map(day => (
              <div key={day} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.58rem', color:'var(--muted)', marginBottom:2 }}>{day}</div>
                <ShiftPill shift={selectedEntry.days[day]} compact />
              </div>
            ))}
          </div>

          <div style={{ marginBottom:9 }}>
            <label style={{ fontSize:'0.73rem', color:'var(--muted)', display:'block', marginBottom:4 }}>Swap with Link Number</label>
            <input type="number" min="1" max="440" placeholder="e.g. 42"
              value={swapLinkInput}
              onChange={e => { setSwapLinkInput(e.target.value); setSavedMsg(''); setError('') }}
              style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'1.1rem' }} />
          </div>

          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:'0.73rem', color:'var(--muted)', display:'block', marginBottom:4 }}>Driver Name (optional)</label>
            <input type="text" placeholder="e.g. John Smith"
              value={driverName}
              onChange={e => { setDriverName(e.target.value); setSavedMsg(''); setError('') }} />
          </div>

          {error    && <p style={{ color:'#FCA5A5', fontSize:'0.8rem', margin:'0 0 8px' }}>{error}</p>}
          {savedMsg && <p style={{ color:'var(--mint)', fontSize:'0.8rem', margin:'0 0 8px' }}>{savedMsg}</p>}

          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-primary" onClick={handleSwap} style={{ flex:1 }}>Record Swap</button>
            {selectedEntry.swapInfo && selectedEntry.swapInfo.swapLink !== 'AL' && (
              <button onClick={handleClear}
                className="glass-card-inner"
                style={{ flex:'0 0 76px', color:'#FCA5A5', borderColor:'rgba(252,165,165,0.3)', borderStyle:'solid', borderWidth:1, borderRadius:10, cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.9rem', padding:'11px 0' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Individual day swap section ──────────────────────────────────────── */}
      {selectedEntry && (() => {
        const weekDaySwaps = DAYS
          .filter(d => daySwaps?.[`${selectedEntry.weekKey}_${d}`])
          .map(d => ({ myDay: d, ...daySwaps[`${selectedEntry.weekKey}_${d}`] }))

        const handleDaySwap = () => {
          const n = parseInt(dsTheirLink)
          if (isNaN(n) || n < 1 || n > 440) { setDsError('Enter a valid link number (1–440)'); return }
          recordDaySwap(selectedEntry, dsMyDay, n, dsTheirDay, dsTheirName.trim())
          setDsSaved(`✓ ${dsMyDay} ↔ ${dsTheirDay} · Link ${n}`)
          setDsError(''); setDsTheirLink(''); setDsTheirName('')
        }

        return (
          <div style={{ marginBottom: 10 }}>
            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 10px' }}>
              <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              <span style={{ fontSize:'0.68rem', color:'var(--muted)', whiteSpace:'nowrap', fontWeight:600, letterSpacing:'0.1em' }}>
                INDIVIDUAL DAY SWAP
              </span>
              <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            </div>

            <div className="glass-card" style={{ padding:16, marginBottom:10 }}>
              {/* My day */}
              <div style={{ marginBottom:9 }}>
                <label style={{ fontSize:'0.73rem', color:'var(--muted)', display:'block', marginBottom:4 }}>My day</label>
                <select value={dsMyDay} onChange={e => { setDsMyDay(e.target.value); setDsSaved(''); setDsError('') }}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Their link + their day side by side */}
              <div style={{ display:'flex', gap:8, marginBottom:9 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.73rem', color:'var(--muted)', display:'block', marginBottom:4 }}>Their link number</label>
                  <input
                    type="number" min="1" max="440" placeholder="e.g. 200"
                    value={dsTheirLink}
                    onChange={e => { setDsTheirLink(e.target.value); setDsSaved(''); setDsError('') }}
                    style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'1rem' }}
                  />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.73rem', color:'var(--muted)', display:'block', marginBottom:4 }}>Their day</label>
                  <select value={dsTheirDay} onChange={e => { setDsTheirDay(e.target.value); setDsSaved(''); setDsError('') }}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Driver name */}
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:'0.73rem', color:'var(--muted)', display:'block', marginBottom:4 }}>Driver name (optional)</label>
                <input
                  type="text" placeholder="Driver name (optional)"
                  value={dsTheirName}
                  onChange={e => { setDsTheirName(e.target.value); setDsSaved(''); setDsError('') }}
                />
              </div>

              {dsError && <p style={{ color:'#FCA5A5', fontSize:'0.8rem', margin:'0 0 8px' }}>{dsError}</p>}
              {dsSaved && <p style={{ color:'var(--mint)', fontSize:'0.8rem', margin:'0 0 8px' }}>{dsSaved}</p>}

              <button className="btn-primary" onClick={handleDaySwap}>Record Swap</button>
            </div>

            {/* Existing day swaps for this week */}
            {weekDaySwaps.length > 0 && (
              <div className="glass-card" style={{ padding:'10px 14px', marginBottom:10 }}>
                <div style={{ fontSize:'0.73rem', fontWeight:600, color:'var(--muted)', marginBottom:8 }}>
                  Day swaps this week
                </div>
                {weekDaySwaps.map(({ myDay, swapLink, swapDay, driverName: dn }) => (
                  <div key={myDay} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:7, marginBottom:7, borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem', color:'var(--acc)' }}>
                      {myDay} ↔ {swapDay} · Link {swapLink}
                      {dn ? <span style={{ color:'var(--muted)', fontFamily:'DM Sans,sans-serif', fontWeight:400 }}> · {dn}</span> : ''}
                    </span>
                    <button
                      style={{ background:'none', border:'none', padding:'2px 8px', fontSize:'0.72rem', color:'#FCA5A5', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                      onClick={() => clearDaySwap(selectedEntry, myDay)}>
                      Clear
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* Week list */}
      {upcoming.map(entry => {
        const isActive = selectedEntry?.weekKey === entry.weekKey
        const hasSwap = entry.swapInfo && entry.swapInfo.swapLink !== 'AL'
        return (
          <button key={entry.weekKey} onClick={() => handleSelect(entry)}
            className="glass-card"
            style={{
              display:'block', width:'100%', textAlign:'left', borderRadius:10, padding:'10px 14px', marginBottom:5, cursor:'pointer', transition:'all 0.15s',
              background: isActive ? 'rgba(249,168,212,0.1)' : undefined,
              borderColor: isActive ? 'var(--acc)' : undefined,
            }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <span className="shift-code" style={{ fontSize:'0.77rem', color:'var(--acc)', fontFamily:'JetBrains Mono, monospace' }}>Link {entry.linkNum}</span>
                {entry.isCurrent && <span style={{ fontSize:'0.62rem', color:'var(--acc)', background:'rgba(249,168,212,0.12)', border:'1px solid rgba(249,168,212,0.3)', borderRadius:20, padding:'1px 8px' }}>NOW</span>}
                {hasSwap && (
                  <span style={{ fontSize:'0.62rem', color:'var(--acc)', background:'rgba(249,168,212,0.1)', border:'1px solid rgba(249,168,212,0.3)', borderRadius:20, padding:'1px 8px' }}>
                    ↔ {entry.swapInfo.swapLink}{entry.swapInfo.driverName ? ` · ${entry.swapInfo.driverName}` : ''}
                  </span>
                )}
              </div>
              <span style={{ fontSize:'0.7rem', color:'var(--muted)', fontFamily:'JetBrains Mono,monospace' }}>{entry.dateFormatted}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
