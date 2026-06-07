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
      {/* Icon with radial glow */}
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
        <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(249,168,212,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', width:72, height:72, background:'rgba(249,168,212,0.08)', border:'1px solid rgba(249,168,212,0.25)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="hud-corner-tl" style={{ width:8, height:8, borderColor:'rgba(249,168,212,0.5)' }} />
          <div className="hud-corner-tr" style={{ width:8, height:8, borderColor:'rgba(249,168,212,0.5)' }} />
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      </div>

      <h1 style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'1.6rem', fontWeight:600, margin:'0 0 6px', letterSpacing:'-0.02em' }}>
        <span style={{ color:'var(--text)' }}>QR</span> <span style={{ color:'var(--acc)' }}>Roster</span>
      </h1>
      <p style={{ color:'var(--muted)', fontSize:'0.85rem', margin:'0 0 40px', textAlign:'center' }}>
        Mayne Link Roster Manager
      </p>

      <div className="glass-card" style={{ width:'100%', maxWidth:340, padding:24 }}>
        <h2 style={{ margin:'0 0 6px', fontSize:'0.95rem', fontWeight:600, color:'var(--text)' }}>What's your starting link?</h2>
        <p style={{ margin:'0 0 16px', fontSize:'0.8rem', color:'var(--muted)' }}>
          Enter the link number you started on the week of <strong style={{ color:'var(--acc2)' }}>20 Apr 2026</strong>. You can change this later in Settings.
        </p>

        <input
          type="number"
          min="1" max="440"
          placeholder="e.g. 390"
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handle()}
          style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'1.4rem', textAlign:'center', marginBottom:12 }}
          onFocus={e => { e.target.style.borderColor = 'var(--acc)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          autoFocus
        />

        {error && <p style={{ color:'#FCA5A5', fontSize:'0.8rem', margin:'0 0 10px', textAlign:'center' }}>{error}</p>}

        <button className="btn-primary" onClick={handle}>
          Start →
        </button>
      </div>
    </div>
  )
}
