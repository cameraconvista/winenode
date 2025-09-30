import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import PhosphorHouse from '~icons/ph/house-light';

interface GestisciOrdiniNavBarProps {
  onBack?: () => void;
  onHome?: () => void;
}

export const GestisciOrdiniNavBar = memo(function GestisciOrdiniNavBar({
  onHome
}: GestisciOrdiniNavBarProps) {
  const navigate = useNavigate();

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      navigate('/'); // Default: vai alla Home
    }
  };

  return (
    <nav className="mobile-navbar">
      {/* Icona Home centrata */}
      <div className="flex-1 flex justify-center">
        <button 
          onClick={handleHome}
          className="nav-btn btn-home"
          title="Home"
          aria-label="Vai alla Home"
        >
          <PhosphorHouse className="icon" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
});
