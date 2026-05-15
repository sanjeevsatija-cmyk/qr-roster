/**
 * QR Roster — Queensland Rail Mayne Link Roster PWA
 * Developed by Sanjeev Satija, Brisbane, Australia
 * First created: April 2026
 * Copyright © 2026 Sanjeev Satija. All rights reserved.
 * Unauthorised copying, modification or distribution
 * of this software is strictly prohibited.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import rosterData from '../data/roster.json'
import jobCardsData from '../data/jobcards.json'

const RosterContext = createContext(null)

const STORAGE_KEY = 'qr_roster_v2'
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

// ─── Special code classification ─────────────────────────────────────────────
const SPECIAL_CODES = ['BLP','SLP','AFP','AFA','AL']
const SPARE_RE = /^(AM|PM)\d\s/i

export function classifyShift(shift) {
  if (!shift) return 'empty'
  const s = shift.replace(/^EX\s*\/\s*/i,'').trim().toUpperCase()
  if (s === 'AL' || s === 'ANNUAL LEAVE') return 'al'
  if (s === 'BLP') return 'blp'
  if (s === 'SLP') return 'slp'
  if (s === 'AFP' || s === 'AFA') return 'afp'
  if (SPARE_RE.test(s)) return 'spare'
  if (s.startsWith('EB')) return 'eb'
  if (s.startsWith('EF')) return 'ef'
  if (s.startsWith('TR')) return 'tr'
  if (s.startsWith('CS') || /^\d{2}:\d{2}\s+CS/.test(s)) return 'cs'
  if (/^\d{2}:\d{2}/.test(s)) return 'other'
  return 'other'
}

export function hasJobCard(shift) {
  if (!shift) return false
  const s = shift.replace(/^EX\s*\/\s*/i,'').trim().toUpperCase()
  if (SPECIAL_CODES.includes(s)) return false
  if (SPARE_RE.test(s)) return false
  return true
}

