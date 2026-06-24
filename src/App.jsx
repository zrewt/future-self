import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthInit } from './hooks/useAuthInit'
import { useTheme } from './hooks/useTheme'
import { useUserStore } from './store/useUserStore'
import NavBar from './components/NavBar'
import AuthGuard from './components/AuthGuard'
import Spinner from './components/ui/Spinner'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Log from './pages/Log'
import Profile from './pages/Profile'
import Achievements from './pages/Achievements'
import WeeklyReview from './pages/WeeklyReview'
import Challenges from './pages/Challenges'
import PublicProfile from './pages/PublicProfile'
import Insights from './pages/Insights'
import Landing from './pages/Landing'

function AppLayout() {
  return (
    <div className="app-bg min-h-screen">
      <NavBar />
      <main className="relative px-4 pt-6 pb-28 md:pb-8 md:pl-[252px] max-w-2xl lg:max-w-3xl mx-auto animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}

function ProtectedLayout() {
  return (
    <AuthGuard>
      <AppLayout />
    </AuthGuard>
  )
}

function HomeRedirect() {
  const { user, authReady } = useUserStore()
  if (!authReady) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

export default function App() {
  useAuthInit()
  useTheme()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no auth needed */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        <Route path="/insights" element={<Insights />} />

        <Route
          path="/onboarding"
          element={
            <AuthGuard onboardingRoute>
              <Onboarding />
            </AuthGuard>
          }
        />

        {/* Protected routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log" element={<Log />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/weekly" element={<WeeklyReview />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/challenges" element={<Challenges />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}