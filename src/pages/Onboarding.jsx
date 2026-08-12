import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'

const PATHS = [
  {
    id: 'athlete',
    label: 'Athlete',
    icon: '🏋️',
    desc: 'Strength, performance & movement',
  },
  {
    id: 'scholar',
    label: 'Scholar',
    icon: '📚',
    desc: 'Learning, focus & knowledge',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    icon: '⚖️',
    desc: 'A little better in every area',
  },
  {
    id: 'builder',
    label: 'Builder',
    icon: '🔨',
    desc: 'Habits, systems & consistency',
  },
]

const GOALS = [
  {
    label: 'Get fitter',
    pillar: 'fitness',
    icon: '🏃',
    desc: 'Build strength and endurance',
  },
  {
    label: 'Sleep better',
    pillar: 'energy',
    icon: '💤',
    desc: 'Improve recovery and energy',
  },
  {
    label: 'Eat healthier',
    pillar: 'nutrition',
    icon: '🥗',
    desc: 'Build better nutrition habits',
  },
  {
    label: 'Build focus',
    pillar: 'focus',
    icon: '🎯',
    desc: 'Improve concentration',
  },
  {
    label: 'Read more',
    pillar: 'focus',
    icon: '📚',
    desc: 'Learn something every day',
  },
  {
    label: 'Reduce stress',
    pillar: 'energy',
    icon: '🧘',
    desc: 'Create more calm and balance',
  },
  {
    label: 'Live longer',
    pillar: 'longevity',
    icon: '🌿',
    desc: 'Build habits that compound',
  },
  {
    label: 'Lose weight',
    pillar: 'nutrition',
    icon: '⚖️',
    desc: 'Work toward a healthier body',
  },
]

function pickFocusPillar(selectedGoals) {
  if (!selectedGoals.length) return 'fitness'

  const first = GOALS.find((goal) => goal.label === selectedGoals[0])

  return first?.pillar || 'fitness'
}

