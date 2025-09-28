// Utility per testare il reset dell'intro (cold start simulation)
// Da usare solo in sviluppo per testare l'IntroPage

export const resetIntroSession = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('winenode_intro_shown_this_session')
    console.log('🔄 Intro session reset - ricarica la pagina per vedere l\'intro')
  }
}

// Esponi la funzione globalmente in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).resetIntroSession = resetIntroSession
}
