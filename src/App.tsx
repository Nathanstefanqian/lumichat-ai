import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { LoginPage } from './features/auth/routes/login'
import { RegisterPage } from './features/auth/routes/register'
import { WechatCallback } from './features/auth/routes/wechat-callback'
import { Dashboard } from './features/dashboard/routes/dashboard'
import { WatermelonGame } from './features/game/components/watermelon/watermelon-game'
import { ProtectedRoute } from './lib/protected-route'
import { NewYearPage } from './features/new-year/routes/new-year'

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground app-shell">
      <Toaster position="top-right" />
      <div className="theme-effects" aria-hidden>
        <span className="theme-orb orb-1" />
        <span className="theme-orb orb-2" />
        <span className="theme-orb orb-3" />
      </div>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/game/watermelon" element={<WatermelonGame />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/wechat/callback" element={<WechatCallback />} />
        <Route path="/new-year" element={<NewYearPage />} />
      </Routes>
    </div>
  )
}

export default App
