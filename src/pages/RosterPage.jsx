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

const QLD_PUBLIC_HOLIDAYS = {
  '2026-01-01': 'New Year\'s Day',
  '2026-01-26': 'Australia Day',
  '2026-04-03': 'Good Friday',
  '2026-04-04': 'Easter Saturday',
  '2026-04-05': 'Easter Sunday',
  '2026-04-06': 'Easter Monday',
  '2026-04-25': 'Anzac Day',
  '2026-05-04': 'Labour Day',
  '2026-08-12': 'Ekka Show Day',
  '2026-10-05': 'Queen\'s Birthday',
  '2026-12-25': 'Christmas Day',
  '2026-12-26': 'Boxing Day',
  '2026-12-28': 'Boxing Day (substitute)',
  '2027-01-01': 'New Year\'s Day',
  '2027-01-26': 'Australia Day',
  '2027-03-26': 'Good Friday',
  '2027-03-27': 'Easter Saturday',
  '2027-03-28': 'Easter Sunday',
  '2027-03-29': 'Easter Monday',
  '2027-04-26': 'Anzac Day (observed)',
  '2027-05-03': 'Labour Day',
  '2027-08-11': 'Ekka Show Day',
  '2027-10-04': 'Queen\'s Birthday',
  '2027-12-27': 'Christmas Day (observed)',
  '2027-12-28': 'Boxing Day (observed)',
}

function getHolidayName(monday, dayIndex) {
  const d = new Date(monday)
  d.setDate(d.getDate() + dayIndex)
  const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return QLD_PUBLIC_HOLIDAYS[key] || null
}

