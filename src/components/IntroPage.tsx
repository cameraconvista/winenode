import { useEffect, useState } from 'react'

interface IntroPageProps {
  onComplete: () => void
}

const IntroPage = ({ onComplete }: IntroPageProps) => {
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    // Fade in immediato
    setFadeIn(true)
    
    // Timer di 5 secondi
    const timer = setTimeout(() => {
      onComplete()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-4">
      <div 
        className={`flex items-center justify-center transition-opacity duration-500 ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <img 
          src="/logo1.png" 
          alt="WineNode Logo" 
          className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-auto object-contain"
          style={{ 
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
            maxHeight: '60vh'
          }}
        />
      </div>
    </div>
  )
}

export default IntroPage
