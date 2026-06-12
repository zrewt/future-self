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
  const [success, setSuccess] = useState(null) // { xp, savedLog }

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
    const newLevel = getLevelFromXP(newTotalXP)

    await supabase
      .from('users_profile')
      .update({ total_xp: newTotalXP, level: newLevel, ...streakUpdate })
      .eq('id', user.id)

    const updatedProfile = { ...profile, total_xp: newTotalXP, level: newLevel, ...streakUpdate }
    setProfile(updatedProfile)
    setTodayLog({ ...row, id: todayLog?.id })
    await loadUserData(user.id)

    setLoading(false)
    setSuccess({ xp: xp_earned + bonusXP, savedLog: row })
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
  }

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────────
  if (success !== null) {
    return (
      <div className="max-w-lg mx-auto pb-8 animate-slide-up space-y-4">
        <div className="glass-card p-5 text-center">
          <p className="text-4xl mb-2">🔒</p>
          <p className="text-2xl font-extrabold text-slate-900">Locked in!</p>
          <p className="text-xl font-bold text-primary mt-1">+{success.xp} XP</p>
        </div>

        <div>
          <p className="section-title mb-2 px-1">Your score card</p>
          <ScoreCard
            profile={profile}
            log={success.savedLog}
            streak={profile?.current_streak ?? 0}
          />
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="btn-secondary w-full"
        >
          Back to dashboard →
        </button>
      </div>
    )
  }

  // ── FORM ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto pb-8 animate-slide-up">
      <header className="mb-4">
        <p className="section-title mb-1">Daily check-in</p>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {isUpdate ? "Update today's log" : 'Log today'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">Scores auto-calculate from your inputs</p>
      </header>

      <div className="glass-card p-3 mb-4 flex justify-between text-center text-xs">
        {[
          { l: 'Nutrition', v: nutritionPreview },
          { l: 'Fitness', v: fitnessPreview },
          { l: 'Future Self', v: previewScores.future_self_score },
        ].map((s) => (
          <div key={s.l}>
            <p className="text-slate-400 font-bold uppercase">{s.l}</p>
            <p className="text-lg font-extrabold text-primary tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="glass-card p-5">
          <label className="label-text">Nutrition — today's servings</label>
          <ServingStepper label="Fruit" emoji="🍎" value={form.fruit_servings} onChange={(v) => updateField('fruit_servings', v)} />
          <ServingStepper label="Vegetables" emoji="🥬" value={form.vegetable_servings} onChange={(v) => updateField('vegetable_servings', v)} />
          <ServingStepper label="Protein" emoji="🥩" value={form.protein_servings} onChange={(v) => updateField('protein_servings', v)} />
          <ServingStepper label="Processed" emoji="🍟" value={form.processed_servings} onChange={(v) => updateField('processed_servings', v)} />

          <DetailToggle label="Search specific foods" badge={details.foods.length}>
            <FoodDetailSection
              foods={details.foods}
              onChange={(foods) => setDetails((d) => ({ ...d, foods }))}
              onServingDetected={(key) =>
                setForm((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
              }
              onServingRemoved={(key) =>
                setForm((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - 1) }))
              }
            />
          </DetailToggle>
        </div>

        <div className="glass-card p-5">
          <label className="label-text">Workout</label>
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
            min={0}
            max={300}
            value={form.workout_duration_min}
            onChange={(e) => updateField('workout_duration_min', Number(e.target.value))}
            className="input-field mt-1"
          />
          <p className="text-xs text-primary font-bold mt-2">Fitness score: {fitnessPreview}</p>
          <DetailToggle label="Workout notes" badge={details.exercise.name || details.exercise.notes ? 1 : 0}>
            <TextField label="Activity" value={details.exercise.name} onChange={(v) => patchDetails('exercise', { name: v })} placeholder="Upper body, 5k…" />
            <TextField label="Notes" value={details.exercise.notes} onChange={(v) => patchDetails('exercise', { notes: v })} multiline />
          </DetailToggle>
        </div>

        <div className="glass-card p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Hours slept</label>
              <input type="number" step={0.5} min={0} max={14} value={form.sleep_hours} onChange={(e) => updateField('sleep_hours', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-text">Sleep quality</label>
              <input type="range" min={1} max={10} value={form.sleep_quality} onChange={(e) => updateField('sleep_quality', Number(e.target.value))} className="w-full mt-3" />
              <p className="text-sm font-bold text-primary tabular-nums">{form.sleep_quality}/10</p>
            </div>
          </div>
          <p className="text-xs text-primary font-bold mt-2">Energy score: {previewScores.energy_score}</p>
        </div>

        <div className="glass-card p-5">
          <label className="label-text">Water</label>
          <input type="range" min={0} max={4000} step={100} value={form.water_ml} onChange={(e) => updateField('water_ml', Number(e.target.value))} className="w-full" />
          <div className="flex flex-wrap gap-2 mt-2">
            {[500, 1000, 1500, 2000, 2500, 3000].map((ml) => (
              <button key={ml} type="button" onClick={() => updateField('water_ml', ml)} className={`text-xs font-semibold px-2 py-1 rounded-lg ${form.water_ml === ml ? 'bg-primary text-white' : 'bg-slate-100'}`}>
                {ml / 1000}L
              </button>
            ))}
          </div>
          <p className="text-sm mt-2">{'🥛'.repeat(glasses) || '—'} · {form.water_ml} ml</p>
        </div>

        <div className="glass-card p-5">
          <label className="label-text">Focus (min)</label>
          <input type="number" min={0} value={form.focus_minutes} onChange={(e) => updateField('focus_minutes', Number(e.target.value))} className="input-field" />
          <DetailToggle label="What you worked on" badge={details.focus.activity ? 1 : 0}>
            <TextField value={details.focus.activity} onChange={(v) => patchDetails('focus', { activity: v })} placeholder="Project, study topic…" />
          </DetailToggle>
        </div>

        <div className="glass-card p-5">
          <label className="label-text">Reading (min)</label>
          <input type="number" min={0} value={form.reading_minutes} onChange={(e) => updateField('reading_minutes', Number(e.target.value))} className="input-field" />
          <DetailToggle label="Book / article" badge={details.reading.title ? 1 : 0}>
            <TextField label="Title" value={details.reading.title} onChange={(v) => patchDetails('reading', { title: v })} />
          </DetailToggle>
        </div>

        <div className="glass-card p-5">
          <label className="label-text">Meditation (min)</label>
          <input type="number" min={0} value={form.meditation_minutes} onChange={(e) => updateField('meditation_minutes', Number(e.target.value))} className="input-field" />
          <DetailToggle label="Style" badge={details.meditation.style ? 1 : 0}>
            <SelectField label="Type" value={details.meditation.style} onChange={(v) => patchDetails('meditation', { style: v })} options={MEDITATION_STYLES} />
          </DetailToggle>
        </div>

        <div className="glass-card p-5">
          <label className="label-text">Mood</label>
          <div className="flex flex-wrap gap-1.5 justify-between">
            {MOOD_EMOJIS.map((emoji, i) => (
              <button key={i + 1} type="button" onClick={() => updateField('mood', i + 1)} className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center ${form.mood === i + 1 ? 'bg-primary-50 ring-2 ring-primary' : 'opacity-50'}`}>
                {emoji}
              </button>
            ))}
          </div>
          <DetailToggle label="Reflection" badge={details.mood.note ? 1 : 0}>
            <TextField value={details.mood.note} onChange={(v) => patchDetails('mood', { note: v })} multiline placeholder="How today felt…" />
          </DetailToggle>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4 shadow-glow">
          {loading ? 'Saving…' : 'Lock in today 🔒'}
        </button>
      </form>
    </div>
  )
}