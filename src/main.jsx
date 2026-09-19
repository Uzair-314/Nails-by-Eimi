import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ConfigNotice from './components/ConfigNotice'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import { SUPABASE_CONFIGURED } from './lib/supabase'
import './index.css'

// Without the database there is nothing to render, so say so plainly rather
// than mounting an app that will fail on its first query.
const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    {SUPABASE_CONFIGURED ? (
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <App />
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <ConfigNotice />
    )}
  </StrictMode>
)
