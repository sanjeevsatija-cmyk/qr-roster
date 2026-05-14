import React, { useState } from 'react'

const MASTER_KEY = 'QRDEV-2026-MASTER'

export default function TrialExpiredPage() {
  const [keyInput, setKeyInput] = useState('')
  const [error,    setError]    = useState('')

  const handleActivate = () => {
    const trimmed = keyInput.trim()

    if (trimmed === MASTER_KEY) {
      localStorage.setItem('qr_licence', 'master')
      window.location.reload()
      return
    }

    // Stage 2: real Stripe licence validation will be added here.
    setError('Invalid key — please contact Sanjeev on 0412 328 562')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>

      {/* Icon */}
      <div style={{
        width: 72, height: 72,
        background: 'var(--surface)',
        border: '2px solid var(--border)',
        borderRadius: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>

      <h1 style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '1.6rem',
        fontWeight: 600,
        color: 'var(--text)',
        margin: '0 0 6px',
        letterSpacing: '-0.02em',
      }}>
        QR <span style={{ color: '#F59E0B' }}>Roster</span>
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 40px', textAlign: 'center' }}>
        Mayne Link Roster Manager
      </p>

      <div className="card" style={{ width: '100%', maxWidth: 340, padding: 24 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700 }}>
          Your free trial has ended.
        </h2>
        <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Thanks for trying QR Roster!
        </p>
        <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: 'var(--muted)' }}>
          To continue using the app, purchase a licence for{' '}
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>$3.99</span>.
        </p>

        <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
          Licence key
        </label>
        <input
          type="text"
          placeholder="XXXX-XXXX-XXXX"
          value={keyInput}
          onChange={e => { setKeyInput(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleActivate()}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1rem',
            textAlign: 'center',
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />

        {error && (
          <p style={{ color: 'var(--red)', fontSize: '0.8rem', margin: '0 0 10px', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button className="btn-primary" onClick={handleActivate}>
          Activate
        </button>

        <p style={{
          margin: '20px 0 0',
          fontSize: '0.78rem',
          color: 'var(--muted)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          To purchase contact Sanjeev on{' '}
          <a href="tel:0412328562" style={{ color: 'var(--amber)', textDecoration: 'none' }}>
            0412 328 562
          </a>
        </p>
      </div>
    </div>
  )
}
