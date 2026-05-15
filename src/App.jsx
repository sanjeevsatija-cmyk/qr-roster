/**
 * QR Roster — Queensland Rail Mayne Link Roster PWA
 * Developed by Sanjeev Satija, Brisbane, Australia
 * First created: April 2026
 * Copyright © 2026 Sanjeev Satija. All rights reserved.
 * Unauthorised copying, modification or distribution
 * of this software is strictly prohibited.
 */
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RosterProvider, useRoster } from './contexts/RosterContext'
import { useNotifications } from './hooks/useNotifications'
import SetupPage from './pages/SetupPage'
import RosterPage from './pages/RosterPage'
import JobCardPage from './pages/JobCardPage'
import SwapPage from './pages/SwapPage'
import LeavePage from './pages/LeavePage'
import ContactsPage from './pages/ContactsPage'
import TrialExpiredPage from './pages/TrialExpiredPage'
import BottomNav from './components/BottomNav'
import AboutPage from './pages/AboutPage'

const TRIAL_ENDS = new Date('2026-05-28T23:59:59')

const TRIAL_KEY_EXPIRY = new Date('2026-05-28T23:59:59')

function isLicenced() {
  const licence = localStorage.getItem('qr_licence')
  if (licence === 'master') return true
  if (licence === 'trial') return new Date() <= TRIAL_KEY_EXPIRY
  return false
}

function isTrialExpired() {
  return new Date() > TRIAL_ENDS
}

function AppInner() {
  const { startingLink, reminders } = useRoster()
  useNotifications(reminders)

  if (!startingLink) return <SetupPage />

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh' }}>
      <div className="page-content">
        <Routes>
          <Route path="/"        element={<RosterPage />} />
          <Route path="/jobcard" element={<JobCardPage />} />
          <Route path="/swap"    element={<SwapPage />} />
          <Route path="/leave"    element={<LeavePage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/about"    element={<AboutPage />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  if (!isLicenced() && isTrialExpired()) {
    return <TrialExpiredPage />
  }

  return (
    <RosterProvider>
      <AppInner />
    </RosterProvider>
  )
}
