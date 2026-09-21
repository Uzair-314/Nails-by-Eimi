import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getUser } from '../lib/api'

const AuthContext = createContext(null)

/**
 * Supabase session plus the matching profile row. `profile.isAdmin` is what
 * gates the admin area in the UI — the database enforces the same rule
 * independently through row level security, so hiding the link is convenience,
 * not the actual protection.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // A recovery link signs the customer in and leaves it to the app to ask for
  // the new password. Without this flag the link just drops them into their
  // account already logged in, and the password never actually changes.
  const [recovery, setRecovery] = useState(false)

  const refreshProfile = useCallback(async () => {
    try {
      setProfile(await getUser())
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) await refreshProfile()
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (!active) return
      setSession(next)
      if (next) await refreshProfile()
      else setProfile(null)
    })

    return () => { active = false; sub.subscription.unsubscribe() }
  }, [refreshProfile])

  const value = useMemo(() => ({
    recovery,
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isSignedIn: !!session,
    isAdmin: !!profile?.isAdmin,
    refreshProfile,

    signUp: async ({ email, password, firstName, lastName }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName, last_name: lastName } },
      })
      if (error) throw error
      // With email confirmation on, there is no session until they confirm.
      return { needsConfirmation: !data.session }
    },

    signIn: async ({ email, password }) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },

    signOut: async () => {
      await supabase.auth.signOut()
      setProfile(null)
    },

    resetPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account/settings`,
      })
      if (error) throw error
    },

    /**
     * Supabase enforces the project's password rules here, not at sign-in, so
     * this is where a weak password is actually refused. Its error says which
     * rule failed, so it is passed through rather than replaced.
     */
    changePassword: async (password) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setRecovery(false)
    },
  }), [session, profile, loading, recovery, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
