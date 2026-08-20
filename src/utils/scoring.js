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

// ── CURVE HELPERS ────────────────────────────────────────────────────────────
// Shared diminishing-returns curve: steep early gains, smooth slowdown,
// asymptotic (never quite reaches `ceiling`). `k` is the half-max point —
// the amount needed to reach half the ceiling.
function diminishing(amount, ceiling, k) {
  const a = Math.max(0, Number(amount) || 0)
  if (a <= 0) return 0
  return (ceiling * a) / (a + k)
}

// Sleep-specific: an optimal-range bell curve centered on 8.25h, rather
// than "more is always better." `spread` controls how quickly the curve
// falls off on both sides — same shape reused at different ceilings for
// the FSS composite dimension, the displayed energy pillar, and longevity.
function sleepHoursCurve(hours, ceiling, center = 8.25, spread = 31.25) {
  const h = Math.max(0, Number(hours) || 0)
  const raw = ceiling - (ceiling / spread) * Math.pow(h - center, 2)
  return Math.max(0, raw)
}

// Sleep quality (0-10) acts as a MULTIPLIER on the hours curve, not an
// additive bonus — so a self-reported 10/10 can't rescue a short night,
// and poor quality meaningfully drags down even great hours.
function qualityFactor(quality) {
  const q = Math.max(0, Math.min(10, Number(quality) || 0))
  return 0.55 + 0.45 * (q / 10)
}

// ── MACRO SUMMARY ──────────────────────────────────────────────────────────────
export function calcMacroSummary(foods) {
  const totals = calcMealMacroTotals(foods)
  if (!totals) return null
  const { calories, protein, carbs, fat } = totals
  return { calories, protein, carbs, fat }
}

// ── NUTRITION SCORE ────────────────────────────────────────────────────────────
// REDESIGNED: servings-only components each use their own diminishing
// curve (not linear caps). Ceilings sum to ~55 asymptotically — servings
// alone can't approach 100; the 55-100 range requires real logged
// food-quality data (calcFoodQualityScore), which already handles variety/
// macro-balance/micronutrients in real depth — not duplicated here.
export function calcNutritionFromServings(log, foods = []) {
  const fruit     = log.fruit_servings     ?? 0
  const veg       = log.vegetable_servings ?? 0
  const protein   = log.protein_servings   ?? 0
  const processed = log.processed_servings ?? 0

  if (fruit + veg + protein + processed === 0 && (log.meal_quality || 0) > 0) {
    return legacyNutrition(log)
  }

  const fruitPts          = diminishing(fruit, 12, 2)
  const vegPts            = diminishing(veg, 18, 3)
  const proteinPts        = diminishing(protein, 15, 2.5)
  const waterPts          = diminishing(log.water_ml || 0, 10, 1400)
  // Processed food: smooth diminishing PENALTY — one item costs little,
  // more items cost progressively more but with shrinking marginal cost
  // (never a flat per-item deduction that can zero out the score alone).
  const processedPenalty  = diminishing(processed, 12, 2)

  let base = fruitPts + vegPts + proteinPts + waterPts - processedPenalty
  base = Math.min(60, Math.max(0, Math.round(base)))

  const fq = calcFoodQualityScore(foods)
  if (fq == null) return base
  const blended = Math.round(base * 0.15 + fq * 0.85)
  return Math.min(100, Math.max(base, blended))
}

// ── FITNESS ────────────────────────────────────────────────────────────────────
// REDESIGNED: duration + type only (no intensity input exists in the real
// Log.jsx form — the old sleep_quality bonus was an unrelated proxy and
// has been removed). Diminishing curve on duration, ceiling 100 pre-type-
// factor, so a very long/hard session experiences real diminishing
// returns rather than climbing indefinitely.
const WORKOUT_FACTOR = { gym: 1, run: 1.1, sport: 1.05, yoga: 0.85, rest: 0.25 }

export function calcFitnessFromWorkout(log) {
  const duration = log.workout_duration_min ?? 0
  const type     = log.exercise_type || 'rest'
  if (duration === 0 && type === 'rest' && !(log.exercise_intensity > 0)) return 0
  if (duration === 0 && (log.exercise_intensity || 0) > 0) return legacyFitness(log)
  const factor = WORKOUT_FACTOR[type] ?? 0.5
  const durationPts = diminishing(duration, 100, 25)
  return Math.min(100, Math.round(durationPts * factor))
}

// ── ENERGY (legacy composite — kept for charts / DB) ───────────────────────────
// REDESIGNED: sleep hours+quality now uses the optimal-range bell curve
// (ceiling 70 for this pillar's share) instead of "more hours = more
// points." Mood and hydration keep their own diminishing curves.
export function calcEnergyFromSleep(log) {
  const hoursRaw = sleepHoursCurve(Number(log.sleep_hours) || 0, 70)
  const sleepPart = hoursRaw * qualityFactor(log.sleep_quality)
  const moodPts = diminishing(log.mood || 0, 12, 3)
  const waterPts = diminishing(log.water_ml || 0, 18, 1400)
  return Math.min(100, Math.round(sleepPart + moodPts + waterPts))
}

