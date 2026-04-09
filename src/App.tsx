import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useEffect, lazy, Suspense } from 'react'
import { useSocketStore } from './stores/socket'
import { useSpecialStore } from './stores/special'
import { ProtectedRoute } from './lib/protected-route'
import { HeartRain } from './components/special/HeartRain'
import { ApologyModal } from './components/special/ApologyModal'
import { ApologyEntry } from './components/special/ApologyEntry'

// 路由懒加载，解决首屏白屏过长的问题
const LoginPage = lazy(() => import('./features/auth/routes/login').then(m => ({ default: m.LoginPage })))
const WechatCallback = lazy(() => import('./features/auth/routes/wechat-callback').then(m => ({ default: m.WechatCallback })))
const Dashboard = lazy(() => import('./features/dashboard/routes/dashboard').then(m => ({ default: m.Dashboard })))
const WatermelonGame = lazy(() => import('./features/game/components/watermelon/watermelon-game').then(m => ({ default: m.WatermelonGame })))
const WillpowerLab = lazy(() => import('./features/self-discipline/components/willpower-lab').then(m => ({ default: m.WillpowerLab })))
const NewYearPage = lazy(() => import('./features/new-year/routes/new-year').then(m => ({ default: m.NewYearPage })))
const TestPage = lazy(() => import('./features/test/routes/test-page').then(m => ({ default: m.TestPage })))

// 简单的加载占位
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

function App() {
  const { socket } = useSocketStore()
  const { showApology, showEntry, setShowApology, setShowEntry } = useSpecialStore()

  useEffect(() => {
    // 监听实时推送 (如果欣妍在线但没刷新页面)
    if (socket) {
      socket.on('special:apology', () => {
        setShowEntry(true)
      })
      return () => {
        socket.off('special:apology')
      }
    }
  }, [socket, setShowEntry])

  const handleEntryClick = () => {
    setShowEntry(false)
    setShowApology(true)
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground app-shell">
      <Toaster position="top-right" />
      {showApology && <HeartRain />}
      <ApologyEntry isVisible={showEntry} onClick={handleEntryClick} />
      <ApologyModal isOpen={showApology} onClose={() => setShowApology(false)} />
      <div className="theme-effects" aria-hidden>
        <span className="theme-orb orb-1" />
        <span className="theme-orb orb-2" />
        <span className="theme-orb orb-3" />
      </div>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ai/roundtable" element={<Dashboard />} />
            <Route path="/game/watermelon" element={<WatermelonGame />} />
            <Route path="/willpower-lab" element={<WillpowerLab />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />
          <Route path="/auth/wechat/callback" element={<WechatCallback />} />
          <Route path="/new-year" element={<NewYearPage />} />
          <Route path="/test" element={<TestPage />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
