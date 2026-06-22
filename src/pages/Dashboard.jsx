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
import TrendChart from '../components/home/TrendChart'
import AskYourData from '../components/home/AskYourData'
import { evaluateQuests } from '../data/quests'
import { getLevelName } from '../utils/scoring'

// ── Helpers ───────────────────────────────────────────────────────────────────

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
      color: 'text-primary',
    }
  }

  const scores = [
    { label: 'Fitness',   value: log.fitness_score   ?? 0 },
    { label: 'Nutrition', value: log.nutrition_score  ?? 0 },
    { label: 'Energy',    value: log.energy_score     ?? 0 },
    { label: 'Focus',     value: log.focus_score      ?? 0 },
    { label: 'Longevity', value: log.longevity_score  ?? 0 },
  ]
  const sorted = [...scores].sort((a, b) => b.value - a.value)
  const best  = sorted[0]
  const worst = sorted[sorted.length - 1]
  const questText = questCount ? `${questsDone}/${questCount} quests` : ''

  if ((log.future_self_score ?? 0) >= 75) {
    return {
      label: 'High signal day',
      title: `${best.label} is carrying your future self.`,
      detail: `${questText ? questText + ' complete · ' : ''}Keep this rhythm and your projection starts to climb.`,
      color: 'text-teal',
    }
  }

  if (questsDone >= Math.ceil(questCount / 2)) {
    return {
      label: 'Momentum building',
      title: `${best.label} is your strongest lever today.`,
      detail: `${questText ? questText + ' · ' : ''}One more win can move the whole day up.`,
      color: 'text-primary',
    }
  }

  return {
    label: 'Next best move',
    title: `${worst.label} is your weakest pillar today.`,
    detail: `Even a small improvement there moves your overall score more than polishing what's already strong.`,
    color: 'text-coral',
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MidnightCountdown() {
  const [seconds, setSeconds] = useState(getSecondsUntilMidnight)

  useEffect(() => {
    const timer = setInterval(() => setSeconds(getSecondsUntilMidnight()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Resets in</p>
        <p className="text-lg font-extrabold tabular-nums text-slate-700 dark:text-slate-200 leading-none mt-0.5">
          {formatCountdown(seconds)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Today's log</p>
        <Link to="/log" className="text-xs font-bold text-primary">
          Edit →
        </Link>
      </div>
    </div>
  )
}

function ScoreRing({ score }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const scoreColor = score >= 70 ? '#2DD4BF' : score >= 45 ? '#7F77DD' : '#F87171'

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="currentColor"
          strokeWidth="6" className="text-slate-100 dark:text-white/10" />
        <circle cx="56" cy="56" r={radius} fill="none" stroke={scoreColor}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="text-center z-10">
        <p className="text-3xl font-extrabold tabular-nums leading-none"
          style={{ color: scoreColor }}>{score}</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">FSS</p>
      </div>
    </div>
  )
}

function PillarBar({ label, value, icon }) {
  const color = value >= 70 ? 'bg-teal' : value >= 45 ? 'bg-primary' : 'bg-coral'
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{icon}</p>
        <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200 tabular-nums">{value}</p>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function LogCTA({ todayLog }) {
  const hour = new Date().getHours()
  const isUrgent = !todayLog && hour >= 20

  if (!todayLog) {
    return (
      <div className={`rounded-2xl p-4 ${isUrgent ? 'bg-coral/10 border border-coral/20' : 'bg-primary/5 border border-primary/20'}`}>
        <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isUrgent ? 'text-coral' : 'text-primary'}`}>
          {isUrgent ? '⚡ Log before midnight' : '📋 Daily check-in'}
        </p>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          {isUrgent
            ? "Your streak resets at midnight — one quick log keeps it alive."
            : "Log today's habits to unlock your score, XP, and daily insights."
          }
        </p>
        <Link
          to="/log"
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white transition-all ${
            isUrgent ? 'bg-coral hover:bg-coral/90' : 'bg-primary hover:bg-primary/90 shadow-glow'
          }`}
        >
          {isUrgent ? 'Log now — save your streak 🔥' : 'Start today\'s log →'}
        </Link>
      </div>
    )
  }

  return null
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    profile,
    todayLog,
    recentScores,
    recentLogs,
    trendLogs,
    achievementEvents,
    userChallenges,
  } = useUserStore()

  if (!profile) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const isNewUser = recentScores.length === 0
  if (isNewUser) return <EmptyHome />

  const level    = profile.level
  const levelName = getLevelName(level)
  const initial  = (profile.username || '?')[0].toUpperCase()
  const log      = todayLog || {}
  const currentFSS = log.future_self_score ?? recentScores[0] ?? 0
  const quests   = evaluateQuests(todayLog)
  const habitsDone = quests.filter((q) => q.done).length
  const dailyEdge = getDailyEdge(todayLog, habitsDone, quests.length)

  const pillars = [
    { icon: '🥗', label: 'Nutrition', value: log.nutrition_score ?? 0 },
    { icon: '🏋️', label: 'Fitness',   value: log.fitness_score   ?? 0 },
    { icon: '💤', label: 'Sleep',     value: log.energy_score    ?? 0 },
    { icon: '🎯', label: 'Focus',     value: log.focus_score     ?? 0 },
    { icon: '🌿', label: 'Longevity', value: log.longevity_score ?? 0 },
  ]

  const allQuestsDone = habitsDone === quests.length && quests.length > 0

  return (
    <div className="space-y-3 animate-slide-up max-w-lg mx-auto">

      {/* ── Hero card ────────────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        {/* Top bar: profile + streak */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/10">
          <Link to="/profile" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-700 dark:from-teal dark:to-primary text-white flex items-center justify-center text-base font-bold shadow-sm shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                {profile.username}
              </p>
              <p className="text-[10px] font-bold text-primary">
                Lv.{level} · {levelName}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Streak</p>
              <div className="flex items-center gap-1 justify-end">
                <IconFlame className="w-4 h-4 text-coral" />
                <span className="text-base font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {profile.current_streak}
                </span>
              </div>
            </div>
            {(profile.streak_shields ?? 0) > 0 && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Shields</p>
                <p className="text-base font-extrabold tabular-nums text-primary">
                  🛡️ {profile.streak_shields}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Score ring + pillars */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <ScoreRing score={currentFSS} />
            <div className="flex-1 space-y-2 min-w-0">
              {pillars.map((p) => (
                <PillarBar key={p.label} {...p} />
              ))}
            </div>
          </div>

          {todayLog && (
            <div className="flex items-center gap-2 mt-3">
              {allQuestsDone ? (
                <div className="flex-1 flex items-center gap-2 py-2 px-3 rounded-xl bg-teal/10 border border-teal/20">
                  <span className="text-teal text-sm">✓</span>
                  <p className="text-xs font-bold text-teal">All {quests.length} quests complete today</p>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                  <div className="flex gap-0.5">
                    {quests.map((q, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${q.done ? 'bg-teal' : 'bg-slate-200 dark:bg-white/20'}`} />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-slate-500">{habitsDone}/{quests.length} quests</p>
                </div>
              )}
              <MidnightCountdown />
            </div>
          )}
        </div>

        {/* XP bar — full width at the bottom of the hero */}
        <div className="px-4 pb-4">
          <XPBar totalXP={profile.total_xp} level={level} />
        </div>
      </div>

      {/* ── Log CTA — only when not logged ─────────────────────────────── */}
      <LogCTA todayLog={todayLog} />

      {/* ── Daily insight ────────────────────────────────────────────────── */}
      {todayLog && (
        <div className="glass-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-extrabold uppercase tracking-wide mb-1 ${dailyEdge.color}`}>
                {dailyEdge.label}
              </p>
              <p className="font-extrabold text-slate-900 dark:text-white leading-snug text-sm">
                {dailyEdge.title}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                {dailyEdge.detail}
              </p>
            </div>
            <span className="pill bg-teal/10 text-teal text-[10px] shrink-0 mt-0.5">Live</span>
          </div>
        </div>
      )}

      {/* ── Engagement nudges ───────────────────────────────────────────── */}
      <EngagementHub
        profile={profile}
        todayLog={todayLog}
        recentScores={recentScores}
        recentLogs={recentLogs}
        userChallenges={userChallenges}
      />

      {/* ── Trend chart ─────────────────────────────────────────────────── */}
      <TrendChart
        trendLogs={trendLogs}
        achievementEvents={achievementEvents}
        userChallenges={userChallenges}
      />

      {/* ── Personal analysis preview ───────────────────────────────────── */}
      <AskYourData trendLogs={trendLogs} profile={profile} />

      {/* ── Score breakdown (only when logged) ──────────────────────────── */}
      {todayLog && (
        <ScoreBreakdown
          scores={{ ...log, mood: log.mood }}
          streakDays={profile.current_streak}
        />
      )}

      {/* ── Daily quests ────────────────────────────────────────────────── */}
      <DailyQuests todayLog={todayLog} />

      {/* ── Future projection ───────────────────────────────────────────── */}
      <FutureProjectionCard recentScores={recentScores} currentScore={currentFSS} />

      {/* ── Nav cards: weekly review + insights ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/weekly"
          className="glass-card p-4 hover:shadow-card-hover transition-shadow"
        >
          <span className="text-2xl block mb-2">📊</span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">This week</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
            Weekly review
          </p>
        </Link>
        <Link
          to="/insights"
          className="glass-card p-4 hover:shadow-card-hover transition-shadow"
        >
          <span className="text-2xl block mb-2">🔎</span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">Analysis</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
            Ask your data
          </p>
        </Link>
      </div>

    </div>
  )
}