const DAYS        = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTHS      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getMondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function buildDateKey(weekEntry, dayIndex) {
  const d = new Date(weekEntry.monday)
  d.setDate(d.getDate() + dayIndex)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

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

function formatDuration(dur) {
  if (!dur) return ''
  const [h, m] = dur.split(':').map(Number)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

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
  const m = shift.match(/(\d{1,2}):(\d{2})/)
  if (m) {
    const h = parseInt(m[1], 10)
    if (h < 10) return { label: 'Early',     type: 'early' }
    if (h < 18) return { label: 'Afternoon', type: 'late'  }
    return              { label: 'Night',     type: 'night' }
  }
  return { label: 'Shift', type: 'other' }
}

const BADGE_COLOR = {
  rest:  'var(--muted)',
  al:    'var(--lav)',
  blp:   'var(--acc)',
  slp:   '#7DD3FC',
  spare: '#A78BFA',
  eb:    '#BEF264',
  ef:    '#A3E635',
  tr:    '#93C5FD',
  cs:    '#FCD34D',
  other: '#E879F9',
  early: '#38BDF8',
  late:  'var(--gold2)',
  night: '#A78BFA',
}

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

function calcProgress(times) {
  if (!times) return null
  const [startStr, endStr] = times.split('-')
  const toMins = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m }
  const start = toMins(startStr)
  let end = toMins(endStr)
  if (end < start) end += 1440
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  if (nowMins < start) return 0
  if (nowMins >= end) return 100
  return Math.round(((nowMins - start) / (end - start)) * 100)
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
  const navigate = useNavigate()
  const { personalRoster, startingLink, resetAll, notes, setNote, reminders, setReminder, clearReminder } = useRoster()

  const [weekOffset,     setWeekOffset]    = useState(0)
  const [selectedShift,  setSelectedShift] = useState(null)
  const [showSettings,   setShowSettings]  = useState(false)
  const [noteSheet,      setNoteSheet]     = useState(null)
  const [reminderSheet,  setReminderSheet] = useState(null)
  const [notifPerm,      setNotifPerm]     = useState(() => getNotificationPermission())
  const [showWeekPicker, setShowWeekPicker] = useState(false)
  const [pickerMonth,    setPickerMonth]   = useState(() => {
    const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1)
  })
  const [dark, toggleDark] = useDarkMode()
  const [tapCount, setTapCount] = useState(0)
  const [lastTap,  setLastTap]  = useState(0)
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => (new Date().getDay() + 6) % 7)
  const [noteText, setNoteText] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)

  const handleTitleTap = () => {
    const now = Date.now()
    if (now - lastTap > 3000) { setTapCount(1) } else { setTapCount(prev => prev + 1) }
    setLastTap(now)
    if (tapCount + 1 >= 7) { setTapCount(0); navigate('/about') }
  }

  const currentWeekIdx = useMemo(
    () => personalRoster.findIndex(e => e.isCurrent),
    [personalRoster]
  )

  const displayIdx = Math.max(0, Math.min(personalRoster.length - 1, currentWeekIdx + weekOffset))
  const entry = personalRoster[displayIdx]

  useEffect(() => {
    if (entry?.isCurrent) {
      setSelectedDayIdx((new Date().getDay() + 6) % 7)
    } else {
      setSelectedDayIdx(0)
    }
  }, [displayIdx])

  if (!startingLink || !entry) return null

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const todayDayName = DAYS[(new Date().getDay() + 6) % 7]

  const isToday   = day    => entry.isCurrent && day === todayDayName
  const isDayPast = dayIdx => {
    if (entry.isPast)    return true
    if (!entry.isCurrent) return false
    const d = new Date(entry.monday)
    d.setDate(d.getDate() + dayIdx)
    d.setHours(0, 0, 0, 0)
    return d < now
  }

  const weekEnd   = new Date(entry.monday)
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
    if (idx >= 0) { setWeekOffset(idx - currentWeekIdx); setShowWeekPicker(false) }
  }

  const openPicker = () => {
    setPickerMonth(new Date(entry.monday.getFullYear(), entry.monday.getMonth(), 1))
    setShowWeekPicker(true)
  }

  // ── Link progress ring ───────────────────────────────────────────────────────
  const ringCircumference = 163
  const linkProgress  = currentWeekIdx >= 0 ? currentWeekIdx / 440 : 0
  const ringOffset    = ringCircumference - linkProgress * ringCircumference

  // ── Selected day data ────────────────────────────────────────────────────────
  const selectedDay     = DAYS[selectedDayIdx]
  const selectedDayDate = new Date(entry.monday)
  selectedDayDate.setDate(entry.monday.getDate() + selectedDayIdx)
  const noteKey      = `${selectedDayDate.getFullYear()}-${String(selectedDayDate.getMonth()+1).padStart(2,'0')}-${String(selectedDayDate.getDate()).padStart(2,'0')}`
  const selectedShiftStr = entry.days[selectedDay] || ''
  const { code, times, duration, hasEx } = parseShift(selectedShiftStr)
  const isRest      = !selectedShiftStr || classifyShift(selectedShiftStr) === 'empty'
  const isAL        = !isRest && classifyShift(selectedShiftStr) === 'al'
  const isWorkShift = !isRest && !isAL
  const signOnTime  = isWorkShift ? extractSignOnTime(selectedShiftStr) : null
  const hasNote     = !!(notes    && notes[noteKey])
  const hasReminder = !!(reminders && reminders[noteKey])
  const isHoliday   = isQldHoliday(selectedDayDate)
  const holidayName = getHolidayName(entry.monday, selectedDayIdx)
  const daySwap     = entry.daySwapInfo?.[selectedDay] || null
  const [signOn, signOff] = times ? times.split('-') : ['', '']
  const isSelectedPast = isDayPast(selectedDayIdx)
  const progressPct = times
    ? (isToday(selectedDay) ? calcProgress(times) : (isSelectedPast ? 100 : null))
    : null

  // ── Nav chevron button style ──────────────────────────────────────────────────
  const chevronBtn = enabled => ({
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '8px 14px',
    cursor: enabled ? 'pointer' : 'default',
    color: enabled ? 'var(--acc)' : 'var(--muted)',
    fontSize: '1.2rem',
    lineHeight: 1,
    opacity: enabled ? 1 : 0.3,
    outline: 'none',
    flexShrink: 0,
  })

  return (
    <div>

      {/* ── Sticky header + week nav ─────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg)', padding: '10px 12px 0' }}>

        {/* HUD header glass card */}
        <div className="glass-card" style={{ padding: '14px 16px 12px', position: 'relative', marginBottom: 8 }}>
          <div className="hud-corner-tl"/>
          <div className="hud-corner-tr"/>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>

            {/* Left: title + subtitle + live pulse */}
            <div>
              <h1 onClick={handleTitleTap}
                style={{ margin: '0 0 3px', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--acc)', cursor: 'default', userSelect: 'none' }}>
                QR Roster
              </h1>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Link {startingLink}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7 }}>
                <div className="pulse-rose" style={{ width: 6, height: 6, borderRadius: '50%', background: '#F9A8D4', boxShadow: '0 0 6px rgba(249,168,212,0.8)', flexShrink: 0 }}/>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#F9A8D4', letterSpacing: '0.2em' }}>LIVE</span>
              </div>
            </div>

            {/* Right: link progress ring + icon buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
              <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
                  <circle
                    cx="32" cy="32" r="26"
                    stroke="var(--acc3)" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    transform="rotate(-90 32 32)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                    {entry.linkNum}
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.1em', lineHeight: 1 }}>
                    LINK
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={toggleDark} title={dark ? 'Light mode' : 'Dark mode'}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '5px 8px', cursor: 'pointer', fontSize: '0.85rem', outline: 'none' }}>
                  {dark ? '☀️' : '🌙'}
                </button>
                <button onClick={() => setShowSettings(true)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '5px 8px', cursor: 'pointer', color: 'var(--muted)', outline: 'none', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Week nav strip */}
        <div className="glass-card" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <button style={chevronBtn(canPrev)} disabled={!canPrev}
              onClick={() => canPrev && setWeekOffset(o => o - 1)} aria-label="Previous week">
              ‹
            </button>

            <button onClick={openPicker}
              style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '2px 0', outline: 'none' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: entry.isCurrent ? 'var(--acc)' : 'var(--text)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {weekLabel}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                Link {entry.linkNum}
                {entry.isCurrent && <span style={{ color: 'var(--acc)', marginLeft: 6 }}>● Now</span>}
              </div>
            </button>

            <button style={chevronBtn(canNext)} disabled={!canNext}
              onClick={() => canNext && setWeekOffset(o => o + 1)} aria-label="Next week">
              ›
            </button>
          </div>

          {entry.swapInfo && (
            <div style={{ textAlign: 'center', marginTop: 6, fontSize: '0.7rem' }}>
              {entry.swapInfo.swapLink === 'AL'
                ? <span style={{ color: 'var(--lav)' }}>↺ Full week — Annual Leave</span>
                : <span style={{ color: '#7DD3FC' }}>↔ Swapped to Link {entry.swapInfo.swapLink}{entry.swapInfo.driverName ? ` · ${entry.swapInfo.driverName}` : ''}</span>
              }
            </div>
          )}
        </div>
      </div>
      {/* end sticky */}

      {/* ── Day strip + detail panel ─────────────────────────────────────────── */}
      <div style={{ padding: '0 12px 8px' }}>

        {/* Day strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 10 }}>
          {DAYS.map((day, i) => {
            const dayDate   = new Date(entry.monday)
            dayDate.setDate(entry.monday.getDate() + i)
            const past      = isDayPast(i)
            const today     = isToday(day)
            const selected  = i === selectedDayIdx
            const dk        = buildDateKey(entry, i)
            const dayHasNote = !!(notes && notes[dk])
            const dayHoliday = getHolidayName(entry.monday, i)

            return (
              <button key={day} onClick={() => {
                setSelectedDayIdx(i)
                setNoteText(notes[dk] || '')
                setNoteOpen(false)
              }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '8px 2px 6px', borderRadius: 10,
                  border: today ? '1px solid rgba(249,168,212,0.8)' : selected ? '2px solid rgba(249,168,212,1)' : '1px solid rgba(255,255,255,0.08)',
                  background: today ? 'rgba(249,168,212,0.15)' : selected ? 'rgba(249,168,212,0.15)' : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer', opacity: (past && !today) ? 0.3 : 1, outline: 'none', transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: '0.52rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '1.5px', textTransform: 'uppercase', lineHeight: 1 }}>
                  {day}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: (today || selected) ? 'var(--acc)' : 'var(--text)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.2 }}>
                  {dayDate.getDate()}
                </span>
                {dayHoliday && (
                  <span style={{ fontSize: 10, color: '#FCD34D', display: 'block', textAlign: 'center', lineHeight: 1 }}>★</span>
                )}
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FCD34D', margin: '2px auto 0', opacity: dayHasNote ? 1 : 0 }}/>
              </button>
            )
          })}
        </div>

        {/* Detail panel — key changes on day/week change to trigger fade-in */}
        <div key={`${displayIdx}-${selectedDayIdx}`} className="glass-card fade-in" style={{ padding: '14px 16px' }}>

          {/* Top row: shift code + ShiftPill + bell */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 36, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.04em', lineHeight: 1 }}>
                {hasEx && <span style={{ fontSize: '1rem', opacity: 0.5, marginRight: 4 }}>EX/</span>}
                {isRest ? 'REST' : isAL ? 'AL' : code}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span>{selectedDay} · {selectedDayDate.getDate()} {MONTHS[selectedDayDate.getMonth()]}</span>
                {isHoliday && <span style={{ color: '#F87171', fontSize: '0.6rem', padding: '0 5px', background: 'rgba(248,113,113,0.12)', borderRadius: 4, border: '1px solid rgba(248,113,113,0.25)' }}>PH</span>}
                {daySwap && <span style={{ color: '#7DD3FC' }}>↔ {daySwap.driverName || `Link ${daySwap.swapLink}`}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginTop: 2 }}>
              <ShiftPill shift={selectedShiftStr}/>
              {signOnTime && (
                <button title={hasReminder ? 'Edit reminder' : 'Set reminder'}
                  onClick={() => setReminderSheet({ dateKey: noteKey, dateLabel: `${selectedDay} · ${selectedDayDate.getDate()} ${MONTHS[selectedDayDate.getMonth()]}`, signOnTime, offsetMinutes: (reminders && reminders[noteKey]?.offsetMinutes) || 60 })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px', color: hasReminder ? 'var(--gold2)' : 'var(--muted)', lineHeight: 1, outline: 'none' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={hasReminder ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Public holiday pill */}
          {holidayName && (
            <div style={{ display: 'inline-block', background: 'rgba(252,211,77,0.12)', border: '1px solid rgba(252,211,77,0.3)', borderRadius: 20, padding: '3px 10px', marginBottom: 12 }}>
              <span style={{ color: '#FCD34D', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>★ {holidayName}</span>
            </div>
          )}

          {/* SIGN ON / SIGN OFF / DURATION — working shifts only */}
          {isWorkShift && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div className="glass-card-inner" style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: '0.55rem', color: '#F9A8D4', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', marginBottom: 5 }}>SIGN ON</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>{signOn || '—'}</div>
              </div>
              <div className="glass-card-inner" style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: '0.55rem', color: '#F9A8D4', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', marginBottom: 5 }}>SIGN OFF</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>{signOff || '—'}</div>
              </div>
              {duration && (
                <div className="glass-card-inner" style={{ padding: '10px 12px', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.55rem', color: '#F9A8D4', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', marginBottom: 5 }}>DURATION</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>{formatDuration(duration)}</div>
                </div>
              )}
            </div>
          )}

          {/* Shift progress bar — today + past working shifts with times */}
          {isWorkShift && progressPct !== null && (
            <div className="glass-card-inner" style={{ padding: '10px 12px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em' }}>SHIFT PROGRESS</span>
                <span style={{ fontSize: '0.55rem', color: 'var(--acc)', fontFamily: 'JetBrains Mono, monospace' }}>{progressPct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--acc3), var(--acc))', borderRadius: 2, transition: 'width 0.6s ease' }}/>
              </div>
            </div>
          )}

          {/* Rest / AL message */}
          {isRest && <div style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: 12 }}>Rest day — no shift</div>}
          {isAL   && <div style={{ fontSize: '0.85rem', color: 'var(--lav)',  fontStyle: 'italic', marginBottom: 12 }}>Annual leave</div>}

          {/* Note preview */}
          {hasNote && (
            <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(252,211,77,0.06)', border: '1px solid rgba(252,211,77,0.2)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--gold2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ✎ {notes[noteKey]}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 7 }}>
            {hasJobCard(selectedShiftStr) && (
              <button onClick={() => setSelectedShift({ entry, day: selectedDay, shift: selectedShiftStr })}
                style={{ flex: 2, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--acc)', background: 'rgba(249,168,212,0.08)', color: 'var(--acc)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', outline: 'none', textTransform: 'uppercase' }}>
                View Job Card
              </button>
            )}
            <button onClick={() => navigate('/swap')}
              style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.06em', cursor: 'pointer', outline: 'none', textTransform: 'uppercase' }}>
              Swap
            </button>
            <button
              onClick={() => setNoteOpen(o => !o)}
              style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: hasNote ? '1px solid rgba(249,168,212,0.3)' : '1px solid rgba(255,255,255,0.08)', background: hasNote ? 'rgba(249,168,212,0.08)' : 'rgba(255,255,255,0.04)', color: hasNote ? 'var(--acc)' : 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.06em', cursor: 'pointer', outline: 'none', textTransform: 'uppercase' }}>
              {hasNote ? 'NOTE ●' : 'NOTE'}
            </button>
          </div>

          {/* Inline note editor */}
          {noteOpen && (
            <div className="fade-in" style={{ marginTop: 8 }}>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note for this day…"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(249,168,212,0.25)',
                  borderRadius: 10,
                  color: 'var(--text)',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.85rem',
                  padding: '10px 12px',
                  width: '100%',
                  minHeight: 80,
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(249,168,212,0.6)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(249,168,212,0.25)' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => { setNote(noteKey, noteText); setNoteOpen(false) }}
                  style={{ background: 'var(--acc3)', color: '#12060E', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, padding: '6px 14px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                  Save Note
                </button>
                <button
                  onClick={() => { setNote(noteKey, ''); setNoteText(''); setNoteOpen(false) }}
                  className="glass-card-inner"
                  style={{ color: 'var(--muted)', border: 'none', borderRadius: 8, fontSize: '0.8rem', padding: '6px 14px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Shift detail modal ───────────────────────────────────────────────── */}
      {selectedShift && (
        <div onClick={() => setSelectedShift(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div className="slide-up" onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', padding: '20px', width: '100%', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }}/>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 6 }}>
              {selectedShift.day} {selectedShift.entry.dayDates[selectedShift.day]} · {selectedShift.entry.dateFormatted} · Link {selectedShift.entry.linkNum}
            </div>
            <div style={{ marginBottom: 16 }}><ShiftPill shift={selectedShift.shift}/></div>
            <div style={{ display: 'flex', gap: 8 }}>
              {hasJobCard(selectedShift.shift) && (
                <button className="btn-primary" style={{ flex: 1 }}
                  onClick={() => { navigate('/jobcard', { state: { shift: selectedShift.shift, day: selectedShift.day } }); setSelectedShift(null) }}>
                  View Job Card →
                </button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedShift(null)}
                style={{ flex: hasJobCard(selectedShift.shift) ? '0 0 80px' : 1 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Week picker modal ────────────────────────────────────────────────── */}
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
        const rosterStart   = personalRoster[0]?.monday
        const rosterEnd     = personalRoster[personalRoster.length - 1]?.monday
        const currentMonday = personalRoster[currentWeekIdx]?.monday
        const selMonday     = entry.monday
        const todayMid      = new Date(); todayMid.setHours(0,0,0,0)
        const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
        const prevMonth = () => setPickerMonth(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))
        const nextMonth = () => setPickerMonth(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))

        return (
          <div onClick={() => setShowWeekPicker(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
            <div className="slide-up" onClick={e => e.stopPropagation()}
              style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', width: '100%', paddingBottom: 'calc(16px + env(safe-area-inset-bottom,0px))' }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
                <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2 }}/>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 10px' }}>
                <button onClick={prevMonth} style={{ background: 'var(--surface2)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--text)', fontSize: '1.1rem', lineHeight: 1 }}>‹</button>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>{MONTHS_FULL[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}</span>
                <button onClick={nextMonth} style={{ background: 'var(--surface2)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--text)', fontSize: '1.1rem', lineHeight: 1 }}>›</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0 12px 4px' }}>
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600, paddingBottom: 4 }}>{d}</div>
                ))}
              </div>
              <div style={{ padding: '0 12px' }}>
                {calWeeks.map((weekDays, wi) => {
                  const rowMonday  = weekDays[0]
                  const inRange    = rosterStart && rosterEnd && rowMonday >= rosterStart && rowMonday <= rosterEnd
                  const isSelected = sameDay(rowMonday, selMonday)
                  const isCurrWk   = sameDay(rowMonday, currentMonday)
                  return (
                    <div key={wi} onClick={() => inRange && handleWeekSelect(rowMonday)}
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderRadius: 8, marginBottom: 2, background: isSelected ? 'var(--acc3)' : isCurrWk ? 'rgba(249,168,212,0.08)' : 'transparent', border: (isCurrWk && !isSelected) ? '1px solid rgba(249,168,212,0.2)' : '1px solid transparent', cursor: inRange ? 'pointer' : 'default', opacity: inRange ? 1 : 0.2 }}>
                      {weekDays.map((day, di) => {
                        const inMonth    = day.getMonth() === pickerMonth.getMonth()
                        const isTodayDay = sameDay(day, todayMid)
                        const isHol      = isQldHoliday(day)
                        const textCol    = isSelected ? '#12060E' : isTodayDay ? 'var(--acc)' : isHol ? '#F87171' : 'var(--text)'
                        return (
                          <div key={di} style={{ textAlign: 'center', padding: '7px 0', position: 'relative' }}>
                            <span style={{ fontSize: '0.83rem', color: textCol, fontWeight: (isTodayDay || isSelected || isHol) ? 700 : 400, opacity: inMonth ? 1 : 0.35 }}>
                              {day.getDate()}
                            </span>
                            {isTodayDay && !isSelected && (
                              <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--acc)' }}/>
                            )}
                            {isHol && !isTodayDay && !isSelected && (
                              <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#F87171' }}/>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
              {!entry.isCurrent && (
                <div style={{ padding: '10px 16px 0' }}>
                  <button className="btn-secondary" style={{ textAlign: 'center' }}
                    onClick={() => { setWeekOffset(0); setShowWeekPicker(false) }}>
                    Jump to this week
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Settings modal ───────────────────────────────────────────────────── */}
      {showSettings && (
        <div onClick={() => setShowSettings(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div className="slide-up" onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', padding: '20px', width: '100%', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }}/>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600 }}>Settings</h3>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 4px' }}>Starting Link</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--acc)', margin: 0 }}>Link {startingLink}</p>
            </div>
            <button className="btn-secondary" style={{ borderColor: '#7F1D1D', color: '#EF4444', marginBottom: 8 }}
              onClick={() => { if (confirm('Reset all data? Cannot be undone.')) { resetAll(); setShowSettings(false) } }}>
              Reset All Data
            </button>
            <button className="btn-ghost" onClick={() => setShowSettings(false)} style={{ width: '100%', textAlign: 'center' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Reminder bottom sheet ────────────────────────────────────────────── */}
      {reminderSheet && (
        <div onClick={() => setReminderSheet(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div className="slide-up" onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', padding: '20px', width: '100%', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }}/>
            <h3 style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 600 }}>Shift Reminder</h3>
            <p style={{ margin: '0 0 14px', fontSize: '0.75rem', color: 'var(--muted)' }}>
              {reminderSheet.dateLabel} · Sign-on {reminderSheet.signOnTime}
            </p>
            {notifPerm === 'denied' && (
              <p style={{ fontSize: '0.78rem', color: '#EF4444', marginBottom: 12, background: 'rgba(239,68,68,0.1)', padding: '8px 10px', borderRadius: 8 }}>
                Notifications are blocked. Enable them in your browser settings.
              </p>
            )}
            {notifPerm === 'default' && (
              <button className="btn-secondary" style={{ marginBottom: 14, width: '100%' }}
                onClick={() => requestNotificationPermission().then(p => setNotifPerm(p))}>
                Enable notifications first →
              </button>
            )}
            {(notifPerm === 'granted' || notifPerm === 'default') && (
              <>
                <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--muted)' }}>Notify me before sign-on:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[15, 30, 60, 120].map(mins => (
                    <button key={mins} onClick={() => setReminderSheet(s => ({ ...s, offsetMinutes: mins }))}
                      style={{ padding: '10px', borderRadius: 8, border: `1px solid ${reminderSheet.offsetMinutes === mins ? 'var(--acc)' : 'var(--border)'}`, background: reminderSheet.offsetMinutes === mins ? 'rgba(249,168,212,0.15)' : 'var(--surface2)', color: reminderSheet.offsetMinutes === mins ? 'var(--acc)' : 'var(--text)', fontWeight: reminderSheet.offsetMinutes === mins ? 600 : 400, cursor: 'pointer', fontSize: '0.85rem' }}>
                      {mins < 60 ? `${mins} min` : `${mins / 60}h before`}
                    </button>
                  ))}
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center' }}>Fires while browser is open</p>
              </>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              {notifPerm === 'granted' && (
                <button className="btn-primary" style={{ flex: 1 }}
                  onClick={() => { setReminder(reminderSheet.dateKey, { offsetMinutes: reminderSheet.offsetMinutes, signOnTime: reminderSheet.signOnTime }); setReminderSheet(null) }}>
                  Set Reminder
                </button>
              )}
              {reminders && reminders[reminderSheet.dateKey] && (
                <button className="btn-secondary" style={{ color: '#EF4444', borderColor: '#7F1D1D' }}
                  onClick={() => { clearReminder(reminderSheet.dateKey); setReminderSheet(null) }}>
                  Clear
                </button>
              )}
              <button className="btn-ghost" onClick={() => setReminderSheet(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note bottom sheet ────────────────────────────────────────────────── */}
      {noteSheet && (
        <div onClick={() => { setNote(noteSheet.dateKey, noteSheet.text); setNoteSheet(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div className="slide-up" onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', padding: '20px', width: '100%', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }}/>
            <h3 style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 600 }}>Note</h3>
            <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: 'var(--muted)' }}>{noteSheet.dateLabel}</p>
            <textarea autoFocus value={noteSheet.text}
              onChange={e => setNoteSheet(s => ({ ...s, text: e.target.value }))}
              placeholder="Add a private note for this day…" rows={4}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: '0.88rem', color: 'var(--text)', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-primary" style={{ flex: 1 }}
                onClick={() => { setNote(noteSheet.dateKey, noteSheet.text); setNoteSheet(null) }}>
                Save
              </button>
              {notes && notes[noteSheet.dateKey] && (
                <button className="btn-secondary" style={{ color: '#EF4444', borderColor: '#7F1D1D' }}
                  onClick={() => { setNote(noteSheet.dateKey, ''); setNoteSheet(null) }}>
                  Clear
                </button>
              )}
              <button className="btn-ghost" onClick={() => setNoteSheet(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
