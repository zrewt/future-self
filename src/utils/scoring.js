/** @param {object} log */

function legacyNutrition(log) {
  return Math.min(100, Math.round((log.meal_quality || 0) * 0.6 + ((log.water_ml || 0) / 3000) * 40))
}

function legacyFitness(log) {
  return Math.min(100, Math.round((log.exercise_intensity || 0) * 0.7 + (log.sleep_quality || 5) * 3))
}

export function calcNutritionFromServings(log) {
  const fruit = log.fruit_servings ?? 0
  const veg = log.vegetable_servings ?? 0
  const protein = log.protein_servings ?? 0
  const processed = log.processed_servings ?? 0

  if (fruit + veg + protein + processed === 0 && (log.meal_quality || 0) > 0) {
    return legacyNutrition(log)
  }

  let score =
    (Math.min(fruit, 3) / 3) * 25 +
    (Math.min(veg, 4) / 4) * 30 +
    (Math.min(protein, 3) / 3) * 30 +
    Math.min((log.water_ml || 0) / 2500, 1) * 15 -
    Math.min(processed, 5) * 8

  return Math.min(100, Math.max(0, Math.round(score)))
}

const WORKOUT_TYPE_FACTOR = { gym: 1, run: 1.1, sport: 1.05, yoga: 0.85, rest: 0.25 }

export function calcFitnessFromWorkout(log) {
  const duration = log.workout_duration_min ?? 0
  const type = log.exercise_type || 'rest'

  if (duration === 0 && type === 'rest' && !(log.exercise_intensity > 0)) return 0
  if (duration === 0 && (log.exercise_intensity || 0) > 0) return legacyFitness(log)

  const factor = WORKOUT_TYPE_FACTOR[type] ?? 0.5
  const durationScore = Math.min(duration / 45, 1) * 75 * factor
  return Math.min(100, Math.round(durationScore + (log.sleep_quality || 5) * 1.5))
}

export function calcEnergyFromSleep(log) {
  const hours = Number(log.sleep_hours) || 0
  const quality = log.sleep_quality || 5
  const mood = log.mood || 5
  const water = Math.min((log.water_ml || 0) / 3000, 1) * 15
  return Math.min(100, Math.round((hours / 8) * 50 + quality * 4 + mood * 2 + water))
}

export function calcFocusScore(log) {
  return Math.min(
    100,
    Math.round(
      ((log.focus_minutes || 0) / 90) * 60 +
        ((log.reading_minutes || 0) / 30) * 25 +
        ((log.meditation_minutes || 0) / 10) * 15
    )
  )
}

export function calcLongevityScore(log, fitnessScore, nutritionScore) {
  return Math.min(
    100,
    Math.round(
      (Number(log.sleep_hours || 0) / 8) * 30 +
        fitnessScore * 0.25 +
        nutritionScore * 0.25 +
        Math.min((log.water_ml || 0) / 3000, 1) * 20
    )
  )
}

export function calcFutureSelfScore(scores, streakDays) {
  const consistency = 0.7 + (Math.min(streakDays, 100) / 100) * 0.3
  const weighted =
    scores.fitness * 0.25 +
    scores.nutrition * 0.2 +
    scores.energy * 0.2 +
    scores.focus * 0.15 +
    scores.longevity * 0.15 +
    scores.mood * 0.05
  return Math.min(100, Math.round(weighted * consistency))
}

export function buildAllScores(log, streakDays = 0) {
  const fitness = calcFitnessFromWorkout(log)
  const nutrition = calcNutritionFromServings(log)
  const energy = calcEnergyFromSleep(log)
  const focus = calcFocusScore(log)
  const longevity = calcLongevityScore(log, fitness, nutrition)
  const mood = (log.mood || 5) * 10
  const future_self_score = calcFutureSelfScore(
    { fitness, nutrition, energy, focus, longevity, mood },
    streakDays
  )

  return {
    fitness_score: fitness,
    nutrition_score: nutrition,
    energy_score: energy,
    focus_score: focus,
    longevity_score: longevity,
    future_self_score,
    mood_score: mood,
  }
}

