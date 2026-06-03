import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'

/**
 * Single auth bootstrap. Defers onAuthStateChange async work to avoid
 * deadlocks with getSession().
 */
export function useAuthInit() {
  const { setUser, setAuthReady, loadUserData, reset } = useUserStore()
  const initDone = useRef(false)

  useEffect(() => {
    let mounted = true

    async function initSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await loadUserData(session.user.id)
        } else {
          reset()
        }
      } catch (err) {
        console.error('Auth init failed:', err)
        if (mounted) reset()
      } finally {
        if (mounted) {
          initDone.current = true
          setAuthReady(true)
        }
      }
    }

    initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted || !initDone.current) return
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return

      setTimeout(async () => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await loadUserData(session.user.id, { silent: true })
        } else if (event === 'SIGNED_OUT') {
          reset()
        }
      }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setAuthReady, loadUserData, reset])
}
