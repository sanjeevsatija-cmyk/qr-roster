/**
 * QR Roster — Queensland Rail Mayne Link Roster PWA
 * Developed by Sanjeev Satija, Brisbane, Australia
 * First created: April 2026
 * Copyright © 2026 Sanjeev Satija. All rights reserved.
 * Unauthorised copying, modification or distribution
 * of this software is strictly prohibited.
 */
import { useEffect, useRef } from 'react'

const ICON = '/qr-roster/icons/icon-192.png'

function fireNotification(title, body) {
  const opts = { body, icon: ICON, badge: ICON, tag: 'qr-roster-reminder' }
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready
      .then(reg => reg.showNotification(title, opts))
      .catch(() => new Notification(title, opts))
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, opts)
  }
}

function formatOffset(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = minutes / 60
  return `${h} hour${h !== 1 ? 's' : ''}`
}

export function useNotifications(reminders) {
  const ids = useRef([])

  useEffect(() => {
    ids.current.forEach(clearTimeout)
    ids.current = []

    if (!reminders || !('Notification' in window) || Notification.permission !== 'granted') return

    const now = Date.now()

    Object.entries(reminders).forEach(([dateKey, { offsetMinutes, signOnTime }]) => {
      if (!signOnTime) return
      const [y, mo, d] = dateKey.split('-').map(Number)
      const [h, m] = signOnTime.split(':').map(Number)
      const signOnMs = new Date(y, mo - 1, d, h, m, 0, 0).getTime()
      const notifyAt = signOnMs - offsetMinutes * 60_000
      const msUntil = notifyAt - now

      if (msUntil <= 0) return

      const id = setTimeout(() => {
        fireNotification(
          'QR Roster — Shift Reminder',
          `Your shift signs on at ${signOnTime} (in ${formatOffset(offsetMinutes)})`
        )
      }, msUntil)

      ids.current.push(id)
    })

    return () => { ids.current.forEach(clearTimeout) }
  }, [reminders])
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}
