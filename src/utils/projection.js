/** Future projection from last ~30 days of logs — simple habit-based model */

function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function computeFutureProjection(logs, currentScore = 0) {
  const current = currentScore || 0

  if (!logs?.length) {
    return {
      current,
      month6: current,
      year1: current,
      momentum: 0,
      drivers: [],
    }
  }

  const last30 = logs.slice(0, 30)
  const last7 = last30.slice(0, 7)
  const prev7 = last30.slice(7, 14)

  const sleepConsistency =
    last30.filter((l) => Number(l.sleep_hours) >= 7).length / last30.length
  const workoutFrequency =
    last30.filter(
      (l) =>
        (l.workout_duration_min || 0) >= 20 ||
        (l.exercise_type && l.exercise_type !== 'rest')
    ).length / last30.length
  const nutritionAvg = avg(last30.map((l) => l.nutrition_score || 0)) / 100
  const focusAvg = avg(last30.map((l) => l.focus_score || 0)) / 100
  const waterAvg = avg(last30.map((l) => Math.min((l.water_ml || 0) / 2500, 1)))

  const habitStrength =
    sleepConsistency * 0.25 +
    workoutFrequency * 0.25 +
    nutritionAvg * 0.2 +
    focusAvg * 0.15 +
    waterAvg * 0.15

  const fss7 = avg(last7.map((l) => l.future_self_score || 0))
  const fssPrev7 = prev7.length ? avg(prev7.map((l) => l.future_self_score || 0)) : fss7
  const momentum = (fss7 - fssPrev7) / 7

  const lift6 = habitStrength * 10 + momentum * 120
  const lift12 = habitStrength * 18 + momentum * 200

  const month6 = Math.round(Math.min(99, Math.max(current - 3, current + lift6)))
  const year1 = Math.round(Math.min(99, Math.max(current - 5, current + lift12)))

  const drivers = [
    { label: 'Sleep consistency', value: Math.round(sleepConsistency * 100), trend: sleepConsistency >= 0.6 ? 'up' : 'flat' },
    { label: 'Workout frequency', value: Math.round(workoutFrequency * 100), trend: workoutFrequency >= 0.4 ? 'up' : 'flat' },
    { label: 'Nutrition avg', value: Math.round(nutritionAvg * 100), trend: nutritionAvg >= 0.55 ? 'up' : 'flat' },
    { label: 'Focus avg', value: Math.round(focusAvg * 100), trend: focusAvg >= 0.5 ? 'up' : 'flat' },
    { label: 'Hydration', value: Math.round(waterAvg * 100), trend: waterAvg >= 0.7 ? 'up' : 'flat' },
  ]

  return {
    current: Math.round(current),
    month6,
    year1,
    momentum: Math.round(momentum * 10) / 10,
    drivers,
  }
}
