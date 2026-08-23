import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'

const PATHS = [
  { id: 'athlete', label: 'Athlete', icon: '🏋️', desc: 'Strength, performance & movement' },
  { id: 'scholar', label: 'Scholar', icon: '📚', desc: 'Learning, focus & knowledge' },
  { id: 'balanced', label: 'Balanced', icon: '⚖️', desc: 'A little better in every area' },
  { id: 'builder', label: 'Builder', icon: '🔨', desc: 'Habits, systems & consistency' },
]

const GOALS = [
  { label: 'Get fitter', pillar: 'fitness', icon: '🏃', desc: 'Build strength and endurance' },
  { label: 'Sleep better', pillar: 'energy', icon: '💤', desc: 'Improve recovery and energy' },
  { label: 'Eat healthier', pillar: 'nutrition', icon: '🥗', desc: 'Build better nutrition habits' },
  { label: 'Build focus', pillar: 'focus', icon: '🎯', desc: 'Improve concentration' },
  { label: 'Read more', pillar: 'focus', icon: '📚', desc: 'Learn something every day' },
  { label: 'Reduce stress', pillar: 'energy', icon: '🧘', desc: 'Create more calm and balance' },
  { label: 'Live longer', pillar: 'longevity', icon: '🌿', desc: 'Build habits that compound' },
  { label: 'Lose weight', pillar: 'nutrition', icon: '⚖️', desc: 'Work toward a healthier body' },
]

const GOAL_HABIT_SUGGESTIONS = {
  'Get fitter':     { name: 'Move',                  icon: '🏃', tracking_type: 'minutes', target_value: 30, target_unit: 'min',      frequency_per_week: 4, difficulty: 'moderate', pillar_tag: 'fitness' },
  'Sleep better':   { name: 'Screen-free before bed', icon: '📵', tracking_type: 'boolean', target_value: null, target_unit: null,     frequency_per_week: 5, difficulty: 'easy',     pillar_tag: 'energy' },
  'Eat healthier':  { name: 'Vegetables',             icon: '🥦', tracking_type: 'times',   target_value: 3,  target_unit: 'servings', frequency_per_week: 7, difficulty: 'easy',     pillar_tag: 'nutrition' },
  'Build focus':    { name: 'Focused work',           icon: '🎯', tracking_type: 'minutes', target_value: 30, target_unit: 'min',      frequency_per_week: 5, difficulty: 'moderate', pillar_tag: 'focus' },
  'Read more':      { name: 'Read',                   icon: '📚', tracking_type: 'minutes', target_value: 20, target_unit: 'min',      frequency_per_week: 5, difficulty: 'easy',     pillar_tag: 'focus' },
  'Reduce stress':  { name: 'Meditate',                icon: '🧘', tracking_type: 'minutes', target_value: 10, target_unit: 'min',      frequency_per_week: 5, difficulty: 'easy',     pillar_tag: 'energy' },
  'Live longer':    { name: 'Whole-foods meal',        icon: '🌿', tracking_type: 'boolean', target_value: null, target_unit: null,     frequency_per_week: 5, difficulty: 'moderate', pillar_tag: 'longevity' },
  'Lose weight':    { name: 'Skip processed food',     icon: '🍟', tracking_type: 'boolean', target_value: null, target_unit: null,     frequency_per_week: 5, difficulty: 'moderate', pillar_tag: 'nutrition' },
}

function habitSummary(h) {
  if (h.tracking_type === 'boolean') return `${h.frequency_per_week}×/week`
  return `${h.target_value}${h.target_unit === 'min' ? ' min' : h.target_unit === 'servings' ? ' servings' : h.target_unit ? ` ${h.target_unit}` : ''} · ${h.frequency_per_week}×/week`
}

function pickFocusPillar(selectedGoals) {
  if (!selectedGoals.length) return 'fitness'
  const first = GOALS.find((goal) => goal.label === selectedGoals[0])
  return first?.pillar || 'fitness'
}

