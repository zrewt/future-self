/**
 * Streak shields — earn one every 14 days of active streak, auto-protect
 * a single missed day instead of resetting to 0.
 *
 * Grace window — if exactly one day was missed and it's within 24h of
 * that day ending, the user can backfill yesterday's log to restore
 * the streak instead of consuming a shield or resetting.
 */

const SHIELD_EVERY_DAYS = 14
const MAX_SHIELDS = 3

export function shieldsEarnedForStreak(streakDays) {
  return Math.min(MAX_SHIELDS, Math.floor(streakDays / SHIELD_EVERY_DAYS))
}

// Call after a successful log to see if a new shield was just earned
export function checkNewShieldEarned(profile, newStreakDays) {
  const alreadyEarned = profile.last_shield_earned_streak || 0
  const totalEligible = shieldsEarnedForStreak(newStreakDays)
  const previouslyEligible = shieldsEarnedForStreak(alreadyEarned)
  const newShields = Math.max(0, totalEligible - previouslyEligible)
  return {
    earned: newShields > 0,
    count: newShields,
    newShieldTotal: Math.min(MAX_SHIELDS, (profile.streak_shields || 0) + newShields),
  }
}

function daysBetween(dateA, dateB) {
  const a = new Date(`${dateA}T12:00:00`)
  const b = new Date(`${dateB}T12:00:00`)
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

/**
 * Determine what happens to the streak given the gap since last log.
 * Returns one of:
 *  - { type: 'continue' }              — logged today or yesterday, normal increment
 *  - { type: 'grace_available', missedDate } — exactly 1 day missed, within 24h grace window
 *  - { type: 'shield_consumed', missedDate }  — 1+ day missed, shield available, auto-protected
 *  - { type: 'broken' }                — streak resets to 1
 */
export function evaluateStreakGap(profile, today) {
  const last = profile.last_log_date
  if (!last) return { type: 'continue' }

  const gap = daysBetween(last, today)
  if (gap <= 1) return { type: 'continue' }

  // Exactly one day missed (gap === 2, e.g. logged Mon, today is Wed → missed Tue)
  if (gap === 2) {
    const missedDate = new Date(`${last}T12:00:00`)
    missedDate.setDate(missedDate.getDate() + 1)
    const missedISO = missedDate.toISOString().slice(0, 10)

    // Grace window: still within 24h of the missed day ending
    const now = new Date()
    const missedDayEnd = new Date(`${missedISO}T23:59:59`)
    const hoursSinceMissedDayEnd = (now - missedDayEnd) / (1000 * 60 * 60)

    if (hoursSinceMissedDayEnd <= 24) {
      return { type: 'grace_available', missedDate: missedISO }
    }

    if ((profile.streak_shields || 0) > 0) {
      return { type: 'shield_consumed', missedDate: missedISO }
    }
  } else if ((profile.streak_shields || 0) > 0) {
    // Multiple days missed — shields only ever cover a single-day gap
    // (prevents a shield from papering over a week-long absence)
    return { type: 'broken' }
  }

  return { type: 'broken' }
}

// Days since the user last opened the app at all (for re-engagement messaging)
export function daysSinceLastActive(lastActiveDate) {
  if (!lastActiveDate) return 0
  const today = new Date().toISOString().slice(0, 10)
  return daysBetween(lastActiveDate, today)
}