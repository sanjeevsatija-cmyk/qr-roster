/**
 * QR Roster — Queensland Rail Mayne Link Roster PWA
 * Developed by Sanjeev Satija, Brisbane, Australia
 * First created: April 2026
 * Copyright © 2026 Sanjeev Satija. All rights reserved.
 * Unauthorised copying, modification or distribution
 * of this software is strictly prohibited.
 */
import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoster, hasJobCard, classifyShift } from '../contexts/RosterContext'
import { requestNotificationPermission, getNotificationPermission } from '../hooks/useNotifications'
import { isQldHoliday } from '../data/qldHolidays'
import ShiftPill from '../components/ShiftPill'

const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTHS      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getMondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

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
  al:    'var(--green)',
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

// ─── Extract sign-on time from shift string ("06:15" or null) ────────────────
function extractSignOnTime(shift) {
  if (!shift) return null
  const clean = shift.replace(/^EX\s*\/\s*/i, '').trim()
  const rangeMatch = clean.match(/^(\d{1,2}:\d{2})\s*[-–]/)
  if (rangeMatch) {
    const [h, m] = rangeMatch[1].split(':')
    return `${String(h).padStart(2, '0')}:${m}`
  }
  const leadingMatch = clean.match(/^(\d{2}:\d{2})\s+[A-Z]/i)
  if (leadingMatch) return leadingMatch[1]
  return null
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
  const { personalRoster, startingLink, resetAll, notes, setNote, reminders, setReminder, clearReminder } = useRoster()

  const [weekOffset,    setWeekOffset]    = useState(0)
  const [selectedShift, setSelectedShift] = useState(null)
  const [showSettings,  setShowSettings]  = useState(false)
  const [noteSheet,     setNoteSheet]     = useState(null) // { dateKey, dateLabel, text }
  const [reminderSheet, setReminderSheet] = useState(null) // { dateKey, dateLabel, signOnTime, offsetMinutes }
  const [notifPerm,     setNotifPerm]     = useState(() => getNotificationPermission())
  const [showWeekPicker, setShowWeekPicker] = useState(false)
  const [pickerMonth,    setPickerMonth]    = useState(() => {
    const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1)
  })
  const [dark, toggleDark] = useDarkMode()

  const [tapCount, setTapCount] = useState(0)
  const [lastTap,  setLastTap]  = useState(0)

  const handleTitleTap = () => {
    const now = Date.now()
    if (now - lastTap > 3000) {
      setTapCount(1)
    } else {
      setTapCount(prev => prev + 1)
    }
    setLastTap(now)
    if (tapCount + 1 >= 7) {
      setTapCount(0)
      navigate('/about')
    }
  }

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

  const handleWeekSelect = (monday) => {
    const idx = personalRoster.findIndex(e => {
      const m = e.monday
      return m.getFullYear() === monday.getFullYear() &&
             m.getMonth()    === monday.getMonth()    &&
             m.getDate()     === monday.getDate()
    })
    if (idx >= 0) {
      setWeekOffset(idx - currentWeekIdx)
      setShowWeekPicker(false)
    }
  }

  const openPicker = () => {
    setPickerMonth(new Date(entry.monday.getFullYear(), entry.monday.getMonth(), 1))
    setShowWeekPicker(true)
  }

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
    <div>

      {/* ── Sticky header + week nav wrapper ────────────────────────────────── */}
      <div style={{ position:'sticky', top:0, zIndex:20, background:'var(--bg)' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 onClick={handleTitleTap} style={{ margin:0, fontSize:'1.1rem', fontWeight:700, fontFamily:'JetBrains Mono,monospace', cursor:'default', userSelect:'none' }}>
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
      <div style={{ borderBottom:'1px solid var(--border)' }}>
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

          <button
            onClick={openPicker}
            style={{ textAlign:'center', flex:1, minWidth:0, background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>
            <div style={{
              fontSize: '0.88rem',
              fontWeight: 600,
              color: entry.isCurrent ? 'var(--amber)' : 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}>
              {weekLabel}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.7, flexShrink:0 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div style={{ fontSize:'0.68rem', color:'var(--muted)', marginTop:1 }}>
              Link {entry.linkNum}
              {entry.isCurrent && (
                <span style={{ color:'var(--green)', marginLeft:6 }}>● This week</span>
              )}
            </div>
          </button>

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

      </div> {/* end sticky wrapper */}

      {/* ── Day cards ────────────────────────────────────────────────────────── */}
      <div style={{ padding:'8px 12px' }}>
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

          // Note key: YYYY-MM-DD for localStorage
          const noteKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth()+1).padStart(2,'0')}-${String(dayDate.getDate()).padStart(2,'0')}`
          const hasNote    = !!(notes && notes[noteKey])
          const isHoliday  = isQldHoliday(dayDate)
          const daySwap    = entry.daySwapInfo?.[day] || null

          // Reminder
          const signOnTime = (!isRest && !isAL) ? extractSignOnTime(shift) : null
          const hasReminder = !!(reminders && reminders[noteKey])

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
              {/* Row 1: date + note icon + badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ fontSize:'0.78rem', color:'var(--muted)', letterSpacing:'0.03em' }}>
                    {dateLabel}
                  </span>
                  {isHoliday && (
                    <span style={{
                      fontSize: '0.6rem',
                      padding: '1px 5px',
                      borderRadius: 6,
                      background: 'rgba(248,113,113,0.15)',
                      color: '#F87171',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                    }}>
                      PH
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {signOnTime && (
                    <button
                      title={hasReminder ? 'Edit reminder' : 'Set reminder'}
                      onClick={e => {
                        e.stopPropagation()
                        setReminderSheet({
                          dateKey: noteKey,
                          dateLabel,
                          signOnTime,
                          offsetMinutes: (reminders && reminders[noteKey]?.offsetMinutes) || 60,
                        })
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 3px',
                        color: hasReminder ? 'var(--amber)' : 'var(--border)',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={hasReminder ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                    </button>
                  )}
                  <button
                    title={hasNote ? 'Edit note' : 'Add note'}
                    onClick={e => {
                      e.stopPropagation()
                      setNoteSheet({ dateKey: noteKey, dateLabel, text: (notes && notes[noteKey]) || '' })
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 3px',
                      color: hasNote ? 'var(--amber)' : 'var(--text)',
                      opacity: hasNote ? 1 : 0.7,
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={hasNote ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
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
              </div>

              {/* Row 2+: body */}
              {isRest ? (
                <div style={{ fontSize:'0.88rem', color:'var(--muted)', fontStyle:'italic' }}>
                  Rest day
                </div>
              ) : isAL ? (
                <div style={{ fontSize:'0.88rem', color:'var(--text)', fontStyle:'italic' }}>
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
              {/* Individual day swap indicator */}
              {daySwap && (
                <div style={{ marginTop:5, fontSize:'0.72rem', color:'#60A5FA' }}>
                  ↔ {daySwap.driverName || `Link ${daySwap.swapLink}`}
                </div>
              )}

              {/* Note preview */}
              {hasNote && (
                <div style={{
                  marginTop: 8,
                  paddingTop: 7,
                  borderTop: '1px solid var(--border)',
                  fontSize: '0.75rem',
                  color: 'var(--amber)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  ✎ {notes[noteKey]}
                </div>
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

      {/* ── Week picker modal ─────────────────────────────────────────────────── */}
      {showWeekPicker && (() => {
        const firstDay    = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1)
        const firstMonday = getMondayOf(firstDay)
        const calWeeks    = Array.from({ length: 6 }, (_, wi) =>
          Array.from({ length: 7 }, (_, di) => {
            const d = new Date(firstMonday)
            d.setDate(firstMonday.getDate() + wi * 7 + di)
            return d
          })
        )
        const rosterStart    = personalRoster[0]?.monday
        const rosterEnd      = personalRoster[personalRoster.length - 1]?.monday
        const currentMonday  = personalRoster[currentWeekIdx]?.monday
        const selectedMonday = entry.monday
        const todayMidnight  = new Date(); todayMidnight.setHours(0,0,0,0)

        const sameDay = (a, b) => a && b &&
          a.getFullYear() === b.getFullYear() &&
          a.getMonth()    === b.getMonth()    &&
          a.getDate()     === b.getDate()

        const prevMonth = () => setPickerMonth(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))
        const nextMonth = () => setPickerMonth(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))

        return (
          <div onClick={() => setShowWeekPicker(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'flex-end' }}>
            <div className="slide-up" onClick={e => e.stopPropagation()}
              style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderRadius:'16px 16px 0 0', width:'100%', paddingBottom:'calc(16px + env(safe-area-inset-bottom,0px))' }}>

              {/* Drag handle */}
              <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 8px' }}>
                <div style={{ width:36, height:4, background:'var(--border)', borderRadius:2 }}/>
              </div>

              {/* Month navigation */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px 10px' }}>
                <button onClick={prevMonth}
                  style={{ background:'var(--surface2)', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', color:'var(--text)', fontSize:'1.1rem', lineHeight:1 }}>
                  ‹
                </button>
                <span style={{ fontWeight:600, fontSize:'0.95rem', color:'var(--text)' }}>
                  {MONTHS_FULL[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}
                </span>
                <button onClick={nextMonth}
                  style={{ background:'var(--surface2)', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', color:'var(--text)', fontSize:'1.1rem', lineHeight:1 }}>
                  ›
                </button>
              </div>

              {/* Day-of-week headers */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 12px 4px' }}>
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={i} style={{ textAlign:'center', fontSize:'0.68rem', color:'var(--muted)', fontWeight:600, paddingBottom:4 }}>{d}</div>
                ))}
              </div>

              {/* Week rows — each full row is a tappable week */}
              <div style={{ padding:'0 12px' }}>
                {calWeeks.map((weekDays, wi) => {
                  const rowMonday  = weekDays[0]
                  const inRange    = rosterStart && rosterEnd && rowMonday >= rosterStart && rowMonday <= rosterEnd
                  const isSelected = sameDay(rowMonday, selectedMonday)
                  const isCurrWk   = sameDay(rowMonday, currentMonday)

                  return (
                    <div key={wi}
                      onClick={() => inRange && handleWeekSelect(rowMonday)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7,1fr)',
                        borderRadius: 8,
                        marginBottom: 2,
                        background: isSelected ? 'var(--amber)' : isCurrWk ? 'var(--today-bg)' : 'transparent',
                        border: isCurrWk && !isSelected ? '1px solid var(--today-bdr)' : '1px solid transparent',
                        cursor: inRange ? 'pointer' : 'default',
                        opacity: inRange ? 1 : 0.2,
                      }}>
                      {weekDays.map((day, di) => {
                        const inMonth   = day.getMonth() === pickerMonth.getMonth()
                        const isToday_  = sameDay(day, todayMidnight)
                        const isHoliday = isQldHoliday(day)
                        const textCol   = isSelected
                          ? '#0A0E1A'
                          : isToday_ ? 'var(--amber)'
                          : isHoliday ? '#F87171'
                          : 'var(--text)'

                        return (
                          <div key={di} style={{ textAlign:'center', padding:'7px 0', position:'relative' }}>
                            <span style={{
                              fontSize: '0.83rem',
                              color: textCol,
                              fontWeight: isToday_ || isSelected || isHoliday ? 700 : 400,
                              opacity: inMonth ? 1 : 0.35,
                            }}>
                              {day.getDate()}
                            </span>
                            {/* Today dot (amber) — only when not selected */}
                            {isToday_ && !isSelected && (
                              <div style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', width:4, height:4, borderRadius:'50%', background:'var(--amber)' }}/>
                            )}
                            {/* Holiday dot (red) — only when not today and not selected */}
                            {isHoliday && !isToday_ && !isSelected && (
                              <div style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', width:4, height:4, borderRadius:'50%', background:'#F87171' }}/>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Jump to this week shortcut */}
              {!entry.isCurrent && (
                <div style={{ padding:'10px 16px 0' }}>
                  <button
                    className="btn-secondary"
                    style={{ textAlign:'center' }}
                    onClick={() => { setWeekOffset(0); setShowWeekPicker(false) }}>
                    Jump to this week
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

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

      {/* ── Reminder bottom sheet ────────────────────────────────────────────── */}
      {reminderSheet && (
        <div
          onClick={() => setReminderSheet(null)}
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
            <h3 style={{ margin:'0 0 2px', fontSize:'0.95rem', fontWeight:600 }}>Shift Reminder</h3>
            <p style={{ margin:'0 0 14px', fontSize:'0.75rem', color:'var(--muted)' }}>
              {reminderSheet.dateLabel} · Sign-on {reminderSheet.signOnTime}
            </p>

            {notifPerm === 'denied' && (
              <p style={{ fontSize:'0.78rem', color:'#EF4444', marginBottom:12, background:'rgba(239,68,68,0.1)', padding:'8px 10px', borderRadius:8 }}>
                Notifications are blocked. Enable them in your browser settings.
              </p>
            )}

            {notifPerm === 'default' && (
              <button
                className="btn-secondary"
                style={{ marginBottom:14, width:'100%' }}
                onClick={() => requestNotificationPermission().then(p => setNotifPerm(p))}>
                Enable notifications first →
              </button>
            )}

            {(notifPerm === 'granted' || notifPerm === 'default') && (
              <>
                <p style={{ margin:'0 0 8px', fontSize:'0.8rem', color:'var(--muted)' }}>Notify me before sign-on:</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                  {[15, 30, 60, 120].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setReminderSheet(s => ({ ...s, offsetMinutes: mins }))}
                      style={{
                        padding: '10px',
                        borderRadius: 8,
                        border: `1px solid ${reminderSheet.offsetMinutes === mins ? 'var(--amber)' : 'var(--border)'}`,
                        background: reminderSheet.offsetMinutes === mins ? 'rgba(245,158,11,0.15)' : 'var(--surface2)',
                        color: reminderSheet.offsetMinutes === mins ? 'var(--amber)' : 'var(--text)',
                        fontWeight: reminderSheet.offsetMinutes === mins ? 600 : 400,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}>
                      {mins < 60 ? `${mins} min` : `${mins / 60}h before`}
                    </button>
                  ))}
                </div>
                <p style={{ margin:'0 0 14px', fontSize:'0.68rem', color:'var(--muted)', textAlign:'center' }}>
                  Fires while browser is open
                </p>
              </>
            )}

            <div style={{ display:'flex', gap:8 }}>
              {notifPerm === 'granted' && (
                <button
                  className="btn-primary"
                  style={{ flex:1 }}
                  onClick={() => {
                    setReminder(reminderSheet.dateKey, { offsetMinutes: reminderSheet.offsetMinutes, signOnTime: reminderSheet.signOnTime })
                    setReminderSheet(null)
                  }}>
                  Set Reminder
                </button>
              )}
              {reminders && reminders[reminderSheet.dateKey] && (
                <button
                  className="btn-secondary"
                  style={{ color:'#EF4444', borderColor:'#7F1D1D' }}
                  onClick={() => { clearReminder(reminderSheet.dateKey); setReminderSheet(null) }}>
                  Clear
                </button>
              )}
              <button className="btn-ghost" onClick={() => setReminderSheet(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note bottom sheet ─────────────────────────────────────────────────── */}
      {noteSheet && (
        <div
          onClick={() => { setNote(noteSheet.dateKey, noteSheet.text); setNoteSheet(null) }}
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
            <h3 style={{ margin:'0 0 2px', fontSize:'0.95rem', fontWeight:600 }}>Note</h3>
            <p style={{ margin:'0 0 12px', fontSize:'0.75rem', color:'var(--muted)' }}>{noteSheet.dateLabel}</p>
            <textarea
              autoFocus
              value={noteSheet.text}
              onChange={e => setNoteSheet(s => ({ ...s, text: e.target.value }))}
              placeholder="Add a private note for this day…"
              rows={4}
              style={{
                width: '100%',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: '0.88rem',
                color: 'var(--text)',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button
                className="btn-primary"
                style={{ flex:1 }}
                onClick={() => { setNote(noteSheet.dateKey, noteSheet.text); setNoteSheet(null) }}>
                Save
              </button>
              {notes && notes[noteSheet.dateKey] && (
                <button
                  className="btn-secondary"
                  style={{ color:'#EF4444', borderColor:'#7F1D1D' }}
                  onClick={() => { setNote(noteSheet.dateKey, ''); setNoteSheet(null) }}>
                  Clear
                </button>
              )}
              <button
                className="btn-ghost"
                onClick={() => setNoteSheet(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
