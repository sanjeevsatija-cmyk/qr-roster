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
      position: 'relative',
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      overflow: 'hidden',
    }}>
      {/* Glow orbs */}
      <div style={{ position:'absolute', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, rgba(249,168,212,0.07) 0%, transparent 70%)', top:-80, right:-60, pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(196,181,253,0.06) 0%, transparent 70%)', bottom:-40, left:-30, pointerEvents:'none' }} />

      <h1 style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '1.8rem',
        fontWeight: 700,
        margin: '0 0 32px',
        letterSpacing: '-0.02em',
      }}>
        <span style={{ color:'var(--text)' }}>QR</span> <span style={{ color:'var(--acc)' }}>Roster</span>
      </h1>

      <div className="glass-card" style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        textAlign: 'center',
        padding: '24px 28px',
        borderRadius: 16,
        maxWidth: 320,
        width: '100%',
        marginBottom: 40,
      }}>
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />

        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}>
          Developed by Sanjeev Satija
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
          Brisbane, Australia
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
          Version 1.0 — April 2026
        </p>
        <p style={{ margin: '12px 0 0', fontSize: '0.85rem', color: 'var(--acc)', fontFamily: 'DM Sans, sans-serif' }}>
          Copyright © 2026 Sanjeev Satija
        </p>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
          All rights reserved
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
          Queensland Rail Mayne Link Roster PWA
        </p>

        <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '12px 0' }} />

        <p style={{
          margin: 0,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.68rem',
          color: 'var(--muted2)',
          letterSpacing: '0.05em',
        }}>
          BUILD-SJS-BNE-2026-QRMAYNE-V1
        </p>
      </div>

      <button
        className="glass-card-inner"
        style={{
          position: 'relative',
          color: 'var(--acc)',
          borderColor: 'rgba(249,168,212,0.3)',
          borderStyle: 'solid',
          borderWidth: 1,
          borderRadius: 10,
          maxWidth: 200,
          width: '100%',
          padding: 10,
          marginTop: 24,
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
        }}
        onClick={() => navigate(-1)}>
        Close
      </button>
    </div>
  )
}
