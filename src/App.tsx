import { Routes, Route } from 'react-router-dom'
import { LoginPage } from './features/auth/routes/login'
import { RegisterPage } from './features/auth/routes/register'
import { Dashboard } from './features/dashboard/routes/dashboard'
import { ProtectedRoute } from './lib/protected-route'

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground app-shell">
      <div className="theme-effects" aria-hidden>
        <span className="theme-orb orb-1" />
        <span className="theme-orb orb-2" />
        <span className="theme-orb orb-3" />
      </div>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  )
}

export default App
