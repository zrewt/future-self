import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useUserStore } from '../store/useUserStore'
import XPBar from '../components/XPBar'
import Spinner from '../components/ui/Spinner'
import { IconFlame } from '../components/ui/Icons'
import FutureProjectionCard from '../components/home/FutureProjectionCard'
import DailyQuests from '../components/home/DailyQuests'
import ScoreBreakdown from '../components/home/ScoreBreakdown'
import EmptyHome from '../components/home/EmptyHome'
import EngagementHub from '../components/home/EngagementHub'
import { evaluateQuests } from '../data/quests'
import { getLevelName } from '../utils/scoring'

function getSecondsUntilMidnight() {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0)
  return Math.floor((midnight - now) / 1000)
}

function formatCountdown(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getDailyEdge(log, questsDone, questCount) {
  if (!log?.future_self_score && log?.future_self_score !== 0) {
    return {
      label: 'Ready state',
      title: 'Your next version starts with one log.',
      detail: 'Lock in the basics today and the app will turn them into a clear score.',
    }
  }

  const scores = [
    { label: 'Fitness', value: log.fitness_score ?? 0 },
    { label: 'Nutrition', value: log.nutrition_score ?? 0 },
    { label: 'Energy', value: log.energy_score ?? 0 },
    { label: 'Focus', value: log.focus_score ?? 0 },
    { label: 'Longevity', value: log.longevity_score ?? 0 },
  ]
  const best = scores.sort((a, b) => b.value - a.value)[0]
  const questText = questCount ? `${questsDone}/${questCount} quests complete` : 'Quests ready'

  if ((log.future_self_score ?? 0) >= 75) {
    return {
      label: 'High signal day',
      title: `${best.label} is carrying your future self.`,
      detail: `${questText}. Keep this rhythm and your projection starts to climb.`,
    }
  }

  if (questsDone >= Math.ceil(questCount / 2)) {
    return {
      label: 'Momentum building',
      title: `${best.label} is your strongest lever today.`,
      detail: `${questText}. One more small win can move the whole day up.`,
    }
  }

  return {
    label: 'Next best move',
    title: `Use ${best.label.toLowerCase()} as your anchor.`,
    detail: `${questText}. Pick the easiest quest and turn the day around.`,
  }
}

function MidnightCountdown() {
  const [seconds, setSeconds] = useState(getSecondsUntilMidnight)

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(getSecondsUntilMidnight())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="glass-card p-3 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase">Next log unlocks in</p>
        <p className="text-xl font-extrabold tabular-nums text-primary">{formatCountdown(seconds)}</p>
      </div>
      <span className="text-2xl">🕛</span>
    </div>
  )
}

export default function Dashboard() {
  const { profile, todayLog, recentScores, recentLogs, userChallenges } = useUserStore()

  if (!profile) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const isNewUser = recentScores.length === 0
  if (isNewUser) return <EmptyHome />

  const level = profile.level
  const levelName = getLevelName(level)
  const initial = (profile.username || '?')[0].toUpperCase()
  const log = todayLog || {}
  const currentFSS = log.future_self_score ?? recentScores[0] ?? 0
  const quests = evaluateQuests(todayLog)
  const habitsDone = quests.filter((q) => q.done).length
  const dailyEdge = getDailyEdge(todayLog, habitsDone, quests.length)

  return (
    <div className="space-y-3 animate-slide-up max-w-lg mx-auto">
      {/* Above-the-fold hero */}
      <div className="glass-card p-4 bg-gradient-to-br from-primary/10 via-white to-white dark:from-teal/10 dark:via-slate-950/40 dark:to-primary/10">
        <div className="flex items-start justify-between gap-3">
          <Link to="/profile" className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-700 dark:from-teal dark:to-primary text-white flex items-center justify-center text-lg font-bold shadow-md">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 truncate">{profile.username}</p>
              <p className="text-xs font-bold text-primary">
                Lv.{level} · {levelName}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/80 border border-surface-border shadow-sm">
            <IconFlame className="w-5 h-5 text-coral" />
            <span className="text-lg font-extrabold tabular-nums">{profile.current_streak}</span>
          </div>
        </div>
        <div className="mt-3">
          <XPBar totalXP={profile.total_xp} level={level} />
        </div>
        <div className="flex gap-2 mt-3">
          <div className="metric-tile bg-primary/10">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Future Self</p>
            <p className="text-2xl font-extrabold text-primary tabular-nums">{currentFSS}</p>
          </div>
          <div className="metric-tile">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Quests</p>
            <p className="text-2xl font-extrabold text-slate-800 tabular-nums">
              {habitsDone}/{quests.length}
            </p>
          </div>
        </div>
      </div>

      <EngagementHub
        profile={profile}
        todayLog={todayLog}
        recentScores={recentScores}
        recentLogs={recentLogs}
        userChallenges={userChallenges}
      />

      <div className="edge-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-title mb-1">{dailyEdge.label}</p>
            <p className="font-extrabold text-slate-900 leading-snug">{dailyEdge.title}</p>
          </div>
          <span className="pill bg-teal/10 text-teal text-[10px] shrink-0">Live</span>
        </div>
        <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">{dailyEdge.detail}</p>
      </div>

      {!todayLog ? (
        <Link to="/log" className="btn-primary w-full text-center shadow-glow py-4">
          Log today to earn XP →
        </Link>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2 py-2 rounded-2xl bg-teal/10 border border-teal/20 text-sm font-semibold text-teal">
            ✓ Logged today
            <Link to="/log" className="text-primary underline ml-1">
              Edit
            </Link>
          </div>
          <MidnightCountdown />
        </>
      )}

      <FutureProjectionCard recentScores={recentScores} currentScore={currentFSS} />

      {todayLog && (
        <ScoreBreakdown scores={{ ...log, mood: log.mood }} streakDays={profile.current_streak} />
      )}

      <DailyQuests todayLog={todayLog} />

      <Link
        to="/weekly"
        className="glass-card p-4 flex items-center justify-between hover:shadow-card-hover transition-shadow block"
      >
        <div>
          <p className="section-title">This week</p>
          <p className="font-bold text-slate-900">View weekly review →</p>
        </div>
        <span className="text-2xl">📊</span>
      </Link>
    </div>
  )
}