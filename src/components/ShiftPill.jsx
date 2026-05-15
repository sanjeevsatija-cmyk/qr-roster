/**
 * QR Roster — Queensland Rail Mayne Link Roster PWA
 * Developed by Sanjeev Satija, Brisbane, Australia
 * First created: April 2026
 * Copyright © 2026 Sanjeev Satija. All rights reserved.
 * Unauthorised copying, modification or distribution
 * of this software is strictly prohibited.
 */
import React from 'react'
import { classifyShift } from '../contexts/RosterContext'

const CLASS_MAP = {
  empty:  'badge-blp',
  blp:    'badge-blp',
  slp:    'badge-slp',
  afp:    'badge-afp',
  al:     'badge-al',
  spare:  'badge-spare',
  eb:     'badge-eb',
  ef:     'badge-ef',
  tr:     'badge-tr',
  cs:     'badge-cs',
  other:  'badge-other',
}

export default function ShiftPill({ shift, compact = false }) {
  if (!shift) return (
    <span className="shift-code badge-blp" style={{ padding: compact ? '1px 4px' : '2px 6px', borderRadius: 4 }}>—</span>
  )

  const hasEx = /^EX\s*\//i.test(shift)
  const display = hasEx ? shift.replace(/^EX\s*\/\s*/i,'') : shift
  const type = classifyShift(shift)
  const cls = CLASS_MAP[type] || 'badge-other'

  return (
    <span
      className={`shift-code ${cls}`}
      style={{
        display: 'inline-block',
        padding: compact ? '1px 4px' : '3px 7px',
        borderRadius: 5,
        fontSize: compact ? '0.67rem' : '0.73rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
      }}
    >
      {hasEx && <span style={{ color: '#FCA5A5', marginRight: 2 }}>EX</span>}
      {display}
    </span>
  )
}
