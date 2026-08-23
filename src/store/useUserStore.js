import { create } from 'zustand'
import { supabase } from '../services/supabase'
import { localDateISO } from '../utils/date'

async function fetchOrCreateProfile(userId, user) {
  const { data: existing } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (existing) return existing

  const username =
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    'User'

  const { data: created, error } = await supabase
    .from('users_profile')
    .insert({ id: userId, username })
    .select()
    .single()

  if (error) {
    console.error('Could not create profile:', error.message)
    return null
  }

  return created
}

export function needsOnboarding(user, profile) {
  if (!user) return false
  const metaDone = user.user_metadata?.onboarding_complete === true
  return !profile || !metaDone
}

function daysAgoISO(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export const useUserStore = create((set, get) => ({
  user: null,
  profile: null,
  todayLog: null,
  recentScores: [],
  recentLogs: [],
  trendLogs: [],
  projectionLogs: [],
  earnedAchievements: [],
  achievementEvents: [],
  userChallenges: [],
  savedMeals: [],
  habits: [],
  habitLogs: [],
  authReady: false,
  dataLoading: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setTodayLog: (todayLog) => set({ todayLog }),
  setRecentScores: (recentScores) => set({ recentScores }),
  setRecentLogs: (recentLogs) => set({ recentLogs }),
  setEarnedAchievements: (earnedAchievements) => set({ earnedAchievements }),
  setUserChallenges: (userChallenges) => set({ userChallenges }),
  setSavedMeals: (savedMeals) => set({ savedMeals }),
  setAuthReady: (authReady) => set({ authReady }),

  loadUserData: async (userId, { silent = false } = {}) => {
    if (!userId) return
    if (!silent) set({ dataLoading: true })

    const today = localDateISO()
    const user = get().user

    try {
      const profile = await fetchOrCreateProfile(userId, user)

      if (profile && profile.last_active_date !== today) {
        supabase.from('users_profile').update({ last_active_date: today }).eq('id', userId)
      }

      const [
        todayLogRes, logsRes, trendLogsRes, projectionLogsRes,
        achievementsRes, challengesRes, savedMealsRes,
        habitsRes, habitLogsRes,
      ] = await Promise.all([
        supabase.from('daily_logs').select('*').eq('user_id', userId).eq('log_date', today).maybeSingle(),
        supabase.from('daily_logs').select('*').eq('user_id', userId).order('log_date', { ascending: false }).limit(30),
        supabase.from('daily_logs').select('log_date, future_self_score, nutrition_score, fitness_score, energy_score, focus_score, longevity_score').eq('user_id', userId).order('log_date', { ascending: false }).limit(90),
        supabase.from('daily_logs').select('*').eq('user_id', userId).order('log_date', { ascending: false }).limit(90),
        supabase.from('achievements').select('achievement_key, earned_at').eq('user_id', userId),
        supabase.from('user_challenges').select('*').eq('user_id', userId),
        supabase.from('saved_meals').select('*').eq('user_id', userId),
        supabase.from('habits').select('*').eq('user_id', userId).eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('habit_logs').select('*').eq('user_id', userId).gte('log_date', daysAgoISO(56)).order('log_date', { ascending: false }),
      ])

      const todayLog = todayLogRes.error ? null : todayLogRes.data
      const recentLogs = logsRes.data || []
      const trendLogs = trendLogsRes.data || []
      const projectionLogs = projectionLogsRes.data || []
      const recentScores = recentLogs.map((r) => r.future_self_score)
      const earnedAchievements = (achievementsRes.data || []).map((a) => a.achievement_key)
      const achievementEvents = (achievementsRes.data || []).map((a) => ({
        key: a.achievement_key,
        earned_at: a.earned_at,
      }))
      const userChallenges = challengesRes.data || []
      const savedMeals = savedMealsRes.data || []
      const habits = habitsRes.data || []
      const habitLogs = habitLogsRes.data || []

      set({
        profile,
        todayLog,
        recentLogs,
        trendLogs,
        projectionLogs,
        recentScores,
        earnedAchievements,
        achievementEvents,
        userChallenges,
        savedMeals,
        habits,
        habitLogs,
        dataLoading: false,
      })
    } catch (err) {
      console.error('loadUserData failed:', err)
      set({ dataLoading: false })
    }
  },

  addSavedMeal: async (name, foods) => {
    const userId = get().user?.id
    if (!userId) return

    const tempId = crypto.randomUUID()
    const optimisticMeal = { id: tempId, user_id: userId, name, foods, _saving: true }

    set((state) => ({ savedMeals: [optimisticMeal, ...state.savedMeals] }))

    const { data, error } = await supabase
      .from('saved_meals')
      .insert({ user_id: userId, name, foods })
      .select()
      .single()

    if (error) {
      console.error('addSavedMeal failed:', error.message)
      set((state) => ({ savedMeals: state.savedMeals.filter((m) => m.id !== tempId) }))
      return
    }

    set((state) => ({
      savedMeals: state.savedMeals.map((m) => (m.id === tempId ? data : m)),
    }))
  },

  deleteSavedMeal: async (id) => {
    const userId = get().user?.id
    if (!userId) return

    const prev = get().savedMeals
    set({ savedMeals: prev.filter((m) => m.id !== id) })

    const { error } = await supabase.from('saved_meals').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      console.error('deleteSavedMeal failed:', error.message)
      set({ savedMeals: prev })
    }
  },

  addHabit: async (habit) => {
    const userId = get().user?.id
    if (!userId) return

    const { data, error } = await supabase
      .from('habits')
      .insert({ user_id: userId, ...habit })
      .select()
      .single()

    if (error) {
      console.error('addHabit failed:', error.message)
      return
    }

    set((state) => ({ habits: [...state.habits, data] }))
  },

  archiveHabit: async (habitId) => {
    const userId = get().user?.id
    if (!userId) return

    const prev = get().habits
    set({ habits: prev.filter((h) => h.id !== habitId) })

    const { error } = await supabase
      .from('habits')
      .update({ archived: true })
      .eq('id', habitId)
      .eq('user_id', userId)

    if (error) {
      console.error('archiveHabit failed:', error.message)
      set({ habits: prev })
    }
  },

  logHabitProgress: async (habit, value, completed) => {
    const userId = get().user?.id
    const profile = get().profile
    if (!userId || !profile) return

    const today = localDateISO()
    const prevLogs = get().habitLogs
    const existing = prevLogs.find((l) => l.habit_id === habit.id && l.log_date === today)
    const wasComplete = existing
      ? (habit.tracking_type === 'boolean' ? existing.completed : existing.value >= (habit.target_value || 0))
      : false

    const row = {
      habit_id: habit.id,
      user_id: userId,
      log_date: today,
      value,
      completed,
    }

    const optimisticLogs = existing
      ? prevLogs.map((l) => (l.habit_id === habit.id && l.log_date === today ? { ...l, ...row } : l))
      : [row, ...prevLogs]
    set({ habitLogs: optimisticLogs })

    const { data, error } = await supabase
      .from('habit_logs')
      .upsert(row, { onConflict: 'habit_id,log_date' })
      .select()
      .single()

    if (error) {
      console.error('logHabitProgress failed:', error.message)
      set({ habitLogs: prevLogs })
      return
    }

    set((state) => ({
      habitLogs: state.habitLogs.map((l) => (l.habit_id === habit.id && l.log_date === today ? data : l)),
    }))

    const nowComplete = habit.tracking_type === 'boolean' ? completed : value >= (habit.target_value || 0)
    if (nowComplete && !wasComplete) {
      const { xpForCompletion } = await import('../utils/habits')
      const xpGain = xpForCompletion(habit)
      const { getLevelFromXP } = await import('../utils/scoring')
      const newTotalXP = profile.total_xp + xpGain
      const newLevel = getLevelFromXP(newTotalXP)

      await supabase.from('users_profile').update({ total_xp: newTotalXP, level: newLevel }).eq('id', userId)
      set({ profile: { ...profile, total_xp: newTotalXP, level: newLevel } })
    }
  },

  reset: () =>
    set({
      user: null,
      profile: null,
      todayLog: null,
      recentScores: [],
      recentLogs: [],
      trendLogs: [],
      projectionLogs: [],
      earnedAchievements: [],
      achievementEvents: [],
      userChallenges: [],
      savedMeals: [],
      habits: [],
      habitLogs: [],
      dataLoading: false,
    }),
}))