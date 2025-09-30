import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import PhosphorArrowLeft from '~icons/ph/arrow-left-light';
import PhosphorHouse from '~icons/ph/house-light';

interface GestisciOrdiniNavBarProps {
  onBack?: () => void;
  onHome?: () => void;
}

export const GestisciOrdiniNavBar = memo(function GestisciOrdiniNavBar({
  onBack,
  onHome
}: GestisciOrdiniNavBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1); // Default: torna indietro nella history
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      navigate('/'); // Default: vai alla Home
    }
  };

  return (
    <nav className="mobile-navbar">
      {/* Pulsante Torna a sinistra */}
      <div className="nav-icons-group">
        <button 
          onClick={handleBack}
          className="nav-btn btn-back"
          title="Torna indietro"
          aria-label="Torna alla pagina precedente"
        >
          <PhosphorArrowLeft className="icon" aria-hidden="true" />
        </button>
      </div>
      
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
      
      {/* Spazio vuoto a destra per bilanciare layout */}
      <div className="nav-icons-group">
        <div style={{ width: '44px' }}></div> {/* Placeholder per bilanciare */}
      </div>
    </nav>
  );
});
