import { CHALLENGES } from '../data/challenges'

function avgField(logs, key) {
  const vals = logs
    .map((l) => Number(l[key]))
    .filter((v) => !Number.isNaN(v) && v !== null && v !== undefined)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

/**
 * Suggests a challenge based on recent activity and current streak state.
 * Returns { challenge, reason } or null if nothing suitable is available.
 *
 * @param {object[]} recentLogs - daily_log rows, newest first
 * @param {object} profile - users_profile row
 * @param {string[]} excludeIds - challenge ids the user has already completed
 */
export function recommendChallenge(recentLogs, profile, excludeIds = []) {
  const available = CHALLENGES.filter((c) => !excludeIds.includes(c.id))
  if (!available.length) return null

  const byId = (id) => available.find((c) => c.id === id)
  const last7 = recentLogs.slice(0, 7)

  // Rebuilding momentum after a broken or short streak takes priority
  if ((profile?.current_streak ?? 0) < 3) {
    const lockIn = byId('lock_in_7')
    if (lockIn) {
      return { challenge: lockIn, reason: 'Great for rebuilding momentum after a reset' }
    }
  }

  const nutrition = avgField(last7, 'nutrition_score')
  const fitness = avgField(last7, 'fitness_score')
  const focus = avgField(last7, 'focus_score')
  const sleepHours = avgField(last7, 'sleep_hours')

  const pillars = [
    {
      value: nutrition,
      candidates: [
        { id: 'no_junk_week', reason: 'Your nutrition score has room to grow — this is built for it' },
        { id: 'hydration_hero', reason: 'Your nutrition score has room to grow — hydration is an easy lever' },
      ],
    },
    {
      value: fitness,
      candidates: [{ id: 'summer_cut', reason: 'Your fitness score has room to grow this week' }],
    },
    {
      value: focus,
      candidates: [
        { id: 'exam_mode', reason: 'Your focus score has room to grow' },
        { id: 'reading_sprint_30', reason: 'Your focus score has room to grow' },
      ],
    },
    {
      value: sleepHours != null ? (sleepHours / 8) * 100 : null,
      candidates: [{ id: 'sleep_king', reason: 'Your sleep has been a bit short lately' }],
    },
  ].filter((p) => p.value != null)

  if (pillars.length) {
    pillars.sort((a, b) => a.value - b.value)
    for (const pillar of pillars) {
      for (const candidate of pillar.candidates) {
        const match = byId(candidate.id)
        if (match) return { challenge: match, reason: candidate.reason }
      }
    }
  }

  // Not enough history yet — default to a streak-building or general challenge
  const fallback = byId('lock_in_7') || byId('perfect_week') || available[0]
  return fallback ? { challenge: fallback, reason: 'A solid challenge to get started with' } : null
}