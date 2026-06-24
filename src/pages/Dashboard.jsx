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

// Returns avg FSS for the best 7-day window in recentScores
function getBestWeekAvg(recentScores) {
  if (!recentScores || recentScores.length < 7) return null
  let best = 0
  for (let i = 0; i <= recentScores.length - 7; i++) {
    const slice = recentScores.slice(i, i + 7)
    const avg = slice.reduce((a, b) => a + b, 0) / 7
    if (avg > best) best = avg
  }
  return Math.round(best)
}

// Returns avg FSS for the last 7 days
function getCurrentWeekAvg(recentScores) {
  if (!recentScores || recentScores.length === 0) return null
  const slice = recentScores.slice(0, Math.min(7, recentScores.length))
  return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length)
}

// Pillar config — maps focus_pillar string to display info + which score key to read
const PILLAR_CONFIG = {
  fitness: {
    label: 'Fitness',
    icon: '🏃',
    scoreKey: 'fitness_score',
    tips: ['Log a workout today', 'Even 20 min counts', 'Consistency beats intensity'],
    color: 'text-primary',
    bg: 'bg-primary/5 border-primary/20',
  },
  nutrition: {
    label: 'Nutrition',
    icon: '🥗',
    scoreKey: 'nutrition_score',
    tips: ['Add one more veg serving', 'Hit your protein goal', 'Cut one processed item'],
    color: 'text-teal',
    bg: 'bg-teal/5 border-teal/20',
  },
  energy: {
    label: 'Sleep & Energy',
    icon: '💤',
    scoreKey: 'energy_score',
    tips: ['Aim for 7.5+ hours', 'Log your sleep quality', 'Hydration affects energy too'],
    color: 'text-coral',
    bg: 'bg-coral/5 border-coral/20',
  },
  focus: {
    label: 'Focus',
    icon: '🎯',
    scoreKey: 'focus_score',
    tips: ['Log deep work time', '25 min sessions count', 'Reading boosts focus score'],
    color: 'text-primary',
    bg: 'bg-primary/5 border-primary/20',
  },
  longevity: {
    label: 'Longevity',
    icon: '🌿',
    scoreKey: 'longevity_score',
    tips: ['Sleep + nutrition compound', 'Hydration is key', 'Log meditation time'],
    color: 'text-teal',
    bg: 'bg-teal/5 border-teal/20',
  },
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
  const best   = sorted[0]
  const worst  = sorted[sorted.length - 1]
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
    <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Resets in</p>
        <p className="text-lg font-extrabold tabular-nums text-slate-700 leading-none mt-0.5">
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
          strokeWidth="6" className="text-slate-100" />
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

function PillarBar({ label, value, icon, highlight }) {
  const color = value >= 70 ? 'bg-teal' : value >= 45 ? 'bg-primary' : 'bg-coral'
  return (
    <div className={`flex-1 min-w-0 rounded-lg px-1 py-0.5 ${highlight ? 'ring-1 ring-primary/40 bg-primary/5' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{icon}</p>
        <p className="text-[10px] font-extrabold text-slate-700 tabular-nums">{value}</p>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ── Focus Pillar Card — shown when user has a focus_pillar set ────────────────
function FocusPillarCard({ pillar, todayLog }) {
  const config = PILLAR_CONFIG[pillar]
  if (!config) return null

  const score = todayLog?.[config.scoreKey] ?? null
  const tip   = config.tips[Math.floor(Math.random() * config.tips.length)]

  return (
    <div className={`glass-card p-4 border ${config.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-wide ${config.color}`}>
              Your focus
            </p>
            <p className="text-sm font-extrabold text-slate-900">{config.label}</p>
          </div>
        </div>
        {score !== null ? (
          <div className="text-right">
            <p className="text-2xl font-extrabold tabular-nums text-slate-900">{score}</p>
            <p className="text-[10px] font-bold text-slate-400">today</p>
          </div>
        ) : (
          <Link to="/log" className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl">
            Log now →
          </Link>
        )}
      </div>
      <p className="text-xs text-slate-500 font-medium">
        💡 {todayLog ? tip : `Log today to see your ${config.label.toLowerCase()} score`}
      </p>
      {score !== null && score < 50 && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-[11px] font-bold text-coral">
            Below target — {tip}
          </p>
        </div>
      )}
      {score !== null && score >= 70 && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className={`text-[11px] font-bold ${config.color}`}>
            ✓ Strong day for your focus pillar
          </p>
        </div>
      )}
    </div>
  )
}

// ── vs Best Week card ─────────────────────────────────────────────────────────
function WeekPaceCard({ recentScores, currentFSS }) {
  const bestWeek   = getBestWeekAvg(recentScores)
  const currentWeek = getCurrentWeekAvg(recentScores)

  if (!bestWeek || !currentWeek) return null

  const diff   = currentWeek - bestWeek
  const onPace = diff >= -3
  const ahead  = diff > 3

  return (
    <div className={`rounded-2xl px-4 py-3 flex items-center justify-between border ${
      ahead
        ? 'bg-teal/5 border-teal/20'
        : onPace
        ? 'bg-primary/5 border-primary/20'
        : 'bg-slate-50 border-slate-100'
    }`}>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-0.5">
          vs your best week
        </p>
        <p className={`text-sm font-extrabold ${ahead ? 'text-teal' : onPace ? 'text-primary' : 'text-slate-600'}`}>
          {ahead
            ? `🔥 ${diff}pts ahead of your best pace`
            : onPace
            ? `✓ On pace with your best week`
            : `📉 ${Math.abs(diff)}pts below your best week pace`
          }
        </p>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className="text-[10px] font-bold text-slate-400">Best avg</p>
        <p className="text-lg font-extrabold tabular-nums text-slate-700">{bestWeek}</p>
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
        <p className="text-sm font-semibold text-slate-700 mb-3">
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
          {isUrgent ? 'Log now — save your streak 🔥' : "Start today's log →"}
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

  const level      = profile.level
  const levelName  = getLevelName(level)
  const initial    = (profile.username || '?')[0].toUpperCase()
  const log        = todayLog || {}
  const currentFSS = log.future_self_score ?? recentScores[0] ?? 0
  const quests     = evaluateQuests(todayLog)
  const habitsDone = quests.filter((q) => q.done).length
  const dailyEdge  = getDailyEdge(todayLog, habitsDone, quests.length)
  const focusPillar = profile.focus_pillar || null

  // Which pillar bar to highlight based on user's focus
  const focusScoreKey = focusPillar ? PILLAR_CONFIG[focusPillar]?.scoreKey : null

  const pillars = [
    { icon: '🥗', label: 'Nutrition', value: log.nutrition_score ?? 0, scoreKey: 'nutrition_score' },
    { icon: '🏋️', label: 'Fitness',   value: log.fitness_score   ?? 0, scoreKey: 'fitness_score'   },
    { icon: '💤', label: 'Sleep',     value: log.energy_score    ?? 0, scoreKey: 'energy_score'    },
    { icon: '🎯', label: 'Focus',     value: log.focus_score     ?? 0, scoreKey: 'focus_score'     },
    { icon: '🌿', label: 'Longevity', value: log.longevity_score ?? 0, scoreKey: 'longevity_score' },
  ]

  const allQuestsDone = habitsDone === quests.length && quests.length > 0

  return (
    <div className="space-y-3 animate-slide-up max-w-lg mx-auto">

      {/* ── Hero card ────────────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
          <Link to="/profile" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-700 text-white flex items-center justify-center text-base font-bold shadow-sm shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 text-sm truncate">
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
                <span className="text-base font-extrabold tabular-nums text-slate-900">
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

        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <ScoreRing score={currentFSS} />
            <div className="flex-1 space-y-2 min-w-0">
              {pillars.map((p) => (
                <PillarBar
                  key={p.label}
                  {...p}
                  highlight={focusScoreKey === p.scoreKey}
                />
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
                <div className="flex-1 flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex gap-0.5">
                    {quests.map((q, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${q.done ? 'bg-teal' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-slate-500">{habitsDone}/{quests.length} quests</p>
                </div>
              )}
              <MidnightCountdown />
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <XPBar totalXP={profile.total_xp} level={level} />
        </div>
      </div>

      {/* ── vs Best Week ─────────────────────────────────────────────────── */}
      {recentScores.length >= 7 && (
        <WeekPaceCard recentScores={recentScores} currentFSS={currentFSS} />
      )}

      {/* ── Log CTA — only when not logged ──────────────────────────────── */}
      <LogCTA todayLog={todayLog} />

      {/* ── Focus pillar card ────────────────────────────────────────────── */}
      {focusPillar && (
        <FocusPillarCard pillar={focusPillar} todayLog={todayLog} />
      )}

      {/* ── Daily insight ────────────────────────────────────────────────── */}
      {todayLog && (
        <div className="glass-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-extrabold uppercase tracking-wide mb-1 ${dailyEdge.color}`}>
                {dailyEdge.label}
              </p>
              <p className="font-extrabold text-slate-900 leading-snug text-sm">
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

      {/* ── Nav cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/weekly" className="glass-card p-4 hover:shadow-card-hover transition-shadow">
          <span className="text-2xl block mb-2">📊</span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">This week</p>
          <p className="text-sm font-extrabold text-slate-900 leading-snug">Weekly review</p>
        </Link>
        <Link to="/insights" className="glass-card p-4 hover:shadow-card-hover transition-shadow">
          <span className="text-2xl block mb-2">🔎</span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">Analysis</p>
          <p className="text-sm font-extrabold text-slate-900 leading-snug">Ask your data</p>
        </Link>
      </div>

    </div>
  )
}
