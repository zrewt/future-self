/**
 * "Why Did My Score Change" — narrative layer on top of
 * comparePillarsWeekOverWeek. Every sentence here is a direct readout of
 * already-stored, already-computed data — no new formula, no causal claim.
 * Language stays at "associated with / contributed to," never "caused."
 */

import { comparePillarsWeekOverWeek } from './trends'

// Open decision #1 (see plan doc) — using the same threshold as the
// existing monthly comparison for consistency. Change this one constant
// if weekly turns out to need a higher bar.
const MEANINGFUL_THRESHOLD = 2

function avgOf(arr, key) {
  const vals = arr.map((l) => l[key]).filter((v) => v != null)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function formatHours(h) {
  if (h == null) return null
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
}

// Raw-field sentence generators, one per pillar (per the plan's mapping
// table). Longevity has no single logged field — handled separately below,
// since calcLongevityScore blends sleep/fitness/nutrition/hydration.
const RAW_FIELD_EXPLAINERS = {
  energy_score: (thisWeek, lastWeek) => {
    const t = avgOf(thisWeek, 'sleep_hours')
    const l = avgOf(lastWeek, 'sleep_hours')
    if (t == null || l == null) return null
    return `You averaged ${formatHours(t)} of sleep this week, compared with ${formatHours(l)} last week.`
  },
  fitness_score: (thisWeek, lastWeek) => {
    const t = avgOf(thisWeek, 'workout_duration_min')
    const l = avgOf(lastWeek, 'workout_duration_min')
    if (t == null || l == null) return null
    return `You averaged ${Math.round(t)} min of workout time this week, compared with ${Math.round(l)} min last week.`
  },
  nutrition_score: (thisWeek, lastWeek) => {
    const t = avgOf(thisWeek, 'vegetable_servings')
    const l = avgOf(lastWeek, 'vegetable_servings')
    if (t == null || l == null) return null
    return `You averaged ${Math.round(t * 10) / 10} veg servings/day this week, compared with ${Math.round(l * 10) / 10} last week.`
  },
  focus_score: (thisWeek, lastWeek) => {
    const t = avgOf(thisWeek, 'focus_minutes')
    const l = avgOf(lastWeek, 'focus_minutes')
    if (t == null || l == null) return null
    return `You averaged ${Math.round(t)} min of focus time this week, compared with ${Math.round(l)} min last week.`
  },
}

function buildLongevitySentence(pillars) {
  const others = pillars.filter((p) => p.key !== 'longevity_score')
  if (!others.length) return null
  const biggest = [...others].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
  if (!biggest || Math.abs(biggest.delta) < MEANINGFUL_THRESHOLD) return null
  return `Longevity is a blend of your other pillars — this week's move tracks closely with your ${biggest.label.toLowerCase()} change.`
}

/**
 * `logs` must be a full log array with raw fields, sorted newest-first
 * (e.g. useUserStore's recentLogs) — NOT trendLogs.
 *
 * Returns one of:
 *   { status: 'insufficient_data' }
 *   { status: 'steady', overallThisWeek, overallLastWeek, overallDelta }
 *   { status: 'change', direction, overallThisWeek, overallLastWeek,
 *     overallDelta, movers: [...], recommendation }
 */
export function explainScoreChange(logs) {
  const comparison = comparePillarsWeekOverWeek(logs)
  if (!comparison) return { status: 'insufficient_data' }

  const { overallDelta, overallThisWeek, overallLastWeek, pillars, thisWeekLogs, lastWeekLogs } = comparison

  if (Math.abs(overallDelta) < MEANINGFUL_THRESHOLD) {
    return { status: 'steady', overallThisWeek, overallLastWeek, overallDelta }
  }

  // Open decision #2 — show a 2nd mover only when it's genuinely close to
  // the top one (within 1pt), rather than always showing exactly 1 or 2.
  const top = pillars[0]
  const second = pillars[1] && Math.abs(pillars[1].delta) >= Math.abs(top.delta) - 1 ? pillars[1] : null

  const movers = [top, second].filter(Boolean).map((p) => ({
    ...p,
    sentence: p.key === 'longevity_score'
      ? buildLongevitySentence(pillars)
      : RAW_FIELD_EXPLAINERS[p.key]?.(thisWeekLogs, lastWeekLogs) ?? null,
  }))

  const direction = overallDelta > 0 ? 'up' : 'down'
  const biggestOpportunity = movers.find((m) => (direction === 'down' ? m.delta < 0 : m.delta > 0)) || top

  return {
    status: 'change',
    direction,
    overallThisWeek,
    overallLastWeek,
    overallDelta,
    movers,
    recommendation: direction === 'down'
      ? `${biggestOpportunity.label} was your biggest mover this week — it's associated with most of the change. Bringing it back toward your usual average is the highest-leverage fix.`
      : `${biggestOpportunity.label} contributed the most to this week's gain — whatever changed there is worth protecting.`,
  }
}