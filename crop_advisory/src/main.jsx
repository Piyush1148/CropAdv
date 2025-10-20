import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// NOTE: StrictMode removed to prevent double-mounting in development
// StrictMode intentionally mounts components twice to catch bugs,
// but was causing excessive re-renders (8+ mounts on dashboard)
// This does NOT affect production builds (StrictMode has no effect in production)
createRoot(document.getElementById('root')).render(
  <App />
)
