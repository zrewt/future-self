// ── LEGACY HELPERS ─────────────────────────────────────────────────────────────
function legacyNutrition(log) {
  return Math.min(100, Math.round((log.meal_quality || 0) * 0.6 + ((log.water_ml || 0) / 3000) * 40))
}
function legacyFitness(log) {
  return Math.min(100, Math.round((log.exercise_intensity || 0) * 0.7 + (log.sleep_quality || 5) * 3))
}

// ── FOOD SCORING (health & longevity — not calorie counting) ─────────────────
export {
  calcFoodQualityScore,
  calcFoodQualityBreakdown,
  calcFoodLongevityScore,
  calcFoodLongevityBreakdown,
  calcMealMacroTotals,
} from './foodScoring'

import { calcFoodQualityScore, calcFoodLongevityScore, calcMealMacroTotals } from './foodScoring'

// ── MACRO SUMMARY ──────────────────────────────────────────────────────────────
export function calcMacroSummary(foods) {
  const totals = calcMealMacroTotals(foods)
  if (!totals) return null
  const { calories, protein, carbs, fat } = totals
  return { calories, protein, carbs, fat }
}

// ── NUTRITION SCORE ────────────────────────────────────────────────────────────
// REBALANCED: servings-only ceiling dropped from ~85-100 to 65. The 65-100
// range now requires real logged food-quality data (calcFoodQualityScore) —
// hitting your fruit/veg/protein quotas alone is no longer enough to
// approach a perfect nutrition score.
export function calcNutritionFromServings(log, foods = []) {
  const fruit     = log.fruit_servings     ?? 0
  const veg       = log.vegetable_servings ?? 0
  const protein   = log.protein_servings   ?? 0
  const processed = log.processed_servings ?? 0

  if (fruit + veg + protein + processed === 0 && (log.meal_quality || 0) > 0) {
    return legacyNutrition(log)
  }

  let base =
    (Math.min(fruit,   4) / 4) * 15 +
    (Math.min(veg,     6) / 6) * 20 +
    (Math.min(protein, 4) / 4) * 20 +
    Math.min((log.water_ml || 0) / 3000, 1) * 10 -
    Math.min(processed, 5) * 10

  base = Math.min(65, Math.max(0, Math.round(base)))

  const fq = calcFoodQualityScore(foods)
  if (fq == null) return base
  const blended = Math.round(base * 0.15 + fq * 0.85)
  return Math.min(100, Math.max(base, blended))
}

// ── FITNESS ────────────────────────────────────────────────────────────────────
// REBALANCED: duration threshold for full credit raised 45min → 60min.
const WORKOUT_FACTOR = { gym: 1, run: 1.1, sport: 1.05, yoga: 0.85, rest: 0.25 }

export function calcFitnessFromWorkout(log) {
  const duration = log.workout_duration_min ?? 0
  const type     = log.exercise_type || 'rest'
  if (duration === 0 && type === 'rest' && !(log.exercise_intensity > 0)) return 0
  if (duration === 0 && (log.exercise_intensity || 0) > 0) return legacyFitness(log)
  const factor = WORKOUT_FACTOR[type] ?? 0.5
  return Math.min(100, Math.round(
    Math.min(duration / 60, 1) * 72 * factor + (log.sleep_quality || 0) * 2.2
  ))
}

// ── ENERGY (legacy composite — kept for charts / DB) ───────────────────────────
// REBALANCED: 8h → 9h for full sleep-hours credit; sleep_quality and mood no
// longer default to 5 when unlogged — real tracking required, not assumed.
export function calcEnergyFromSleep(log) {
  return Math.min(100, Math.round(
    (Number(log.sleep_hours || 0) / 9) * 40 +
    (log.sleep_quality || 0) * 3.5 +
    (log.mood || 0) * 2 +
    Math.min((log.water_ml || 0) / 3200, 1) * 15
  ))
}

// ── FUTURE SELF PILLARS ────────────────────────────────────────────────────────
// REBALANCED: 8h → 9h for full credit; sleep_quality no longer defaults to 5.
export function calcSleepScore(log) {
  return Math.min(100, Math.round(
    (Number(log.sleep_hours || 0) / 9) * 55 +
    (log.sleep_quality || 0) * 4.2
  ))
}

// REBALANCED: 2500ml → 3200ml required for full hydration credit.
export function calcHydrationScore(log) {
  return Math.min(100, Math.round(Math.min((log.water_ml || 0) / 3200, 1) * 100))
}

