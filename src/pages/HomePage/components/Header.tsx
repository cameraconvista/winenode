import React from 'react';

export function Header() {
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
              decoding="async"
            />
          </picture>
        </div>
      </div>
    </header>
  );
}
