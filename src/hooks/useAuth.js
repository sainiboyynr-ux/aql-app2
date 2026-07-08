import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setCompany(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(uid) {
    const { data: prof } = await supabase
      .from('profiles').select('*').eq('id', uid).single()
    setProfile(prof)
    if (prof?.company_id) {
      const { data: comp } = await supabase
        .from('companies').select('*').eq('id', prof.company_id).single()
      setCompany(comp)
    }
    setLoading(false)
  }

  async function login(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function logout() {
    return supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  return { user, profile, company, loading, login, logout, refreshProfile }
}
