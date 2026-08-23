/**
 * Layer 3 — habit suggestions.
 *
 * Reuses whatIfSimulator's rankScenarios (the SAME real scoring pipeline
 * already driving "Shape Your Future") to find the biggest real
 * opportunity, then translates it into a real, creatable habit.
 * Suggestions are informational nudges only — creating the habit still
 * goes through the normal addHabit() path, so the FSS-never-touched-by-
 * habits guardrail from Layer 1 is unaffected.
 */

import { buildBaselineLog, rankScenarios } from './whatIfSimulator'

const SCENARIO_HABIT_TEMPLATES = {
  veg:       { name: 'Vegetables',    icon: '🥦', tracking_type: 'times',   target_unit: 'servings', frequency_per_week: 7, difficulty: 'easy',     pillar_tag: 'nutrition' },
  workouts:  { name: 'Workout',       icon: '🏋️', tracking_type: 'boolean', target_unit: null,       difficulty: 'moderate', pillar_tag: 'fitness' },
  sleep:     { name: 'Sleep 8 hours', icon: '😴', tracking_type: 'boolean', target_unit: null,       frequency_per_week: 7, difficulty: 'easy',     pillar_tag: 'energy' },
  focus:     { name: 'Focused work',  icon: '🎯', tracking_type: 'minutes', target_unit: 'min',      frequency_per_week: 5, difficulty: 'moderate', pillar_tag: 'focus' },
  hydration: { name: 'Hydration',     icon: '💧', tracking_type: 'amount',  target_unit: 'ml',       frequency_per_week: 7, difficulty: 'easy',     pillar_tag: 'nutrition' },
}

/**
 * Converts a ranked (or actively-adjusted) scenario into a real habit
 * definition. Exported directly so the What-If Simulator can offer
 * "add to my habits" on WHICHEVER scenario the user is looking at, not
 * only the auto-detected top one.
 */
export function scenarioToHabit(scenario) {
  const template = SCENARIO_HABIT_TEMPLATES[scenario.key]
  if (!template) return null

  return {
    name: template.name,
    icon: template.icon,
    tracking_type: template.tracking_type,
    target_value: template.tracking_type === 'boolean' ? null : scenario.target,
    target_unit: template.target_unit,
    frequency_per_week: scenario.key === 'workouts' ? scenario.target : (template.frequency_per_week || 5),
    difficulty: template.difficulty,
    pillar_tag: template.pillar_tag,
  }
}

/**
 * Returns the single best proactive habit suggestion, or null if there's
 * no real opportunity (impact too small) or the user already tracks that
 * pillar via an existing habit.
 */
export function getSuggestedHabit(recentLogs, streakDays, existingHabits = []) {
  const baseline = buildBaselineLog(recentLogs)
  if (!baseline) return null

  const ranked = rankScenarios(baseline, streakDays)
  const top = ranked.find((s) => s.impact >= 1)
  if (!top) return null

  const habit = scenarioToHabit(top)
  if (!habit) return null

  const alreadyHave = existingHabits.some(
    (h) => h.pillar_tag === habit.pillar_tag && h.name.toLowerCase() === habit.name.toLowerCase()
  )
  if (alreadyHave) return null

  const reason = `Your ${top.label} has been your biggest opportunity — currently averaging ${top.formatValue(top.current)}. This could move your Future Self by an estimated +${top.impact}.`

  return { habit, reason, scenario: top }
}