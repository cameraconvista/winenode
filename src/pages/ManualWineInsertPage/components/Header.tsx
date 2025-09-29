import React, { memo } from 'react';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = memo(function Header() {
  const navigate = useNavigate();

  return (
    <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-105"
            title="Torna alla home"
            style={{
              filter: "brightness(1.3)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}
          >
            <svg 
              className="h-6 w-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <img 
              src="/logo1.png" 
              alt="WINENODE" 
              className="h-32 w-auto object-contain"
              loading="lazy"
              decoding="async"
              width="128"
              height="128"
            />
          <button
            onClick={() => navigate("/")}
            className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors"
            title="Vai alla home"
            style={{
              filter: "brightness(1.2)",
              color: "#ffffff"
            }}
          >
            <Home className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
});