function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}
    >
      <div
        className="qyven-onb-blob"
        style={{ top: -120, left: '-14%', width: 460, height: 460, background: 'radial-gradient(circle, rgba(255,122,198,0.30) 0%, transparent 70%)', animationDelay: '0s' }}
      />
      <div
        className="qyven-onb-blob"
        style={{ top: 120, right: '-16%', width: 420, height: 420, background: 'radial-gradient(circle, rgba(124,58,237,0.26) 0%, transparent 70%)', animationDelay: '3s' }}
      />
      <div
        className="qyven-onb-blob"
        style={{ bottom: -120, left: '14%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,205,180,0.26) 0%, transparent 70%)', animationDelay: '6s' }}
      />
      <style>{`
        .qyven-onb-blob { position: absolute; border-radius: 50%; filter: blur(18px); animation: qyvenOnbDrift 15s ease-in-out infinite; }
        @keyframes qyvenOnbDrift { 0%, 100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(28px,-32px,0) scale(1.1); } }
        @media (max-width: 640px) { .qyven-onb-blob { filter: blur(14px); } }
        @media (prefers-reduced-motion: reduce) { .qyven-onb-blob { animation: none !important; } }
      `}</style>
    </div>
  )
}

const STEP_INFO = [
  { number: '01', title: 'About you', short: 'Your profile' },
  { number: '02', title: 'Your path', short: 'Your direction' },
  { number: '03', title: 'Your goals', short: 'Your priorities' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, profile, setProfile, addHabit } = useUserStore()

  const [step, setStep] = useState(1)
  const [username, setUsername] = useState(profile?.username || user?.user_metadata?.username || '')
  const [avatarClass, setAvatarClass] = useState(profile?.avatar_class || 'balanced')
  const [goals, setGoals] = useState([])
  const [removedHabits, setRemovedHabits] = useState(new Set())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const progress = (step / 3) * 100

  const suggestedHabits = useMemo(() => {
    const seen = new Set()
    const list = []
    goals.forEach((goalLabel) => {
      const suggestion = GOAL_HABIT_SUGGESTIONS[goalLabel]
      if (suggestion && !seen.has(suggestion.name)) {
        seen.add(suggestion.name)
        list.push(suggestion)
      }
    })
    return list
  }, [goals])

  function toggleGoal(goal) {
    setGoals((prev) => {
      if (prev.includes(goal)) return prev.filter((item) => item !== goal)
      if (prev.length >= 3) return prev
      return [...prev, goal]
    })
  }

  function toggleHabitSuggestion(name) {
    setRemovedHabits((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function continueFromStep1() {
    if (!username.trim()) { setError('Please enter your name.'); return }
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

    if (!username.trim()) { setError('Please enter your name.'); setStep(1); return }
    if (!goals.length) { setError('Choose at least one goal to continue.'); return }

    setError('')
    setLoading(true)

    const focusPillar = pickFocusPillar(goals)

    const { data: savedProfile, error: profileError } = await supabase
      .from('users_profile')
      .upsert({ id: user.id, username: username.trim(), avatar_class: avatarClass, focus_pillar: focusPillar }, { onConflict: 'id' })
      .select()
      .single()

    if (profileError) { setLoading(false); setError(profileError.message); return }

    const { data: authData, error: authError } = await supabase.auth.updateUser({
      data: { onboarding_complete: true, goals },
    })

    if (authError) { setLoading(false); setError(authError.message); return }

    const { setUser, loadUserData } = useUserStore.getState()
    if (authData?.user) setUser(authData.user)
    setProfile(savedProfile)

    const habitsToCreate = suggestedHabits.filter((h) => !removedHabits.has(h.name))
    if (habitsToCreate.length) {
      await Promise.all(
        habitsToCreate.map((h) =>
          addHabit({
            name: h.name, icon: h.icon, tracking_type: h.tracking_type,
            target_value: h.target_value, target_unit: h.target_unit,
            frequency_per_week: h.frequency_per_week, difficulty: h.difficulty, pillar_tag: h.pillar_tag,
          })
        )
      )
    }

    await loadUserData(user.id, { silent: true })
    setLoading(false)
    navigate('/dashboard')
  }

  const selectedPath = PATHS.find((path) => path.id === avatarClass) || PATHS[2]
  const focusPillar = pickFocusPillar(goals)

  return (
    <div
      className="min-h-screen px-4 py-7 text-[#12111e] sm:py-9 md:py-12 relative overflow-hidden"
      style={{ background: 'radial-gradient(circle at 50% -5%, rgba(124,58,237,0.10), transparent 32%), radial-gradient(circle at 100% 45%, rgba(0,205,180,0.06), transparent 30%), #f5f3ff' }}
    >
      <AmbientBackground />
      <div className="mx-auto w-full max-w-xl relative z-10">
        <div className="mb-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7c3aed]">Qyven</p>
              <p className="mt-1 text-sm font-bold text-[#12111e]">Build your Future Self</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Step</p>
              <p className="text-sm font-extrabold text-slate-600">{step} <span className="text-slate-300">/ 3</span></p>
            </div>
          </div>

          <div className="relative">
            <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(109,40,217,0.08)]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3">
              {STEP_INFO.map((item, index) => {
                const active = step >= index + 1
                return (
                  <div key={item.number} className={['flex items-center gap-1.5', index === 1 ? 'justify-center' : index === 2 ? 'justify-end' : 'justify-start'].join(' ')}>
                    <span className={['text-[10px] font-extrabold', active ? 'text-[#7c3aed]' : 'text-slate-300'].join(' ')}>{item.number}</span>
                    <span className={['hidden text-[10px] font-bold sm:inline', active ? 'text-slate-500' : 'text-slate-300'].join(' ')}>{item.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
        )}

        {step === 1 && (
          <div className="animate-slide-up">
            <div className="px-1 sm:px-2">
              <div className="mb-9">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-200 bg-gradient-to-br from-pink-100 to-purple-100 text-2xl">👋</div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#7c3aed]">Let&apos;s make this yours</p>
                <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-[#12111e] sm:text-4xl">What should we call you?</h1>
                <p className="max-w-lg text-sm font-medium leading-6 text-slate-500 sm:text-base">Your name will personalize your Qyven experience and appear on your dashboard.</p>
              </div>
              <div>
                <label htmlFor="username" className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">Your name</label>
                <input
                  id="username" type="text" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') continueFromStep1() }}
                  className="mb-5 w-full rounded-2xl border border-[rgba(109,40,217,0.14)] bg-white px-4 py-4 text-[#12111e] outline-none transition-all placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200"
                  placeholder="e.g. Benny" autoFocus maxLength={30}
                />
                <button type="button" onClick={continueFromStep1} disabled={!username.trim()} className="btn-primary w-full shadow-glow disabled:cursor-not-allowed disabled:opacity-40">Continue →</button>
                <p className="mt-4 text-center text-[11px] font-medium text-slate-400">You can change this later.</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#7c3aed]">Your direction</p>
              <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-[#12111e] md:text-3xl">Who are you becoming?</h1>
              <p className="text-sm font-medium leading-relaxed text-slate-500 md:text-base">Choose the path that feels closest to the person you want to become. This helps personalize your experience.</p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3">
              {PATHS.map((path) => {
                const selected = avatarClass === path.id
                return (
                  <button
                    key={path.id} type="button" onClick={() => setAvatarClass(path.id)}
                    className={['relative rounded-3xl border p-5 text-left transition-all duration-200 focus:outline-none', selected ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-300 shadow-[0_0_30px_rgba(124,58,237,0.10)]' : 'border-[rgba(109,40,217,0.18)] shadow-[0_2px_8px_rgba(109,40,217,0.06)] bg-white hover:border-purple-300 hover:bg-purple-50/40'].join(' ')}
                  >
                    {selected && <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#7c3aed] text-xs font-extrabold text-white">✓</span>}
                    <span className="mb-4 block text-3xl">{path.icon}</span>
                    <p className="font-extrabold text-[#12111e]">{path.label}</p>
                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">{path.desc}</p>
                  </button>
                )
              })}
            </div>

            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[rgba(109,40,217,0.18)] shadow-[0_2px_8px_rgba(109,40,217,0.06)] bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-xl">{selectedPath.icon}</div>
              <div className="flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Your path</p>
                <p className="text-sm font-extrabold text-slate-700">{selectedPath.label}</p>
              </div>
              <span className="text-xs font-extrabold text-[#7c3aed]">Selected</span>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="btn-secondary flex-1">Back</button>
              <button type="button" onClick={continueFromStep2} className="btn-primary flex-1">Continue →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#7c3aed]">Your priorities</p>
                  <h1 className="text-2xl font-extrabold tracking-tight text-[#12111e] md:text-3xl">What do you want to improve?</h1>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-extrabold text-slate-500">{goals.length}/3</p>
                  <p className="text-[10px] font-medium text-slate-400">selected</p>
                </div>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-500 md:text-base">Pick up to 3. Your first choice becomes your main focus inside Qyven.</p>
            </div>

            <div className="mb-6 space-y-2.5">
              {GOALS.map((goal) => {
                const selected = goals.includes(goal.label)
                const isFirst = goals[0] === goal.label
                return (
                  <button
                    key={goal.label} type="button" onClick={() => toggleGoal(goal.label)}
                    className={['flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none', selected ? (isFirst ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-300' : 'border-purple-200 bg-purple-50/60') : 'border-[rgba(109,40,217,0.18)] shadow-[0_2px_8px_rgba(109,40,217,0.06)] bg-white hover:border-purple-200 hover:bg-purple-50/40'].join(' ')}
                  >
                    <div className={['flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-all', selected ? 'bg-purple-100' : 'bg-slate-50'].join(' ')}>{goal.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-slate-800">{goal.label}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-500">{goal.desc}</p>
                    </div>
                    {isFirst && <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#7c3aed]">Main</span>}
                    {!isFirst && selected && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7c3aed] text-xs font-extrabold text-white">✓</span>}
                    {!selected && goals.length < 3 && <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(109,40,217,0.16)] text-xs font-bold text-slate-400">+</span>}
                  </button>
                )
              })}
            </div>

            {goals.length > 0 && (
              <div className="mb-5 rounded-3xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-teal-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg">🎯</div>
                  <div>
                    <p className="mb-1 text-xs font-extrabold text-slate-700">Your Qyven experience is taking shape</p>
                    <p className="text-[11px] font-medium leading-relaxed text-slate-500">
                      Your main focus will be <span className="font-extrabold capitalize text-[#7c3aed]">{focusPillar}</span>. You&apos;ll still track all five pillars, but this one will get extra attention.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {suggestedHabits.length > 0 && (
              <div className="mb-5 rounded-3xl border border-[rgba(109,40,217,0.18)] shadow-[0_2px_8px_rgba(109,40,217,0.06)] bg-white p-4">
                <p className="mb-3 text-xs font-extrabold text-slate-700">Your starting habits</p>
                <div className="space-y-2">
                  {suggestedHabits.map((h) => {
                    const removed = removedHabits.has(h.name)
                    return (
                      <div key={h.name} className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all ${removed ? 'border-slate-100 bg-slate-50 opacity-50' : 'border-purple-100 bg-purple-50/40'}`}>
                        <span className="text-lg shrink-0">{h.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${removed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{h.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{habitSummary(h)}</p>
                        </div>
                        <button type="button" onClick={() => toggleHabitSuggestion(h.name)} className="text-[10px] font-bold text-[#7c3aed] shrink-0">
                          {removed ? 'Add back' : 'Remove'}
                        </button>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-3 text-[10px] text-slate-400 font-medium">You can change these anytime from your habits.</p>
              </div>
            )}

            <div className="mb-6 rounded-2xl border border-[rgba(109,40,217,0.18)] shadow-[0_2px_8px_rgba(109,40,217,0.06)] bg-white p-4">
              <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Your setup</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Name</p>
                  <p className="mt-0.5 truncate text-sm font-extrabold text-slate-700">{username || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Path</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-700">{selectedPath.label}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="btn-secondary flex-1" disabled={loading}>Back</button>
              <button type="button" onClick={finish} disabled={loading || goals.length === 0} className="btn-primary flex-[1.6] shadow-glow disabled:cursor-not-allowed disabled:opacity-40">
                {loading ? 'Setting up Qyven…' : 'Start my journey 🚀'}
              </button>
            </div>
            <p className="mt-4 text-center text-[10px] font-medium text-slate-400">You can change your goals and path anytime from your profile.</p>
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-[11px] font-medium text-slate-400">Qyven · Become your Future Self</p>
        </div>
      </div>
    </div>
  )
}