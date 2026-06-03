/** @typedef {{ totalLogs: number, longestStreak: number, currentStreak: number, perfectDays: number, waterGoalDays: number, sleepGoalDays: number, totalFocusMinutes: number, totalReadingMinutes: number, workoutDays: number, bestFitnessScore: number, bestFutureSelfScore: number, readingDays: number, level: number, totalXP: number, avgLongevity: number, fruitDays: number }} Stats */

export const ACHIEVEMENTS = [
  // Streaks
  { key: 'first_log', category: 'streak', name: 'First Step', desc: 'Complete your first log', icon: '🚀', tier: 'bronze', xp: 100, check: (s) => s.totalLogs >= 1, progress: (s) => ({ current: Math.min(s.totalLogs, 1), target: 1 }) },
  { key: 'streak_3', category: 'streak', name: 'Spark', desc: '3-day streak', icon: '✨', tier: 'bronze', xp: 75, check: (s) => s.longestStreak >= 3, progress: (s) => ({ current: s.longestStreak, target: 3 }) },
  { key: 'streak_7', category: 'streak', name: 'First Flame', desc: '7-day streak', icon: '🔥', tier: 'bronze', xp: 100, check: (s) => s.longestStreak >= 7, progress: (s) => ({ current: s.longestStreak, target: 7 }) },
  { key: 'streak_14', category: 'streak', name: 'Fortnight', desc: '14-day streak', icon: '📅', tier: 'silver', xp: 200, check: (s) => s.longestStreak >= 14, progress: (s) => ({ current: s.longestStreak, target: 14 }) },
  { key: 'streak_30', category: 'streak', name: 'Iron Discipline', desc: '30-day streak', icon: '💪', tier: 'silver', xp: 500, check: (s) => s.longestStreak >= 30, progress: (s) => ({ current: s.longestStreak, target: 30 }) },
  { key: 'streak_100', category: 'streak', name: 'Century', desc: '100-day streak', icon: '🏆', tier: 'legendary', xp: 2000, check: (s) => s.longestStreak >= 100, progress: (s) => ({ current: s.longestStreak, target: 100 }) },

  // Sleep
  { key: 'sleep_7', category: 'sleep', name: 'Well Rested', desc: '7 nights with 7+ hours sleep', icon: '😴', tier: 'bronze', xp: 150, check: (s) => s.sleepGoalDays >= 7, progress: (s) => ({ current: s.sleepGoalDays, target: 7 }) },
  { key: 'sleep_30', category: 'sleep', name: 'Sleep Champion', desc: '30 nights with 7+ hours', icon: '🌙', tier: 'gold', xp: 400, check: (s) => s.sleepGoalDays >= 30, progress: (s) => ({ current: s.sleepGoalDays, target: 30 }) },

  // Fitness
  { key: 'workout_7', category: 'fitness', name: 'Active Week', desc: '7 workout days', icon: '🏃', tier: 'bronze', xp: 150, check: (s) => s.workoutDays >= 7, progress: (s) => ({ current: s.workoutDays, target: 7 }) },
  { key: 'workout_30', category: 'fitness', name: 'Athlete', desc: '30 workout days', icon: '🏋️', tier: 'silver', xp: 350, check: (s) => s.workoutDays >= 30, progress: (s) => ({ current: s.workoutDays, target: 30 }) },
  { key: 'fitness_90', category: 'fitness', name: 'Elite Athlete', desc: 'Fitness score 90+', icon: '🎯', tier: 'gold', xp: 300, check: (s) => s.bestFitnessScore >= 90, progress: (s) => ({ current: s.bestFitnessScore, target: 90 }) },

  // Nutrition
  { key: 'hydro_7', category: 'nutrition', name: 'Hydrated Week', desc: '7 days hitting water goal', icon: '💧', tier: 'bronze', xp: 100, check: (s) => s.waterGoalDays >= 7, progress: (s) => ({ current: s.waterGoalDays, target: 7 }) },
  { key: 'hydro_30', category: 'nutrition', name: 'Hydro King', desc: '30 days water goal', icon: '🌊', tier: 'silver', xp: 200, check: (s) => s.waterGoalDays >= 30, progress: (s) => ({ current: s.waterGoalDays, target: 30 }) },
  { key: 'greens_30', category: 'nutrition', name: 'Plant Powered', desc: '30 days with 3+ veg servings', icon: '🥬', tier: 'silver', xp: 250, check: (s) => s.vegGoalDays >= 30, progress: (s) => ({ current: s.vegGoalDays, target: 30 }) },

  // Reading
  { key: 'read_7', category: 'reading', name: 'Page Turner', desc: '7 days of reading', icon: '📖', tier: 'bronze', xp: 120, check: (s) => s.readingDays >= 7, progress: (s) => ({ current: s.readingDays, target: 7 }) },
  { key: 'bookworm', category: 'reading', name: 'Bookworm', desc: '30 days reading logged', icon: '📚', tier: 'silver', xp: 300, check: (s) => s.readingDays >= 30, progress: (s) => ({ current: s.readingDays, target: 30 }) },

  // Focus
  { key: 'focus_10h', category: 'focus', name: 'Focused', desc: '10 hours focus logged', icon: '🧠', tier: 'bronze', xp: 150, check: (s) => s.totalFocusMinutes >= 600, progress: (s) => ({ current: Math.floor(s.totalFocusMinutes / 60), target: 10 }) },
  { key: 'focus_100h', category: 'focus', name: 'Deep Thinker', desc: '100 hours focus', icon: '💡', tier: 'gold', xp: 500, check: (s) => s.totalFocusMinutes >= 6000, progress: (s) => ({ current: Math.floor(s.totalFocusMinutes / 60), target: 100 }) },

  // Longevity / FSS
  { key: 'fss_70', category: 'longevity', name: 'Rising Star', desc: 'Future Self Score 70+', icon: '⭐', tier: 'silver', xp: 250, check: (s) => s.bestFutureSelfScore >= 70, progress: (s) => ({ current: s.bestFutureSelfScore, target: 70 }) },
  { key: 'fss_80', category: 'longevity', name: 'Future Unlocked', desc: 'Future Self Score 80+', icon: '🔮', tier: 'gold', xp: 400, check: (s) => s.bestFutureSelfScore >= 80, progress: (s) => ({ current: s.bestFutureSelfScore, target: 80 }) },
  { key: 'perfect_week', category: 'longevity', name: 'Perfect Week', desc: '7 perfect days', icon: '🌟', tier: 'silver', xp: 250, check: (s) => s.perfectDays >= 7, progress: (s) => ({ current: s.perfectDays, target: 7 }) },

  // XP / Level
  { key: 'level_5', category: 'xp', name: 'Builder', desc: 'Reach level 5', icon: '🔨', tier: 'bronze', xp: 150, check: (s) => s.level >= 5, progress: (s) => ({ current: s.level, target: 5 }) },
  { key: 'level_10', category: 'xp', name: 'Disciplined', desc: 'Reach level 10', icon: '✨', tier: 'silver', xp: 300, check: (s) => s.level >= 10, progress: (s) => ({ current: s.level, target: 10 }) },
  { key: 'level_20', category: 'xp', name: 'Elite', desc: 'Reach level 20', icon: '👁️', tier: 'gold', xp: 600, check: (s) => s.level >= 20, progress: (s) => ({ current: s.level, target: 20 }) },
  { key: 'xp_5000', category: 'xp', name: 'XP Collector', desc: 'Earn 5,000 total XP', icon: '💎', tier: 'gold', xp: 400, check: (s) => s.totalXP >= 5000, progress: (s) => ({ current: s.totalXP, target: 5000 }) },
  { key: 'xp_25000', category: 'xp', name: 'XP Legend', desc: 'Earn 25,000 total XP', icon: '👑', tier: 'legendary', xp: 1500, check: (s) => s.totalXP >= 25000, progress: (s) => ({ current: s.totalXP, target: 25000 }) },
]

export const ACHIEVEMENT_CATEGORIES = [
  'streak',
  'sleep',
  'fitness',
  'nutrition',
  'reading',
  'focus',
  'longevity',
  'xp',
]