// REBALANCED: focus 60→90min, reading 20→30min, meditation 10→20min; mood
// no longer defaults to 5.
export function calcHabitsScore(log) {
  return Math.min(100, Math.round(
    Math.min((log.focus_minutes || 0) / 90, 1) * 35 +
    Math.min((log.reading_minutes || 0) / 30, 1) * 20 +
    Math.min((log.meditation_minutes || 0) / 20, 1) * 15 +
    (log.mood || 0) * 3
  ))
}

// ── FOCUS ──────────────────────────────────────────────────────────────────────
// REBALANCED: focus 90→120min, reading 30→45min, meditation 10→20min.
export function calcFocusScore(log) {
  return Math.min(100, Math.round(
    ((log.focus_minutes      || 0) / 120) * 55 +
    ((log.reading_minutes    || 0) / 45)  * 25 +
    ((log.meditation_minutes || 0) / 20)  * 20
  ))
}

// ── LONGEVITY ──────────────────────────────────────────────────────────────────
// REBALANCED: base ceiling reduced (30→25 sleep weight, 20→15 hydration
// weight — base now tops out at 90, not 100). Blend with real food-longevity
// data flipped to favor it more heavily (was 55/45 base-heavy, now 45/55
// quality-heavy) — matches the nutrition rebalance's philosophy.
export function calcLongevityScore(log, fitnessScore, nutritionScore, foods = []) {
  const base = Math.min(100, Math.round(
    (Number(log.sleep_hours || 0) / 9) * 25 +
    fitnessScore   * 0.25 +
    nutritionScore * 0.25 +
    Math.min((log.water_ml || 0) / 3200, 1) * 15
  ))
  const fl = calcFoodLongevityScore(foods)
  return fl != null
    ? Math.min(100, Math.round(base * 0.45 + fl * 0.55))
    : base
}

// ── FUTURE SELF SCORE ──────────────────────────────────────────────────────────
// UNCHANGED — weights and 97-cap left as-is. Since every input dimension
// above is now harder to max, the composite naturally becomes harder
// without needing its own weight changes.
export function calcFutureSelfScore(scores, streakDays) {
  const c = 0.7 + (Math.min(streakDays, 100) / 100) * 0.3
  const composite = (
    scores.nutrition * 0.25 +
    scores.fitness   * 0.25 +
    scores.sleep     * 0.20 +
    scores.hydration * 0.15 +
    scores.habits    * 0.15
  )
  // 97+ reserved for near-perfect days across all pillars
  return Math.min(97, Math.round(composite * c))
}

export function getFutureSelfBreakdown(log, foods = [], streakDays = 0) {
  const nutrition = calcNutritionFromServings(log, foods)
  const fitness   = calcFitnessFromWorkout(log)
  const sleep     = calcSleepScore(log)
  const hydration = calcHydrationScore(log)
  const habits    = calcHabitsScore(log)
  const c = 0.7 + (Math.min(streakDays, 100) / 100) * 0.3

  const items = [
    { key: 'nutrition', label: 'Nutrition', weight: 0.25, value: nutrition },
    { key: 'fitness',   label: 'Fitness',   weight: 0.25, value: fitness },
    { key: 'sleep',     label: 'Sleep',     weight: 0.20, value: sleep },
    { key: 'hydration', label: 'Hydration', weight: 0.15, value: hydration },
    { key: 'habits',    label: 'Habits',    weight: 0.15, value: habits },
  ].map((item) => ({
    ...item,
    points:  Math.round(item.value * item.weight * c),
    percent: Math.round(item.weight * 100),
  }))

  const score = calcFutureSelfScore({ nutrition, fitness, sleep, hydration, habits }, streakDays)
  return { score, items, multiplier: c }
}

// ── BUILD ALL ──────────────────────────────────────────────────────────────────
export function buildAllScores(log, streakDays = 0, foods = []) {
  const fitness   = calcFitnessFromWorkout(log)
  const nutrition = calcNutritionFromServings(log, foods)
  const energy    = calcEnergyFromSleep(log)
  const focus     = calcFocusScore(log)
  const longevity = calcLongevityScore(log, fitness, nutrition, foods)
  const mood      = (log.mood || 0) * 10
  const fss       = getFutureSelfBreakdown(log, foods, streakDays)
  return {
    fitness_score:     fitness,
    nutrition_score:   nutrition,
    energy_score:      energy,
    focus_score:       focus,
    longevity_score:   longevity,
    future_self_score: fss.score,
    mood_score:        mood,
  }
}

