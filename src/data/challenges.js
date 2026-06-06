export const CHALLENGES = [
    {
      id: 'lock_in_7',
      name: '7-Day Lock In',
      emoji: '🔒',
      desc: 'Log every single day for 7 days straight. No breaks, no excuses.',
      duration: 7,
      category: 'streak',
      color: '#7F77DD',
      badge: 'Iron Will',
      badgeIcon: '🏅',
      xpReward: 500,
      check: (logs) => logs.length >= 7,
      progress: (logs) => ({ current: logs.length, target: 7 }),
    },
    {
      id: 'no_junk_week',
      name: 'No Junk Food Week',
      emoji: '🥗',
      desc: 'Zero processed food servings for 7 days. Clean eating only.',
      duration: 7,
      category: 'nutrition',
      color: '#1D9E75',
      badge: 'Clean Eater',
      badgeIcon: '🥦',
      xpReward: 400,
      check: (logs) =>
        logs.length >= 7 && logs.every((l) => (l.processed_servings || 0) === 0),
      progress: (logs) => ({
        current: logs.filter((l) => (l.processed_servings || 0) === 0).length,
        target: 7,
      }),
    },
    {
      id: 'summer_cut',
      name: 'Summer Cut',
      emoji: '🌊',
      desc: 'Work out 5+ days and hit 2.5L water daily for 2 weeks.',
      duration: 14,
      category: 'fitness',
      color: '#D85A30',
      badge: 'Shredded',
      badgeIcon: '🔥',
      xpReward: 750,
      check: (logs) => {
        const workoutDays = logs.filter(
          (l) => (l.workout_duration_min || 0) >= 20 || (l.exercise_type && l.exercise_type !== 'rest')
        ).length
        const waterDays = logs.filter((l) => (l.water_ml || 0) >= 2500).length
        return workoutDays >= 10 && waterDays >= 10
      },
      progress: (logs) => {
        const workoutDays = logs.filter(
          (l) => (l.workout_duration_min || 0) >= 20 || (l.exercise_type && l.exercise_type !== 'rest')
        ).length
        const waterDays = logs.filter((l) => (l.water_ml || 0) >= 2500).length
        return { current: Math.min(workoutDays, waterDays), target: 10 }
      },
    },
    {
      id: 'reading_sprint_30',
      name: '30-Day Reading Sprint',
      emoji: '📚',
      desc: 'Read at least 10 minutes every day for 30 days.',
      duration: 30,
      category: 'focus',
      color: '#EF9F27',
      badge: 'Bibliophile',
      badgeIcon: '📖',
      xpReward: 1000,
      check: (logs) =>
        logs.length >= 30 && logs.filter((l) => (l.reading_minutes || 0) >= 10).length >= 28,
      progress: (logs) => ({
        current: logs.filter((l) => (l.reading_minutes || 0) >= 10).length,
        target: 28,
      }),
    },
    {
      id: 'exam_mode',
      name: 'Exam Mode',
      emoji: '🧠',
      desc: '60+ min focus and 7+ hrs sleep every day for 10 days.',
      duration: 10,
      category: 'focus',
      color: '#7F77DD',
      badge: 'Big Brain',
      badgeIcon: '💡',
      xpReward: 600,
      check: (logs) =>
        logs.filter(
          (l) => (l.focus_minutes || 0) >= 60 && Number(l.sleep_hours) >= 7
        ).length >= 10,
      progress: (logs) => ({
        current: logs.filter(
          (l) => (l.focus_minutes || 0) >= 60 && Number(l.sleep_hours) >= 7
        ).length,
        target: 10,
      }),
    },
    {
      id: 'hydration_hero',
      name: 'Hydration Hero',
      emoji: '💧',
      desc: 'Hit 3L of water every day for 14 days.',
      duration: 14,
      category: 'nutrition',
      color: '#1D9E75',
      badge: 'Hydrated',
      badgeIcon: '🌊',
      xpReward: 450,
      check: (logs) =>
        logs.filter((l) => (l.water_ml || 0) >= 3000).length >= 14,
      progress: (logs) => ({
        current: logs.filter((l) => (l.water_ml || 0) >= 3000).length,
        target: 14,
      }),
    },
    {
      id: 'sleep_king',
      name: 'Sleep King',
      emoji: '👑',
      desc: '8+ hours sleep for 14 nights in a row.',
      duration: 14,
      category: 'sleep',
      color: '#7F77DD',
      badge: 'Well Rested',
      badgeIcon: '😴',
      xpReward: 500,
      check: (logs) =>
        logs.filter((l) => Number(l.sleep_hours) >= 8).length >= 14,
      progress: (logs) => ({
        current: logs.filter((l) => Number(l.sleep_hours) >= 8).length,
        target: 14,
      }),
    },
    {
      id: 'perfect_week',
      name: 'Perfect Week',
      emoji: '⭐',
      desc: 'Hit a perfect day score 7 days in a row.',
      duration: 7,
      category: 'streak',
      color: '#EF9F27',
      badge: 'Flawless',
      badgeIcon: '✨',
      xpReward: 700,
      check: (logs) =>
        logs.filter((l) => l.is_perfect_day).length >= 7,
      progress: (logs) => ({
        current: logs.filter((l) => l.is_perfect_day).length,
        target: 7,
      }),
    },
  ]
  
  export const CHALLENGE_CATEGORIES = ['all', 'streak', 'nutrition', 'fitness', 'focus', 'sleep']