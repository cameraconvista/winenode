import React from 'react';

interface CreaOrdineHeaderProps {
  supplier?: string;
  totalBottiglie: number;
  onBack: () => void;
}

export const CreaOrdineHeader: React.FC<CreaOrdineHeaderProps> = ({
  supplier,
  totalBottiglie,
  onBack
}) => {
  return (
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
      
      {/* Header sticky sotto il logo */}
      <div 
        className="sticky border-b"
        style={{ 
          background: 'var(--bg)', 
          borderColor: '#e2d6aa',
          top: 'calc(var(--safe-top) + 60pt)',
          zIndex: 40,
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}
      >
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: '#541111' }}>
            Crea Ordine
          </h2>
          <p className="text-base" style={{ color: '#7a4a30' }}>
            Fornitore: {decodeURIComponent(supplier || '')}
          </p>
        </div>

        {totalBottiglie > 0 && (
          <div className="text-center">
            <span className="text-sm" style={{ color: '#7a4a30' }}>
              Totale: {totalBottiglie} bottiglie
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
