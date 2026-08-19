/**
 * Trend chart data prep: smoothing, monthly comparisons, and milestone
 * annotation matching against logs.
 */

function toDate(iso) {
  return new Date(`${iso}T12:00:00`)
}

// Simple moving average over `window` days — smooths day-to-day noise
// so the underlying trend reads clearly even with a spiky daily score.
function smooth(points, window = 5) {
  return points.map((p, i) => {
    const start = Math.max(0, i - window + 1)
    const slice = points.slice(start, i + 1)
    const avg = slice.reduce((s, x) => s + x.value, 0) / slice.length
    return { ...p, smoothed: Math.round(avg * 10) / 10 }
  })
}

/**
 * Build chart-ready points from trendLogs (newest-first from the DB).
 * Returns oldest-first, since charts read left-to-right chronologically.
 */
export function buildTrendSeries(trendLogs, days = 30, field = 'future_self_score') {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const filtered = (trendLogs || [])
    .filter((l) => toDate(l.log_date) >= cutoff)
    .slice()
    .reverse() // oldest first

  const points = filtered.map((l) => ({
    date: l.log_date,
    value: l[field] ?? 0,
  }))

  return smooth(points)
}

/**
 * Attach achievement/milestone markers to the series by matching
 * earned_at dates (or challenge completed_at) to the closest log date.
 */
export function attachMilestones(series, achievementEvents = [], challenges = []) {
  const milestoneDates = new Set()

  achievementEvents.forEach((a) => {
    if (a.earned_at) milestoneDates.add(a.earned_at.slice(0, 10))
  })
  challenges
    .filter((c) => c.completed && c.completed_at)
    .forEach((c) => milestoneDates.add(c.completed_at.slice(0, 10)))

  return series.map((p) => ({
    ...p,
    milestone: milestoneDates.has(p.date),
  }))
}

/**
 * Compare this calendar month to last calendar month, per pillar.
 * Returns null if there isn't at least some data in both periods.
 */
export function comparePillarsMonthOverMonth(trendLogs) {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const thisMonth = (trendLogs || []).filter((l) => toDate(l.log_date) >= thisMonthStart)
  const lastMonth = (trendLogs || []).filter(
    (l) => toDate(l.log_date) >= lastMonthStart && toDate(l.log_date) <= lastMonthEnd
  )

  if (!thisMonth.length || !lastMonth.length) return null

  const fields = [
    { key: 'nutrition_score', label: 'Nutrition' },
    { key: 'fitness_score',   label: 'Fitness' },
    { key: 'energy_score',    label: 'Sleep & Energy' },
    { key: 'focus_score',     label: 'Focus' },
    { key: 'longevity_score', label: 'Longevity' },
  ]

  const avg = (logs, key) => {
    const vals = logs.map((l) => l[key]).filter((v) => v != null)
    if (!vals.length) return null
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  }

  return fields
    .map((f) => {
      const thisAvg = avg(thisMonth, f.key)
      const lastAvg = avg(lastMonth, f.key)
      if (thisAvg == null || lastAvg == null) return null
      return {
        label: f.label,
        thisMonth: thisAvg,
        lastMonth: lastAvg,
        delta: thisAvg - lastAvg,
      }
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

/**
 * Compares the last 7 logged days to the 7 days before that. Rolling by
 * logged-day COUNT (not calendar week) so it works from day 15 onward
 * regardless of gaps.
 *
 * IMPORTANT: `logs` must be a full log array with raw fields (e.g.
 * useUserStore's `recentLogs`), sorted newest-first — NOT `trendLogs`,
 * whose query only selects computed scores, not raw fields like
 * sleep_hours or workout_duration_min.
 *
 * Returns null if there isn't at least 14 scored days available.
 */
export function comparePillarsWeekOverWeek(logs) {
  const scored = (logs || []).filter((l) => l.future_self_score != null)
  if (scored.length < 14) return null

  const thisWeek = scored.slice(0, 7)
  const lastWeek = scored.slice(7, 14)

  const avgOf = (arr, key) => {
    const vals = arr.map((l) => l[key]).filter((v) => v != null)
    if (!vals.length) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  const overallThis = avgOf(thisWeek, 'future_self_score')
  const overallLast = avgOf(lastWeek, 'future_self_score')
  if (overallThis == null || overallLast == null) return null

  const fields = [
    { key: 'nutrition_score', label: 'Nutrition' },
    { key: 'fitness_score',   label: 'Fitness' },
    { key: 'energy_score',    label: 'Sleep & Energy' },
    { key: 'focus_score',     label: 'Focus' },
    { key: 'longevity_score', label: 'Longevity' },
  ]

  const pillars = fields
    .map((f) => {
      const thisAvg = avgOf(thisWeek, f.key)
      const lastAvg = avgOf(lastWeek, f.key)
      if (thisAvg == null || lastAvg == null) return null
      return {
        key: f.key,
        label: f.label,
        thisWeek: Math.round(thisAvg),
        lastWeek: Math.round(lastAvg),
        delta: Math.round(thisAvg - lastAvg),
      }
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  return {
    overallDelta: Math.round(overallThis - overallLast),
    overallThisWeek: Math.round(overallThis),
    overallLastWeek: Math.round(overallLast),
    pillars,
    thisWeekLogs: thisWeek,
    lastWeekLogs: lastWeek,
  }
}