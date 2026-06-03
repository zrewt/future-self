import { Navigate } from 'react-router-dom'
import { useUserStore, needsOnboarding } from '../store/useUserStore'
import Spinner from './ui/Spinner'

export default function AuthGuard({ children, onboardingRoute = false }) {
  const { user, profile, authReady, dataLoading } = useUserStore()

  if (!authReady || dataLoading) {
    return (
      <div className="app-bg min-h-screen flex flex-col items-center justify-center gap-4">
        <Spinner />
        <p className="text-sm font-medium text-slate-400">Loading your journey…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const mustOnboard = needsOnboarding(user, profile)

  if (onboardingRoute) {
    if (!mustOnboard) return <Navigate to="/dashboard" replace />
    return children
  }

  if (mustOnboard) return <Navigate to="/onboarding" replace />

  return children
}
