/**
 * Trend chart data prep: smoothing, monthly comparisons, and milestone
 * annotation matching against logs.
 */

function toDate(iso) {
  return new Date(`${iso}T12:00:00`)
}

function smooth(points, window = 5) {
  return points.map((p, i) => {
    const start = Math.max(0, i - window + 1)
    const slice = points.slice(start, i + 1)
    const avg = slice.reduce((s, x) => s + x.value, 0) / slice.length
    return { ...p, smoothed: Math.round(avg * 10) / 10 }
  })
}

export function buildTrendSeries(trendLogs, days = 30, field = 'future_self_score') {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const filtered = (trendLogs || [])
    .filter((l) => toDate(l.log_date) >= cutoff)
    .slice()
    .reverse()

  const points = filtered.map((l) => ({
    date: l.log_date,
    value: l[field] ?? 0,
  }))

  return smooth(points)
}

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

/**
 * Derives the slow-moving "Future Self Score" from raw per-day scores
 * via an exponential moving average (α = 0.1). Display value only —
 * `future_self_score` in daily_logs keeps meaning "that day's raw
 * composite" (now surfaced in the UI as "Daily Score"). No DB migration.
 *
 * `trendLogs` must be sorted newest-first (as returned by useUserStore).
 * Returns null if there's nothing to smooth.
 */
const FSS_SMOOTHING_ALPHA = 0.1

export function calcSmoothedFSSSeries(trendLogs) {
  const scored = (trendLogs || [])
    .filter((l) => l.future_self_score != null)
    .slice()
    .reverse()

  if (!scored.length) return null

  let ema = scored[0].future_self_score
  const series = [{ date: scored[0].log_date, raw: ema, smoothedFSS: Math.round(ema) }]

  for (let i = 1; i < scored.length; i++) {
    const raw = scored[i].future_self_score
    ema = FSS_SMOOTHING_ALPHA * raw + (1 - FSS_SMOOTHING_ALPHA) * ema
    series.push({ date: scored[i].log_date, raw, smoothedFSS: Math.round(ema) })
  }

  return series
}

export function calcCurrentSmoothedFSS(trendLogs) {
  const series = calcSmoothedFSSSeries(trendLogs)
  if (!series?.length) return null
  return series[series.length - 1].smoothedFSS
}

export function calcMomentum(trendLogs, lookback = 30) {
  const series = calcSmoothedFSSSeries(trendLogs)
  if (!series || series.length < 2) return null

  const latest = series[series.length - 1]
  const pastIndex = Math.max(0, series.length - 1 - lookback)
  const past = series[pastIndex]

  if (pastIndex === series.length - 1) return null

  return {
    delta: Math.round((latest.smoothedFSS - past.smoothedFSS) * 10) / 10,
    fromDate: past.date,
    toDate: latest.date,
  }
}