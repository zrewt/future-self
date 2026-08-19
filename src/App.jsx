import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthInit } from './hooks/useAuthInit'
import { useTheme } from './hooks/useTheme'
import { useUserStore } from './store/useUserStore'
import NavBar from './components/NavBar'
import AuthGuard from './components/AuthGuard'
import Spinner from './components/ui/Spinner'
import AmbientBackground from './components/ui/AmbientBackground'
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
import GetStarted from './pages/GetStarted'

function AppLayout() {
  return (
    <div className="app-bg min-h-screen">
      <AmbientBackground />
      <div className="relative z-10">
        <NavBar />
        <main className="relative px-4 pt-6 pb-28 md:pb-8 md:pl-[252px] max-w-2xl lg:max-w-3xl mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
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

export default function App() {
  useAuthInit()
  useTheme()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public / marketing */}
        <Route path="/" element={<Landing />} />
        <Route path="/get-started" element={<GetStarted />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/u/:username" element={<PublicProfile />} />

        <Route
          path="/onboarding"
          element={
            <AuthGuard onboardingRoute>
              <Onboarding />
            </AuthGuard>
          }
        />

        {/* Protected app */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log" element={<Log />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/weekly" element={<WeeklyReview />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/insights" element={<Insights />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}