// ── FUTURE SELF PILLARS ────────────────────────────────────────────────────────
// REDESIGNED: optimal-range bell curve (ceiling 100) × quality multiplier.
// A 9h/quality-10 night lands ~98 — genuinely exceptional, both dimensions
// have to be real. A 6h/quality-5 night lands ~65 — meaningfully reduced,
// not crashed to near-zero.
export function calcSleepScore(log) {
  const hoursRaw = sleepHoursCurve(Number(log.sleep_hours) || 0, 100)
  const score = hoursRaw * qualityFactor(log.sleep_quality)
  return Math.min(100, Math.round(score))
}

// REDESIGNED: diminishing curve instead of a hard linear ramp to 3200ml —
// more water always helps a little, but with real diminishing returns.
export function calcHydrationScore(log) {
  return Math.min(100, Math.round(diminishing(log.water_ml || 0, 100, 1400)))
}

// REDESIGNED: each input (focus/reading/meditation/mood) gets its own
// diminishing curve; ceilings sum to 100.
export function calcHabitsScore(log) {
  const focusPts      = diminishing(log.focus_minutes || 0, 42, 30)
  const readingPts    = diminishing(log.reading_minutes || 0, 24, 12)
  const meditationPts = diminishing(log.meditation_minutes || 0, 18, 8)
  const moodPts        = diminishing(log.mood || 0, 16, 3)
  return Math.min(100, Math.round(focusPts + readingPts + meditationPts + moodPts))
}

// ── FOCUS ──────────────────────────────────────────────────────────────────────
// REDESIGNED: diminishing curves, ceilings sum to 100. 140 min of focus
// alone lands ~45 — nowhere near maxing the pillar, per the explicit
// example in the design brief.
export function calcFocusScore(log) {
  const focusPts      = diminishing(log.focus_minutes || 0, 55, 32)
  const readingPts    = diminishing(log.reading_minutes || 0, 28, 14)
  const meditationPts = diminishing(log.meditation_minutes || 0, 17, 7)
  return Math.min(100, Math.round(focusPts + readingPts + meditationPts))
}

// ── LONGEVITY ──────────────────────────────────────────────────────────────────
// REDESIGNED: sleep sub-term now uses the same bell curve; base ceiling
// stays well under 90 in practice (safety cap unchanged at 90). Blend with
// real food-longevity data shifted further toward the food data (40/60),
// since the base alone still can't assess genuine dietary quality.
export function calcLongevityScore(log, fitnessScore, nutritionScore, foods = []) {
  const sleepPts = sleepHoursCurve(Number(log.sleep_hours) || 0, 22) * qualityFactor(log.sleep_quality)
  const hydrationPts = diminishing(log.water_ml || 0, 13, 1400)
  const base = Math.min(90, Math.round(
    sleepPts + fitnessScore * 0.22 + nutritionScore * 0.22 + hydrationPts
  ))
  const fl = calcFoodLongevityScore(foods)
  return fl != null
    ? Math.min(100, Math.round(base * 0.4 + fl * 0.6))
    : base
}

// ── FUTURE SELF SCORE ──────────────────────────────────────────────────────────
// Weights unchanged (25/25/20/15/15), cap unchanged (97). Streak
// multiplier floor widened 0.7 → 0.65 per confirmed choice — sharper
// separation between a single great day (no streak) and sustained
// consistency, while the top end (100-day streak → 1.0x) is unchanged.
export function calcFutureSelfScore(scores, streakDays) {
  const c = 0.65 + (Math.min(streakDays, 100) / 100) * 0.35
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
  const c = 0.65 + (Math.min(streakDays, 100) / 100) * 0.35

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
  const c = 0.65 + (Math.min(streakDays, 100) / 100) * 0.35
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
// UNCHANGED thresholds — but flagging a real side effect: the nutrition
// bonus (calcNutritionFromServings >= 50) is now much harder to reach via
// servings alone (base tops ~50-55 asymptotically), since 50+ increasingly
// requires real food-quality logging. Worth revisiting if daily XP feels
// too hard to earn on days without detailed food logging — see Limitations.
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
// RE-RECALIBRATED for this second, more aggressive curve pass (supersedes
// the previous 45/45/7.5/7/2200 version):
//  - nutrition: 45 → 35. Under the new curve, servings-only base tops out
//    ~50-55 asymptotically; 45 would effectively require food-quality
//    logging every single day to ever hit "perfect day," which conflicts
//    with "don't over-correct." 35 stays a real, meaningful bar reachable
//    through strong servings alone.
//  - fitness: 45 → 52. Under the new duration curve, 45 was reachable with
//    only ~20min (100*20/45 ≈ 44) — too low a bar for "perfect day" now
//    that the curve itself is gentler at low durations. 52 requires a
//    genuine ~30min+ session.
//  - sleep_hours, mood, water_ml: unchanged — these check raw logged
//    values directly, not curve output, so they're unaffected by the
//    formula redesign.
export function isPerfectDay(log, foods = []) {
  const s = buildAllScores(log, 0, foods)
  return (
    s.nutrition_score >= 35 &&
    s.fitness_score   >= 52 &&
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

// UNCHANGED — legacy EMA-based projection, not used by the real Future
// Self Projection card (which is projectFutureSelf in futureProjection.js).
// Left as-is; not part of this redesign's scope.
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