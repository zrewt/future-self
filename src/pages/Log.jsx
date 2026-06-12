import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import DetailToggle from '../components/log/DetailToggle'
import FoodDetailSection from '../components/log/FoodDetailSection'
import ServingStepper from '../components/log/ServingStepper'
import { TextField, SelectField } from '../components/log/TextDetailFields'
import ScoreCard from '../components/home/ScoreCard'
import {
  buildAllScores,
  calcXP,
  getLevelFromXP,
  isPerfectDay,
  calcNutritionFromServings,
  calcFitnessFromWorkout,
} from '../utils/scoring'
import { checkAndAwardAchievements } from '../utils/achievementStats'
import { emptyLogDetails, parseLogDetails } from '../utils/logDetails'
import { localDateISO } from '../utils/date'
import {
  getCompletedQuestIds,
  newlyCompletedQuestIds,
  questXPForLog,
} from '../data/quests'

// ✅ NEW IMPORT
import { getHonestyBonus } from '../utils/integrity'

const EXERCISE_TYPES = ['gym', 'run', 'sport', 'yoga', 'rest']
const MOOD_EMOJIS = ['😞', '😟', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳', '🔥']
const MEDITATION_STYLES = [
  { value: 'breathwork', label: 'Breathwork' },
  { value: 'guided', label: 'Guided' },
  { value: 'silent', label: 'Silent' },
  { value: 'yoga', label: 'Yoga / stretch' },
  { value: 'other', label: 'Other' },
]

const defaultForm = {
  fruit_servings: 0,
  vegetable_servings: 0,
  protein_servings: 0,
  processed_servings: 0,
  exercise_type: 'rest',
  workout_duration_min: 0,
  sleep_hours: 7,
  sleep_quality: 5,
  water_ml: 1500,
  focus_minutes: 0,
  reading_minutes: 0,
  meditation_minutes: 0,
  mood: 5,
}

function computeStreak(profile, today, isUpdateSameDay) {
  if (isUpdateSameDay) {
    return {
      current_streak: profile.current_streak,
      longest_streak: profile.longest_streak,
      last_log_date: profile.last_log_date || today,
    }
  }
  const last = profile.last_log_date
  let streak = 1
  if (last) {
    const lastDate = new Date(`${last}T12:00:00`)
    const todayDate = new Date(`${today}T12:00:00`)
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) streak = (profile.current_streak || 0) + 1
    else if (diffDays === 0) streak = profile.current_streak || 1
    else streak = 1
  }
  return {
    current_streak: streak,
    longest_streak: Math.max(profile.longest_streak || 0, streak),
    last_log_date: today,
  }
}

