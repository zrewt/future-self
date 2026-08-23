import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import DetailToggle from '../components/log/DetailToggle'
import FoodDetailSection from '../components/log/FoodDetailSection'
import ServingStepper from '../components/log/ServingStepper'
import ShieldNotice from '../components/log/ShieldNotice'
import QuickTierSelect from '../components/log/QuickTierSelect'
import MyHabitsSection from '../components/log/MyHabitsSection'
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

const EXERCISE_TYPES = ['gym', 'run', 'sport', 'yoga', 'bike', 'other']
const MOOD_EMOJIS = ['😞', '😟', '😐', '🙂', '😊', '😄', '🤩']
const MOOD_VALUES = [1, 3, 4, 6, 7, 9, 10]
const MEDITATION_STYLES = [
  { value: 'breathwork', label: 'Breathwork' },
  { value: 'guided',     label: 'Guided' },
  { value: 'silent',     label: 'Silent' },
  { value: 'yoga',       label: 'Yoga / stretch' },
  { value: 'other',      label: 'Other' },
]

function scoreLabel(score) {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Great'
  if (score >= 50) return 'Good'
  if (score >= 30) return 'Okay'
  return 'Needs work'
}

function dailyScoreMessage(score) {
  if (score >= 85) return 'Excellent day. This is what building compounds.'
  if (score >= 70) return 'Great day. Keep it going.'
  if (score >= 50) return 'Solid day — small wins add up.'
  if (score >= 30) return "A tougher day — tomorrow's a reset."
  return 'Rough day — showing up tomorrow is what counts.'
}

const NUTRITION_TIERS = [
  { value: 'needs_work', label: 'Needs Work', apply: (f) => ({ ...f, fruit_servings: 0, vegetable_servings: 0, protein_servings: 1, processed_servings: 3 }) },
  { value: 'okay',       label: 'Okay',       apply: (f) => ({ ...f, fruit_servings: 1, vegetable_servings: 1, protein_servings: 1, processed_servings: 2 }) },
  { value: 'good',       label: 'Good',       apply: (f) => ({ ...f, fruit_servings: 2, vegetable_servings: 2, protein_servings: 2, processed_servings: 1 }) },
  { value: 'great',      label: 'Great',      apply: (f) => ({ ...f, fruit_servings: 3, vegetable_servings: 4, protein_servings: 3, processed_servings: 0 }) },
]

const FITNESS_TIERS = [
  { value: 'rest',    label: 'Rest',    apply: (f) => ({ ...f, exercise_type: 'rest', workout_duration_min: 0, workout_intensity: 1 }) },
  { value: 'light',   label: 'Light',   apply: (f) => ({ ...f, exercise_type: f.exercise_type === 'rest' ? 'yoga' : f.exercise_type, workout_duration_min: 20, workout_intensity: 3 }) },
  { value: 'workout', label: 'Workout', apply: (f) => ({ ...f, exercise_type: f.exercise_type === 'rest' ? 'gym' : f.exercise_type, workout_duration_min: f.workout_duration_min || 45, workout_intensity: f.workout_intensity || 6 }) },
]
const FITNESS_EXPAND_TIERS = new Set(['workout'])

const SLEEP_HOUR_TIERS = [
  { value: 6, label: '6h' },
  { value: 7, label: '7h' },
  { value: 8, label: '8h' },
  { value: 9, label: '9h+' },
]
const SLEEP_QUALITY_TIERS = [
  { value: 3, label: 'Poor' },
  { value: 5, label: 'Okay' },
  { value: 7, label: 'Good' },
  { value: 9, label: 'Great' },
]

const HYDRATION_TIERS = [
  { value: 1000, label: '1L' },
  { value: 1500, label: '1.5L' },
  { value: 2000, label: '2L' },
  { value: 2500, label: '2.5L' },
  { value: 3000, label: '3L+' },
]

const FOCUS_TIERS = [
  { value: 15,  label: '<30m' },
  { value: 45,  label: '30-60m' },
  { value: 90,  label: '1-2h' },
  { value: 180, label: '2-4h' },
  { value: 300, label: '4h+' },
]
const FOCUS_TOPIC_TIERS = [
  { value: 'School',   label: 'School' },
  { value: 'Work',     label: 'Work' },
  { value: 'Reading',  label: 'Reading' },
  { value: 'Creative', label: 'Creative' },
  { value: 'Other',    label: 'Other' },
]

