import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import Spinner from '../components/ui/Spinner'
import EmptyHome from '../components/home/EmptyHome'
import IntegrityCard from '../components/home/IntegrityCard'
import { localWeekStartISO } from '../utils/date'
import { computeIntegrityScore } from '../utils/integrity'

function generateInsights(logs, profile) {
  if (!logs.length) return []

  const insights = []

  const avg = (key) =>
    Math.round(logs.reduce((s, l) => s + (l[key] || 0), 0) / logs.length)

  const total = (key) =>
    logs.reduce((s, l) => s + (l[key] || 0), 0)

  const workoutDays = logs.filter(
    (l) => (l.workout_duration_min || 0) >= 20 || (l.exercise_type && l.exercise_type !== 'rest')
  ).length
  const totalWorkoutMins = total('workout_duration_min')
  const avgWorkoutMins = Math.round(totalWorkoutMins / Math.max(workoutDays, 1))

  if (workoutDays >= 5) {
    insights.push({ icon: '💪', tone: 'positive', text: `You trained ${workoutDays} out of 7 days this week — that's elite consistency.${avgWorkoutMins > 0 ? ` Averaging ${avgWorkoutMins} min per session.` : ''}` })
  } else if (workoutDays >= 3) {
    insights.push({ icon: '🏋️', tone: 'neutral', text: `${workoutDays} workout days this week. Solid base — adding one more session next week would push your fitness score noticeably higher.` })
  } else if (workoutDays > 0) {
    insights.push({ icon: '⚡', tone: 'improve', text: `Only ${workoutDays} workout day${workoutDays > 1 ? 's' : ''} logged. Even 20 min of movement on off days adds ~8 pts to your Future Self Score.` })
  } else {
    insights.push({ icon: '🛋️', tone: 'improve', text: `No workouts logged this week. A single 30-min session can shift your fitness score from 0 to 50+.` })
  }

  const avgSleep = logs.reduce((s, l) => s + Number(l.sleep_hours || 0), 0) / logs.length
  const avgSleepRounded = Math.round(avgSleep * 10) / 10
  const goodSleepDays = logs.filter((l) => Number(l.sleep_hours) >= 7.5).length
  const avgSleepQuality = avg('sleep_quality')

  if (avgSleep >= 7.5) {
    insights.push({ icon: '😴', tone: 'positive', text: `Great sleep week — averaging ${avgSleepRounded}h with quality at ${avgSleepQuality}/10.` })
  } else if (avgSleep >= 6.5) {
    insights.push({ icon: '🌙', tone: 'neutral', text: `Averaging ${avgSleepRounded}h sleep. Getting to 7.5h on ${7 - goodSleepDays} more nights would add ~6 pts to your energy score.` })
  } else {
    insights.push({ icon: '⚠️', tone: 'improve', text: `Sleep averaged only ${avgSleepRounded}h this week. Low sleep is dragging your energy and longevity scores.` })
  }

  const avgVeg       = avg('vegetable_servings')
  const avgFruit     = avg('fruit_servings')
  const avgProtein   = avg('protein_servings')
  const avgProcessed = avg('processed_servings')

  const weekendLogs  = logs.filter((l) => { const d = new Date(l.log_date).getDay(); return d === 0 || d === 6 })
  const weekdayLogs  = logs.filter((l) => { const d = new Date(l.log_date).getDay(); return d !== 0 && d !== 6 })
  const weekendNutAvg = weekendLogs.length ? Math.round(weekendLogs.reduce((s, l) => s + (l.nutrition_score || 0), 0) / weekendLogs.length) : null
  const weekdayNutAvg = weekdayLogs.length ? Math.round(weekdayLogs.reduce((s, l) => s + (l.nutrition_score || 0), 0) / weekdayLogs.length) : null

  if (weekendNutAvg !== null && weekdayNutAvg !== null && weekdayNutAvg - weekendNutAvg >= 10) {
    insights.push({ icon: '📉', tone: 'improve', text: `Nutrition drops on weekends — weekday avg ${weekdayNutAvg} vs weekend avg ${weekendNutAvg}. One prepped meal Saturday can close that gap.` })
  } else if (avgVeg < 3) {
    const projectedFSS = Math.min(99, avg('future_self_score') + Math.round((5 - avgVeg) * 2.5))
    insights.push({ icon: '🥬', tone: 'improve', text: `Averaging ${avgVeg} veg serving${avgVeg !== 1 ? 's' : ''} daily. Hitting 5 servings would push your projected Future Self Score to ~${projectedFSS}.` })
  } else if (avgProcessed >= 3) {
    insights.push({ icon: '🍟', tone: 'improve', text: `Processed food averaged ${avgProcessed} servings/day. Cutting to 1 would add roughly 7-10 pts to your nutrition score.` })
  } else {
    insights.push({ icon: '🥗', tone: 'positive', text: `Solid nutrition week — ${avgVeg} veg, ${avgFruit} fruit, ${avgProtein} protein servings on average.${avgProcessed <= 1 ? ' Low processed food too — excellent.' : ''}` })
  }

  const totalFocus    = total('focus_minutes')
  const totalReading  = total('reading_minutes')
  const avgFocusScore = avg('focus_score')

  if (totalFocus >= 300) {
    insights.push({ icon: '🧠', tone: 'positive', text: `${Math.round(totalFocus / 60)}h of deep work logged this week.${totalReading > 0 ? ` Plus ${totalReading} min reading.` : ''} Focus score averaged ${avgFocusScore}.` })
  } else if (totalFocus >= 120) {
    insights.push({ icon: '🎯', tone: 'neutral', text: `${totalFocus} min of focus logged. Hitting 300+ min next week would move your focus score above 70.` })
  } else if (totalFocus > 0) {
    insights.push({ icon: '🎯', tone: 'improve', text: `Only ${totalFocus} min of focused work this week. Even 45 min/day compounds significantly over months.` })
  }

  const avgWater     = Math.round(total('water_ml') / logs.length)
  const goodWaterDays = logs.filter((l) => (l.water_ml || 0) >= 2500).length

  if (avgWater < 1800) {
    insights.push({ icon: '💧', tone: 'improve', text: `Averaging ${Math.round(avgWater / 100) / 10}L water — below the 2.5L target.` })
  } else if (goodWaterDays >= 5) {
    insights.push({ icon: '💧', tone: 'positive', text: `Hit the 2.5L water target ${goodWaterDays} days this week. Consistently hydrated.` })
  }

  const streak = profile?.current_streak ?? 0
  if (streak >= 7) {
    insights.push({ icon: '🔥', tone: 'positive', text: `${streak}-day streak active. Multiplier at ${Math.round((0.7 + Math.min(streak, 100) / 100 * 0.3) * 100)}% of max.` })
  }

  const perfectDays = logs.filter((l) => l.is_perfect_day).length
  if (perfectDays >= 3) {
    insights.push({ icon: '⭐', tone: 'positive', text: `${perfectDays} perfect days this week. You're in a strong rhythm.` })
  }

  const pillars = [
    { key: 'fitness_score',   label: 'fitness',       avg: avg('fitness_score'),   goodThreshold: 65, fix: workoutDays < 5 ? `add ${5 - workoutDays} more workout session${5 - workoutDays > 1 ? 's' : ''}` : 'increase workout duration to 45+ min', gainPer10: 4.5 },
    { key: 'nutrition_score', label: 'nutrition',     avg: avg('nutrition_score'), goodThreshold: 65, fix: avgVeg < 4 ? `add ${4 - avgVeg} more veg serving${4 - avgVeg > 1 ? 's' : ''} daily` : 'cut processed food to 1 serving/day', gainPer10: 4.0 },
    { key: 'energy_score',    label: 'sleep & energy',avg: avg('energy_score'),    goodThreshold: 65, fix: avgSleep < 7.5 ? `sleep ${Math.round((7.5 - avgSleep) * 2) / 2}h more per night` : 'no screens before bed', gainPer10: 4.0 },
    { key: 'focus_score',     label: 'focus',         avg: avgFocusScore,          goodThreshold: 65, fix: totalFocus < 300 ? `log ${Math.ceil((300 - totalFocus) / 7)} more min of deep work daily` : 'add 10 min daily meditation', gainPer10: 3.0 },
    { key: 'longevity_score', label: 'longevity',     avg: avg('longevity_score'), goodThreshold: 65, fix: 'add anti-inflammatory foods like salmon, walnuts, or blueberries', gainPer10: 3.0 },
  ]

  const belowThreshold = pillars.filter((p) => p.avg < p.goodThreshold)
  const candidate = belowThreshold.length > 0
    ? belowThreshold.sort((a, b) => a.avg - b.avg)[0]
    : pillars.sort((a, b) => a.avg - b.avg)[0]

  const gap = 100 - candidate.avg
  if (gap >= 10) {
    const realisticImprovement = Math.round(gap * 0.30)
    const fssDelta = Math.round(realisticImprovement * candidate.gainPer10 / 10)
    const projectedFSS = Math.min(99, avg('future_self_score') + fssDelta)
    if (fssDelta >= 3) {
      insights.push({ icon: '📈', tone: 'projection', text: `Your weakest pillar is ${candidate.label} (avg ${candidate.avg}). If you ${candidate.fix}, your Future Self Score could reach ~${projectedFSS} within 30 days.` })
    }
  }

  return insights
}

