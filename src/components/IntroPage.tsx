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
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center px-4 relative">
      {/* Logo centrato */}
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
      
      {/* Footer "By DERO" in basso */}
      <div 
        className={`absolute bottom-0 left-0 right-0 flex items-center justify-center transition-opacity duration-500 ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom), 0px) + 24px',
          color: '#541111'
        }}
      >
        <span 
          className="text-sm font-medium tracking-wide"
          style={{ 
            fontSize: '14px',
            fontWeight: '500',
            letterSpacing: '0.025em'
          }}
        >
          By DERO
        </span>
      </div>
    </div>
  )
}

export default IntroPage
