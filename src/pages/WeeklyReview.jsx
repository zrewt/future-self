import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import Spinner from '../components/ui/Spinner'
import EmptyHome from '../components/home/EmptyHome'
import { localWeekStartISO } from '../utils/date'

export default function WeeklyReview() {
  const { user, profile } = useUserStore()
  const [loading, setLoading] = useState(true)
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
      .then(({ data }) => {
        setWeekLogs(data || [])
        setLoading(false)
      })
  }, [user])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

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

  const avg = (key) =>
    Math.round(weekLogs.reduce((s, l) => s + (l[key] || 0), 0) / weekLogs.length)

  const categories = [
    { key: 'fitness_score', label: 'Fitness' },
    { key: 'nutrition_score', label: 'Nutrition' },
    { key: 'energy_score', label: 'Energy' },
    { key: 'focus_score', label: 'Focus' },
    { key: 'longevity_score', label: 'Longevity' },
    { key: 'future_self_score', label: 'Future Self' },
  ]

  const ranked = categories
    .map((c) => ({ ...c, avg: avg(c.key) }))
    .sort((a, b) => b.avg - a.avg)

  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  const xpEarned = weekLogs.reduce((s, l) => s + (l.xp_earned || 0), 0)
  const habitRate = Math.round(
    (weekLogs.filter((l) => l.future_self_score >= 50).length / 7) * 100
  )
  const streakNow = profile?.current_streak ?? 0
  const streakDelta = weekLogs.length >= 2 ? (streakNow > 0 ? '+' : '') + streakNow : '—'

  return (
    <div className="space-y-4 animate-slide-up pb-6">
      <header>
        <p className="section-title">Insights</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Weekly review</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {weekLogs.length} day{weekLogs.length !== 1 ? 's' : ''} logged this week
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <p className="text-xs font-bold text-slate-400 uppercase">XP earned</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{xpEarned}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-bold text-slate-400 uppercase">Habit rate</p>
          <p className="text-2xl font-extrabold text-teal mt-1">{habitRate}%</p>
        </div>
        <div className="glass-card p-4 col-span-2">
          <p className="text-xs font-bold text-slate-400 uppercase">Avg Future Self</p>
          <p className="text-3xl font-extrabold text-primary mt-1">{avg('future_self_score')}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <p className="section-title mb-3">Category averages</p>
        <ul className="space-y-2">
          {ranked.map((c) => (
            <li key={c.key} className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 w-20">{c.label}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary/70 rounded-full" style={{ width: `${c.avg}%` }} />
              </div>
              <span className="text-sm font-bold tabular-nums w-8 text-right">{c.avg}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 border-teal/20 bg-teal/5">
          <p className="text-[10px] font-bold text-teal uppercase">Best</p>
          <p className="font-extrabold text-slate-900 mt-1">{best.label}</p>
          <p className="text-2xl font-bold text-teal">{best.avg}</p>
        </div>
        <div className="glass-card p-4 border-coral/20 bg-coral/5">
          <p className="text-[10px] font-bold text-coral uppercase">Grow next</p>
          <p className="font-extrabold text-slate-900 mt-1">{worst.label}</p>
          <p className="text-2xl font-bold text-coral">{worst.avg}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <p className="section-title mb-2">Streak</p>
        <p className="text-lg font-bold text-slate-800">
          Current streak: <span className="text-primary">{streakNow} days</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">Keep logging daily to maintain momentum.</p>
      </div>

      <Link to="/log" className="btn-primary w-full block text-center">
        Log today
      </Link>
    </div>
  )
}