const TONE_STYLES = {
  positive:   'bg-teal/5 border-teal/20',
  neutral:    'bg-slate-50 border-slate-200/60 dark:bg-white/5 dark:border-white/10',
  improve:    'bg-amber-50/60 border-amber-200/40 dark:bg-amber/5 dark:border-amber/20',
  projection: 'bg-primary/5 border-primary/20',
}

const TONE_LABEL = {
  positive:   { text: 'Win',         color: 'text-teal bg-teal/10' },
  neutral:    { text: 'Note',        color: 'text-slate-500 bg-slate-100 dark:bg-white/10' },
  improve:    { text: 'Opportunity', color: 'text-amber-700 bg-amber-100/80 dark:text-amber dark:bg-amber/10' },
  projection: { text: 'Projection',  color: 'text-primary bg-primary/10' },
}

// Shared branded card recipe, matching every other page
const cardClass = 'rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-transparent'

export default function WeeklyReview() {
  const { user, profile, recentLogs } = useUserStore()
  const [loading,  setLoading]  = useState(true)
  const [weekLogs, setWeekLogs] = useState([])

  useEffect(() => {
    if (!user) return
    const start = localWeekStartISO()
    supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('log_date', start)
      .order('log_date', { ascending: true })
      .then(({ data }) => { setWeekLogs(data || []); setLoading(false) })
  }, [user])

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>

  if (!weekLogs.length) {
    return (
      <div>
        <header className="mb-6">
          <p className="section-title">Insights</p>
          <h1 className="text-2xl font-extrabold text-slate-900">Weekly review</h1>
        </header>
        <EmptyHome />
      </div>
    )
  }

  const avg = (key) => Math.round(weekLogs.reduce((s, l) => s + (l[key] || 0), 0) / weekLogs.length)

  const categories = [
    { key: 'fitness_score',    label: 'Fitness'     },
    { key: 'nutrition_score',  label: 'Nutrition'   },
    { key: 'energy_score',     label: 'Energy'      },
    { key: 'focus_score',      label: 'Focus'       },
    { key: 'longevity_score',  label: 'Longevity'   },
    { key: 'future_self_score',label: 'Future Self' },
  ]

  const ranked      = categories.map((c) => ({ ...c, avg: avg(c.key) })).sort((a, b) => b.avg - a.avg)
  const best        = ranked[0]
  const worst       = ranked[ranked.length - 1]
  const xpEarned    = weekLogs.reduce((s, l) => s + (l.xp_earned || 0), 0)
  const perfectDays = weekLogs.filter((l) => l.is_perfect_day).length
  const streakNow   = profile?.current_streak ?? 0
  const avgFSS      = avg('future_self_score')
  const insights    = generateInsights(weekLogs, profile)
  const integrity   = computeIntegrityScore(recentLogs, profile)

  const tierColor = { high: 'text-teal', moderate: 'text-amber-600 dark:text-amber', low: 'text-coral' }

  return (
    <div className="space-y-4 animate-slide-up pb-6 max-w-lg mx-auto">
      <header>
        <p className="section-title">Insights</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Weekly review</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {weekLogs.length} day{weekLogs.length !== 1 ? 's' : ''} logged this week
        </p>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-bold text-slate-400 uppercase">Avg Future Self</p>
          <p className="text-3xl font-extrabold text-primary mt-1">{avgFSS}</p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-bold text-slate-400 uppercase">XP earned</p>
          <p className="text-3xl font-extrabold text-primary mt-1">{xpEarned}</p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-bold text-slate-400 uppercase">Perfect days</p>
          <p className="text-2xl font-extrabold text-teal mt-1">{perfectDays}</p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-bold text-slate-400 uppercase">Streak</p>
          <p className="text-2xl font-extrabold text-coral mt-1">{streakNow} 🔥</p>
        </div>
      </div>

      {/* Integrity + FSS summary row */}
      <div className={`relative overflow-hidden ${cardClass} p-4`}>
        <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] dark:hidden" />
        <div className="flex items-center justify-between">
          <div>
            <p className="section-title mb-1">This week's integrity</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-primary tabular-nums">FSS {avgFSS}</span>
              <span className="text-slate-400 text-sm font-medium">·</span>
              <span className={`text-lg font-extrabold tabular-nums ${tierColor[integrity.tier]}`}>
                {integrity.score}% integrity
              </span>
            </div>
          </div>
          <span className={`pill text-[10px] ${
            integrity.tier === 'high'
              ? 'bg-teal/10 text-teal'
              : integrity.tier === 'moderate'
              ? 'bg-amber-100/80 text-amber-700 dark:bg-amber/10 dark:text-amber'
              : 'bg-coral/10 text-coral'
          }`}>
            {integrity.label}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
          {integrity.tier === 'high'
            ? 'Your logs are consistent and realistic. High-confidence tracking leads to more accurate future projections.'
            : integrity.tier === 'moderate'
            ? 'Good tracking. Log more consistently and include imperfect days — that\'s what builds real confidence.'
            : 'Keep logging daily, including bad days. Honest tracking is what makes your Future Self Score meaningful.'}
        </p>
      </div>

      {/* Category bars */}
      <div className={`${cardClass} p-4`}>
        <p className="section-title mb-3">Category averages</p>
        <ul className="space-y-2">
          {ranked.map((c) => (
            <li key={c.key} className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 w-20">{c.label}</span>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${c.avg}%`, background: c.avg >= 70 ? '#00b8a0' : c.avg >= 50 ? '#7c3aed' : '#d97706' }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums w-8 text-right">{c.avg}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Best / worst */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`${cardClass} p-4 border-teal/20 bg-teal/5`}>
          <p className="text-[10px] font-bold text-teal uppercase">Strongest</p>
          <p className="font-extrabold text-slate-900 mt-1">{best.label}</p>
          <p className="text-2xl font-bold text-teal">{best.avg}</p>
        </div>
        <div className={`${cardClass} p-4 border-amber-200/40 bg-amber-50/40 dark:bg-amber/5 dark:border-amber/20`}>
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber uppercase">Focus next</p>
          <p className="font-extrabold text-slate-900 mt-1">{worst.label}</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber">{worst.avg}</p>
        </div>
      </div>

      {/* Insights */}
      <div>
        <p className="section-title mb-3">This week's breakdown</p>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className={`${cardClass} p-4 border ${TONE_STYLES[insight.tone]}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{insight.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-1.5 ${TONE_LABEL[insight.tone].color}`}>
                    {TONE_LABEL[insight.tone].text}
                  </span>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link
        to="/log"
        className="w-full block text-center py-3.5 rounded-2xl font-semibold text-white transition-all bg-[linear-gradient(135deg,#ff7ac6,#7c3aed,#00cdb4)] shadow-[0_4px_16px_rgba(124,58,237,0.26)] dark:bg-[linear-gradient(135deg,#00E87A,#7F5AF0)] dark:shadow-none"
      >
        Log today
      </Link>
    </div>
  )
}
