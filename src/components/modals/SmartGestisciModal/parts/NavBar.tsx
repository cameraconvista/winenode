import React from 'react';
import PhosphorArrowLeft from '~icons/ph/arrow-left-light';

interface NavBarProps {
  onBack: () => void;
}

export function NavBar({ onBack }: NavBarProps) {
  return (
    <nav className="mobile-navbar">
      {/* Pulsante Torna indietro a sinistra */}
      <div className="nav-icons-group">
        <button 
          onClick={onBack}
          className="nav-btn btn-back"
          title="Torna indietro"
        >
          <PhosphorArrowLeft className="icon" aria-hidden="true" />
        </button>
      </div>
      
      {/* Spazio vuoto a destra per mantenere layout */}
      <div></div>
    </nav>
  );
}