export default function Log() {
  const navigate = useNavigate()
  const { user, profile, todayLog, earnedAchievements, loadUserData, setTodayLog, setProfile } =
    useUserStore()

  const [form, setForm] = useState(defaultForm)
  const [details, setDetails] = useState(emptyLogDetails)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const isUpdate = Boolean(todayLog)

  useEffect(() => {
    if (!todayLog) return
    setForm({
      fruit_servings: todayLog.fruit_servings ?? 0,
      vegetable_servings: todayLog.vegetable_servings ?? 0,
      protein_servings: todayLog.protein_servings ?? 0,
      processed_servings: todayLog.processed_servings ?? 0,
      exercise_type: todayLog.exercise_type ?? 'rest',
      workout_duration_min: todayLog.workout_duration_min ?? 0,
      sleep_hours: Number(todayLog.sleep_hours) || 7,
      sleep_quality: todayLog.sleep_quality ?? 5,
      water_ml: todayLog.water_ml ?? 1500,
      focus_minutes: todayLog.focus_minutes ?? 0,
      reading_minutes: todayLog.reading_minutes ?? 0,
      meditation_minutes: todayLog.meditation_minutes ?? 0,
      mood: todayLog.mood ?? 5,
    })
    setDetails(parseLogDetails(todayLog.log_details))
  }, [todayLog])

  const previewFoods = details.foods || []
  const previewLog = useMemo(() => ({ ...form, sleep_hours: Number(form.sleep_hours) }), [form])
  const previewScores = useMemo(
    () => buildAllScores(previewLog, profile?.current_streak || 0, previewFoods),
    [previewLog, profile?.current_streak, previewFoods]
  )
  const nutritionPreview = calcNutritionFromServings(previewLog, previewFoods)
  const fitnessPreview = calcFitnessFromWorkout(previewLog)

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function patchDetails(section, patch) {
    setDetails((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }))
  }

  const glasses = Math.min(8, Math.floor(form.water_ml / 250))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user || !profile) return

    setError('')
    setLoading(true)

    const today = localDateISO()
    const isUpdateSameDay = profile.last_log_date === today

    const streakForCalc = isUpdateSameDay
      ? profile.current_streak
      : computeStreak(profile, today, false).current_streak

    const logPayload = { ...form, sleep_hours: Number(form.sleep_hours) }
    const foods = details.foods || []

    const scores = buildAllScores(logPayload, streakForCalc, foods)
    const is_perfect_day = isPerfectDay(logPayload)

    const prevQuests = getCompletedQuestIds(todayLog)
    const newQuestIds = newlyCompletedQuestIds(logPayload, prevQuests)
    const allQuestIds = [...new Set([...prevQuests, ...newQuestIds])]
    const questXP = questXPForLog(logPayload, prevQuests)

    const mergedDetails = { ...details, quests_completed: allQuestIds }

    const xp_earned = calcXP({ ...logPayload, is_perfect_day }, streakForCalc, questXP)

    const row = {
      user_id: user.id,
      log_date: today,
      fruit_servings: form.fruit_servings,
      vegetable_servings: form.vegetable_servings,
      protein_servings: form.protein_servings,
      processed_servings: form.processed_servings,
      meal_quality: scores.nutrition_score,
      exercise_intensity: scores.fitness_score,
      exercise_type: form.exercise_type,
      workout_duration_min: form.workout_duration_min,
      sleep_hours: Number(form.sleep_hours),
      sleep_quality: form.sleep_quality,
      water_ml: form.water_ml,
      focus_minutes: form.focus_minutes,
      reading_minutes: form.reading_minutes,
      meditation_minutes: form.meditation_minutes,
      mood: form.mood,
      log_details: mergedDetails,
      ...scores,
      xp_earned,
      is_perfect_day,
    }

    const { error: logError } = await supabase.from('daily_logs').upsert(row, {
      onConflict: 'user_id,log_date',
    })

    if (logError) {
      setLoading(false)
      setError(logError.message)
      return
    }

    const streakUpdate = computeStreak(profile, today, isUpdateSameDay)
    const previousXP = todayLog?.xp_earned || 0

    let newTotalXP = profile.total_xp - previousXP + xp_earned

    const { bonusXP } = await checkAndAwardAchievements(
      user.id,
      { ...profile, ...streakUpdate, level: getLevelFromXP(newTotalXP) },
      earnedAchievements
    )

    newTotalXP += bonusXP

    // ✅ HONESTY BONUS (NEW)
    const honestyBonus = getHonestyBonus({ ...row, ...scores })
    const honestyXP = honestyBonus?.xp ?? 0
    const honestyMessage = honestyBonus?.message ?? null

    newTotalXP += honestyXP

    const newLevel = getLevelFromXP(newTotalXP)

    await supabase
      .from('users_profile')
      .update({ total_xp: newTotalXP, level: newLevel, ...streakUpdate })
      .eq('id', user.id)

    const updatedProfile = {
      ...profile,
      total_xp: newTotalXP,
      level: newLevel,
      ...streakUpdate,
    }

    setProfile(updatedProfile)
    setTodayLog({ ...row, id: todayLog?.id })
    await loadUserData(user.id)

    setLoading(false)

    // ✅ UPDATED SUCCESS STATE
    setSuccess({
      xp: xp_earned + bonusXP + honestyXP,
      savedLog: row,
      honestyMessage,
    })

    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
  }

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────────
  if (success !== null) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-slide-up">
        <div className="glass-card p-10 text-center">
          <p className="text-4xl mb-2">🔒</p>
          <p className="text-2xl font-extrabold text-slate-900">Locked in!</p>
          <p className="text-xl font-bold text-primary mt-2">+{success.xp} XP</p>

          {success.honestyMessage && (
            <p className="mt-3 text-sm font-semibold text-teal-600 bg-teal-50 rounded-2xl px-4 py-2">
              🎯 {success.honestyMessage}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="btn-secondary w-full max-w-sm mt-6"
        >
          Back to dashboard →
        </button>
      </div>
    )
  }

  // ── FORM ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto pb-8 animate-slide-up">
      {/* (UNCHANGED FORM CONTENT — SAME AS BEFORE) */}
      {/* ... keep your existing JSX exactly as-is ... */}
    </div>
  )
}