export function extractJobCode(shift) {
  if (!shift) return null
  const clean = shift.replace(/^EX\s*\/\s*/i,'').trim()
  // Remove leading HH:MM if present
  const withoutTime = clean.replace(/^\d{1,2}:\d{2}\s+/,'')
  const m = withoutTime.match(/^([A-Z]{1,3}[0-9][A-Z0-9#\-]*)/i)
    || clean.match(/([A-Z]{2}[A-Z0-9#\-]+)/i)
  return m ? m[1].toUpperCase() : null
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

// Parse DD/MM/YYYY → Date (midnight)
function parseDate(str) {
  if (!str) return null
  const [d,m,y] = str.split('/')
  return new Date(+y, +m-1, +d)
}

// Get ISO week string for a Date → 'YYYY-Www'
function weekKey(date) {
  const d = new Date(date)
  d.setHours(0,0,0,0)
  // Find Monday of the week
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// Get today's weekKey
function todayWeekKey() { return weekKey(new Date()) }

// ─── Rotation logic ───────────────────────────────────────────────────────────
// roster[0] = Link 1, week of 20/04/2026 (index 0)
// roster[n] = Link n+1
// If user starts on link S, on week index W they are on link: ((S-1) + W) % 440
// Week index W = weeks elapsed since 20/04/2026

const CYCLE_START = parseDate('20/04/2026')  // Week 0 in the cycle
const TOTAL_LINKS = 440

function getWeekIndex(weekMonday) {
  // How many weeks since cycle start?
  const diff = Math.round((weekMonday - CYCLE_START) / (7 * 24 * 60 * 60 * 1000))
  return ((diff % TOTAL_LINKS) + TOTAL_LINKS) % TOTAL_LINKS
}

function getUserLinkIndex(startingLink, weekIndex) {
  return ((startingLink - 1 + weekIndex) % TOTAL_LINKS + TOTAL_LINKS) % TOTAL_LINKS
}

// Build the Monday date for a given week index from cycle start
function mondayForWeekIndex(weekIndex) {
  const d = new Date(CYCLE_START)
  d.setDate(d.getDate() + weekIndex * 7)
  return d
}

// Format date nicely
function formatDate(str) {
  if (!str) return ''
  const [d,m,y] = str.split('/')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`
}

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      startingLink: null,
      swaps: {},
      dayOverrides: {},
      swapLog: [],
      notes: {},
      reminders: {},
      ...parsed,
    }
  } catch { return { startingLink: null, swaps: {}, dayOverrides: {}, swapLog: [], notes: {}, reminders: {} } }
}

function saveStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function RosterProvider({ children }) {
  const [store, setStore] = useState(loadStorage)

  const persistStore = useCallback((updater) => {
    setStore(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveStorage(next)
      return next
    })
  }, [])

  // ── Setup ──────────────────────────────────────────────────────────────────
  const setStartingLink = useCallback((link) => {
    persistStore(prev => ({ ...prev, startingLink: link }))
  }, [persistStore])

  // ── Build user's personal roster view ─────────────────────────────────────
  // Returns array of 440 week entries with user's actual link for each week
  const personalRoster = useMemo(() => {
    if (!store.startingLink) return []
    const sl = store.startingLink
    const today = new Date(); today.setHours(0,0,0,0)
    const todayDay = today.getDay() || 7
    const thisMon = new Date(today); thisMon.setDate(today.getDate() - todayDay + 1)
    const currentWK = weekKey(thisMon)

    return Array.from({ length: TOTAL_LINKS }, (_, weekIdx) => {
      const monday = mondayForWeekIndex(weekIdx)
      const wk = weekKey(monday)
      const linkIdx = getUserLinkIndex(sl, weekIdx)
      const base = rosterData[linkIdx]

      // Apply day-level AL overrides
      const days = { ...base.days }
      DAYS.forEach(day => {
        const ok = `${wk}_${day}`
        if (store.dayOverrides[ok]) days[day] = 'AL'
      })

      // Apply swap
      const swapInfo = store.swaps[wk] || null
      let displayDays = days

      if (swapInfo) {
        if (swapInfo.swapLink === 'AL') {
          // Whole week AL — set all days to AL
          displayDays = Object.fromEntries(DAYS.map(d => [d, 'AL']))
        } else {
          // Regular swap — use the swap link's shifts
          const swapLinkIdx = swapInfo.swapLink - 1
          if (swapLinkIdx >= 0 && swapLinkIdx < TOTAL_LINKS) {
            const swapBase = rosterData[swapLinkIdx]
            displayDays = { ...swapBase.days }
          }
        }
        // Individual AL overrides still apply on top
        DAYS.forEach(day => {
          const ok = `${wk}_${day}`
          if (store.dayOverrides[ok]) displayDays[day] = 'AL'
        })
      }

      // Compute the actual week date from monday (not from base.date which is wrong)
      const dateStr = `${String(monday.getDate()).padStart(2,'0')}/${String(monday.getMonth()+1).padStart(2,'0')}/${monday.getFullYear()}`

      // Individual date for each day column (Mon=+0, Tue=+1 ... Sun=+6)
      const dayDates = {}
      DAYS.forEach((day, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        dayDates[day] = d.getDate()
      })

      return {
        weekIdx,
        weekKey: wk,
        monday,
        linkNum: base.link,
        date: dateStr,
        dateFormatted: formatDate(dateStr),
        dayDates,
        days: displayDays,
        originalDays: days,
        swapInfo,
        isCurrent: wk === currentWK,
        isPast: monday < thisMon,
      }
    })
  }, [store.startingLink, store.swaps, store.dayOverrides])

  // ── Record swap ────────────────────────────────────────────────────────────
  const recordSwap = useCallback((weekEntry, swapLinkNum, driverName = '') => {
    const swapLink = parseInt(swapLinkNum)
    if (isNaN(swapLink) || swapLink < 1 || swapLink > 440) return

    const logEntry = {
      timestamp: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' }),
      weekDate: weekEntry.dateFormatted,
      myLink: weekEntry.linkNum,
      swapLink,
      driverName,
      originalShifts: Object.entries(weekEntry.originalDays).map(([d,s]) => `${d}:${s}`).join(' | ')
    }

    persistStore(prev => ({
      ...prev,
      swaps: { ...prev.swaps, [weekEntry.weekKey]: { swapLink, driverName } },
      swapLog: [logEntry, ...prev.swapLog]
    }))
  }, [persistStore])

  // ── Clear swap ─────────────────────────────────────────────────────────────
  const clearSwap = useCallback((weekEntry) => {
    persistStore(prev => {
      const swaps = { ...prev.swaps }
      delete swaps[weekEntry.weekKey]
      return { ...prev, swaps }
    })
  }, [persistStore])

  // ── Mark whole week AL ─────────────────────────────────────────────────────
  const markWeekAL = useCallback((weekEntry) => {
    persistStore(prev => ({
      ...prev,
      swaps: { ...prev.swaps, [weekEntry.weekKey]: { swapLink: 'AL', driverName: '' } },
    }))
  }, [persistStore])

  // ── Mark single day AL ────────────────────────────────────────────────────
  const markDayAL = useCallback((weekEntry, dayKey) => {
    const ok = `${weekEntry.weekKey}_${dayKey}`
    persistStore(prev => ({
      ...prev,
      dayOverrides: { ...prev.dayOverrides, [ok]: 'AL' }
    }))
  }, [persistStore])

  // ── Clear single day AL ───────────────────────────────────────────────────
  const clearDayAL = useCallback((weekEntry, dayKey) => {
    const ok = `${weekEntry.weekKey}_${dayKey}`
    persistStore(prev => {
      const dayOverrides = { ...prev.dayOverrides }
      delete dayOverrides[ok]
      return { ...prev, dayOverrides }
    })
  }, [persistStore])

  // ── Reminders ─────────────────────────────────────────────────────────────
  const setReminder = useCallback((dateKey, data) => {
    persistStore(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [dateKey]: data },
    }))
  }, [persistStore])

  const clearReminder = useCallback((dateKey) => {
    persistStore(prev => {
      const reminders = { ...prev.reminders }
      delete reminders[dateKey]
      return { ...prev, reminders }
    })
  }, [persistStore])

  // ── Notes ─────────────────────────────────────────────────────────────────
  const setNote = useCallback((dateKey, text) => {
    persistStore(prev => {
      const notes = { ...prev.notes }
      if (text && text.trim()) {
        notes[dateKey] = text
      } else {
        delete notes[dateKey]
      }
      return { ...prev, notes }
    })
  }, [persistStore])

  // ── Job card search ───────────────────────────────────────────────────────
  const searchJobCards = useCallback((query) => {
    if (!query || query.length < 3) return []
    const q = query.toUpperCase().trim()
    return jobCardsData.filter(c => c.header.toUpperCase().includes(q)).slice(0, 20)
  }, [])

  const findJobCard = useCallback((shift, dayKey) => {
    const code = extractJobCode(shift)
    if (!code) return null
    const day = dayKey ? dayKey.toUpperCase().slice(0,3) : null
    if (day) {
      const exact = jobCardsData.find(c =>
        c.header.toUpperCase().startsWith(day) &&
        c.header.toUpperCase().includes(code)
      )
      if (exact) return exact
    }
    return jobCardsData.find(c => c.header.toUpperCase().includes(code)) || null
  }, [])

  // ── Reset everything ──────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    const empty = { startingLink: null, swaps: {}, dayOverrides: {}, swapLog: [], notes: {}, reminders: {} }
    saveStorage(empty)
    setStore(empty)
  }, [])

  return (
    <RosterContext.Provider value={{
      startingLink: store.startingLink,
      setStartingLink,
      personalRoster,
      recordSwap, clearSwap,
      markWeekAL, markDayAL, clearDayAL,
      swapLog: store.swapLog,
      notes: store.notes,
      setNote,
      reminders: store.reminders,
      setReminder,
      clearReminder,
      searchJobCards, findJobCard,
      resetAll,
    }}>
      {children}
    </RosterContext.Provider>
  )
}

export const useRoster = () => useContext(RosterContext)