const READING_TIERS = [
  { value: 0,   label: '0m' },
  { value: 15,  label: '15m' },
  { value: 30,  label: '30m' },
  { value: 60,  label: '60m' },
  { value: 120, label: '2h+' },
]
const MEDITATION_TIERS = [
  { value: 0,  label: '0m' },
  { value: 5,  label: '5m' },
  { value: 10, label: '10m' },
  { value: 20, label: '20m' },
  { value: 30, label: '30m+' },
]
const SCREEN_TIME_TIERS = [
  { value: 30,  label: '<1h' },
  { value: 90,  label: '1-2h' },
  { value: 180, label: '2-4h' },
  { value: 300, label: '4-6h' },
  { value: 420, label: '6h+' },
]

const MEAL_TRIGGERS = [
  { value: 'breakfast', label: '+ Breakfast' },
  { value: 'lunch',     label: '+ Lunch' },
  { value: 'dinner',    label: '+ Dinner' },
  { value: 'snack',     label: '+ Snack' },
]

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

function computeStreakForced(profile, today, graceAccepted) {
  if (graceAccepted) {
    const streak = (profile.current_streak || 0) + 1
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

function getDefaultForm(recentLogs, todayLog) {
  const yesterday = recentLogs?.[0]
  if (!yesterday || todayLog) {
    return {
      fruit_servings: 0, vegetable_servings: 0, protein_servings: 0, processed_servings: 0,
      exercise_type: 'rest', workout_duration_min: 0, workout_intensity: 6,
      sleep_hours: 7, sleep_quality: 5, water_ml: 1500,
      focus_minutes: 0, reading_minutes: 0, meditation_minutes: 0, mood: 6,
      screen_time_minutes: 0,
    }
  }
  return {
    fruit_servings: 0, vegetable_servings: 0, protein_servings: 0, processed_servings: 0,
    exercise_type:       yesterday.exercise_type ?? 'rest',
    workout_duration_min: 0,
    workout_intensity:   yesterday.workout_intensity ?? 6,
    sleep_hours:         Number(yesterday.sleep_hours) || 7,
    sleep_quality:       yesterday.sleep_quality ?? 5,
    water_ml:            yesterday.water_ml ?? 1500,
    focus_minutes: 0, reading_minutes: 0, meditation_minutes: 0, mood: 6,
    screen_time_minutes: 0,
  }
}

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
      <div className="relative overflow-hidden rounded-3xl bg-white p-8 w-full max-w-sm text-center border border-[rgba(109,40,217,0.10)] shadow-[0_20px_60px_rgba(109,40,217,0.14)]">
        <div className="absolute top-0 left-8 right-8 h-[3px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4]" />
        <ShieldNotice shieldEvent={shieldEvent} newShieldEarned={newShieldEarned} />
        <p className="text-4xl mb-1">🔒</p>
        <p className="text-2xl font-extrabold text-slate-900 mb-1">Locked in!</p>
        <p
          className="text-3xl font-extrabold tabular-nums mb-6"
          style={{
            background: 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          +{displayedTotal} XP
        </p>
        <div className="space-y-2 text-left">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-300 ${
                i < visible ? 'opacity-100 translate-y-0 bg-[#7c3aed]/5' : 'opacity-0 translate-y-2'
              }`}
              style={{ transitionDelay: `${i * 20}ms` }}
            >
              <span className="text-sm font-semibold text-slate-700">{line.icon} {line.label}</span>
              <span className="text-sm font-extrabold text-[#7c3aed] tabular-nums">+{line.xp}</span>
            </div>
          ))}
        </div>
        {visible >= lines.length && lines.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">Total</span>
            <span className="text-xl font-extrabold text-[#7c3aed] tabular-nums">+{total} XP</span>
          </div>
        )}
      </div>
    </div>
  )
}

function GracePrompt({ missedDate, onAnswer, loading }) {
  const formatted = new Date(`${missedDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', month: 'short', day: 'numeric',
  })
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-slide-up px-4">
      <div className="rounded-3xl bg-white p-8 w-full max-w-sm text-center border border-[rgba(109,40,217,0.10)] shadow-[0_8px_28px_rgba(109,40,217,0.10)]">
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

function StreakBadge({ count }) {
  if (!count || count < 2) return null
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-coral bg-coral/10 rounded-full px-1.5 py-0.5 ml-2">
      🔥{count}
    </span>
  )
}

function FocusBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#7c3aed] bg-[#7c3aed]/10 rounded-full px-2 py-0.5 ml-2">
      🎯 Your focus
    </span>
  )
}

