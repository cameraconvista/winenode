import React from 'react';

interface HeaderProps {
  fornitore: string;
}

export function Header({ fornitore }: HeaderProps) {
  return (
    <>
      {/* HEADER FISSO CON LOGO */}
      <header className="mobile-header">
        <div className="header-content">
          <div className="logo-wrap">
            <img 
              src="/logo1.png" 
              alt="WINENODE" 
              loading="lazy"
              decoding="async"
              width="48"
              height="48"
            />
          </div>
        </div>
      </header>

      {/* HEADER STICKY TESTI */}
      <div 
        className="sticky border-b"
        style={{ 
          background: '#fff9dc',
          borderColor: '#e2d6aa',
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
          top: 'calc(env(safe-area-inset-top, 0px) + 80px)',
          zIndex: 40,
          '--header-height': '88px'
        } as React.CSSProperties & { '--header-height': string }}
      >
        <div className="text-center">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold" style={{ color: '#541111' }}>
              Gestisci Ordine
            </h2>
          </div>
          <p className="text-base" style={{ color: '#7a4a30' }}>
            Fornitore: {fornitore.toUpperCase()}
          </p>
        </div>
      </div>
    </>
  );
}
