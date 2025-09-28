// Utility per testare il reset del primo avvio
// Da usare solo in sviluppo per testare l'IntroPage

export const resetFirstLaunch = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('winenode_first_launch_completed')
    console.log('🔄 First launch reset - ricarica la pagina per vedere l\'intro')
  }
}

// Esponi la funzione globalmente in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).resetFirstLaunch = resetFirstLaunch
}
