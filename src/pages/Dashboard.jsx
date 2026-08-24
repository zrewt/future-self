import { Link } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { useTheme } from '../hooks/useTheme'
import XPBar from '../components/XPBar'
import Spinner from '../components/ui/Spinner'
import { IconFlame } from '../components/ui/Icons'
import EmptyHome from '../components/home/EmptyHome'
import TrendChart from '../components/home/TrendChart'
import WhatIfSimulator from '../components/home/WhatIfSimulator'
import FutureProjection from '../components/home/FutureProjection'
import { evaluateQuests } from '../data/quests'
import { getLevelName } from '../utils/scoring'
import { getPathConfig } from '../data/paths'
import { calcCurrentSmoothedFSS, calcMomentum } from '../utils/trends'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getCurrentWeekAvg(recentScores) {
  if (!recentScores || recentScores.length === 0) return null
  const slice = recentScores.slice(0, Math.min(7, recentScores.length))
  return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length)
}

const PILLAR_COLORS = {
  nutrition_score: { bar: 'bg-[#00b8a0]',  text: 'text-[#00a591]',  ring: '#00b8a0' },
  fitness_score:   { bar: 'bg-[#7c3aed]',  text: 'text-[#7c3aed]',  ring: '#7c3aed' },
  energy_score:    { bar: 'bg-[#3b82c4]',  text: 'text-[#3b82c4]',  ring: '#3b82c4' },
  focus_score:     { bar: 'bg-[#d97706]',  text: 'text-[#d97706]',  ring: '#d97706' },
  longevity_score: { bar: 'bg-[#e0527a]',  text: 'text-[#e0527a]',  ring: '#e0527a' },
}

const PILLAR_CONFIG = {
  fitness: {
    label: 'Fitness', icon: '🏃', scoreKey: 'fitness_score',
    tips: ['Log a workout today', 'Even 20 min counts', 'Consistency beats intensity'],
  },
  nutrition: {
    label: 'Nutrition', icon: '🥗', scoreKey: 'nutrition_score',
    tips: ['Add one more veg serving', 'Hit your protein goal', 'Cut one processed item'],
  },
  energy: {
    label: 'Sleep & Energy', icon: '💤', scoreKey: 'energy_score',
    tips: ['Aim for 7.5+ hours', 'Log your sleep quality', 'Hydration affects energy too'],
  },
  focus: {
    label: 'Focus', icon: '🎯', scoreKey: 'focus_score',
    tips: ['Log deep work time', '25 min sessions count', 'Reading boosts focus score'],
  },
  longevity: {
    label: 'Longevity', icon: '🌿', scoreKey: 'longevity_score',
    tips: ['Sleep + nutrition compound', 'Hydration is key', 'Log meditation time'],
  },
}

const PILLAR_RING_LIST = [
  { icon: '🥗', label: 'Nutrition', scoreKey: 'nutrition_score' },
  { icon: '🏋️', label: 'Fitness',   scoreKey: 'fitness_score'   },
  { icon: '💤', label: 'Sleep',     scoreKey: 'energy_score'    },
  { icon: '🎯', label: 'Focus',     scoreKey: 'focus_score'     },
  { icon: '🌿', label: 'Longevity', scoreKey: 'longevity_score' },
]

function getDailyEdge(log, questsDone, questCount) {
  if (!log?.future_self_score && log?.future_self_score !== 0) {
    return { label: 'Ready state', title: 'Your next version starts with one log.', detail: 'Lock in the basics today and the app will turn them into a clear score.', type: 'neutral' }
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
    return { label: 'High signal day', title: `${best.label} is carrying your future self.`, detail: `${questText ? questText + ' complete · ' : ''}Keep this rhythm and your projection starts to climb.`, type: 'good' }
  }
  if (questsDone >= Math.ceil(questCount / 2)) {
    return { label: 'Momentum building', title: `${best.label} is your strongest lever today.`, detail: `${questText ? questText + ' · ' : ''}One more win can move the whole day up.`, type: 'neutral' }
  }
  return { label: 'Next best move', title: `${worst.label} is your weakest pillar today.`, detail: `Even a small improvement there moves your overall score more than polishing what's already strong.`, type: 'attention' }
}

