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
import BottomNav from './components/BottomNav'

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
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <RosterProvider>
      <AppInner />
    </RosterProvider>
  )
}
