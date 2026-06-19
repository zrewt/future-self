import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import DetailToggle from '../components/log/DetailToggle'
import FoodDetailSection from '../components/log/FoodDetailSection'
import ServingStepper from '../components/log/ServingStepper'
import ShieldNotice from '../components/log/ShieldNotice'
import { TextField, SelectField } from '../components/log/TextDetailFields'
import {
  buildAllScores,
  calcXP,
  getLevelFromXP,
  isPerfectDay,
  calcNutritionFromServings,
  calcFitnessFromWorkout,
  calcSleepScore,
  calcFocusScore,
} from '../utils/scoring'
import { checkAndAwardAchievements } from '../utils/achievementStats'
import { parseLogDetails } from '../utils/logDetails'
import { localDateISO } from '../utils/date'
import {
  getCompletedQuestIds,
  newlyCompletedQuestIds,
  questXPForLog,
} from '../data/quests'
import { PRESET_WORKOUTS, getSavedWorkouts } from '../data/workouts'
import { evaluateStreakGap, checkNewShieldEarned } from '../utils/streakShield'

const EXERCISE_TYPES = ['gym', 'run', 'sport', 'yoga', 'rest']
const MOOD_EMOJIS = ['😞', '😟', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳', '🔥']
const MEDITATION_STYLES = [
  { value: 'breathwork', label: 'Breathwork' },
  { value: 'guided',     label: 'Guided' },
  { value: 'silent',     label: 'Silent' },
  { value: 'yoga',       label: 'Yoga / stretch' },
  { value: 'other',      label: 'Other' },
]

// ── XP breakdown for animated success screen ──────────────────────────────────
function buildXPBreakdown(log, streakForCalc, questXP, foods, bonusXP) {
  const lines = []
  if (calcFitnessFromWorkout(log) >= 50 || (log.workout_duration_min || 0) >= 20)
    lines.push({ icon: '🏋️', label: 'Workout', xp: 25 })
  if (calcNutritionFromServings(log, foods) >= 50)
    lines.push({ icon: '🥗', label: 'Nutrition', xp: 15 })
  if (Number(log.sleep_hours) >= 7.5)
    lines.push({ icon: '💤', label: 'Sleep', xp: 20 })
  if ((log.water_ml || 0) >= 2500)
    lines.push({ icon: '💧', label: 'Hydration', xp: 10 })
  if ((log.focus_minutes || 0) >= 60)
    lines.push({ icon: '🎯', label: 'Focus', xp: 20 })
  if ((log.reading_minutes || 0) >= 20)
    lines.push({ icon: '📚', label: 'Reading', xp: 15 })
  if ((log.meditation_minutes || 0) >= 10)
    lines.push({ icon: '🧘', label: 'Meditation', xp: 10 })
  if (log.is_perfect_day)
    lines.push({ icon: '⭐', label: 'Perfect day!', xp: 50 })
  const weekBonus = Math.floor(streakForCalc / 7) * 5
  if (weekBonus > 0)
    lines.push({ icon: '🔥', label: 'Streak bonus', xp: weekBonus })
  if (questXP > 0)
    lines.push({ icon: '✅', label: 'Quests', xp: questXP })
  if (bonusXP > 0)
    lines.push({ icon: '🏆', label: 'Achievement!', xp: bonusXP })
  return lines
}

// ── Habit streak counter ──────────────────────────────────────────────────────
function calcHabitStreak(recentLogs, check) {
  let streak = 0
  for (const log of recentLogs) {
    if (check(log)) streak++
    else break
  }
  return streak
}

// ── Numeric input helper ──────────────────────────────────────────────────────
function numericFieldProps(value, onChange) {
  return {
    value: value === 0 ? '' : value,
    onChange: (e) => {
      const raw = e.target.value
      if (raw === '') { onChange(0); return }
      const parsed = Number(raw)
      onChange(Number.isNaN(parsed) ? 0 : parsed)
    },
  }
}

// ── Streak computation — now shield/grace aware ────────────────────────────────
// Returns either a normal result, or { graceAvailable: missedDate } meaning
// the caller should pause and ask the user before finalizing the streak.
function computeStreak(profile, today, isUpdateSameDay) {
  if (isUpdateSameDay) {
    return {
      current_streak: profile.current_streak,
      longest_streak: profile.longest_streak,
      last_log_date:  profile.last_log_date || today,
      shieldEvent: null,
      newShieldEarned: 0,
      streak_shields: profile.streak_shields || 0,
      shield_used_dates: profile.shield_used_dates || [],
      last_shield_earned_streak: profile.last_shield_earned_streak || 0,
      graceAvailable: null,
    }
  }

  const gapResult = evaluateStreakGap(profile, today)

  if (gapResult.type === 'grace_available') {
    // Pause here — caller must ask the user yes/no before we touch the streak
    return { graceAvailable: gapResult.missedDate }
  }

  let streak
  let shieldEvent = null
  let shieldsRemaining = profile.streak_shields || 0
  let shieldUsedDates = profile.shield_used_dates || []

  if (gapResult.type === 'continue') {
    streak = (profile.current_streak || 0) + 1
  } else if (gapResult.type === 'shield_consumed') {
    streak = (profile.current_streak || 0) + 1
    shieldsRemaining = Math.max(0, shieldsRemaining - 1)
    shieldUsedDates = [...shieldUsedDates, gapResult.missedDate]
    shieldEvent = { type: 'shield_consumed', missedDate: gapResult.missedDate }
  } else {
    streak = 1
  }

  const newLongest = Math.max(profile.longest_streak || 0, streak)
  const shieldCheck = checkNewShieldEarned(profile, streak)

  return {
    current_streak: streak,
    longest_streak: newLongest,
    last_log_date: today,
    streak_shields: shieldCheck.earned ? shieldCheck.newShieldTotal : shieldsRemaining,
    shield_used_dates: shieldUsedDates,
    last_shield_earned_streak: shieldCheck.earned ? streak : (profile.last_shield_earned_streak || 0),
    shieldEvent,
    newShieldEarned: shieldCheck.earned ? shieldCheck.count : 0,
    graceAvailable: null,
  }
}

// Force a normal increment/break, skipping the grace pause — used once the
// user has answered the grace-window yes/no prompt.
function computeStreakForced(profile, today, graceAccepted) {
  if (graceAccepted) {
    const streak = (profile.current_streak || 0) + 1 // missed day "filled in", chain continues
    const newLongest = Math.max(profile.longest_streak || 0, streak)
    const shieldCheck = checkNewShieldEarned(profile, streak)
    return {
      current_streak: streak,
      longest_streak: newLongest,
      last_log_date: today,
      streak_shields: shieldCheck.earned ? shieldCheck.newShieldTotal : (profile.streak_shields || 0),
      shield_used_dates: profile.shield_used_dates || [],
      last_shield_earned_streak: shieldCheck.earned ? streak : (profile.last_shield_earned_streak || 0),
      shieldEvent: null,
      newShieldEarned: shieldCheck.earned ? shieldCheck.count : 0,
      graceAvailable: null,
    }
  }
  // Declined — streak breaks normally
  return {
    current_streak: 1,
    longest_streak: profile.longest_streak || 0,
    last_log_date: today,
    streak_shields: profile.streak_shields || 0,
    shield_used_dates: profile.shield_used_dates || [],
    last_shield_earned_streak: profile.last_shield_earned_streak || 0,
    shieldEvent: null,
    newShieldEarned: 0,
    graceAvailable: null,
  }
}

// ── Smart default form (runs outside component — no hook restrictions) ─────────
function getDefaultForm(recentLogs, todayLog) {
  const yesterday = recentLogs?.[0]
  if (!yesterday || todayLog) {
    return {
      fruit_servings: 0, vegetable_servings: 0, protein_servings: 0, processed_servings: 0,
      exercise_type: 'rest', workout_duration_min: 0,
      sleep_hours: 7, sleep_quality: 5, water_ml: 1500,
      focus_minutes: 0, reading_minutes: 0, meditation_minutes: 0, mood: 5,
    }
  }
  return {
    fruit_servings: 0, vegetable_servings: 0, protein_servings: 0, processed_servings: 0,
    exercise_type:       yesterday.exercise_type ?? 'rest',
    workout_duration_min: 0,
    sleep_hours:         Number(yesterday.sleep_hours) || 7,
    sleep_quality:       yesterday.sleep_quality ?? 5,
    water_ml:            yesterday.water_ml ?? 1500,
    focus_minutes: 0, reading_minutes: 0, meditation_minutes: 0, mood: 5,
  }
}

// ── Quick-log presets ─────────────────────────────────────────────────────────
const QUICK_PRESETS = [
  {
    id: 'ate_well', label: 'Ate well', emoji: '🥗',
    apply: (f) => ({
      ...f,
      fruit_servings:     Math.max(f.fruit_servings, 2),
      vegetable_servings: Math.max(f.vegetable_servings, 3),
      protein_servings:   Math.max(f.protein_servings, 2),
      processed_servings: Math.min(f.processed_servings, 1),
    }),
  },
  {
    id: 'worked_out', label: 'Worked out', emoji: '🏋️',
    apply: (f) => ({
      ...f,
      exercise_type:        f.exercise_type === 'rest' ? 'gym' : f.exercise_type,
      workout_duration_min: Math.max(f.workout_duration_min, 45),
    }),
  },
  {
    id: 'slept_good', label: 'Slept good', emoji: '💤',
    apply: (f) => ({ ...f, sleep_hours: Math.max(Number(f.sleep_hours), 8), sleep_quality: Math.max(f.sleep_quality, 8) }),
  },
  {
    id: 'hydrated', label: 'Hydrated', emoji: '💧',
    apply: (f) => ({ ...f, water_ml: Math.max(f.water_ml, 2500) }),
  },
  {
    id: 'focused', label: 'Focused', emoji: '🎯',
    apply: (f) => ({ ...f, focus_minutes: Math.max(f.focus_minutes, 60) }),
  },
]

// ── Animated XP success screen ────────────────────────────────────────────────
function XPSuccessScreen({ lines, total, shieldEvent, newShieldEarned }) {
  const [visible, setVisible] = useState(0)
  const [shown, setShown]     = useState(false)

  useEffect(() => {
    if (shown) return
    setShown(true)
    lines.forEach((_, i) => {
      setTimeout(() => setVisible(i + 1), i * 220 + 300)
    })
  }, [lines, shown])

  const displayedTotal = lines.slice(0, visible).reduce((s, l) => s + l.xp, 0)

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-slide-up px-4">
      <div className="glass-card p-8 w-full max-w-sm text-center">
        <ShieldNotice shieldEvent={shieldEvent} newShieldEarned={newShieldEarned} />
        <p className="text-4xl mb-1">🔒</p>
        <p className="text-2xl font-extrabold text-slate-900 mb-1">Locked in!</p>
        <p className="text-3xl font-extrabold text-primary tabular-nums mb-6">+{displayedTotal} XP</p>
        <div className="space-y-2 text-left">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-300 ${
                i < visible ? 'opacity-100 translate-y-0 bg-primary/5' : 'opacity-0 translate-y-2'
              }`}
              style={{ transitionDelay: `${i * 20}ms` }}
            >
              <span className="text-sm font-semibold text-slate-700">{line.icon} {line.label}</span>
              <span className="text-sm font-extrabold text-primary tabular-nums">+{line.xp}</span>
            </div>
          ))}
        </div>
        {visible >= lines.length && lines.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">Total</span>
            <span className="text-xl font-extrabold text-primary tabular-nums">+{total} XP</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Grace window prompt ───────────────────────────────────────────────────────
function GracePrompt({ missedDate, onAnswer, loading }) {
  const formatted = new Date(`${missedDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', month: 'short', day: 'numeric',
  })
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-slide-up px-4">
      <div className="glass-card p-8 w-full max-w-sm text-center">
        <p className="text-4xl mb-2">🤔</p>
        <p className="text-xl font-extrabold text-slate-900 mb-2">Missed a day?</p>
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
          Looks like you didn't log on <span className="font-bold text-slate-700">{formatted}</span>.
          Did you roughly hit your basics that day — eating reasonably, some movement, decent sleep?
        </p>
        <div className="space-y-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => onAnswer(true)}
            className="btn-primary w-full !py-3 text-sm"
          >
            Yes, keep my streak going
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onAnswer(false)}
            className="btn-secondary w-full !py-3 text-sm"
          >
            No, that's fair — reset it
          </button>
        </div>
        <p className="text-[10px] text-slate-400 font-medium mt-4">
          This grace window only covers a single missed day, once.
        </p>
      </div>
    </div>
  )
}