// Picks the pillar that drove a given day's score highest — used in the
// Recent Days list so each row has a quick "what carried this day" icon.
function bestPillarForLog(log) {
  let best = null
  let bestVal = -1
  for (const p of PILLAR_RING_LIST) {
    const v = log[p.scoreKey] ?? 0
    if (v > bestVal) { bestVal = v; best = p }
  }
  return best
}

function formatShortDate(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

// NEW — large, minimal hero ring. Lighter chrome than the old ScoreRing:
// thinner stroke, no card border around it, meant to sit as the single
// dominant element on the page (Cal-AI-style "one big number" hero).
function HeroRing({ score, size = 168 }) {
  const { theme } = useTheme()
  const radius = (size - 14) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  const scoreColor = theme === 'dark'
    ? score >= 70 ? '#00E8C6' : score >= 45 ? '#FFB830' : '#FF7AC6'
    : score >= 70 ? '#00cdb4' : score >= 45 ? '#7c3aed' : '#e0527a'

  const trackColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(109,40,217,0.07)'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="heroScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff7ac6" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#00cdb4" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={theme === 'dark' ? scoreColor : 'url(#heroScoreGradient)'}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 10px ${scoreColor}66)` }}
        />
      </svg>
      <div className="text-center z-10">
        <p className="text-5xl font-extrabold tabular-nums leading-none" style={{ color: scoreColor }}>{score}</p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-[#5A7050] uppercase tracking-wide mt-1">Future Self</p>
      </div>
    </div>
  )
}

// NEW — small ring stat, Cal-AI-style, replacing the horizontal pillar bars.
function MiniRing({ icon, label, value, color, highlight }) {
  const size = 52
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (value / 100) * circumference

  return (
    <div className={`flex flex-col items-center gap-1 rounded-2xl px-1.5 py-2 transition-all ${highlight ? 'bg-[#7c3aed]/5 dark:bg-[#00E8C6]/5' : ''}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="absolute inset-0 -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(109,40,217,0.08)" strokeWidth="4" className="dark:stroke-white/8" />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.7s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm">{icon}</div>
      </div>
      <p className="text-[10px] font-extrabold tabular-nums text-slate-700 dark:text-[#E8F0E0]">{value}</p>
      <p className="text-[8px] font-bold text-slate-400 dark:text-[#5A7050] uppercase tracking-wide leading-none">{label}</p>
    </div>
  )
}

// NEW — small circular badge for streak/level, Cal-AI-style compact top stats.
function StatBadge({ icon, value, color }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/8 px-2.5 py-1.5">
      <span style={{ color }}>{icon}</span>
      <span className="text-xs font-extrabold tabular-nums text-slate-700 dark:text-[#E8F0E0]">{value}</span>
    </div>
  )
}

// NEW — Recent Days list, Cal-AI "recently uploaded" analog.
function RecentDaysList({ recentLogs }) {
  const days = (recentLogs || []).slice(0, 6)
  if (!days.length) return null

  return (
    <div className="rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-4">
      <p className="text-sm font-bold text-slate-800 dark:text-[#E8F0E0] mb-3">Recent days</p>
      <div className="space-y-1.5">
        {days.map((log) => {
          const best = bestPillarForLog(log)
          const colors = best ? PILLAR_COLORS[best.scoreKey] : null
          return (
            <div key={log.log_date} className="flex items-center gap-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] px-3 py-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                style={{ background: colors ? `${colors.ring}1A` : 'rgba(109,40,217,0.08)' }}
              >
                {best?.icon || '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-[#E8F0E0]">{formatShortDate(log.log_date)}</p>
                <p className="text-[10px] text-slate-400 dark:text-[#5A7050] font-medium">
                  {best ? `${best.label} carried this day` : 'Logged'}
                </p>
              </div>
              <p className={`text-sm font-extrabold tabular-nums shrink-0 ${colors ? colors.text : 'text-slate-500'}`}>
                {log.future_self_score ?? '—'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FocusPillarCard({ pillar, todayLog }) {
  const config = PILLAR_CONFIG[pillar]
  if (!config) return null
  const colors = PILLAR_COLORS[config.scoreKey]
  const score = todayLog?.[config.scoreKey] ?? null
  const tip = config.tips[Math.floor(Math.random() * config.tips.length)]

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-4">
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] dark:hidden" />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-wide ${colors.text}`}>Your focus</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">{config.label}</p>
          </div>
        </div>
        {score !== null ? (
          <div className="text-right">
            <p className={`text-2xl font-extrabold tabular-nums ${colors.text}`}>{score}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-[#5A7050]">today</p>
          </div>
        ) : (
          <Link to="/log" className="text-xs font-bold text-[#7c3aed] dark:text-[#00E87A] bg-[#7c3aed]/10 dark:bg-[#00E87A]/10 px-3 py-1.5 rounded-xl">
            Log now →
          </Link>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-[#5A7050] font-medium">
        💡 {todayLog ? tip : `Log today to see your ${config.label.toLowerCase()} score`}
      </p>
      {score !== null && score < 50 && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/8">
          <p className="text-[11px] font-bold text-[#e0527a]">Below target — {tip}</p>
        </div>
      )}
      {score !== null && score >= 70 && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/8">
          <p className={`text-[11px] font-bold ${colors.text}`}>✓ Strong day for your focus pillar</p>
        </div>
      )}
    </div>
  )
}

function WeekPaceCard({ recentScores }) {
  const bestWeek = getBestWeekAvg(recentScores)
  const currentWeek = getCurrentWeekAvg(recentScores)
  if (!bestWeek || !currentWeek) return null
  const diff = currentWeek - bestWeek
  const ahead = diff > 3
  const onPace = diff >= -3

  return (
    <div className={`rounded-2xl px-4 py-3 flex items-center justify-between border ${
      ahead   ? 'bg-[#00cdb4]/[0.06] dark:bg-[#141220] border-[#00cdb4]/25 dark:border-[#3B3560]'
      : onPace ? 'bg-[#7c3aed]/[0.05] dark:bg-[#141220] border-[#7c3aed]/20 dark:border-[#29263B]'
              : 'bg-slate-50 dark:bg-[#141220] border-slate-200 dark:border-[#29263B]'
    }`}>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-[#5A7050] mb-0.5">
          vs your best week
        </p>
        <p className={`text-sm font-extrabold ${
          ahead   ? 'text-[#00a591]'
          : onPace ? 'text-[#7c3aed] dark:text-[#00E8C6]'
                  : 'text-slate-500 dark:text-[#9DB890]'
        }`}>
          {ahead
            ? `🔥 ${diff}pts ahead of your best pace`
            : onPace ? `✓ On pace with your best week`
            : `📉 ${Math.abs(diff)}pts below your best week pace`}
        </p>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className="text-[10px] font-bold text-slate-400 dark:text-[#5A7050]">Best avg</p>
        <p className="text-lg font-extrabold tabular-nums text-slate-700 dark:text-[#E8F0E0]">{bestWeek}</p>
      </div>
    </div>
  )
}

function DailyVsFutureCard({ dailyScore, momentum }) {
  if (dailyScore == null) return null
  return (
    <div className="rounded-2xl px-4 py-3 flex items-center justify-between border bg-slate-50 dark:bg-[#141220] border-slate-200 dark:border-[#29263B]">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-[#5A7050] mb-0.5">
          Today's Daily Score
        </p>
        <p className="text-lg font-extrabold tabular-nums text-slate-700 dark:text-[#E8F0E0]">{dailyScore}</p>
      </div>
      {momentum != null && (
        <div className="text-right shrink-0 ml-3">
          <p className="text-[10px] font-bold text-slate-400 dark:text-[#5A7050]">Momentum</p>
          <p className={`text-sm font-extrabold tabular-nums ${momentum.delta >= 0 ? 'text-[#00a591]' : 'text-[#e0527a]'}`}>
            {momentum.delta >= 0 ? '+' : ''}{momentum.delta} this month
          </p>
        </div>
      )}
    </div>
  )
}

function LogCTA({ todayLog }) {
  const hour = new Date().getHours()
  const isUrgent = !todayLog && hour >= 20
  if (todayLog) return null
  return (
    <div className={`rounded-2xl p-4 border ${
      isUrgent
        ? 'bg-[#e0527a]/[0.06] border-[#e0527a]/20'
        : 'bg-[#7c3aed]/[0.05] dark:bg-[#7F5AF0]/10 border-[#7c3aed]/15 dark:border-[#7F5AF0]/25'
    }`}>
      <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${
        isUrgent ? 'text-[#e0527a]' : 'text-[#7c3aed] dark:text-green'
      }`}>
        {isUrgent ? '⚡ Log before midnight' : '📋 Daily check-in'}
      </p>
      <p className="text-sm font-medium text-slate-700 dark:text-[#B8C9AF] mb-3">
        {isUrgent
          ? 'Your streak resets at midnight — one quick log keeps it alive.'
          : "Log today's habits to unlock your score, XP, and daily insights."}
      </p>
      <Link
        to="/log"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:brightness-105"
        style={{
          background: isUrgent
            ? '#e0527a'
            : 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
          boxShadow: isUrgent
            ? '0 4px 14px rgba(224,82,122,0.3)'
            : '0 4px 18px rgba(124,58,237,0.28)',
        }}
      >
        {isUrgent ? 'Log now — save your streak 🔥' : "Start today's log →"}
      </Link>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    profile, todayLog, recentScores, recentLogs, projectionLogs,
    trendLogs, achievementEvents, userChallenges,
  } = useUserStore()

  if (!profile) {
    return <div className="flex justify-center py-24"><Spinner /></div>
  }

  const isNewUser = recentScores.length === 0
  if (isNewUser) return <EmptyHome />

  const level      = profile.level
  const levelName  = getLevelName(level)
  const log        = todayLog || {}

  const dailyScore  = log.future_self_score ?? recentScores[0] ?? null
  const smoothedFSS = calcCurrentSmoothedFSS(trendLogs) ?? dailyScore ?? 0
  const momentum    = calcMomentum(trendLogs)

  const quests     = evaluateQuests(todayLog)
  const habitsDone = quests.filter((q) => q.done).length
  const dailyEdge  = getDailyEdge(todayLog, habitsDone, quests.length)
  const focusPillar = profile.focus_pillar || null
  const focusScoreKey = focusPillar ? PILLAR_CONFIG[focusPillar]?.scoreKey : null
  const allQuestsDone = habitsDone === quests.length && quests.length > 0
  const pathConfig = getPathConfig(profile.avatar_class)

  const insightColors = {
    good:      'text-[#00a591] dark:text-[#00E8C6]',
    neutral:   'text-[#7c3aed] dark:text-[#C4B5FD]',
    attention: 'text-[#e0527a]',
  }

  return (
    <div className="space-y-5 animate-slide-up max-w-2xl mx-auto">

      <p className="px-1 text-sm font-semibold text-slate-500 dark:text-[#9DB890]">
        {profile.username}, {pathConfig.tone.greetingPrefix}
      </p>

      {/* ── Hero card — restyled Cal-AI-style: one big centered number,
           minimal chrome, small stat badges instead of a dense header row ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_6px_24px_rgba(109,40,217,0.08)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] px-5 pt-4 pb-5">
        <div className="absolute top-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] dark:hidden" />

        <div className="flex items-center justify-between mb-2">
          <Link to="/profile" className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-[#5A7050]">
            Lv.{level} · {levelName}
          </Link>
          <div className="flex items-center gap-2">
            <StatBadge icon={<IconFlame className="w-3.5 h-3.5" />} value={profile.current_streak} color="#FFB830" />
            {(profile.streak_shields ?? 0) > 0 && (
              <StatBadge icon="🛡️" value={profile.streak_shields} color="#7c3aed" />
            )}
          </div>
        </div>

        <div className="flex justify-center py-2">
          <HeroRing score={smoothedFSS} />
        </div>

        <div className="grid grid-cols-5 gap-1 mt-3">
          {PILLAR_RING_LIST.map((p) => (
            <MiniRing
              key={p.scoreKey}
              icon={p.icon}
              label={p.label}
              value={log[p.scoreKey] ?? 0}
              color={PILLAR_COLORS[p.scoreKey].ring}
              highlight={focusScoreKey === p.scoreKey}
            />
          ))}
        </div>

        {todayLog && (
          <div className="flex items-center gap-3 mt-4 rounded-xl bg-slate-50/80 dark:bg-[#141220] border border-slate-200 dark:border-[#29263B] px-3 py-2.5">
            {allQuestsDone ? (
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[#00a591] dark:text-[#00E8C6] text-sm">✓</span>
                <p className="text-xs font-bold text-[#00a591] dark:text-[#00E8C6]">Daily checklist complete</p>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {quests.map((q, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${q.done ? 'bg-[#00b8a0] dark:bg-[#00E8C6]' : 'bg-slate-200 dark:bg-white/15'}`} />
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-[#9DB890]">{habitsDone} of {quests.length} daily actions complete</p>
              </div>
            )}
            <Link to="/log" className="text-xs font-bold text-[#7c3aed] dark:text-green shrink-0">Edit log</Link>
          </div>
        )}

        <div className="mt-4">
          <XPBar totalXP={profile.total_xp} level={level} />
        </div>
      </div>

      {/* ── Daily Score / Momentum ── */}
      <DailyVsFutureCard dailyScore={dailyScore} momentum={momentum} />

      {/* ── Recent days — Cal-AI "recently uploaded" analog ── */}
      <RecentDaysList recentLogs={recentLogs} />

      {focusPillar && (
        <FocusPillarCard pillar={focusPillar} todayLog={todayLog} />
      )}

      {recentScores.length >= 7 && <WeekPaceCard recentScores={recentScores} />}

      <LogCTA todayLog={todayLog} />

      {todayLog && (
        <div className="rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed] dark:text-[#00E87A] mb-1">Today&apos;s focus</p>
              <p className={`text-[10px] font-extrabold uppercase tracking-wide mb-1 ${insightColors[dailyEdge.type]}`}>
                {dailyEdge.label}
              </p>
              <p className="font-extrabold text-slate-900 dark:text-[#E8F0E0] leading-snug text-sm">
                {dailyEdge.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-[#5A7050] font-medium mt-1.5 leading-relaxed">
                {dailyEdge.detail}
              </p>
            </div>
          </div>
        </div>
      )}

      <WhatIfSimulator recentLogs={recentLogs} streakDays={profile.current_streak} />

      <FutureProjection
        projectionLogs={projectionLogs}
        currentFSS={smoothedFSS}
        currentStreak={profile.current_streak}
      />

      <TrendChart
        trendLogs={trendLogs}
        achievementEvents={achievementEvents}
        userChallenges={userChallenges}
      />

      <section className="rounded-3xl border border-[rgba(109,40,217,0.10)] bg-white p-4 shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:border-[#29263B] dark:bg-[#141220]">
        <div className="mb-3">
          <p className="text-sm font-bold text-slate-800 dark:text-[#E8F0E0]">Explore your progress</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-[#9DB890]">Review patterns and turn your recent activity into useful next steps.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/weekly" className="group rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition-colors hover:border-[#7c3aed]/30 hover:bg-[#7c3aed]/5 dark:border-[#302D45] dark:bg-[#11101C] dark:hover:border-[#4A4270] dark:hover:bg-[#1B1929]">
            <p className="text-xs font-bold text-slate-800 dark:text-[#E8F0E0]">Weekly review</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-[#9DB890]">Your week at a glance <span className="transition-transform group-hover:translate-x-0.5 inline-block">→</span></p>
          </Link>
          <Link to="/insights" className="group rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition-colors hover:border-[#7c3aed]/30 hover:bg-[#7c3aed]/5 dark:border-[#302D45] dark:bg-[#11101C] dark:hover:border-[#4A4270] dark:hover:bg-[#1B1929]">
            <p className="text-xs font-bold text-slate-800 dark:text-[#E8F0E0]">Data insights</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-[#9DB890]">What your logs show <span className="transition-transform group-hover:translate-x-0.5 inline-block">→</span></p>
          </Link>
        </div>
      </section>
    </div>
  )
}