import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getToken, getSessionUser, setSession, clearSession, authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSessionUser())
  const [booting, setBooting] = useState(Boolean(getToken()))

  useEffect(() => {
    let cancelled = false
    if (getToken()) {
      authApi
        .me()
        .then((me) => {
          if (!cancelled) setSession(getToken(), me)
          if (!cancelled) setUser(me)
        })
        .catch(() => {
          if (!cancelled) clearSession()
          if (!cancelled) setUser(null)
        })
        .finally(() => {
          if (!cancelled) setBooting(false)
        })
    }
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      booting,
      async login(email, password, remember = true) {
        const { token, user: u } = await authApi.login(email, password)
        setSession(token, u, remember)
        setUser(u)
        return u
      },
      async register(data, remember = true) {
        const { token, user: u } = await authApi.register(data)
        setSession(token, u, remember)
        setUser(u)
        return u
      },
      async updateProfile(data) {
        const updated = await authApi.updateMe(data)
        setSession(getToken(), updated)
        setUser(updated)
        return updated
      },
      logout() {
        clearSession()
        setUser(null)
      },
    }),
    [user, booting]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
