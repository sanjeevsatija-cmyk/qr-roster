/**
 * QR Roster — Queensland Rail Mayne Link Roster PWA
 * Developed by Sanjeev Satija, Brisbane, Australia
 * First created: April 2026
 * Copyright © 2026 Sanjeev Satija. All rights reserved.
 * Unauthorised copying, modification or distribution
 * of this software is strictly prohibited.
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    }}>
      <h1 style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '1.8rem',
        fontWeight: 700,
        color: '#F59E0B',
        margin: '0 0 32px',
        letterSpacing: '-0.02em',
      }}>
        QR Roster
      </h1>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        textAlign: 'center',
        marginBottom: 40,
      }}>
        <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}>
          Developed by Sanjeev Satija
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
          Brisbane, Australia
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
          Version 1.0 — April 2026
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '0.88rem', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}>
          Copyright © 2026 Sanjeev Satija
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
          All rights reserved
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
          Queensland Rail Mayne Link Roster PWA
        </p>
        <p style={{
          margin: '16px 0 0',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          color: 'var(--border)',
          letterSpacing: '0.05em',
        }}>
          BUILD-SJS-BNE-2026-QRMAYNE-V1
        </p>
      </div>

      <button
        className="btn-secondary"
        style={{ maxWidth: 200, width: '100%' }}
        onClick={() => navigate(-1)}>
        Close
      </button>
    </div>
  )
}
