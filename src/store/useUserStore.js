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

export const useUserStore = create((set, get) => ({
  user: null,
  profile: null,
  todayLog: null,
  recentScores: [],
  recentLogs: [],
  earnedAchievements: [],
  userChallenges: [],
  savedMeals: [],
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

      const [todayLogRes, logsRes, achievementsRes, challengesRes, savedMealsRes] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('log_date', today)
          .maybeSingle(),
        supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', userId)
          .order('log_date', { ascending: false })
          .limit(30),
        supabase.from('achievements').select('achievement_key').eq('user_id', userId),
        supabase.from('user_challenges').select('*').eq('user_id', userId),
        supabase.from('saved_meals').select('*').eq('user_id', userId),
      ])

      const todayLog = todayLogRes.error ? null : todayLogRes.data
      const recentLogs = logsRes.data || []
      const recentScores = recentLogs.map((r) => r.future_self_score)
      const earnedAchievements = (achievementsRes.data || []).map((a) => a.achievement_key)
      const userChallenges = challengesRes.data || []
      const savedMeals = savedMealsRes.data || []

      set({
        profile,
        todayLog,
        recentLogs,
        recentScores,
        earnedAchievements,
        userChallenges,
        savedMeals,
        dataLoading: false,
      })
    } catch (err) {
      console.error('loadUserData failed:', err)
      set({ dataLoading: false })
    }
  },

  // Optimistically adds a saved meal, then persists it to Supabase.
  // On success the temporary row is replaced with the real DB row (real id).
  // On failure the optimistic row is rolled back.
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

  // Optimistically removes a saved meal, then deletes it from Supabase.
  // Rolls back if the delete fails.
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

  reset: () =>
    set({
      user: null,
      profile: null,
      todayLog: null,
      recentScores: [],
      recentLogs: [],
      earnedAchievements: [],
      userChallenges: [],
      savedMeals: [],
      dataLoading: false,
    }),
}))