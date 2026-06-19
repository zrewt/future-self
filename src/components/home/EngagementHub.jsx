import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import confetti from 'canvas-confetti'
import ScoreCard from './ScoreCard'
import { recommendChallenge } from '../../utils/challengeRecommend'
import { daysSinceLastActive } from '../../utils/streakShield'

const DISMISS_PREFIX = 'qyven_dismiss_'
const DISMISS_DAYS = 7

function isDismissed(key) {
  try {
    const until = Number(localStorage.getItem(DISMISS_PREFIX + key) || 0)
    return Date.now() < until
  } catch {
    return false
  }
}

function dismiss(key, days = DISMISS_DAYS) {
  try {
    localStorage.setItem(DISMISS_PREFIX + key, String(Date.now() + days * 86400000))
  } catch {
    // ignore
  }
}

export default function EngagementHub({ profile, todayLog, recentScores, recentLogs, userChallenges }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [, setDismissTick] = useState(0)

  const streak = profile?.current_streak ?? 0
  const longestStreak = profile?.longest_streak ?? 0
  const shields = profile?.streak_shields ?? 0
  const hour = new Date().getHours()
  const daysAway = daysSinceLastActive(profile?.last_active_date)

  const score = todayLog?.future_self_score
  const allTimeBest = recentScores?.length ? Math.max(...recentScores) : 0
  const isPersonalBest =
    score != null && score > 0 && score >= allTimeBest && (recentScores?.length ?? 0) >= 3

  const active = (userChallenges || []).filter((c) => !c.completed)
  const completedIds = (userChallenges || []).filter((c) => c.completed).map((c) => c.challenge_id)

  // ── Re-engagement (highest priority — only fires on actual return) ─────────
  let reengagement = null
  if (daysAway >= 3 && !todayLog) {
    if (daysAway >= 14) {
      reengagement = {
        key: 'reengage_14',
        icon: '👋',
        label: 'Welcome back',
        title: "It's been a while — your data's all still here",
        detail: `Your best streak was ${longestStreak} days. No pressure to match it today — just pick back up.`,
      }
    } else if (daysAway >= 7) {
      reengagement = {
        key: 'reengage_7',
        icon: '🌱',
        label: 'We miss you',
        title: "A week away — let's ease back in",
        detail: 'One log today resets your momentum. Your Future Self is still rooting for you.',
      }
    } else {
      reengagement = {
        key: 'reengage_3',
        icon: '⏳',
        label: 'A few days gone',
        title: 'Quick check-in?',
        detail: "Even a partial log keeps things warm. Today's a good day to jump back in.",
      }
    }
  }

  // ── Primary nudge: comeback / streak-risk / personal best ──────────────────
  let primary = null

  if (reengagement) {
    primary = reengagement
    primary.action = (
      <Link to="/log" className="btn-primary w-full !py-2.5 text-sm text-center">
        Log today
      </Link>
    )
  } else if (isPersonalBest) {
    primary = {
      key: 'personal_best',
      icon: '🏆',
      label: 'New personal best',
      title: `${score} is your highest Future Self Score yet`,
      detail: "Worth capturing — share today's card and show off the progress.",
      action: (
        <button
          type="button"
          className="btn-primary w-full !py-2.5 text-sm"
          onClick={() => setShareOpen((v) => !v)}
        >
          {shareOpen ? 'Hide card' : 'Share my score'}
        </button>
      ),
    }
  } else if (streak === 0 && longestStreak >= 3 && !todayLog) {
    primary = {
      key: 'comeback',
      icon: '↩️',
      label: 'Welcome back',
      title: `Your ${longestStreak}-day streak reset — beat it this time`,
      detail: 'One log gets the momentum going again. Your best run is the target now.',
      action: (
        <Link to="/log" className="btn-primary w-full !py-2.5 text-sm text-center">
          Log today
        </Link>
      ),
    }
  } else if (!todayLog && streak > 0) {
    // Escalating streak-risk warning — gets louder as the day goes on
    if (hour >= 21) {
      primary = {
        key: 'streak_risk_critical',
        icon: '🚨',
        label: 'Last call',
        title: `Only hours left to save your ${streak}-day streak!`,
        detail: shields > 0
          ? `It resets at midnight. You do have ${shields} shield${shields > 1 ? 's' : ''} banked, but don't rely on it — log now.`
          : "It resets at midnight and you have no shields banked. Log now to keep it alive.",
        action: (
          <Link to="/log" className="btn-primary w-full !py-2.5 text-sm text-center animate-pulse">
            Log now — don't lose it
          </Link>
        ),
      }
    } else if (hour >= 18) {
      primary = {
        key: 'streak_risk',
        icon: '🔥',
        label: 'Streak at risk',
        title: `Don't lose your ${streak}-day streak`,
        detail: 'It resets at midnight. A quick log keeps it alive.',
        action: (
          <Link to="/log" className="btn-primary w-full !py-2.5 text-sm text-center">
            Log now
          </Link>
        ),
      }
    }
  }

  // ── Challenge nudge ──────────────────────────────────────────────────────
  let challengeCard = null
  if (active.length === 0 && !reengagement) {
    const rec = recommendChallenge(recentLogs || [], profile, completedIds)
    if (rec) challengeCard = rec
  }

  // ── Share profile ────────────────────────────────────────────────────────
  const shareWorthy = longestStreak >= 3 || (recentScores?.[0] ?? 0) >= 60
  const shareProfileCard =
    !primary && shareWorthy && Boolean(profile?.username) && !isDismissed('share_profile')

  // ── Confetti for personal best ───────────────────────────────────────────
  useEffect(() => {
    if (primary?.key !== 'personal_best' || !todayLog?.log_date) return
    const key = `qyven_pb_confetti_${todayLog.log_date}`
    try {
      if (!sessionStorage.getItem(key)) {
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.3 } })
        sessionStorage.setItem(key, '1')
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary?.key, todayLog?.log_date])

  if (!profile) return null
  if (!primary && !challengeCard && !shareProfileCard) return null

  async function handleShareProfile() {
    const url = `https://qyven.vercel.app/u/${profile.username}`
    const text = 'Tracking my Future Self Score on Qyven — check out my progress:'
    try {
      if (navigator.share) {
        await navigator.share({ text, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3">
      {/* Shield count indicator — only shown when you have at least one */}
      {shields > 0 && !reengagement && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary px-1">
          <span>🛡️</span>
          <span>{shields} streak shield{shields > 1 ? 's' : ''} banked</span>
        </div>
      )}

      {primary && (
        <div className={`glass-card p-4 ${primary.key === 'streak_risk_critical' ? 'border-2 border-coral/40' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-title mb-1">
                {primary.icon} {primary.label}
              </p>
              <p className="font-extrabold text-slate-900 leading-snug">{primary.title}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed mb-3">{primary.detail}</p>
          {primary.action}
          {primary.key === 'personal_best' && shareOpen && (
            <div className="mt-3">
              <ScoreCard profile={profile} log={todayLog} streak={streak} />
            </div>
          )}
        </div>
      )}

      {challengeCard && (
        <Link
          to="/challenges"
          className="glass-card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow block"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `${challengeCard.challenge.color}20` }}
          >
            {challengeCard.challenge.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="section-title mb-0.5">Try a challenge</p>
            <p className="font-extrabold text-slate-900 truncate">{challengeCard.challenge.name}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">{challengeCard.reason}</p>
          </div>
          <span
            className="pill text-[10px] shrink-0"
            style={{ background: `${challengeCard.challenge.color}15`, color: challengeCard.challenge.color }}
          >
            +{challengeCard.challenge.xpReward} XP
          </span>
        </Link>
      )}

      {shareProfileCard && (
        <div className="glass-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-title mb-1">📣 Spread the word</p>
              <p className="font-extrabold text-slate-900 leading-snug">Share your public profile</p>
            </div>
            <button
              type="button"
              onClick={() => {
                dismiss('share_profile')
                setDismissTick((n) => n + 1)
              }}
              className="text-slate-400 text-xs font-bold leading-none"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed mb-3">
            Friends can see your streak, level, and scores at qyven.vercel.app/u/{profile.username}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={handleShareProfile} className="btn-primary flex-1 !py-2.5 text-sm">
              Share profile
            </button>
            <Link to={`/u/${profile.username}`} className="btn-secondary flex-1 !py-2.5 text-sm text-center">
              Preview
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}