function DailyScoreHero({ score, deltaVsAvg }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_6px_24px_rgba(109,40,217,0.08)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-6 mb-4 text-center">
      <div className="absolute top-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] dark:hidden" />
      <p
        className="text-5xl font-extrabold tabular-nums leading-none mb-1"
        style={{
          background: 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {score}
      </p>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Today's Score</p>
      {deltaVsAvg != null && (
        <p className={`text-xs font-bold mb-1 ${deltaVsAvg >= 0 ? 'text-[#00a591]' : 'text-[#e0527a]'}`}>
          {deltaVsAvg >= 0 ? '↑' : '↓'} {Math.abs(deltaVsAvg)} from your average
        </p>
      )}
      <p className="text-sm text-slate-500 font-medium">{dailyScoreMessage(score)}</p>
    </div>
  )
}

function SectionHeader({ icon, title, score, isFocusPillar }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="label-text mb-0">{title}</span>
        {isFocusPillar && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#7c3aed] bg-[#7c3aed]/10 rounded-full px-2 py-0.5">
            🎯 Focus
          </span>
        )}
      </div>
      {score != null && (
        <p className="text-sm font-extrabold text-[#7c3aed] tabular-nums">
          {score} <span className="text-slate-400 font-semibold">· {scoreLabel(score)}</span>
        </p>
      )}
    </div>
  )
}

