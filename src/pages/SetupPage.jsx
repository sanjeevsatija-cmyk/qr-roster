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

export default function SetupPage() {
  const { setStartingLink } = useRoster()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const handle = () => {
    const n = parseInt(input)
    if (isNaN(n) || n < 1 || n > 440) {
      setError('Enter a number between 1 and 440')
      return
    }
    setStartingLink(n)
  }

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      {/* Icon */}
      <div style={{ width:72, height:72, background:'var(--surface)', border:'2px solid var(--border)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>

      <h1 style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'1.6rem', fontWeight:600, color:'#F1F5F9', margin:'0 0 6px', letterSpacing:'-0.02em' }}>
        QR <span style={{ color:'#F59E0B' }}>Roster</span>
      </h1>
      <p style={{ color:'#64748B', fontSize:'0.85rem', margin:'0 0 40px', textAlign:'center' }}>
        Mayne Link Roster Manager
      </p>

      <div className="card" style={{ width:'100%', maxWidth:340, padding:24 }}>
        <h2 style={{ margin:'0 0 6px', fontSize:'0.95rem', fontWeight:600 }}>What's your starting link?</h2>
        <p style={{ margin:'0 0 16px', fontSize:'0.8rem', color:'#64748B' }}>
          Enter the link number you started on the week of <strong style={{ color:'#F1F5F9' }}>20 Apr 2026</strong>. You can change this later in Settings.
        </p>

        <input
          type="number"
          min="1" max="440"
          placeholder="e.g. 390"
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handle()}
          style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'1.4rem', textAlign:'center', marginBottom:12 }}
          autoFocus
        />

        {error && <p style={{ color:'#EF4444', fontSize:'0.8rem', margin:'0 0 10px', textAlign:'center' }}>{error}</p>}

        <button className="btn-primary" onClick={handle}>
          Start →
        </button>
      </div>
    </div>
  )
}
