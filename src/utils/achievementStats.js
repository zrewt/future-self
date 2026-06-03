import { ACHIEVEMENTS } from '../data/achievements'
import { supabase } from '../services/supabase'
import { getLevelFromXP } from './scoring'

export async function fetchAchievementStats(userId, profile) {
  const { data: logs, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })

  if (error) throw error

  const allLogs = logs || []
  const totalXP = profile?.total_xp ?? 0

  return {
    totalLogs: allLogs.length,
    longestStreak: profile?.longest_streak ?? 0,
    currentStreak: profile?.current_streak ?? 0,
    perfectDays: allLogs.filter((l) => l.is_perfect_day).length,
    waterGoalDays: allLogs.filter((l) => (l.water_ml || 0) >= 2500).length,
    sleepGoalDays: allLogs.filter((l) => Number(l.sleep_hours) >= 7).length,
    vegGoalDays: allLogs.filter((l) => (l.vegetable_servings || 0) >= 3).length,
    totalFocusMinutes: allLogs.reduce((sum, l) => sum + (l.focus_minutes || 0), 0),
    totalReadingMinutes: allLogs.reduce((sum, l) => sum + (l.reading_minutes || 0), 0),
    workoutDays: allLogs.filter(
      (l) => (l.workout_duration_min || 0) >= 15 || (l.exercise_type && l.exercise_type !== 'rest')
    ).length,
    bestFitnessScore: allLogs.reduce((max, l) => Math.max(max, l.fitness_score || 0), 0),
    bestFutureSelfScore: allLogs.reduce((max, l) => Math.max(max, l.future_self_score || 0), 0),
    readingDays: allLogs.filter((l) => (l.reading_minutes || 0) > 0).length,
    level: profile?.level ?? getLevelFromXP(totalXP),
    totalXP,
    avgLongevity: allLogs.length
      ? Math.round(allLogs.reduce((s, l) => s + (l.longevity_score || 0), 0) / allLogs.length)
      : 0,
  }
}

export async function checkAndAwardAchievements(userId, profile, earnedKeys) {
  const stats = await fetchAchievementStats(userId, profile)
  const newlyEarned = []
  let bonusXP = 0

  for (const ach of ACHIEVEMENTS) {
    if (earnedKeys.includes(ach.key)) continue
    if (!ach.check(stats)) continue

    const { error } = await supabase.from('achievements').insert({
      user_id: userId,
      achievement_key: ach.key,
      tier: ach.tier,
      xp_awarded: ach.xp,
    })

    if (!error) {
      newlyEarned.push(ach.key)
      bonusXP += ach.xp
    }
  }

  return { newlyEarned, bonusXP, stats }
}
