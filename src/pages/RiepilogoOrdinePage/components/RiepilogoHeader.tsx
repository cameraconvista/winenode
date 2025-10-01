import React from 'react';

export const RiepilogoHeader: React.FC = () => {
  return (
    <>
      {/* HEADER FISSO CON LOGO */}
      <header className="mobile-header">
        <div className="header-content">
          <div className="logo-wrap">
            <picture>
              <source type="image/webp" srcSet="/logo1.webp" />
              <img 
                src="/logo1.png" 
                alt="WINENODE"
                loading="eager"
              />
            </picture>
          </div>
        </div>
      </header>

      {/* HEADER STICKY SOTTO IL LOGO */}
      <div 
        className="sticky border-b"
        style={{ 
          background: 'var(--bg)', 
          top: 'var(--header-height)', 
          zIndex: 30,
          padding: '12px 16px',
          borderBottomColor: 'rgba(84, 17, 17, 0.1)'
        }}
      >
        <h1 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: 'var(--text)',
          margin: 0,
          textAlign: 'center'
        }}>
          Riepilogo Ordine
        </h1>
      </div>
    </>
  );
};
