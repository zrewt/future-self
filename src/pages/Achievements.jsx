import { useEffect, useState } from 'react'
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../data/achievements'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import { fetchAchievementStats } from '../utils/achievementStats'
import Spinner from '../components/ui/Spinner'

const TIER_STYLES = {
  bronze: 'bg-gradient-to-r from-amber-100 to-orange-50 text-amber-800 border-amber-200/60',
  silver: 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border-slate-200/60',
  gold: 'bg-gradient-to-r from-yellow-100 to-amber-50 text-yellow-800 border-yellow-200/60',
  legendary: 'bg-gradient-to-r from-primary-100 to-purple-50 text-primary-800 border-primary-200/60',
}

const CATEGORY_LABELS = {
  streak: 'Streaks',
  sleep: 'Sleep',
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  reading: 'Reading',
  focus: 'Focus',
  longevity: 'Longevity',
  xp: 'XP & levels',
}

export default function Achievements() {
  const { user, earnedAchievements } = useUserStore()
  const [earnedDetails, setEarnedDetails] = useState({})
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      const [{ data }, s] = await Promise.all([
        supabase.from('achievements').select('achievement_key, earned_at').eq('user_id', user.id),
        fetchAchievementStats(user.id, useUserStore.getState().profile),
      ])

      const map = {}
      ;(data || []).forEach((a) => {
        map[a.achievement_key] = a.earned_at
      })
      setEarnedDetails(map)
      setStats(s)
      setLoading(false)
    }

    load()
  }, [user, earnedAchievements])

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const earnedCount = ACHIEVEMENTS.filter(
    (a) => earnedAchievements.includes(a.key) || earnedDetails[a.key]
  ).length

  const filtered =
    filter === 'all' ? ACHIEVEMENTS : ACHIEVEMENTS.filter((a) => a.category === filter)

  return (
    <div className="animate-slide-up pb-6">
      <header className="mb-4">
        <p className="section-title">Trophies</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Achievements</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {earnedCount} / {ACHIEVEMENTS.length} unlocked
        </p>
        <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-400 rounded-full"
            style={{ width: `${(earnedCount / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`shrink-0 pill text-xs ${filter === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          All
        </button>
        {ACHIEVEMENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`shrink-0 pill text-xs ${filter === cat ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((ach) => {
          const earned = earnedAchievements.includes(ach.key) || earnedDetails[ach.key]
          const earnedAt = earnedDetails[ach.key]
          const prog = ach.progress ? ach.progress(stats) : null
          const pct = prog ? Math.min(100, Math.round((prog.current / prog.target) * 100)) : 0

          return (
            <div
              key={ach.key}
              className={[
                'rounded-3xl p-4 transition-all',
                earned ? 'glass-card ring-2 ring-primary/30' : 'bg-slate-100/70 border border-slate-200/50',
              ].join(' ')}
            >
              <div className="flex gap-3">
                <span className={`text-3xl ${!earned && 'grayscale opacity-60'}`}>{ach.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{ach.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ach.desc}</p>
                  <span className={`inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${TIER_STYLES[ach.tier]}`}>
                    {ach.tier} · +{ach.xp} XP
                  </span>
                </div>
                {!earned && <span className="text-sm opacity-50">🔒</span>}
              </div>
              {!earned && prog && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>Progress</span>
                    <span className="tabular-nums">
                      {prog.current} / {prog.target}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
              {earned && earnedAt && (
                <p className="text-[10px] text-teal font-semibold mt-2">
                  Earned {new Date(earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
