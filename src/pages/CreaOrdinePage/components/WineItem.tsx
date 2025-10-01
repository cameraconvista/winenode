import React from 'react';
import { Minus, Plus } from 'lucide-react';
import PhosphorBell from '~icons/ph/bell-light';
import { WineItemProps } from '../types';

export const WineItem: React.FC<WineItemProps> = ({
  wine,
  ordineItem,
  unitPreference,
  onQuantityChange,
  onUnitChange
}) => {
  const quantity = ordineItem?.quantity || 0;
  const isInAlert = wine.inventory <= wine.minStock;

  const handleIncrement = () => {
    onQuantityChange(wine.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(wine.id, quantity - 1);
    }
  };

  const handleUnitToggle = () => {
    const newUnit = unitPreference === 'bottiglie' ? 'cartoni' : 'bottiglie';
    onUnitChange(wine.id, newUnit);
  };

  return (
    <div className="wine-card">
      <div className="wine-card-content">
        {/* Header con nome e alert */}
        <div className="wine-header">
          <div className="wine-title">
            <h3 className="wine-name">{wine.name}</h3>
            {isInAlert && (
              <PhosphorBell 
                className="alert-icon"
                style={{ color: 'var(--danger)' }}
              />
            )}
          </div>
          <div className="wine-info">
            <span className="wine-description">{wine.description}</span>
            {wine.vintage && <span className="wine-vintage">({wine.vintage})</span>}
          </div>
        </div>

        {/* Controlli quantità */}
        <div className="wine-controls">
          <div className="quantity-controls">
            <button
              onClick={handleDecrement}
              disabled={quantity === 0}
              className="quantity-btn minus"
            >
              <Minus className="h-4 w-4" />
            </button>
            
            <span className="quantity-display">
              {quantity}
            </span>
            
            <button
              onClick={handleIncrement}
              className="quantity-btn plus"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Toggle unità */}
          {quantity > 0 && (
            <button
              onClick={handleUnitToggle}
              className="unit-toggle"
            >
              {unitPreference}
            </button>
          )}
        </div>

        {/* Info giacenza e prezzo */}
        <div className="wine-footer">
          <div className="wine-stock">
            <span 
              className="stock-value"
              style={{
                color: isInAlert ? 'var(--danger)' : 'var(--text)',
                fontWeight: isInAlert ? 'bold' : 'normal'
              }}
            >
              {wine.inventory}
            </span>
            <span className="stock-label">disponibili</span>
          </div>
          
          <div className="wine-price">
            €{wine.cost?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>
    </div>
  );
};
