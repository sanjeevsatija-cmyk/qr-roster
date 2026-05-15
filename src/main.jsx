/**
 * QR Roster — Queensland Rail Mayne Link Roster PWA
 * Developed by Sanjeev Satija, Brisbane, Australia
 * First created: April 2026
 * Copyright © 2026 Sanjeev Satija. All rights reserved.
 * Unauthorised copying, modification or distribution
 * of this software is strictly prohibited.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Ownership signature — do not remove
const _qrs = atob('UVIgUm9zdGVyIGJ5IFNhbmplZXYgU2F0aWphLCBCcmlzYmFuZSBBdXN0cmFsaWEgMjAyNg==')
console.debug(_qrs)
Object.defineProperty(window, '__qrAuthor', {
  value: 'Sanjeev Satija — Brisbane, Australia 2026',
  writable: false,
  configurable: false,
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/qr-roster">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