const STEP_INFO = [
  {
    number: '01',
    title: 'About you',
    short: 'Your profile',
  },
  {
    number: '02',
    title: 'Your path',
    short: 'Your direction',
  },
  {
    number: '03',
    title: 'Your goals',
    short: 'Your priorities',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, profile, setProfile } = useUserStore()

  const [step, setStep] = useState(1)

  const [username, setUsername] = useState(
    profile?.username || user?.user_metadata?.username || ''
  )

  const [avatarClass, setAvatarClass] = useState(
    profile?.avatar_class || 'balanced'
  )

  const [goals, setGoals] = useState([])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const progress = (step / 3) * 100

  function toggleGoal(goal) {
    setGoals((prev) => {
      if (prev.includes(goal)) {
        return prev.filter((item) => item !== goal)
      }

      if (prev.length >= 3) {
        return prev
      }

      return [...prev, goal]
    })
  }

  function continueFromStep1() {
    if (!username.trim()) return

    setError('')
    setStep(2)
  }

  function continueFromStep2() {
    setError('')
    setStep(3)
  }

  function goBack() {
    setError('')
    setStep((prev) => Math.max(1, prev - 1))
  }

  async function finish() {
    if (!user) return

    if (!username.trim()) {
      setError('Please enter your name.')
      setStep(1)
      return
    }

    if (!goals.length) {
      setError('Choose at least one goal to continue.')
      return
    }

    setError('')
    setLoading(true)

    const focusPillar = pickFocusPillar(goals)

    const { data: savedProfile, error: profileError } = await supabase
      .from('users_profile')
      .upsert(
        {
          id: user.id,
          username: username.trim(),
          avatar_class: avatarClass,
          focus_pillar: focusPillar,
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (profileError) {
      setLoading(false)
      setError(profileError.message)
      return
    }

    const { data: authData, error: authError } =
      await supabase.auth.updateUser({
        data: {
          onboarding_complete: true,
          goals,
        },
      })

    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }

    const { setUser, loadUserData } = useUserStore.getState()

    if (authData?.user) {
      setUser(authData.user)
    }

    setProfile(savedProfile)

    await loadUserData(user.id, { silent: true })

    setLoading(false)

    navigate('/dashboard')
  }

  const selectedPath =
    PATHS.find((path) => path.id === avatarClass) || PATHS[2]

  const focusPillar = pickFocusPillar(goals)

  return (
    <div
      className="app-bg min-h-screen px-4 py-8 md:py-12"
      style={{
        background:
          'radial-gradient(circle at 50% 0%, rgba(127,90,240,0.10), transparent 35%), var(--app-bg, #f8fafc)',
      }}
    >
      <div className="max-w-xl mx-auto">
        {/* ─────────────────────────────────────────
            HEADER
        ───────────────────────────────────────── */}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
                Qyven
              </p>

              <p className="text-sm font-bold text-slate-900 mt-1">
                Build your Future Self
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Step
              </p>

              <p className="text-sm font-extrabold text-slate-700">
                {step} <span className="text-slate-300">/</span> 3
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="relative">
            <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF7AC6] via-[#7F5AF0] to-[#00E8C6] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid grid-cols-3 mt-3">
              {STEP_INFO.map((item, index) => {
                const active = step >= index + 1

                return (
                  <div
                    key={item.number}
                    className={[
                      'flex items-center gap-1.5',
                      index === 1
                        ? 'justify-center'
                        : index === 2
                        ? 'justify-end'
                        : 'justify-start',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'text-[10px] font-extrabold',
                        active ? 'text-primary' : 'text-slate-300',
                      ].join(' ')}
                    >
                      {item.number}
                    </span>

                    <span
                      className={[
                        'text-[10px] font-bold hidden sm:inline',
                        active ? 'text-slate-500' : 'text-slate-300',
                      ].join(' ')}
                    >
                      {item.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 font-medium animate-slide-up">
            {error}
          </div>
        )}

        {/* ─────────────────────────────────────────
            STEP 1 — NAME
        ───────────────────────────────────────── */}

        {step === 1 && (
          <div className="animate-slide-up">
            <div className="glass-card p-6 md:p-8">
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF7AC6]/20 to-[#7F5AF0]/20 border border-primary/10 flex items-center justify-center text-2xl mb-5">
                  👋
                </div>

                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary mb-2">
                  Let&apos;s make this yours
                </p>

                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                  What should we call you?
                </h1>

                <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
                  Your name will personalize your Qyven experience and
                  appear on your dashboard.
                </p>
              </div>

              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                Your name
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    continueFromStep1()
                  }
                }}
                className="input-field mb-6"
                placeholder="e.g. Benny"
                autoFocus
                maxLength={30}
              />

              <button
                type="button"
                onClick={continueFromStep1}
                disabled={!username.trim()}
                className="btn-primary w-full shadow-glow disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>

              <p className="text-center text-[11px] text-slate-400 font-medium mt-4">
                You can change this later.
              </p>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────
            STEP 2 — PATH
        ───────────────────────────────────────── */}

        {step === 2 && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary mb-2">
                Your direction
              </p>

              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                Who are you becoming?
              </h1>

              <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
                Choose the path that feels closest to the person you want to
                become. This helps personalize your experience.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {PATHS.map((path) => {
                const selected = avatarClass === path.id

                return (
                  <button
                    key={path.id}
                    type="button"
                    onClick={() => setAvatarClass(path.id)}
                    className={[
                      'relative text-left rounded-3xl p-5 border transition-all duration-200',
                      'focus:outline-none',
                      selected
                        ? 'bg-primary/10 border-primary ring-2 ring-primary shadow-card-hover scale-[1.015]'
                        : 'bg-white/80 border-surface-border hover:border-primary/40 hover:shadow-card-hover',
                    ].join(' ')}
                  >
                    {/* Selected check */}
                    {selected && (
                      <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-extrabold">
                        ✓
                      </span>
                    )}

                    <span className="text-3xl block mb-4">
                      {path.icon}
                    </span>

                    <p className="font-extrabold text-slate-900">
                      {path.label}
                    </p>

                    <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                      {path.desc}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Current selection */}
            <div className="glass-card p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                {selectedPath.icon}
              </div>

              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  Your path
                </p>

                <p className="text-sm font-extrabold text-slate-800">
                  {selectedPath.label}
                </p>
              </div>

              <span className="text-primary text-xs font-extrabold">
                Selected
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="btn-secondary flex-1"
              >
                Back
              </button>

              <button
                type="button"
                onClick={continueFromStep2}
                className="btn-primary flex-1"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────
            STEP 3 — GOALS
        ───────────────────────────────────────── */}

        {step === 3 && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <div className="flex items-end justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary mb-2">
                    Your priorities
                  </p>

                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    What do you want to improve?
                  </h1>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-extrabold text-slate-400">
                    {goals.length}/3
                  </p>

                  <p className="text-[10px] text-slate-400 font-medium">
                    selected
                  </p>
                </div>
              </div>

              <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
                Pick up to 3. Your first choice becomes your main focus inside
                Qyven.
              </p>
            </div>

            <div className="space-y-2.5 mb-6">
              {GOALS.map((goal) => {
                const selected = goals.includes(goal.label)
                const isFirst = goals[0] === goal.label

                return (
                  <button
                    key={goal.label}
                    type="button"
                    onClick={() => toggleGoal(goal.label)}
                    className={[
                      'w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200',
                      'focus:outline-none',
                      selected
                        ? isFirst
                          ? 'bg-primary/10 border-primary ring-2 ring-primary shadow-sm'
                          : 'bg-primary/5 border-primary/40'
                        : 'bg-white/80 border-surface-border hover:border-primary/30 hover:bg-primary/[0.02]',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all',
                        selected
                          ? 'bg-primary/15'
                          : 'bg-slate-100',
                      ].join(' ')}
                    >
                      {goal.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-slate-800">
                        {goal.label}
                      </p>

                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {goal.desc}
                      </p>
                    </div>

                    {isFirst && (
                      <span className="text-[9px] font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        Main
                      </span>
                    )}

                    {!isFirst && selected && (
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-extrabold">
                        ✓
                      </span>
                    )}

                    {!selected && goals.length < 3 && (
                      <span className="w-6 h-6 rounded-full border border-slate-200 text-slate-300 flex items-center justify-center text-xs font-bold">
                        +
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Personalized preview */}
            {goals.length > 0 && (
              <div className="rounded-3xl p-4 mb-5 bg-gradient-to-r from-primary/10 via-purple-500/5 to-cyan-500/10 border border-primary/10">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center text-lg shrink-0">
                    🎯
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-slate-800 mb-1">
                      Your Qyven experience is taking shape
                    </p>

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Your main focus will be{' '}
                      <span className="font-extrabold text-primary capitalize">
                        {focusPillar}
                      </span>
                      . You&apos;ll still track all five pillars, but this one
                      will get extra attention.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="glass-card p-4 mb-6">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 font-extrabold mb-3">
                Your setup
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Name
                  </p>

                  <p className="text-sm font-extrabold text-slate-800 mt-0.5 truncate">
                    {username || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Path
                  </p>

                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                    {selectedPath.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Back
              </button>

              <button
                type="button"
                onClick={finish}
                disabled={loading || goals.length === 0}
                className="btn-primary flex-[1.6] shadow-glow disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up Qyven…' : 'Start my journey 🚀'}
              </button>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-medium mt-4">
              You can change your goals and path anytime from your profile.
            </p>
          </div>
        )}

        {/* Bottom brand */}
        <div className="text-center mt-10">
          <p className="text-[11px] text-slate-400 font-medium">
            Qyven · Become your Future Self
          </p>
        </div>
      </div>
    </div>
  )
}