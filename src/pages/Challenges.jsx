import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import { CHALLENGES, CHALLENGE_CATEGORIES } from '../data/challenges'
import { localDateISO } from '../utils/date'
import Spinner from '../components/ui/Spinner'
import confetti from 'canvas-confetti'

const CATEGORY_LABELS = {
  all: 'All',
  streak: 'Streak',
  nutrition: 'Nutrition',
  fitness: 'Fitness',
  focus: 'Focus',
  sleep: 'Sleep',
}

// Shared branded card recipe, matching every other page
const cardClass = 'rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-transparent'

function daysLeft(startedAt, duration) {
  const start = new Date(startedAt)
  const end = new Date(start)
  end.setDate(end.getDate() + duration)
  const now = new Date()
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
}

function daysElapsed(startedAt) {
  const start = new Date(startedAt)
  const now = new Date()
  return Math.floor((now - start) / (1000 * 60 * 60 * 24))
}

export default function Challenges() {
  const { user, profile } = useUserStore()
  const [filter, setFilter] = useState('all')
  const [joined, setJoined] = useState({}) // { challenge_id: { started_at, completed } }
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])

  useEffect(() => {
    if (!user) return

    async function load() {
      const [challengesRes, logsRes] = await Promise.all([
        supabase
          .from('user_challenges')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('log_date', { ascending: false })
          .limit(60),
      ])

      const map = {}
      ;(challengesRes.data || []).forEach((c) => {
        map[c.challenge_id] = c
      })
      setJoined(map)
      setRecentLogs(logsRes.data || [])
      setLoading(false)
    }

    load()
  }, [user])

  async function handleJoin(challenge) {
    if (!user) return

    const { data, error } = await supabase
      .from('user_challenges')
      .insert({
        user_id: user.id,
        challenge_id: challenge.id,
        started_at: new Date().toISOString(),
        completed: false,
      })
      .select()
      .single()

    if (!error && data) {
      setJoined((prev) => ({ ...prev, [challenge.id]: data }))
    }
  }

  async function handleAbandon(challengeId) {
    if (!user) return
    await supabase
      .from('user_challenges')
      .delete()
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)

    setJoined((prev) => {
      const next = { ...prev }
      delete next[challengeId]
      return next
    })
  }

  async function checkAndComplete(challenge, entry) {
    if (!user || entry.completed || completing === challenge.id) return

    // Get logs since challenge start
    const startDate = localDateISO(new Date(entry.started_at))
    const challengeLogs = recentLogs.filter((l) => l.log_date >= startDate)

    if (!challenge.check(challengeLogs)) return

    setCompleting(challenge.id)

    // Mark complete + award XP
    await supabase
      .from('user_challenges')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('challenge_id', challenge.id)

    const newTotalXP = (profile?.total_xp || 0) + challenge.xpReward
    await supabase
      .from('users_profile')
      .update({ total_xp: newTotalXP })
      .eq('id', user.id)

    setJoined((prev) => ({
      ...prev,
      [challenge.id]: { ...prev[challenge.id], completed: true },
    }))

    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } })
    setCompleting(null)
  }

  // Auto-check completion for active challenges
  useEffect(() => {
    if (loading || !recentLogs.length) return
    CHALLENGES.forEach((challenge) => {
      const entry = joined[challenge.id]
      if (entry && !entry.completed) {
        checkAndComplete(challenge, entry)
      }
    })
  }, [joined, recentLogs, loading])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const filtered =
    filter === 'all' ? CHALLENGES : CHALLENGES.filter((c) => c.category === filter)

  const activeCount = Object.values(joined).filter((j) => !j.completed).length
  const completedCount = Object.values(joined).filter((j) => j.completed).length

  return (
    <div className="animate-slide-up pb-6 max-w-lg mx-auto">
      <header className="mb-4">
        <p className="section-title">Compete</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Challenges</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {activeCount} active · {completedCount} completed
        </p>
      </header>

      {/* Stats */}
      {(activeCount > 0 || completedCount > 0) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`${cardClass} p-4 text-center`}>
            <p className="text-2xl font-extrabold text-primary">{activeCount}</p>
            <p className="text-xs font-bold text-slate-400 uppercase mt-1">Active</p>
          </div>
          <div className={`${cardClass} p-4 text-center`}>
            <p className="text-2xl font-extrabold text-teal">{completedCount}</p>
            <p className="text-xs font-bold text-slate-400 uppercase mt-1">Completed</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CHALLENGE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`shrink-0 pill text-xs ${
              filter === cat
                ? 'text-white bg-[linear-gradient(135deg,#ff7ac6,#7c3aed,#00cdb4)]'
                : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Challenge cards */}
      <div className="space-y-3">
        {filtered.map((challenge) => {
          const entry = joined[challenge.id]
          const isJoined = Boolean(entry)
          const isCompleted = entry?.completed
          const isActive = isJoined && !isCompleted

          // Progress
          const startDate = entry ? localDateISO(new Date(entry.started_at)) : null
          const challengeLogs = startDate
            ? recentLogs.filter((l) => l.log_date >= startDate)
            : []
          const prog = isActive ? challenge.progress(challengeLogs) : null
          const pct = prog ? Math.min(100, Math.round((prog.current / prog.target) * 100)) : 0
          const remaining = entry ? daysLeft(entry.started_at, challenge.duration) : null

          return (
            <div
              key={challenge.id}
              className={[
                cardClass,
                'relative overflow-hidden p-4 transition-all',
                isCompleted ? 'ring-2 ring-teal/40' : '',
                isActive ? 'ring-2 ring-[#7c3aed]/30' : '',
              ].join(' ')}
            >
              {isCompleted && (
                <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] dark:hidden" />
              )}
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: `${challenge.color}20` }}
                >
                  {challenge.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-slate-900">{challenge.name}</p>
                    {isCompleted && (
                      <span className="pill bg-teal/10 text-teal text-[10px]">
                        ✓ Done
                      </span>
                    )}
                    {isActive && (
                      <span className="pill bg-[#7c3aed]/10 text-[#7c3aed] text-[10px]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                    {challenge.desc}
                  </p>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="pill bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px]">
                  ⏱ {challenge.duration} days
                </span>
                <span className="pill text-[10px]" style={{ background: `${challenge.color}15`, color: challenge.color }}>
                  +{challenge.xpReward} XP
                </span>
                <span className="pill bg-amber-50 dark:bg-amber/10 text-amber-700 dark:text-amber text-[10px]">
                  {challenge.badgeIcon} {challenge.badge} badge
                </span>
                {isActive && remaining !== null && (
                  <span className="pill bg-slate-100 dark:bg-white/10 text-slate-500 text-[10px]">
                    {remaining}d left
                  </span>
                )}
              </div>

              {/* Progress bar — active only */}
              {isActive && prog && (
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>Progress</span>
                    <span className="tabular-nums">{prog.current} / {prog.target}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: challenge.color }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{pct}% complete</p>
                </div>
              )}

              {/* Completed badge */}
              {isCompleted && (
                <div className="mb-3 flex items-center gap-2 bg-teal/10 rounded-2xl px-3 py-2">
                  <span className="text-lg">{challenge.badgeIcon}</span>
                  <div>
                    <p className="text-xs font-extrabold text-teal">{challenge.badge} badge earned!</p>
                    <p className="text-[10px] text-slate-500">+{challenge.xpReward} XP awarded</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!isJoined && (
                <button
                  type="button"
                  onClick={() => handleJoin(challenge)}
                  className="w-full !py-2.5 text-sm rounded-2xl font-semibold text-white transition-all bg-[linear-gradient(135deg,#ff7ac6,#7c3aed,#00cdb4)] shadow-[0_4px_14px_rgba(124,58,237,0.24)] dark:bg-[linear-gradient(135deg,#00E87A,#7F5AF0)] dark:shadow-none"
                >
                  Join challenge
                </button>
              )}
              {isActive && (
                <button
                  type="button"
                  onClick={() => handleAbandon(challenge.id)}
                  className="btn-secondary w-full !py-2 text-xs text-slate-400"
                >
                  Abandon
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
