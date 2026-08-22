/**
 * What-If Simulator — runs hypothetical habit changes through Qyven's
 * REAL, unmodified scoring pipeline (getFutureSelfBreakdown). Only the
 * synthetic log's raw inputs are ever changed — no scoring formula is
 * touched, duplicated, or forked.
 *
 * REDESIGNED this session: scenarios are now TARGET-based (current →
 * suggested value) instead of open-ended +delta sliders. This fixes two
 * real bugs in the old delta model:
 *   1. Sleep used to always ADD hours regardless of direction — since
 *      calcSleepScore is a bell curve centered at 8.25h, adding hours to
 *      an already-good sleeper made things WORSE, not better. Now the
 *      sleep scenario targets 8h directly.
 *   2. With no ranking, a user whose baseline was already near-ceiling on
 *      most pillars (common after the scoring recalibrations) saw near-
 *      zero movement on every lever, with no way to know WHY or which
 *      lever (if any) still had real headroom.
 *
 * IMPORTANT — real quirks of the scoring engine, not introduced here:
 * FSS's "sleep" component uses calcSleepScore (via getFutureSelfBreakdown),
 * a DIFFERENT formula from calcEnergyFromSleep (the displayed pillar).
 * The "Focus" scenario affects FSS via calcHabitsScore (habits component),
 * NOT calcFocusScore (a separate display-only pillar not in the FSS
 * composite at all). This simulator always follows whichever formula
 * getFutureSelfBreakdown actually uses.
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
    workout_intensity:    avgField(recentLogs, 'workout_intensity') || 6,
    exercise_type:        modeField(recentLogs, 'exercise_type', 'gym'),
    sleep_hours:          avgField(recentLogs, 'sleep_hours'),
    sleep_quality:        avgField(recentLogs, 'sleep_quality') || 5,
    focus_minutes:        avgField(recentLogs, 'focus_minutes'),
    reading_minutes:      avgField(recentLogs, 'reading_minutes'),
    meditation_minutes:   avgField(recentLogs, 'meditation_minutes'),
    mood:                 avgField(recentLogs, 'mood') || 5,
  }
}

function scoreForLog(log, streakDays) {
  return getFutureSelfBreakdown(log, [], streakDays).score
}

// ~45min/session, matching WORKOUT_FACTOR's own denominator in scoring.js —
// used only to translate "sessions/week" into a daily-average minute value.
const MIN_PER_SESSION = 45
const sessionsToDailyMin = (sessions) => (sessions * MIN_PER_SESSION) / 7
const dailyMinToSessions = (mins) => Math.round((mins * 7) / MIN_PER_SESSION)

/**
 * Each scenario represents a real-life action, not an abstract pillar
 * slider. `getCurrent` reads the baseline's real value in scenario units;
 * `suggestedTarget` is the "Try it" default; `apply` returns a NEW log
 * with that field set to the given value (never mutates).
 */
export const SCENARIOS = [
  {
    key: 'veg',
    icon: '🥗',
    label: 'Eat more vegetables',
    unit: 'servings/day',
    min: 0,
    max: 4,
    step: 1,
    getCurrent: (b) => Math.round(b.vegetable_servings),
    suggestedTarget: (b) => Math.min(4, Math.round(b.vegetable_servings) + 1),
    formatValue: (v) => (v >= 4 ? '4+' : `${v}`),
    apply: (log, v) => ({ ...log, vegetable_servings: v }),
  },
  {
    key: 'workouts',
    icon: '🏃',
    label: 'Exercise consistently',
    unit: 'days/week',
    min: 0,
    max: 7,
    step: 1,
    getCurrent: (b) => dailyMinToSessions(b.workout_duration_min),
    suggestedTarget: (b) => Math.min(7, dailyMinToSessions(b.workout_duration_min) + 1),
    formatValue: (v) => `${v}`,
    apply: (log, v) => ({ ...log, workout_duration_min: sessionsToDailyMin(v) }),
  },
  {
    key: 'sleep',
    icon: '😴',
    label: 'Improve sleep',
    unit: 'hours',
    min: 5,
    max: 9.5,
    step: 0.25,
    getCurrent: (b) => Math.round(b.sleep_hours * 4) / 4,
    // Fixed target of 8h — the actual optimum of the bell curve — not
    // "current + delta", so this never recommends sleeping past optimal.
    suggestedTarget: () => 8,
    formatValue: (v) => `${v}h`,
    apply: (log, v) => ({ ...log, sleep_hours: v }),
  },
  {
    key: 'focus',
    icon: '🎯',
    label: 'Focus',
    unit: 'min/day',
    min: 0,
    max: 180,
    step: 5,
    getCurrent: (b) => Math.round(b.focus_minutes / 5) * 5,
    suggestedTarget: (b) => Math.min(180, Math.round(b.focus_minutes / 5) * 5 + 30),
    formatValue: (v) => `${v} min`,
    apply: (log, v) => ({ ...log, focus_minutes: v }),
  },
  {
    key: 'hydration',
    icon: '💧',
    label: 'Hydration',
    unit: 'ml/day',
    min: 500,
    max: 4000,
    step: 250,
    getCurrent: (b) => Math.round(b.water_ml / 250) * 250,
    suggestedTarget: (b) => Math.min(4000, Math.round(b.water_ml / 250) * 250 + 500),
    formatValue: (v) => `${(v / 1000).toFixed(1)}L`,
    apply: (log, v) => ({ ...log, water_ml: v }),
  },
]

/**
 * Runs every scenario at ITS suggested target and ranks by impact —
 * powers both "biggest opportunity" (top result) and the "what's shaping
 * your Future Self" ranked list. Impact is rounded to 1 decimal, honest
 * about being small.
 */
export function rankScenarios(baseline, streakDays) {
  const baselineScore = scoreForLog(baseline, streakDays)

  return SCENARIOS.map((s) => {
    const current = s.getCurrent(baseline)
    const target = s.suggestedTarget(baseline)
    const simulatedLog = s.apply(baseline, target)
    const impact = Math.round((scoreForLog(simulatedLog, streakDays) - baselineScore) * 10) / 10
    return { ...s, current, target, impact }
  }).sort((a, b) => b.impact - a.impact)
}

/**
 * Live score for a single scenario at an arbitrary (slider) value —
 * used while the user is dragging, not just at the suggested target.
 */
export function simulateScenario(baseline, scenario, value, streakDays) {
  const baselineScore = scoreForLog(baseline, streakDays)
  const simulatedLog = scenario.apply(baseline, value)
  const simulatedScore = scoreForLog(simulatedLog, streakDays)
  return {
    baselineScore,
    simulatedScore,
    delta: Math.round((simulatedScore - baselineScore) * 10) / 10,
  }
}