// ── SCORE BREAKDOWN (legacy alias) ─────────────────────────────────────────────
export function getScoreBreakdown(scores, streakDays) {
  const c = 0.7 + (Math.min(streakDays, 100) / 100) * 0.3
  return [
    { key: 'nutrition', label: 'Nutrition', weight: 0.25, value: scores.nutrition ?? 0 },
    { key: 'fitness',   label: 'Fitness',   weight: 0.25, value: scores.fitness   ?? 0 },
    { key: 'sleep',     label: 'Sleep',     weight: 0.20, value: scores.sleep     ?? 0 },
    { key: 'hydration', label: 'Hydration', weight: 0.15, value: scores.hydration ?? 0 },
    { key: 'habits',    label: 'Habits',    weight: 0.15, value: scores.habits    ?? 0 },
  ].map((item) => ({
    ...item,
    points:  Math.round(item.value * item.weight * c),
    percent: Math.round(item.weight * 100),
  }))
}

// ── XP ─────────────────────────────────────────────────────────────────────────
// UNCHANGED for now — thresholds here (fitness>=50, nutrition>=50, etc.)
// weren't part of the requested recalibration. Worth revisiting separately
// if XP starts feeling too easy/hard to earn under the new curve.
export function calcXP(log, streakDays, questXP = 0, foods = []) {
  let base = 0
  if (calcFitnessFromWorkout(log) >= 50 || (log.workout_duration_min || 0) >= 20) base += 25
  if (calcNutritionFromServings(log, foods) >= 50) base += 15
  if (Number(log.sleep_hours) >= 7.5)          base += 20
  if ((log.water_ml       || 0) >= 2500)        base += 10
  if ((log.focus_minutes  || 0) >= 60)          base += 20
  if ((log.reading_minutes|| 0) >= 20)          base += 15
  if ((log.meditation_minutes||0) >= 10)        base += 10
  if (log.is_perfect_day)                       base += 50
  return base + Math.floor(streakDays / 7) * 5 + questXP
}

// ── PERFECT DAY ────────────────────────────────────────────────────────────────
// RECALIBRATED thresholds, per the new harder curve. Reasoning:
//  - nutrition: 55 → 45 (servings-only ceiling is now 65, so 45 is a real
//    solid-effort bar, not a token minimum)
//  - fitness: 50 → 45 (new formula still lands ~65 at default 45min/quality
//    unset, so 45 stays meaningful without being trivial)
//  - sleep_hours: 7 → 7.5 (formula now targets 9h for full credit, so the
//    perfect-day bar should track that upward shift)
//  - mood: unchanged (raw input, unaffected by the formula rebalance)
//  - water_ml: 2000 → 2200 (hydration ceiling moved 2500→3200; this keeps
//    the perfect-day bar meaningfully below the new max, not at parity)
// These are a reasonable starting recalibration, not derived from data —
// worth revisiting once real logged days come in under the new curve.
export function isPerfectDay(log, foods = []) {
  const s = buildAllScores(log, 0, foods)
  return (
    s.nutrition_score >= 45 &&
    s.fitness_score   >= 45 &&
    Number(log.sleep_hours) >= 7.5 &&
    (log.mood     || 0) >= 7 &&
    (log.water_ml || 0) >= 2200
  )
}

// ── LEVELS ─────────────────────────────────────────────────────────────────────
export function getLevelFromXP(totalXP) {
  for (let n = 1; n <= 99; n++) {
    if (totalXP < Math.floor(100 * Math.pow(n, 1.8))) return n
  }
  return 99
}

export function getLevelName(level) {
  if (level <=  4) return 'Initiate'
  if (level <=  9) return 'Builder'
  if (level <= 19) return 'Disciplined'
  if (level <= 34) return 'Elite'
  if (level <= 49) return 'Master'
  return 'Future Legend'
}

export function getXPForLevel(level) {
  return level <= 1 ? 0 : Math.floor(100 * Math.pow(level - 1, 1.8))
}

export function getXPForNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.8))
}

export function calcProjection(recentScores, daysAhead) {
  if (!recentScores || recentScores.length < 3) return null
  let ema = recentScores[0]
  for (const s of recentScores) ema = 0.1 * s + 0.9 * ema
  const last7   = recentScores.slice(0, 7)
  const prev7   = recentScores.slice(7, 14)
  const avg7    = last7.reduce((a, b) => a + b, 0) / last7.length
  const avgPrev = prev7.length ? prev7.reduce((a, b) => a + b, 0) / prev7.length : avg7
  const momentum = (avg7 - avgPrev) / 7
  const decay    = Math.max(0, (ema - 70) / 100)
  return Math.round(Math.min(99, Math.max(ema - 5, ema + momentum * daysAhead * (1 - decay))))
}