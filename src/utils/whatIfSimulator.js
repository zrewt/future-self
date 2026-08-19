/**
 * What-If Simulator — runs hypothetical habit changes through Qyven's
 * REAL, unmodified scoring pipeline (getFutureSelfBreakdown). Only the
 * synthetic log's raw inputs are ever changed — no scoring formula is
 * touched, duplicated, or forked.
 *
 * IMPORTANT — a real quirk of the existing scoring engine, not something
 * introduced here: the Future Self Score composite uses calcSleepScore
 * (via getFutureSelfBreakdown) for its "sleep" component, which is a
 * DIFFERENT formula from calcEnergyFromSleep (used for the displayed
 * "Sleep & Energy" pillar elsewhere in the app). This simulator correctly
 * follows whichever formula getFutureSelfBreakdown actually uses, since
 * that's what determines the real FSS.
 *
 * Similarly, the "Focus" slider affects FSS via the HABITS component
 * (calcHabitsScore, which reads focus_minutes/reading_minutes/
 * meditation_minutes/mood) — NOT via calcFocusScore, which is a separate
 * display-only pillar not included in the FSS composite formula at all.
 */

import { getFutureSelfBreakdown } from './scoring'

const MIN_LOGS_REQUIRED = 7

function avgField(logs, key) {
  const vals = logs.map((l) => l[key]).filter((v) => v != null)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + Number(b), 0) / vals.length
}

function modeField(logs, key, fallback) {
  const counts = {}
  logs.forEach((l) => {
    const v = l[key]
    if (!v) return
    counts[v] = (counts[v] || 0) + 1
  })
  const entries = Object.entries(counts)
  if (!entries.length) return fallback
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

/**
 * Builds a synthetic "average day" log from real logged history.
 * Returns null if there isn't enough history yet (gate: 7+ logged days).
 */
export function buildBaselineLog(recentLogs) {
  if (!recentLogs || recentLogs.length < MIN_LOGS_REQUIRED) return null

  return {
    fruit_servings:       avgField(recentLogs, 'fruit_servings'),
    vegetable_servings:   avgField(recentLogs, 'vegetable_servings'),
    protein_servings:     avgField(recentLogs, 'protein_servings'),
    processed_servings:   avgField(recentLogs, 'processed_servings'),
    water_ml:             avgField(recentLogs, 'water_ml'),
    workout_duration_min: avgField(recentLogs, 'workout_duration_min'),
    exercise_type:        modeField(recentLogs, 'exercise_type', 'gym'),
    sleep_hours:          avgField(recentLogs, 'sleep_hours'),
    sleep_quality:        avgField(recentLogs, 'sleep_quality') || 5,
    focus_minutes:        avgField(recentLogs, 'focus_minutes'),
    reading_minutes:      avgField(recentLogs, 'reading_minutes'),
    meditation_minutes:   avgField(recentLogs, 'meditation_minutes'),
    mood:                 avgField(recentLogs, 'mood') || 5,
  }
}

// Slider definitions — each maps a 0..max delta onto baseline field(s).
// `apply` returns a NEW log object; never mutates the baseline.
export const WHATIF_LEVERS = {
  sleep: {
    label: 'Sleep',
    unit: 'hr more/night',
    min: 0,
    max: 2,
    step: 0.25,
    apply: (log, delta) => ({ ...log, sleep_hours: (log.sleep_hours || 0) + delta }),
  },
  workouts: {
    label: 'Workouts',
    unit: 'session(s)/week more',
    min: 0,
    max: 3,
    step: 1,
    // Each extra weekly session assumed ~45min (matches WORKOUT_FACTOR's
    // own 45min denominator in scoring.js), spread across 7 days as a
    // daily average. Real per-user session length may differ — worth
    // revisiting if this feels off in practice.
    apply: (log, delta) => ({
      ...log,
      workout_duration_min: (log.workout_duration_min || 0) + (delta * 45) / 7,
    }),
  },
  veg: {
    label: 'Vegetables',
    unit: 'serving(s)/day more',
    min: 0,
    max: 4,
    step: 1,
    apply: (log, delta) => ({ ...log, vegetable_servings: (log.vegetable_servings || 0) + delta }),
  },
  focus: {
    label: 'Focus time',
    unit: 'min/day more',
    min: 0,
    max: 60,
    step: 5,
    apply: (log, delta) => ({ ...log, focus_minutes: (log.focus_minutes || 0) + delta }),
  },
}

/**
 * Runs a baseline log (optionally with lever deltas applied) through the
 * real, unmodified scoring pipeline. `deltas` = { sleep: 0.5, workouts: 1, ... }
 */
export function simulateFSS(baselineLog, deltas, streakDays) {
  let log = { ...baselineLog }
  Object.entries(deltas).forEach(([key, delta]) => {
    if (!delta) return
    const lever = WHATIF_LEVERS[key]
    if (lever) log = lever.apply(log, delta)
  })
  return getFutureSelfBreakdown(log, [], streakDays)
}