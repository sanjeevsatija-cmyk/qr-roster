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
  const [dsMyDay,    setDsMyDay]    = useState('Mon')
  const [dsTheirLink, setDsTheirLink] = useState('')
  const [dsTheirDay,  setDsTheirDay]  = useState('Mon')
  const [dsTheirName, setDsTheirName] = useState('')
  const [dsError,    setDsError]    = useState('')
  const [dsSavedMsg, setDsSavedMsg]  = useState('')

  // Current + future weeks only
  const upcoming = personalRoster.filter(e => !e.isPast)

  const handleSelect = (entry) => {
    setSelectedEntry(entry)
    setSwapLinkInput(entry.swapInfo?.swapLink !== 'AL' ? (entry.swapInfo?.swapLink || '') : '')
    setDriverName(entry.swapInfo?.driverName || '')
    setError(''); setSavedMsg('')
    setDsMyDay('Mon'); setDsTheirLink(''); setDsTheirDay('Mon'); setDsTheirName('')
    setDsError(''); setDsSavedMsg('')
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
            Swap <span style={{ color:'#F59E0B' }}>Manager</span>
          </h2>
          <p style={{ margin:0, fontSize:'0.73rem', color:'#64748B' }}>Select a week to record a swap</p>
        </div>
        <button className="btn-ghost" onClick={() => setShowLog(v => !v)} style={{ color:'#64748B', fontSize:'0.75rem' }}>
          {showLog ? 'Hide Log' : 'Swap Log'}
        </button>
      </div>

      {/* Swap Log */}
      {showLog && (
        <div className="card fade-in" style={{ padding:14, marginBottom:12 }}>
          <div style={{ fontSize:'0.78rem', fontWeight:600, marginBottom:8 }}>Swap Log</div>
          {swapLog.length === 0
            ? <p style={{ color:'#64748B', fontSize:'0.78rem', margin:0 }}>No swaps recorded yet.</p>
            : swapLog.slice(0, 20).map((log, i) => (
              <div key={i} style={{ borderBottom: i < swapLog.length-1 ? '1px solid var(--border)' : 'none', paddingBottom:8, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span className="shift-code" style={{ fontSize:'0.72rem', color:'#F59E0B' }}>
                    Link {log.myLink} → {log.swapLink}
                    {log.driverName ? ` (${log.driverName})` : ''}
                  </span>
                  <span style={{ fontSize:'0.68rem', color:'#64748B' }}>{log.weekDate}</span>
                </div>
                <div style={{ fontSize:'0.68rem', color:'#64748B', marginTop:2 }}>{log.timestamp}</div>
              </div>
            ))
          }
        </div>
      )}

      {/* Swap form */}
      {selectedEntry && (
        <div className="card slide-up" style={{ padding:16, marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <span className="shift-code" style={{ color:'#F59E0B', fontSize:'0.8rem' }}>Link {selectedEntry.linkNum}</span>
              <span style={{ fontSize:'0.73rem', color:'#94A3B8', marginLeft:8 }}>{selectedEntry.dateFormatted}</span>
            </div>
            <button className="btn-ghost" onClick={() => setSelectedEntry(null)} style={{ color:'#64748B', padding:'4px 8px' }}>✕</button>
          </div>

          {/* Current shifts */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 }}>
            {DAYS.map(day => (
              <div key={day} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.58rem', color:'#64748B', marginBottom:2 }}>{day}</div>
                <ShiftPill shift={selectedEntry.days[day]} compact />
              </div>
            ))}
          </div>

          <div style={{ marginBottom:9 }}>
            <label style={{ fontSize:'0.73rem', color:'#94A3B8', display:'block', marginBottom:4 }}>Swap with Link Number</label>
            <input type="number" min="1" max="440" placeholder="e.g. 42"
              value={swapLinkInput}
              onChange={e => { setSwapLinkInput(e.target.value); setSavedMsg(''); setError('') }}
              style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'1.1rem' }} />
          </div>

          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:'0.73rem', color:'#94A3B8', display:'block', marginBottom:4 }}>Driver Name (optional)</label>
            <input type="text" placeholder="e.g. John Smith"
              value={driverName}
              onChange={e => { setDriverName(e.target.value); setSavedMsg(''); setError('') }} />
          </div>

          {error    && <p style={{ color:'#EF4444', fontSize:'0.8rem', margin:'0 0 8px' }}>{error}</p>}
          {savedMsg && <p style={{ color:'#34D399', fontSize:'0.8rem', margin:'0 0 8px' }}>{savedMsg}</p>}

          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-primary" onClick={handleSwap} style={{ flex:1 }}>Record Swap</button>
            {selectedEntry.swapInfo && selectedEntry.swapInfo.swapLink !== 'AL' && (
              <button className="btn-secondary" onClick={handleClear} style={{ flex:'0 0 76px' }}>Clear</button>
            )}
          </div>
        </div>
      )}

      {/* ── Individual day swap section ───────────────────────────────────────── */}
      {selectedEntry && (() => {
        const weekDaySwaps = DAYS
          .map(day => ({ day, data: daySwaps?.[`${selectedEntry.weekKey}_${day}`] }))
          .filter(x => x.data)

        const handleDaySwap = () => {
          const n = parseInt(dsTheirLink)
          if (isNaN(n) || n < 1 || n > 440) { setDsError('Enter a valid link number (1–440)'); return }
          recordDaySwap(selectedEntry, dsMyDay, n, dsTheirDay, dsTheirName.trim())
          setDsSavedMsg(`✓ ${dsMyDay} swapped with Link ${n} ${dsTheirDay}`)
          setDsError('')
          setDsTheirLink(''); setDsTheirName('')
        }

        return (
          <div style={{ marginBottom: 10 }}>
            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 10px' }}>
              <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              <span style={{ fontSize:'0.7rem', color:'var(--muted)', whiteSpace:'nowrap', fontWeight:600, letterSpacing:'0.04em' }}>
                INDIVIDUAL DAY SWAP
              </span>
              <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            </div>

            <div className="card" style={{ padding:16, marginBottom:10 }}>
              {/* My day */}
              <div style={{ marginBottom:9 }}>
                <label style={{ fontSize:'0.73rem', color:'var(--muted)', display:'block', marginBottom:4 }}>My day</label>
                <select value={dsMyDay} onChange={e => { setDsMyDay(e.target.value); setDsSavedMsg(''); setDsError('') }}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Their link + their day — side by side */}
              <div style={{ display:'flex', gap:8, marginBottom:9 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.73rem', color:'var(--muted)', display:'block', marginBottom:4 }}>Their link number</label>
                  <input
                    type="number" min="1" max="440" placeholder="e.g. 42"
                    value={dsTheirLink}
                    onChange={e => { setDsTheirLink(e.target.value); setDsSavedMsg(''); setDsError('') }}
                    style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'1rem' }}
                  />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'0.73rem', color:'var(--muted)', display:'block', marginBottom:4 }}>Their day</label>
                  <select value={dsTheirDay} onChange={e => { setDsTheirDay(e.target.value); setDsSavedMsg(''); setDsError('') }}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Their name */}
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:'0.73rem', color:'var(--muted)', display:'block', marginBottom:4 }}>Their name (optional)</label>
                <input
                  type="text" placeholder="e.g. John Smith"
                  value={dsTheirName}
                  onChange={e => { setDsTheirName(e.target.value); setDsSavedMsg(''); setDsError('') }}
                />
              </div>

              {dsError    && <p style={{ color:'var(--red)', fontSize:'0.8rem', margin:'0 0 8px' }}>{dsError}</p>}
              {dsSavedMsg && <p style={{ color:'#34D399', fontSize:'0.8rem', margin:'0 0 8px' }}>{dsSavedMsg}</p>}

              <button className="btn-primary" onClick={handleDaySwap}>Record Day Swap</button>
            </div>

            {/* Existing day swaps for this week */}
            {weekDaySwaps.length > 0 && (
              <div className="card" style={{ padding:'10px 14px' }}>
                <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--muted)', marginBottom:8 }}>
                  Day swaps this week
                </div>
                {weekDaySwaps.map(({ day, data }) => (
                  <div key={day} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 8,
                    marginBottom: 8,
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem', color:'#60A5FA' }}>
                        {day} ↔ Link {data.swapLink} {data.swapDay}
                      </span>
                      {data.driverName && (
                        <span style={{ fontSize:'0.72rem', color:'var(--muted)', marginLeft:6 }}>
                          · {data.driverName}
                        </span>
                      )}
                    </div>
                    <button
                      className="btn-ghost"
                      style={{ padding:'2px 8px', fontSize:'0.72rem', color:'var(--red)' }}
                      onClick={() => clearDaySwap(selectedEntry, day)}>
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
            style={{ display:'block', width:'100%', textAlign:'left', background: isActive ? '#1A1E10' : 'var(--surface)', border:`1px solid ${isActive ? '#F59E0B' : 'var(--border)'}`, borderRadius:10, padding:'10px 12px', marginBottom:5, cursor:'pointer', transition:'all 0.15s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <span className="shift-code" style={{ fontSize:'0.77rem', color:'#F59E0B' }}>Link {entry.linkNum}</span>
                {entry.isCurrent && <span style={{ fontSize:'0.62rem', color:'#34D399', background:'#0A2417', border:'1px solid #065F46', borderRadius:4, padding:'1px 5px' }}>NOW</span>}
                {hasSwap && (
                  <span style={{ fontSize:'0.62rem', color:'#60A5FA', background:'#0C1A2E', border:'1px solid #1E3A5F', borderRadius:4, padding:'1px 5px' }}>
                    ↔ {entry.swapInfo.swapLink}{entry.swapInfo.driverName ? ` · ${entry.swapInfo.driverName}` : ''}
                  </span>
                )}
              </div>
              <span style={{ fontSize:'0.7rem', color:'#64748B', fontFamily:'JetBrains Mono,monospace' }}>{entry.dateFormatted}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