function SectionCard({ pillar, focusPillar, children }) {
  const isFocus = pillar && focusPillar === pillar
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-white shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] p-5 ${isFocus ? 'border border-[#7c3aed]/25 ring-2 ring-[#7c3aed]/30 dark:border-[#29263B] shadow-[0_4px_20px_rgba(124,58,237,0.14)]' : 'border border-[rgba(109,40,217,0.10)] dark:border-[#29263B]'}`}>
      {isFocus && (
        <div className="absolute top-0 left-5 right-5 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] dark:hidden" />
      )}
      {children}
    </div>
  )
}

export default function Log() {
  const navigate = useNavigate()
  const {
    user, profile, todayLog, recentLogs,
    earnedAchievements, loadUserData, setTodayLog, setProfile,
  } = useUserStore()

  const focusPillar = profile?.focus_pillar || null

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
  const [showWorkoutLib, setShowWorkoutLib] = useState(false)
  const [savedWorkouts, setSavedWorkouts]   = useState([])
  const [workoutLibTab, setWorkoutLibTab]   = useState('presets')
  const [lowMoodPrompt, setLowMoodPrompt]   = useState(false)
  const [gracePrompt, setGracePrompt]       = useState(null)
  const [activeMeal, setActiveMeal]         = useState(null)

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
      workout_intensity:    todayLog.workout_intensity    ?? 6,
      sleep_hours:          Number(todayLog.sleep_hours)  || 7,
      sleep_quality:        todayLog.sleep_quality        ?? 5,
      water_ml:             todayLog.water_ml             ?? 1500,
      focus_minutes:        todayLog.focus_minutes        ?? 0,
      reading_minutes:      todayLog.reading_minutes      ?? 0,
      meditation_minutes:   todayLog.meditation_minutes   ?? 0,
      mood:                 todayLog.mood                 ?? 6,
      screen_time_minutes:  todayLog.screen_time_minutes  ?? 0,
    })
    setDetails(parseLogDetails(todayLog.log_details))
  }, [todayLog])

  const previewLog    = useMemo(() => ({ ...form, sleep_hours: Number(form.sleep_hours) }), [form])
  const previewScores = useMemo(
    () => buildAllScores(previewLog, profile?.current_streak || 0, details.foods),
    [previewLog, profile?.current_streak, details.foods]
  )
  const nutritionPreview = calcNutritionFromServings(previewLog, details.foods)
  const fitnessPreview   = calcFitnessFromWorkout(previewLog)
  const sleepPreview     = calcSleepScore(previewLog)
  const focusPreview     = calcFocusScore(previewLog)

  const recentAvg = useMemo(() => {
    const prior = (recentLogs || []).filter((l) => l.future_self_score != null).slice(0, 7)
    if (!prior.length) return null
    return Math.round(prior.reduce((s, l) => s + l.future_self_score, 0) / prior.length)
  }, [recentLogs])
  const deltaVsAvg = recentAvg != null ? previewScores.future_self_score - recentAvg : null

  const activeNutritionTier = useMemo(() => {
    const total = form.fruit_servings + form.vegetable_servings + form.protein_servings
    if (total === 0 && form.processed_servings === 0) return null
    return NUTRITION_TIERS.find((t) => {
      const applied = t.apply(form)
      return applied.fruit_servings === form.fruit_servings &&
             applied.vegetable_servings === form.vegetable_servings &&
             applied.protein_servings === form.protein_servings &&
             applied.processed_servings === form.processed_servings
    })?.value ?? null
  }, [form.fruit_servings, form.vegetable_servings, form.protein_servings, form.processed_servings])

  const activeFitnessTier = useMemo(() => {
    if (form.exercise_type === 'rest') return 'rest'
    if (form.workout_duration_min > 0 && form.workout_duration_min <= 25) return 'light'
    if (form.workout_duration_min > 0) return 'workout'
    return null
  }, [form.exercise_type, form.workout_duration_min])

  const activeMoodIndex = MOOD_VALUES.indexOf(form.mood)

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applyTier(tier) {
    setForm((prev) => tier.apply(prev))
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

  function formatScreenTime(mins) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
  }

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
      workout_intensity:    form.workout_intensity,
      sleep_hours:          Number(form.sleep_hours),
      sleep_quality:        form.sleep_quality,
      water_ml:             form.water_ml,
      focus_minutes:        form.focus_minutes,
      reading_minutes:      form.reading_minutes,
      meditation_minutes:   form.meditation_minutes,
      mood:                 form.mood,
      screen_time_minutes:  form.screen_time_minutes,
      log_details:          mergedDetails,
      ...scores,
      xp_earned,
      is_perfect_day,
    }
  }

  async function finalizeSubmit(streakUpdate) {
    const today = localDateISO()
    const foods          = details.foods || []
    const logPayload     = { ...form, sleep_hours: Number(form.sleep_hours), screen_time_target_minutes: profile.screen_time_target_minutes, _foodsLoggedToday: foods.length }
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

  async function handlePartialSave() {
    if (!user || !profile) return
    setSaving(true)
    const today = localDateISO()
    const isUpdateSameDay = profile.last_log_date === today
    const streakForCalc = isUpdateSameDay ? profile.current_streak : profile.current_streak

    const foods          = details.foods || []
    const logPayload     = { ...form, sleep_hours: Number(form.sleep_hours), screen_time_target_minutes: profile.screen_time_target_minutes, _foodsLoggedToday: foods.length }
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user || !profile) return
    setError('')
    setLoading(true)

    const today = localDateISO()
    const isUpdateSameDay = profile.last_log_date === today
    const streakUpdate = computeStreak(profile, today, isUpdateSameDay)

    if (streakUpdate.graceAvailable) {
      setLoading(false)
      setGracePrompt(streakUpdate.graceAvailable)
      return
    }

    await finalizeSubmit(streakUpdate)
  }

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
          <p className="section-title mb-1">Daily Check-in</p>
          <h1 className="text-xl font-extrabold text-slate-900">Your day so far</h1>
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
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#7c3aed] px-1 mb-3">
          <span>🛡️</span>
          <span>{profile.streak_shields} streak shield{profile.streak_shields > 1 ? 's' : ''} banked</span>
        </div>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 font-medium">
          {error}
        </div>
      )}

      <DailyScoreHero score={previewScores.future_self_score} deltaVsAvg={deltaVsAvg} />

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Nutrition ── */}
        <SectionCard pillar="nutrition" focusPillar={focusPillar}>
          <SectionHeader icon="🥗" title="Nutrition" score={nutritionPreview} isFocusPillar={focusPillar === 'nutrition'} />
          <p className="text-xs text-slate-500 font-medium mb-2">How did you eat today?</p>
          <QuickTierSelect
            options={NUTRITION_TIERS}
            value={activeNutritionTier}
            onSelect={applyTier}
          />
          <DetailToggle label="+ Add details" badge={0}>
            <ServingStepper label="Fruit"      emoji="🍎" value={form.fruit_servings}     onChange={(v) => updateField('fruit_servings', v)} />
            <ServingStepper label="Vegetables" emoji="🥬" value={form.vegetable_servings} onChange={(v) => updateField('vegetable_servings', v)} />
            <ServingStepper label="Protein"    emoji="🥩" value={form.protein_servings}   onChange={(v) => updateField('protein_servings', v)} />
            <ServingStepper label="Processed"  emoji="🍟" value={form.processed_servings} onChange={(v) => updateField('processed_servings', v)} />

            <DetailToggle label="+ Log a meal" badge={details.foods.length}>
              <div className="flex flex-wrap gap-2 mb-3">
                {MEAL_TRIGGERS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setActiveMeal(activeMeal === m.value ? null : m.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activeMeal === m.value ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {activeMeal && (
                <FoodDetailSection
                  foods={details.foods}
                  activeMeal={activeMeal}
                  onChange={(foods) => setDetails((d) => ({ ...d, foods }))}
                  onServingDetected={handleServingDetected}
                  onServingRemoved={handleServingRemoved}
                />
              )}
              {!activeMeal && details.foods.length > 0 && (
                <FoodDetailSection
                  foods={details.foods}
                  activeMeal={null}
                  onChange={(foods) => setDetails((d) => ({ ...d, foods }))}
                  onServingDetected={handleServingDetected}
                  onServingRemoved={handleServingRemoved}
                />
              )}
            </DetailToggle>
          </DetailToggle>
        </SectionCard>

        {/* ── Fitness ── */}
        <SectionCard pillar="fitness" focusPillar={focusPillar}>
          <SectionHeader icon="🏋️" title="Fitness" score={fitnessPreview} isFocusPillar={focusPillar === 'fitness'} />
          <p className="text-xs text-slate-500 font-medium mb-2">What did you do?</p>
          <QuickTierSelect
            options={FITNESS_TIERS}
            value={activeFitnessTier}
            onSelect={applyTier}
          />
          {activeFitnessTier && FITNESS_EXPAND_TIERS.has(activeFitnessTier) && (
            <div className="mt-4 pt-4 border-t border-slate-100/80 space-y-3 animate-fade-in">
              <button
                type="button"
                onClick={() => setShowWorkoutLib((v) => !v)}
                className="w-full text-left text-xs font-bold text-[#7c3aed] flex items-center gap-1"
              >
                🏃 {showWorkoutLib ? 'Hide' : 'Pick from library'} ▾
              </button>
              {showWorkoutLib && (
                <div>
                  <div className="flex gap-2 mb-2">
                    {['presets', 'saved'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setWorkoutLibTab(tab)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          workoutLibTab === tab ? 'text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                        style={workoutLibTab === tab ? { background: 'linear-gradient(135deg, #7c3aed, #00cdb4)' } : undefined}
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
                        className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-slate-50 border border-[rgba(109,40,217,0.10)] text-xs font-semibold text-slate-700 hover:bg-[#7c3aed]/5 hover:border-[#7c3aed]/30 transition-colors"
                      >
                        <span className="text-lg">{w.emoji}</span>
                        <span className="text-[10px] leading-tight text-center">{w.name}</span>
                        <span className="text-[9px] text-slate-400">{w.duration}min</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-500">Type</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {EXERCISE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField('exercise_type', type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
                        form.exercise_type === type ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Duration (minutes)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {[15, 30, 45, 60, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => updateField('workout_duration_min', d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        form.workout_duration_min === d ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {d === 90 ? '90+' : d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Intensity</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form.workout_intensity}
                  onChange={(e) => updateField('workout_intensity', Number(e.target.value))}
                  className="w-full mt-2"
                />
                <p className="text-sm font-bold text-[#7c3aed] tabular-nums">{form.workout_intensity}/10</p>
              </div>
              <DetailToggle label="Workout notes" badge={details.exercise.name || details.exercise.notes ? 1 : 0}>
                <TextField label="Activity" value={details.exercise.name} onChange={(v) => patchDetails('exercise', { name: v })} placeholder="Upper body, 5k…" />
                <TextField label="Notes"    value={details.exercise.notes} onChange={(v) => patchDetails('exercise', { notes: v })} multiline />
              </DetailToggle>
            </div>
          )}
        </SectionCard>

        {/* ── Sleep ── */}
        <SectionCard pillar="energy" focusPillar={focusPillar}>
          <SectionHeader icon="😴" title="Sleep" score={sleepPreview} isFocusPillar={focusPillar === 'energy'} />
          <QuickTierSelect
            options={SLEEP_HOUR_TIERS}
            value={Number(form.sleep_hours) >= 9 ? 9 : Number(form.sleep_hours)}
            onSelect={(opt) => updateField('sleep_hours', opt.value)}
          />
          <div className="mt-3">
            <QuickTierSelect
              options={SLEEP_QUALITY_TIERS}
              value={form.sleep_quality}
              onSelect={(opt) => updateField('sleep_quality', opt.value)}
            />
          </div>
          <DetailToggle label="+ Adjust exactly" badge={0}>
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
                <label className="label-text">Quality</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form.sleep_quality}
                  onChange={(e) => updateField('sleep_quality', Number(e.target.value))}
                  className="w-full mt-3"
                />
                <p className="text-sm font-bold text-[#7c3aed] tabular-nums">{form.sleep_quality}/10</p>
              </div>
            </div>
          </DetailToggle>
        </SectionCard>

        {/* ── Hydration ── */}
        <div className="rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💧</span>
              <span className="label-text mb-0">Hydration</span>
            </div>
            <p className="text-sm font-extrabold text-[#7c3aed] tabular-nums">{(form.water_ml / 1000).toFixed(1)}L</p>
          </div>
          <QuickTierSelect
            options={HYDRATION_TIERS}
            value={form.water_ml}
            onSelect={(opt) => updateField('water_ml', opt.value)}
          />
          <p className="text-sm mt-3 text-slate-400">{'🥛'.repeat(glasses) || '—'}</p>
        </div>

        {/* ── Focus ── */}
        <SectionCard pillar="focus" focusPillar={focusPillar}>
          <SectionHeader icon="🎯" title="Focus" score={focusPreview} isFocusPillar={focusPillar === 'focus'} />
          <p className="text-xs text-slate-500 font-medium mb-2">How much?</p>
          <QuickTierSelect
            options={FOCUS_TIERS}
            value={form.focus_minutes}
            onSelect={(opt) => updateField('focus_minutes', opt.value)}
          />
          <DetailToggle label="+ Add details" badge={details.focus.activity ? 1 : 0}>
            <p className="text-xs font-semibold text-slate-500 mb-2">What did you focus on?</p>
            <QuickTierSelect
              options={FOCUS_TOPIC_TIERS}
              value={details.focus.activity}
              onSelect={(opt) => patchDetails('focus', { activity: opt.value })}
            />
            <div className="mt-2">
              <TextField value={details.focus.activity} onChange={(v) => patchDetails('focus', { activity: v })} placeholder="Or describe it…" />
            </div>
          </DetailToggle>
        </SectionCard>

        {/* ── Mood ── */}
        <div className="rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-5">
          <label className="label-text">Mood</label>
          <div className="flex flex-wrap gap-1.5 justify-between">
            {MOOD_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleMoodChange(MOOD_VALUES[i])}
                className={`text-xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeMoodIndex === i ? 'bg-[#7c3aed]/10 ring-2 ring-[#7c3aed] scale-110' : 'opacity-50'
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

        {/* ── My Habits ── */}
        <MyHabitsSection />

        {/* ── Add more ── */}
        <div className="rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-5">
          <DetailToggle label="+ Add more" badge={0}>
            <div>
              <label className="label-text mb-2">📚 Reading</label>
              <QuickTierSelect
                options={READING_TIERS}
                value={form.reading_minutes}
                onSelect={(opt) => updateField('reading_minutes', opt.value)}
              />
              <DetailToggle label="Book / article" badge={details.reading.title ? 1 : 0}>
                <TextField label="Title" value={details.reading.title} onChange={(v) => patchDetails('reading', { title: v })} />
              </DetailToggle>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="label-text mb-2">🧘 Meditation</label>
              <QuickTierSelect
                options={MEDITATION_TIERS}
                value={form.meditation_minutes}
                onSelect={(opt) => updateField('meditation_minutes', opt.value)}
              />
              <DetailToggle label="Style" badge={details.meditation.style ? 1 : 0}>
                <SelectField label="Type" value={details.meditation.style} onChange={(v) => patchDetails('meditation', { style: v })} options={MEDITATION_STYLES} />
              </DetailToggle>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="label-text mb-2">📱 Screen time</label>
              <QuickTierSelect
                options={SCREEN_TIME_TIERS}
                value={form.screen_time_minutes}
                onSelect={(opt) => updateField('screen_time_minutes', opt.value)}
              />
            </div>
          </DetailToggle>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full text-lg py-4 rounded-2xl font-bold text-white transition-all hover:brightness-105 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
            boxShadow: '0 6px 22px rgba(124,58,237,0.32)',
          }}
        >
          {loading ? 'Saving…' : 'Lock in today 🔒'}
        </button>
      </form>
    </div>
  )
}