export function getScoreBreakdown(scores, streakDays) {
  const consistency = 0.7 + (Math.min(streakDays, 100) / 100) * 0.3
  const weights = {
    fitness: 0.25,
    nutrition: 0.2,
    energy: 0.2,
    focus: 0.15,
    longevity: 0.15,
    mood: 0.05,
  }
  const items = [
    { key: 'fitness', label: 'Fitness', weight: weights.fitness, value: scores.fitness },
    { key: 'nutrition', label: 'Nutrition', weight: weights.nutrition, value: scores.nutrition },
    { key: 'energy', label: 'Energy', weight: weights.energy, value: scores.energy },
    { key: 'focus', label: 'Focus', weight: weights.focus, value: scores.focus },
    { key: 'longevity', label: 'Longevity', weight: weights.longevity, value: scores.longevity },
    { key: 'mood', label: 'Mood', weight: weights.mood, value: scores.mood },
  ]

  return items.map((item) => ({
    ...item,
    points: Math.round(item.value * item.weight * consistency),
    percent: Math.round(item.weight * consistency * 100),
  }))
}

export function calcXP(log, streakDays, questXP = 0) {
  let base = 0
  const fitness = calcFitnessFromWorkout(log)
  const nutrition = calcNutritionFromServings(log)

  if (fitness >= 50 || (log.workout_duration_min || 0) >= 20) base += 25
  if (nutrition >= 50) base += 15
  if (Number(log.sleep_hours) >= 7.5) base += 20
  if ((log.water_ml || 0) >= 2500) base += 10
  if ((log.focus_minutes || 0) >= 60) base += 20
  if ((log.reading_minutes || 0) >= 20) base += 15
  if ((log.meditation_minutes || 0) >= 10) base += 10
  if (log.is_perfect_day) base += 50

  const streakBonus = Math.floor(streakDays / 7) * 5
  return base + streakBonus + questXP
}

export function isPerfectDay(log) {
  const scores = buildAllScores(log, 0)
  return (
    scores.nutrition_score >= 55 &&
    scores.fitness_score >= 50 &&
    Number(log.sleep_hours) >= 7 &&
    (log.mood || 0) >= 7 &&
    (log.water_ml || 0) >= 2000
  )
}

export function getLevelFromXP(totalXP) {
  for (let n = 1; n <= 99; n++) {
    if (totalXP < Math.floor(100 * Math.pow(n, 1.8))) return n
  }
  return 99
}

export function getLevelName(level) {
  if (level <= 4) return 'Initiate'
  if (level <= 9) return 'Builder'
  if (level <= 19) return 'Disciplined'
  if (level <= 34) return 'Elite'
  if (level <= 49) return 'Master'
  return 'Future Legend'
}

export function getXPForLevel(level) {
  if (level <= 1) return 0
  return Math.floor(100 * Math.pow(level - 1, 1.8))
}

export function getXPForNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.8))
}

/** @deprecated use computeFutureProjection */
export function calcProjection(recentScores, daysAhead) {
  if (!recentScores || recentScores.length < 3) return null
  let ema = recentScores[0]
  const alpha = 0.1
  for (const score of recentScores) ema = alpha * score + (1 - alpha) * ema
  const last7 = recentScores.slice(0, 7)
  const prev7 = recentScores.slice(7, 14)
  const avg7 = last7.reduce((a, b) => a + b, 0) / last7.length
  const avgPrev = prev7.length ? prev7.reduce((a, b) => a + b, 0) / prev7.length : avg7
  const momentum = (avg7 - avgPrev) / 7
  const decay = Math.max(0, (ema - 70) / 100)
  const projected = ema + momentum * daysAhead * (1 - decay)
  return Math.round(Math.min(99, Math.max(ema - 5, projected)))
}
