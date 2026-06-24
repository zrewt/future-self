import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'

const PATHS = [
  { id: 'athlete', label: 'Athlete', icon: '🏋️', desc: 'Strength & performance' },
  { id: 'scholar', label: 'Scholar', icon: '📚', desc: 'Mind & knowledge' },
  { id: 'balanced', label: 'Balanced', icon: '⚖️', desc: 'Holistic growth' },
  { id: 'builder', label: 'Builder', icon: '🔨', desc: 'Habits & systems' },
]

// Each goal maps to the pillar it primarily affects on the dashboard
const GOALS = [
  { label: 'Get fitter',     pillar: 'fitness',   icon: '🏃' },
  { label: 'Sleep better',   pillar: 'energy',    icon: '💤' },
  { label: 'Eat healthier',  pillar: 'nutrition', icon: '🥗' },
  { label: 'Build focus',    pillar: 'focus',     icon: '🎯' },
  { label: 'Read more',      pillar: 'focus',     icon: '📚' },
  { label: 'Reduce stress',  pillar: 'energy',    icon: '🧘' },
  { label: 'Live longer',    pillar: 'longevity', icon: '🌿' },
  { label: 'Lose weight',    pillar: 'nutrition', icon: '⚖️' },
]

// The single most important goal maps to a focus_pillar saved on the profile
function pickFocusPillar(selectedGoals) {
  if (!selectedGoals.length) return 'fitness'
  const first = GOALS.find((g) => g.label === selectedGoals[0])
  return first?.pillar || 'fitness'
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, profile, setProfile } = useUserStore()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState(
    profile?.username || user?.user_metadata?.username || ''
  )
  const [avatarClass, setAvatarClass] = useState(profile?.avatar_class || 'balanced')
  const [goals, setGoals] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const progress = (step / 3) * 100

  function toggleGoal(goal) {
    setGoals((prev) => {
      if (prev.includes(goal)) return prev.filter((g) => g !== goal)
      if (prev.length >= 3) return prev
      return [...prev, goal]
    })
  }

  async function finish() {
    if (!user) return
    setError('')
    setLoading(true)

    const focusPillar = pickFocusPillar(goals)

    const { data: savedProfile, error: profileError } = await supabase
      .from('users_profile')
      .upsert(
        { id: user.id, username, avatar_class: avatarClass, focus_pillar: focusPillar },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (profileError) {
      setLoading(false)
      setError(profileError.message)
      return
    }

    const { data: authData, error: authError } = await supabase.auth.updateUser({
      data: { onboarding_complete: true, goals },
    })

    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }

    const { setUser, loadUserData } = useUserStore.getState()
    if (authData?.user) setUser(authData.user)
    setProfile(savedProfile)
    await loadUserData(user.id, { silent: true })
    setLoading(false)
    navigate('/dashboard')
  }

  return (
    <div className="app-bg min-h-screen px-4 py-10">
      <div className="max-w-lg mx-auto animate-slide-up">
        <div className="mb-8">
          <p className="section-title mb-1">Welcome to Qyven</p>
          <p className="text-xs text-slate-400 font-medium mb-3">Step {step} of 3</p>
          <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 font-medium">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="glass-card p-6 md:p-8">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">What should we call you?</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">
              This is how you&apos;ll appear on your public profile.
            </p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field mb-6"
              placeholder="yourname"
            />
            <button
              type="button"
              onClick={() => username.trim() && setStep(2)}
              disabled={!username.trim()}
              className="btn-primary w-full"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Choose your path</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">
              Pick the archetype that fits you best.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {PATHS.map((path) => (
                <button
                  key={path.id}
                  type="button"
                  onClick={() => setAvatarClass(path.id)}
                  className={[
                    'glass-card p-4 text-left transition-all',
                    avatarClass === path.id
                      ? 'ring-2 ring-primary shadow-card-hover scale-[1.02]'
                      : 'hover:shadow-card-hover opacity-90',
                  ].join(' ')}
                >
                  <span className="text-3xl">{path.icon}</span>
                  <p className="font-bold text-slate-900 mt-2">{path.label}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{path.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">
              What&apos;s your #1 focus?
            </h2>
            <p className="text-slate-500 text-sm mb-1 font-medium">
              Select up to 3 goals. Your top pick shapes your daily dashboard.
            </p>
            <p className="text-[11px] text-primary font-bold mb-5">
              First selection = your main focus pillar
            </p>
            <div className="space-y-2 mb-6">
              {GOALS.map((goal, idx) => {
                const selected = goals.includes(goal.label)
                const isFirst  = goals[0] === goal.label
                return (
                  <button
                    key={goal.label}
                    type="button"
                    onClick={() => toggleGoal(goal.label)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all',
                      selected
                        ? isFirst
                          ? 'bg-primary/10 border-primary ring-2 ring-primary'
                          : 'bg-primary/5 border-primary/40'
                        : 'bg-white border-surface-border',
                    ].join(' ')}
                  >
                    <span className="text-xl">{goal.icon}</span>
                    <span className="flex-1 text-slate-800 font-semibold text-sm">{goal.label}</span>
                    {isFirst && (
                      <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Main focus
                      </span>
                    )}
                    {selected && !isFirst && (
                      <span className="text-[10px] font-bold text-slate-400">✓</span>
                    )}
                    {!selected && goals.length < 3 && (
                      <span className="text-[10px] font-bold text-slate-300">+</span>
                    )}
                  </button>
                )
              })}
            </div>

            {goals.length > 0 && (
              <div className="glass-card p-3 mb-4 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <p className="text-xs font-semibold text-slate-600">
                  Your dashboard will highlight your{' '}
                  <span className="font-extrabold text-primary capitalize">
                    {pickFocusPillar(goals)}
                  </span>{' '}
                  pillar every day
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">
                Back
              </button>
              <button
                type="button"
                onClick={finish}
                disabled={loading || goals.length === 0}
                className="btn-primary flex-1 shadow-glow disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Start my journey 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
