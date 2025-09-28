import { useState, useEffect } from 'react'

const SESSION_INTRO_KEY = 'winenode_intro_shown_this_session'

export const useFirstLaunch = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Controlla se l'intro è già stata mostrata in questa sessione
    const hasSeenIntroThisSession = sessionStorage.getItem(SESSION_INTRO_KEY)
    setIsFirstLaunch(!hasSeenIntroThisSession)
    setIsLoading(false)
  }, [])

  const markIntroCompleted = () => {
    sessionStorage.setItem(SESSION_INTRO_KEY, 'true')
    setIsFirstLaunch(false)
  }

  return {
    isFirstLaunch,
    isLoading,
    markIntroCompleted
  }
}
