/**
 * QR Roster — Queensland Rail Mayne Link Roster PWA
 * Developed by Sanjeev Satija, Brisbane, Australia
 * First created: April 2026
 * Copyright © 2026 Sanjeev Satija. All rights reserved.
 * Unauthorised copying, modification or distribution
 * of this software is strictly prohibited.
 */
// Queensland public holidays 2026–2027 (hardcoded).
// Ekka (Royal Queensland Show) dates are estimates — officially announced annually by the RNA.
// Sources: Queensland Government Holidays Act 1983; QLD public holidays calendar.

const QLD_HOLIDAYS = new Set([
  // ── 2026 ──────────────────────────────────────────────────────────────────
  '2026-01-01', // New Year's Day
  '2026-01-26', // Australia Day
  '2026-04-03', // Good Friday
  '2026-04-04', // Easter Saturday
  '2026-04-05', // Easter Sunday
  '2026-04-06', // Easter Monday
  '2026-04-25', // Anzac Day
  '2026-05-04', // Labour Day (first Monday in May)
  '2026-06-08', // King's Birthday (second Monday in June)
  '2026-08-12', // Royal Queensland Show — Brisbane (est. second Wednesday in August)
  '2026-12-25', // Christmas Day
  '2026-12-26', // Boxing Day
  '2026-12-28', // Boxing Day observed (26 Dec falls on Saturday)

  // ── 2027 ──────────────────────────────────────────────────────────────────
  '2027-01-01', // New Year's Day
  '2027-01-26', // Australia Day
  '2027-03-26', // Good Friday
  '2027-03-27', // Easter Saturday
  '2027-03-28', // Easter Sunday
  '2027-03-29', // Easter Monday
  '2027-04-25', // Anzac Day
  '2027-05-03', // Labour Day (first Monday in May)
  '2027-06-14', // King's Birthday (second Monday in June)
  '2027-08-11', // Royal Queensland Show — Brisbane (est. second Wednesday in August)
  '2027-12-25', // Christmas Day (Saturday) — actual day
  '2027-12-26', // Boxing Day (Sunday) — actual day
  '2027-12-27', // Christmas Day observed (substitute Monday)
  '2027-12-28', // Boxing Day observed (substitute Tuesday)
])

export function isQldHoliday(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return QLD_HOLIDAYS.has(`${y}-${m}-${d}`)
}
