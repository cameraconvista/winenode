import { useState, useEffect } from 'react'

const FIRST_LAUNCH_KEY = 'winenode_first_launch_completed'

export const useFirstLaunch = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Controlla se l'utente ha già visto l'intro
    const hasSeenIntro = localStorage.getItem(FIRST_LAUNCH_KEY)
    setIsFirstLaunch(!hasSeenIntro)
    setIsLoading(false)
  }, [])

  const markIntroCompleted = () => {
    localStorage.setItem(FIRST_LAUNCH_KEY, 'true')
    setIsFirstLaunch(false)
  }

  return {
    isFirstLaunch,
    isLoading,
    markIntroCompleted
  }
}