// ── Habit streak badge ────────────────────────────────────────────────────────
function StreakBadge({ count }) {
  if (!count || count < 2) return null
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-coral bg-coral/10 rounded-full px-1.5 py-0.5 ml-2">
      🔥{count}
    </span>
  )
}

// ── Section score pill ────────────────────────────────────────────────────────
function ScorePill({ score, label }) {
  const color = score >= 70
    ? 'text-teal bg-teal/10'
    : score >= 45
    ? 'text-primary bg-primary/10'
    : 'text-coral bg-coral/10'
  return (
    <span className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 tabular-nums ml-auto ${color}`}>
      {label}: {score}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Log() {
  const navigate = useNavigate()
  const {
    user, profile, todayLog, recentLogs,
    earnedAchievements, loadUserData, setTodayLog, setProfile,
  } = useUserStore()

  const defaultForm = useMemo(
    () => getDefaultForm(recentLogs, todayLog),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const [form, setForm]                     = useState(() => defaultForm)
  const [details, setDetails]               = useState(() => ({
    foods: [],
    exercise:  { name: '', duration_min: '', notes: '' },
    sleep:     { bedtime: '', wake_time: '', notes: '' },
    water:     { notes: '' },
    focus:     { activity: '' },
    reading:   { title: '', pages: '' },
    meditation:{ style: '' },
    mood:      { note: '' },
  }))
  const [loading, setLoading]               = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [savedAt, setSavedAt]               = useState(null)
  const [error, setError]                   = useState('')
  const [success, setSuccess]               = useState(null)
  const [quickActive, setQuickActive]       = useState(new Set())
  const [showWorkoutLib, setShowWorkoutLib] = useState(false)
  const [savedWorkouts, setSavedWorkouts]   = useState([])
  const [workoutLibTab, setWorkoutLibTab]   = useState('presets')
  const [lowMoodPrompt, setLowMoodPrompt]   = useState(false)
  const [gracePrompt, setGracePrompt]       = useState(null) // missedDate string, or null

  const isUpdate = Boolean(todayLog)

  useEffect(() => {
    setSavedWorkouts([...PRESET_WORKOUTS, ...getSavedWorkouts()])
  }, [])

  useEffect(() => {
    if (!todayLog) return
    setForm({
      fruit_servings:       todayLog.fruit_servings       ?? 0,
      vegetable_servings:   todayLog.vegetable_servings   ?? 0,
      protein_servings:     todayLog.protein_servings     ?? 0,
      processed_servings:   todayLog.processed_servings   ?? 0,
      exercise_type:        todayLog.exercise_type        ?? 'rest',
      workout_duration_min: todayLog.workout_duration_min ?? 0,
      sleep_hours:          Number(todayLog.sleep_hours)  || 7,
      sleep_quality:        todayLog.sleep_quality        ?? 5,
      water_ml:             todayLog.water_ml             ?? 1500,
      focus_minutes:        todayLog.focus_minutes        ?? 0,
      reading_minutes:      todayLog.reading_minutes      ?? 0,
      meditation_minutes:   todayLog.meditation_minutes   ?? 0,
      mood:                 todayLog.mood                 ?? 5,
    })
    setDetails(parseLogDetails(todayLog.log_details))
  }, [todayLog])

  // Habit streaks — consecutive days each habit was met
  const habitStreaks = useMemo(() => {
    const logs = recentLogs || []
    return {
      nutrition:  calcHabitStreak(logs, (l) => (l.vegetable_servings || 0) >= 2 || (l.fruit_servings || 0) >= 2),
      workout:    calcHabitStreak(logs, (l) => (l.workout_duration_min || 0) >= 15 || l.exercise_type !== 'rest'),
      sleep:      calcHabitStreak(logs, (l) => Number(l.sleep_hours) >= 7),
      water:      calcHabitStreak(logs, (l) => (l.water_ml || 0) >= 2000),
      focus:      calcHabitStreak(logs, (l) => (l.focus_minutes || 0) >= 30),
      reading:    calcHabitStreak(logs, (l) => (l.reading_minutes || 0) >= 10),
      meditation: calcHabitStreak(logs, (l) => (l.meditation_minutes || 0) >= 5),
    }
  }, [recentLogs])

  const previewLog    = useMemo(() => ({ ...form, sleep_hours: Number(form.sleep_hours) }), [form])
  const previewScores = useMemo(
    () => buildAllScores(previewLog, profile?.current_streak || 0, details.foods),
    [previewLog, profile?.current_streak, details.foods]
  )
  const nutritionPreview = calcNutritionFromServings(previewLog, details.foods)
  const fitnessPreview   = calcFitnessFromWorkout(previewLog)
  const sleepPreview     = calcSleepScore(previewLog)
  const focusPreview     = calcFocusScore(previewLog)

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function patchDetails(section, patch) {
    setDetails((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }))
  }

  function handleServingDetected(servingKey) {
    setForm((prev) => ({ ...prev, [servingKey]: (prev[servingKey] ?? 0) + 1 }))
  }

  function handleServingRemoved(servingKey) {
    setForm((prev) => ({ ...prev, [servingKey]: Math.max(0, (prev[servingKey] ?? 0) - 1) }))
  }

  function toggleQuickPreset(preset) {
    const next = new Set(quickActive)
    if (next.has(preset.id)) {
      next.delete(preset.id)
      let f = { ...defaultForm }
      for (const id of next) {
        const p = QUICK_PRESETS.find((p) => p.id === id)
        if (p) f = p.apply(f)
      }
      setForm(f)
    } else {
      next.add(preset.id)
      setForm((prev) => preset.apply({ ...prev }))
    }
    setQuickActive(next)
  }

  function applyWorkout(w) {
    updateField('exercise_type', w.type)
    updateField('workout_duration_min', w.duration)
    patchDetails('exercise', { name: w.name })
    setShowWorkoutLib(false)
  }

  function handleMoodChange(val) {
    updateField('mood', val)
    if (val <= 4 && !details.mood.note) {
      setLowMoodPrompt(true)
    } else {
      setLowMoodPrompt(false)
    }
  }

  const glasses = Math.min(8, Math.floor(form.water_ml / 250))

  // ── Build DB row ──────────────────────────────────────────────────────────
  function buildRow(userId, today, scores, xp_earned, is_perfect_day, mergedDetails) {
    return {
      user_id:              userId,
      log_date:             today,
      fruit_servings:       form.fruit_servings,
      vegetable_servings:   form.vegetable_servings,
      protein_servings:     form.protein_servings,
      processed_servings:   form.processed_servings,
      meal_quality:         scores.nutrition_score,
      exercise_intensity:   scores.fitness_score,
      exercise_type:        form.exercise_type,
      workout_duration_min: form.workout_duration_min,
      sleep_hours:          Number(form.sleep_hours),
      sleep_quality:        form.sleep_quality,
      water_ml:             form.water_ml,
      focus_minutes:        form.focus_minutes,
      reading_minutes:      form.reading_minutes,
      meditation_minutes:   form.meditation_minutes,
      mood:                 form.mood,
      log_details:          mergedDetails,
      ...scores,
      xp_earned,
      is_perfect_day,
    }
  }

  // ── Shared finalize step — writes profile + log, shows success screen ──────
  async function finalizeSubmit(streakUpdate) {
    const today = localDateISO()
    const foods          = details.foods || []
    const logPayload     = { ...form, sleep_hours: Number(form.sleep_hours) }
    const scores         = buildAllScores(logPayload, streakUpdate.current_streak, foods)
    const is_perfect_day = isPerfectDay(logPayload, foods)
    const prevQuests     = getCompletedQuestIds(todayLog)
    const newQuestIds    = newlyCompletedQuestIds(logPayload, prevQuests)
    const allQuestIds    = [...new Set([...prevQuests, ...newQuestIds])]
    const questXP        = questXPForLog(logPayload, prevQuests)
    const mergedDetails  = { ...details, quests_completed: allQuestIds }
    const xp_earned      = calcXP({ ...logPayload, is_perfect_day }, streakUpdate.current_streak, questXP, foods)
    const row             = buildRow(user.id, today, scores, xp_earned, is_perfect_day, mergedDetails)

    const { error: logError } = await supabase.from('daily_logs').upsert(row, { onConflict: 'user_id,log_date' })
    if (logError) { setLoading(false); setError(logError.message); return }

    const previousXP = todayLog?.xp_earned || 0
    let newTotalXP   = profile.total_xp - previousXP + xp_earned

    const { bonusXP } = await checkAndAwardAchievements(
      user.id,
      { ...profile, current_streak: streakUpdate.current_streak, longest_streak: streakUpdate.longest_streak, level: getLevelFromXP(newTotalXP) },
      earnedAchievements
    )
    newTotalXP    += bonusXP
    const newLevel = getLevelFromXP(newTotalXP)

    await supabase.from('users_profile')
      .update({
        total_xp: newTotalXP,
        level: newLevel,
        current_streak: streakUpdate.current_streak,
        longest_streak: streakUpdate.longest_streak,
        last_log_date: streakUpdate.last_log_date,
        last_active_date: today,
        streak_shields: streakUpdate.streak_shields,
        shield_used_dates: streakUpdate.shield_used_dates,
        last_shield_earned_streak: streakUpdate.last_shield_earned_streak,
      })
      .eq('id', user.id)

    setProfile({
      ...profile,
      total_xp: newTotalXP,
      level: newLevel,
      current_streak: streakUpdate.current_streak,
      longest_streak: streakUpdate.longest_streak,
      last_log_date: streakUpdate.last_log_date,
      streak_shields: streakUpdate.streak_shields,
      shield_used_dates: streakUpdate.shield_used_dates,
      last_shield_earned_streak: streakUpdate.last_shield_earned_streak,
    })
    setTodayLog({ ...row, id: todayLog?.id })
    await loadUserData(user.id)

    setLoading(false)
    setGracePrompt(null)
    const xpLines = buildXPBreakdown({ ...logPayload, is_perfect_day }, streakUpdate.current_streak, questXP, foods, bonusXP)
    setSuccess({
      lines: xpLines,
      total: xp_earned + bonusXP,
      shieldEvent: streakUpdate.shieldEvent,
      newShieldEarned: streakUpdate.newShieldEarned,
    })
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
    setTimeout(() => navigate('/dashboard'), xpLines.length * 220 + 2800)
  }

  // ── Partial save (no streak/shield logic — just persists progress) ─────────
  async function handlePartialSave() {
    if (!user || !profile) return
    setSaving(true)
    const today = localDateISO()
    const isUpdateSameDay = profile.last_log_date === today
    const streakForCalc = isUpdateSameDay ? profile.current_streak : profile.current_streak

    const foods          = details.foods || []
    const logPayload     = { ...form, sleep_hours: Number(form.sleep_hours) }
    const scores         = buildAllScores(logPayload, streakForCalc, foods)
    const is_perfect_day = isPerfectDay(logPayload, foods)
    const prevQuests     = getCompletedQuestIds(todayLog)
    const allQuestIds    = [...new Set([...prevQuests, ...newlyCompletedQuestIds(logPayload, prevQuests)])]
    const mergedDetails  = { ...details, quests_completed: allQuestIds }
    const xp_earned      = calcXP({ ...logPayload, is_perfect_day }, streakForCalc, questXPForLog(logPayload, prevQuests), foods)
    const row            = buildRow(user.id, today, scores, xp_earned, is_perfect_day, mergedDetails)

    await supabase.from('daily_logs').upsert(row, { onConflict: 'user_id,log_date' })
    setTodayLog({ ...row, id: todayLog?.id })
    setSavedAt(new Date())
    setSaving(false)
  }

  // ── Full submit ───────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (!user || !profile) return
    setError('')
    setLoading(true)

    const today = localDateISO()
    const isUpdateSameDay = profile.last_log_date === today
    const streakUpdate = computeStreak(profile, today, isUpdateSameDay)

    if (streakUpdate.graceAvailable) {
      // Pause submission — ask the user about the missed day first
      setLoading(false)
      setGracePrompt(streakUpdate.graceAvailable)
      return
    }

    await finalizeSubmit(streakUpdate)
  }

  // ── Grace prompt answer handler ─────────────────────────────────────────────
  async function handleGraceAnswer(accepted) {
    if (!user || !profile) return
    setLoading(true)
    const today = localDateISO()
    const streakUpdate = computeStreakForced(profile, today, accepted)
    await finalizeSubmit(streakUpdate)
  }

  if (gracePrompt) {
    return <GracePrompt missedDate={gracePrompt} onAnswer={handleGraceAnswer} loading={loading} />
  }

  if (success) {
    return (
      <XPSuccessScreen
        lines={success.lines}
        total={success.total}
        shieldEvent={success.shieldEvent}
        newShieldEarned={success.newShieldEarned}
      />
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-8 animate-slide-up">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="section-title mb-1">Daily check-in</p>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isUpdate ? "Update today's log" : 'Log today'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Scores update live as you fill in each section</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            type="button"
            onClick={handlePartialSave}
            disabled={saving}
            className="btn-secondary !py-2 !px-3 text-xs"
          >
            {saving ? 'Saving…' : '💾 Save progress'}
          </button>
          {savedAt && (
            <p className="text-[10px] text-teal font-semibold">
              ✓ Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </header>

      {profile?.streak_shields > 0 && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary px-1 mb-3">
          <span>🛡️</span>
          <span>{profile.streak_shields} streak shield{profile.streak_shields > 1 ? 's' : ''} banked</span>
        </div>
      )}

      {/* Live score preview */}
      <div className="glass-card p-3 mb-4 grid grid-cols-3 gap-2 text-center text-xs">
        {[
          { l: 'Nutrition',   v: nutritionPreview },
          { l: 'Fitness',     v: fitnessPreview },
          { l: 'Future Self', v: previewScores.future_self_score },
        ].map((s) => (
          <div key={s.l}>
            <p className="text-slate-400 font-bold uppercase text-[10px]">{s.l}</p>
            <p className="text-lg font-extrabold text-primary tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      {/* Quick-log fast lane */}
      <div className="glass-card p-4 mb-4">
        <p className="section-title mb-2">⚡ Quick log</p>
        <p className="text-xs text-slate-500 font-medium mb-3">Tap what applies — fills in smart values instantly</p>
        <div className="grid grid-cols-5 gap-2">
          {QUICK_PRESETS.map((preset) => {
            const active = quickActive.has(preset.id)
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => toggleQuickPreset(preset)}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-primary text-white shadow-md scale-95'
                    : 'bg-slate-50 text-slate-600 border border-surface-border'
                }`}
              >
                <span className="text-xl">{preset.emoji}</span>
                <span className="leading-tight text-center text-[10px]">{preset.label}</span>
              </button>
            )
          })}
        </div>
        {quickActive.size > 0 && (
          <button
            type="button"
            onClick={() => { setQuickActive(new Set()); setForm(defaultForm) }}
            className="text-[10px] font-bold text-slate-400 mt-2 underline"
          >
            Clear quick log
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Nutrition ── */}
        <div className="glass-card p-5">
          <div className="flex items-center mb-1">
            <label className="label-text mb-0">Nutrition — today&apos;s servings</label>
            <StreakBadge count={habitStreaks.nutrition} />
            <ScorePill score={nutritionPreview} label="Score" />
          </div>
          <ServingStepper label="Fruit"      emoji="🍎" value={form.fruit_servings}     onChange={(v) => updateField('fruit_servings', v)} />
          <ServingStepper label="Vegetables" emoji="🥬" value={form.vegetable_servings} onChange={(v) => updateField('vegetable_servings', v)} />
          <ServingStepper label="Protein"    emoji="🥩" value={form.protein_servings}   onChange={(v) => updateField('protein_servings', v)} />
          <ServingStepper label="Processed"  emoji="🍟" value={form.processed_servings} onChange={(v) => updateField('processed_servings', v)} />
          <DetailToggle label="Search specific foods" badge={details.foods.length}>
            <FoodDetailSection
              foods={details.foods}
              onChange={(foods) => setDetails((d) => ({ ...d, foods }))}
              onServingDetected={handleServingDetected}
              onServingRemoved={handleServingRemoved}
            />
          </DetailToggle>
        </div>

        {/* ── Workout ── */}
        <div className="glass-card p-5">
          <div className="flex items-center mb-3">
            <label className="label-text mb-0">Workout</label>
            <StreakBadge count={habitStreaks.workout} />
            <ScorePill score={fitnessPreview} label="Score" />
          </div>
          <button
            type="button"
            onClick={() => setShowWorkoutLib((v) => !v)}
            className="w-full text-left text-xs font-bold text-primary mb-3 flex items-center gap-1"
          >
            🏃 {showWorkoutLib ? 'Hide' : 'Pick a workout'} ▾
          </button>
          {showWorkoutLib && (
            <div className="mb-3">
              <div className="flex gap-2 mb-2">
                {['presets', 'saved'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setWorkoutLibTab(tab)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      workoutLibTab === tab ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab === 'presets' ? '⚡ Presets' : '⭐ Saved'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {(workoutLibTab === 'presets' ? PRESET_WORKOUTS : getSavedWorkouts()).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => applyWorkout(w)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-slate-50 border border-surface-border text-xs font-semibold text-slate-700 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  >
                    <span className="text-lg">{w.emoji}</span>
                    <span className="text-[10px] leading-tight text-center">{w.name}</span>
                    <span className="text-[9px] text-slate-400">{w.duration}min</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {EXERCISE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateField('exercise_type', type)}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium capitalize',
                  form.exercise_type === type ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600',
                ].join(' ')}
              >
                {type}
              </button>
            ))}
          </div>
          <label className="text-xs font-semibold text-slate-500">Duration (minutes)</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={300}
            placeholder="0"
            {...numericFieldProps(form.workout_duration_min, (v) => updateField('workout_duration_min', v))}
            className="input-field mt-1"
          />
          <DetailToggle label="Workout notes" badge={details.exercise.name || details.exercise.notes ? 1 : 0}>
            <TextField label="Activity" value={details.exercise.name} onChange={(v) => patchDetails('exercise', { name: v })} placeholder="Upper body, 5k…" />
            <TextField label="Notes"    value={details.exercise.notes} onChange={(v) => patchDetails('exercise', { notes: v })} multiline />
          </DetailToggle>
        </div>

        {/* ── Sleep ── */}
        <div className="glass-card p-5">
          <div className="flex items-center mb-3">
            <label className="label-text mb-0">Sleep</label>
            <StreakBadge count={habitStreaks.sleep} />
            <ScorePill score={sleepPreview} label="Score" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Hours slept</label>
              <input
                type="number"
                step={0.5}
                min={0}
                max={14}
                value={form.sleep_hours}
                onChange={(e) => updateField('sleep_hours', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">Sleep quality</label>
              <input
                type="range"
                min={1}
                max={10}
                value={form.sleep_quality}
                onChange={(e) => updateField('sleep_quality', Number(e.target.value))}
                className="w-full mt-3"
              />
              <p className="text-sm font-bold text-primary tabular-nums">{form.sleep_quality}/10</p>
            </div>
          </div>
        </div>

        {/* ── Water ── */}
        <div className="glass-card p-5">
          <div className="flex items-center mb-2">
            <label className="label-text mb-0">Water</label>
            <StreakBadge count={habitStreaks.water} />
          </div>
          <input
            type="range"
            min={0}
            max={4000}
            step={100}
            value={form.water_ml}
            onChange={(e) => updateField('water_ml', Number(e.target.value))}
            className="w-full"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {[500, 1000, 1500, 2000, 2500, 3000].map((ml) => (
              <button
                key={ml}
                type="button"
                onClick={() => updateField('water_ml', ml)}
                className={`text-xs font-semibold px-2 py-1 rounded-lg ${form.water_ml === ml ? 'bg-primary text-white' : 'bg-slate-100'}`}
              >
                {ml / 1000}L
              </button>
            ))}
          </div>
          <p className="text-sm mt-2">{'🥛'.repeat(glasses) || '—'} · {form.water_ml} ml</p>
        </div>

        {/* ── Focus ── */}
        <div className="glass-card p-5">
          <div className="flex items-center mb-2">
            <label className="label-text mb-0">Focus (min)</label>
            <StreakBadge count={habitStreaks.focus} />
            <ScorePill score={focusPreview} label="Score" />
          </div>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            {...numericFieldProps(form.focus_minutes, (v) => updateField('focus_minutes', v))}
            className="input-field"
          />
          <DetailToggle label="What you worked on" badge={details.focus.activity ? 1 : 0}>
            <TextField value={details.focus.activity} onChange={(v) => patchDetails('focus', { activity: v })} placeholder="Project, study topic…" />
          </DetailToggle>
        </div>

        {/* ── Reading ── */}
        <div className="glass-card p-5">
          <div className="flex items-center mb-2">
            <label className="label-text mb-0">Reading (min)</label>
            <StreakBadge count={habitStreaks.reading} />
          </div>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            {...numericFieldProps(form.reading_minutes, (v) => updateField('reading_minutes', v))}
            className="input-field"
          />
          <DetailToggle label="Book / article" badge={details.reading.title ? 1 : 0}>
            <TextField label="Title" value={details.reading.title} onChange={(v) => patchDetails('reading', { title: v })} />
          </DetailToggle>
        </div>

        {/* ── Meditation ── */}
        <div className="glass-card p-5">
          <div className="flex items-center mb-2">
            <label className="label-text mb-0">Meditation (min)</label>
            <StreakBadge count={habitStreaks.meditation} />
          </div>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            {...numericFieldProps(form.meditation_minutes, (v) => updateField('meditation_minutes', v))}
            className="input-field"
          />
          <DetailToggle label="Style" badge={details.meditation.style ? 1 : 0}>
            <SelectField label="Type" value={details.meditation.style} onChange={(v) => patchDetails('meditation', { style: v })} options={MEDITATION_STYLES} />
          </DetailToggle>
        </div>

        {/* ── Mood ── */}
        <div className="glass-card p-5">
          <label className="label-text">Mood</label>
          <div className="flex flex-wrap gap-1.5 justify-between">
            {MOOD_EMOJIS.map((emoji, i) => (
              <button
                key={i + 1}
                type="button"
                onClick={() => handleMoodChange(i + 1)}
                className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  form.mood === i + 1 ? 'bg-primary-50 ring-2 ring-primary scale-110' : 'opacity-50'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {form.mood <= 4 && (
            <p className="text-xs text-slate-500 font-medium mt-2 italic">
              Rough day? Even noting it here counts — your Future Self Score accounts for honesty.
            </p>
          )}
          <DetailToggle
            label={form.mood <= 4 ? "What's going on? (optional)" : 'Reflection'}
            badge={details.mood.note ? 1 : 0}
            forceOpen={lowMoodPrompt}
          >
            <TextField
              value={details.mood.note}
              onChange={(v) => patchDetails('mood', { note: v })}
              multiline
              placeholder={form.mood <= 4 ? 'What made today feel this way…' : 'How today felt…'}
            />
          </DetailToggle>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-lg py-4 shadow-glow"
        >
          {loading ? 'Saving…' : 'Lock in today 🔒'}
        </button>
      </form>
    </div>
  )
}