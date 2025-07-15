import { useState, useEffect } from 'react'
import { authManager, type AuthUser } from '../lib/supabase'

export function useAuthManager() {
  const [user, setUser] = useState<AuthUser>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)

    // Ottieni l'utente corrente
    const currentUser = authManager.getCurrentUser()
    setUser(currentUser)
    setIsAuthenticated(!!currentUser)
    setIsLoading(false)

    // Ascolta i cambiamenti di stato
    const unsubscribe = authManager.onAuthStateChange((newUser) => {
      setUser(newUser)
      setIsAuthenticated(!!newUser)
      setIsLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const getUserId = async (): Promise<string | null> => {
    try {
      // Prima prova con l'utente corrente
      if (user?.id) {
        return user.id
      }
      
      // Fallback: usa authManager senza accesso diretto a supabase
      return authManager.getUserId()
    } catch (error) {
      console.error('❌ Error getting user ID:', error)
      return null
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    userId: user?.id || null,
    signIn: authManager.signIn.bind(authManager),
    signOut: authManager.signOut.bind(authManager),
    signUp: authManager.signUp.bind(authManager),
    validateSession: authManager.validateSession.bind(authManager),
    getUserId,
  }
}