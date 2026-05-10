import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoster, hasJobCard, classifyShift } from '../contexts/RosterContext'
import ShiftPill from '../components/ShiftPill'

const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── parseShift — unchanged from original ────────────────────────────────────
function parseShift(shift) {
  if (!shift) return { code: '—', times: '', duration: '', hasEx: false }
  const hasEx = /^EX\s*\//i.test(shift)
  const clean = shift.replace(/^EX\s*\/\s*/i, '').trim()
  const durMatch = clean.match(/\((\d{2}:\d{2})\)/)
  const duration = durMatch ? durMatch[1] : ''
  const timeMatch = clean.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
  const times = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : ''
  const leadingTime = clean.match(/^(\d{2}:\d{2})\s+([A-Z][A-Z0-9#\-]+)/i)
  let code
  if (leadingTime) {
    code = leadingTime[2]
  } else {
    code = clean
      .replace(/\(\d{2}:\d{2}\)/, '')
      .replace(/\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}/, '')
      .replace(/S\/O\s+\w+/, '')
      .trim()
      .split(/\s+/)[0]
  }
  return { code: code || clean, times, duration, hasEx }
}

// ─── Duration formatter: "08:18" → "8h 18m" ──────────────────────────────────
function formatDuration(dur) {
  if (!dur) return ''
  const [h, m] = dur.split(':').map(Number)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

// ─── Shift badge ──────────────────────────────────────────────────────────────
// Uses classifyShift() from RosterContext for special codes.
// Falls back to start-time classification for regular working shifts ('other').
function getShiftBadge(shift) {
  if (!shift || !shift.trim()) return { label: 'Rest', type: 'rest' }
  const type = classifyShift(shift)
  const MAP = {
    empty: { label: 'Rest',         type: 'rest'  },
    al:    { label: 'Annual Leave', type: 'al'    },
    blp:   { label: 'BLP',          type: 'blp'   },
    slp:   { label: 'SLP',          type: 'slp'   },
    afp:   { label: 'Leave',        type: 'al'    },
    spare: { label: 'Spare',        type: 'spare' },
    eb:    { label: 'Early Birds',  type: 'eb'    },
    ef:    { label: 'Early Finish', type: 'ef'    },
    tr:    { label: 'Training',     type: 'tr'    },
    cs:    { label: 'CS',           type: 'cs'    },
  }
  if (MAP[type]) return MAP[type]
  // 'other' — classify by start time
  const m = shift.match(/(\d{1,2}):(\d{2})/)
  if (m) {
    const h = parseInt(m[1], 10)
    if (h < 10) return { label: 'Early',     type: 'early' }
    if (h < 18) return { label: 'Afternoon', type: 'late'  }
    return              { label: 'Night',     type: 'night' }
  }
  return { label: 'Shift', type: 'other' }
}

// Badge colours match the existing index.css badge classes.
// 'early', 'late', 'night' are new for regular working shifts.
const BADGE_COLOR = {
  rest:  'var(--muted)',
  al:    '#6EE7B7',
  blp:   '#64748B',
  slp:   '#60A5FA',
  spare: '#A78BFA',
  eb:    '#BEF264',
  ef:    '#A3E635',
  tr:    '#93C5FD',
  cs:    '#FCD34D',
  other: '#E879F9',
  early: '#38BDF8',
  late:  'var(--amber)',
  night: '#A78BFA',
}

// ─── Dark mode hook — unchanged from original ─────────────────────────────────
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

// ─── RosterPage ───────────────────────────────────────────────────────────────
export default function RosterPage() {
  const navigate = useNavigate()
  const { personalRoster, startingLink, resetAll } = useRoster()

  const [weekOffset,    setWeekOffset]    = useState(0)
  const [selectedShift, setSelectedShift] = useState(null)
  const [showSettings,  setShowSettings]  = useState(false)
  const [dark, toggleDark] = useDarkMode()

  // Find the current week's index inside the pre-built personalRoster array.
  // weekOffset=0 → current week, negative=past, positive=future.
  const currentWeekIdx = useMemo(
    () => personalRoster.findIndex(e => e.isCurrent),
    [personalRoster]
  )

  const displayIdx = Math.max(0, Math.min(personalRoster.length - 1, currentWeekIdx + weekOffset))
  const entry = personalRoster[displayIdx]

  if (!startingLink || !entry) return null

  // ── Date helpers ──────────────────────────────────────────────────────────
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const todayDayName = DAYS[(now.getDay() + 6) % 7]  // Mon=0 … Sun=6

  const isToday = day => entry.isCurrent && day === todayDayName

  // A day is past if: whole week is past, OR it's the current week and the
  // individual day's date is strictly before today.
  const isDayPast = dayIdx => {
    if (entry.isPast) return true
    if (!entry.isCurrent) return false
    const d = new Date(entry.monday)
    d.setDate(d.getDate() + dayIdx)
    d.setHours(0, 0, 0, 0)
    return d < now
  }

  // ── Week range label ──────────────────────────────────────────────────────
  const weekEnd = new Date(entry.monday)
  weekEnd.setDate(entry.monday.getDate() + 6)
  const sameMonth = entry.monday.getMonth() === weekEnd.getMonth()
  const weekLabel = sameMonth
    ? `${entry.monday.getDate()} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`
    : `${entry.monday.getDate()} ${MONTHS[entry.monday.getMonth()]} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`

  const canPrev = displayIdx > 0
  const canNext = displayIdx < personalRoster.length - 1

  const navBtnStyle = disabled => ({
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 16px',
    cursor: disabled ? 'default' : 'pointer',
    color: disabled ? 'var(--border)' : 'var(--text)',
    fontSize: '1.2rem',
    lineHeight: 1,
    opacity: disabled ? 0.3 : 1,
    flexShrink: 0,
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>
            <span style={{ color:'var(--amber)' }}>QR</span> Roster
          </h1>
          <p style={{ margin:0, fontSize:'0.72rem', color:'var(--muted)' }}>
            Starting link: {startingLink}
          </p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button
            onClick={toggleDark}
            style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:'1rem' }}
            title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'var(--muted)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Week navigation ──────────────────────────────────────────────────── */}
      <div style={{ flexShrink:0, borderBottom:'1px solid var(--border)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          gap: 8,
        }}>
          <button
            style={navBtnStyle(!canPrev)}
            disabled={!canPrev}
            onClick={() => canPrev && setWeekOffset(o => o - 1)}
            aria-label="Previous week">
            ‹
          </button>

          <div style={{ textAlign:'center', flex:1, minWidth:0 }}>
            <div style={{
              fontSize: '0.88rem',
              fontWeight: 600,
              color: entry.isCurrent ? 'var(--amber)' : 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {weekLabel}
            </div>
            <div style={{ fontSize:'0.68rem', color:'var(--muted)', marginTop:1 }}>
              Link {entry.linkNum}
              {entry.isCurrent && (
                <span style={{ color:'var(--green)', marginLeft:6 }}>● This week</span>
              )}
            </div>
          </div>

          <button
            style={navBtnStyle(!canNext)}
            disabled={!canNext}
            onClick={() => canNext && setWeekOffset(o => o + 1)}
            aria-label="Next week">
            ›
          </button>
        </div>

        {/* Swap / AL banner — only shown when this week has an override */}
        {entry.swapInfo && (
          <div style={{ textAlign:'center', paddingBottom:6, fontSize:'0.7rem' }}>
            {entry.swapInfo.swapLink === 'AL'
              ? <span style={{ color:'#6EE7B7' }}>↺ Full week — Annual Leave</span>
              : <span style={{ color:'#60A5FA' }}>
                  ↔ Swapped to Link {entry.swapInfo.swapLink}
                  {entry.swapInfo.driverName ? ` · ${entry.swapInfo.driverName}` : ''}
                </span>
            }
          </div>
        )}
      </div>

      {/* ── Day cards ────────────────────────────────────────────────────────── */}
      <div className="page-content" style={{ padding:'8px 12px' }}>
        {DAYS.map((day, i) => {
          const shift    = entry.days[day] || ''
          const today    = isToday(day)
          const past     = isDayPast(i)
          const tappable = hasJobCard(shift)
          const isRest   = !shift || classifyShift(shift) === 'empty'
          const isAL     = !isRest && classifyShift(shift) === 'al'
          const badge    = getShiftBadge(shift)
          const { code, times, duration, hasEx } = parseShift(shift)

          // Compute full date — handles month boundaries correctly
          const dayDate = new Date(entry.monday)
          dayDate.setDate(entry.monday.getDate() + i)
          const dateLabel = `${day} · ${dayDate.getDate()} ${MONTHS[dayDate.getMonth()]}`

          const badgeColor = today
            ? 'var(--amber)'
            : (BADGE_COLOR[badge.type] || 'var(--muted)')
          const badgeLabel = today ? 'Today' : badge.label

          return (
            <div
              key={day}
              className="card"
              style={{
                marginBottom: 8,
                padding: '10px 14px',
                opacity: past ? 0.35 : 1,
                border: today
                  ? '1.5px solid var(--amber)'
                  : '1px solid var(--border)',
                cursor: tappable ? 'pointer' : 'default',
                transition: 'opacity 0.15s',
              }}
              onClick={() => tappable && setSelectedShift({ entry, day, shift })}
            >
              {/* Row 1: date + badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}>
                <span style={{ fontSize:'0.78rem', color:'var(--muted)', letterSpacing:'0.03em' }}>
                  {dateLabel}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '1px 9px',
                  borderRadius: 10,
                  border: `0.5px solid ${badgeColor}`,
                  color: badgeColor,
                  whiteSpace: 'nowrap',
                }}>
                  {badgeLabel}
                </span>
              </div>

              {/* Row 2+: body */}
              {isRest ? (
                <div style={{ fontSize:'0.88rem', color:'var(--muted)', fontStyle:'italic' }}>
                  Rest day
                </div>
              ) : isAL ? (
                <div style={{ fontSize:'0.88rem', color:'#6EE7B7', fontStyle:'italic' }}>
                  Annual leave
                </div>
              ) : (
                <>
                  {/* Shift code — large mono */}
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                    letterSpacing: '0.04em',
                    marginBottom: times ? 4 : 0,
                  }}>
                    {hasEx && (
                      <span style={{ fontSize:'0.78rem', opacity:0.6, marginRight:4 }}>EX /</span>
                    )}
                    {code}
                  </div>
                  {/* Times → Duration */}
                  {times && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.78rem', color:'var(--muted)' }}>
                        {times.replace('-', ' → ')}
                      </span>
                      {duration && (
                        <span style={{
                          fontSize: '0.72rem',
                          color: 'var(--muted)',
                          background: 'var(--surface2)',
                          padding: '2px 9px',
                          borderRadius: 8,
                        }}>
                          {formatDuration(duration)}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Shift detail modal — unchanged from original ──────────────────────── */}
      {selectedShift && (
        <div
          onClick={() => setSelectedShift(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'flex-end' }}>
          <div
            className="slide-up"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0',
              padding: '20px',
              width: '100%',
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
            }}>
            <div style={{ width:36, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 16px' }}/>
            <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginBottom:6 }}>
              {selectedShift.day} {selectedShift.entry.dayDates[selectedShift.day]} · {selectedShift.entry.dateFormatted} · Link {selectedShift.entry.linkNum}
            </div>
            <div style={{ marginBottom:16 }}>
              <ShiftPill shift={selectedShift.shift} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {hasJobCard(selectedShift.shift) && (
                <button
                  className="btn-primary"
                  style={{ flex:1 }}
                  onClick={() => {
                    navigate('/jobcard', { state:{ shift:selectedShift.shift, day:selectedShift.day } })
                    setSelectedShift(null)
                  }}>
                  View Job Card →
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => setSelectedShift(null)}
                style={{ flex: hasJobCard(selectedShift.shift) ? '0 0 80px' : 1 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings modal — unchanged from original ──────────────────────────── */}
      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'flex-end' }}>
          <div
            className="slide-up"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0',
              padding: '20px',
              width: '100%',
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
            }}>
            <div style={{ width:36, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 16px' }}/>
            <h3 style={{ margin:'0 0 16px', fontSize:'0.95rem', fontWeight:600 }}>Settings</h3>
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:'0.8rem', color:'var(--muted)', margin:'0 0 4px' }}>Starting Link</p>
              <p style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--amber)', margin:0 }}>
                Link {startingLink}
              </p>
            </div>
            <button
              className="btn-secondary"
              style={{ borderColor:'#7F1D1D', color:'#EF4444', marginBottom:8 }}
              onClick={() => {
                if (confirm('Reset all data? Cannot be undone.')) {
                  resetAll()
                  setShowSettings(false)
                }
              }}>
              Reset All Data
            </button>
            <button
              className="btn-ghost"
              onClick={() => setShowSettings(false)}
              style={{ width:'100%', textAlign:'center' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
