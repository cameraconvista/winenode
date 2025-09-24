import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateOrderPage from '../pages/CreateOrderPage';

// Mock dei moduli esterni
vi.mock('../../../hooks/useSuppliers', () => ({
  default: () => ({
    suppliers: [{ id: 'supplier-1', nome: 'Fornitore Test' }],
    isLoading: false,
    error: null
  })
}));

vi.mock('../../../hooks/useWines', () => ({
  default: () => ({
    wines: [
      { 
        id: '1', 
        name: 'Vino Test', 
        supplier: 'Fornitore Test',
        inventory: 10,
        minStock: 5
      }
    ],
    isLoading: false,
    error: null
  })
}));

const RouterWrapper = ({ children }: { children: any }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CreateOrderPage Overlay Check', () => {
  it('should not have any blocking overlay elements', () => {
    // Mock URL params per supplier
    Object.defineProperty(window, 'location', {
      value: {
        search: '?supplier=supplier-1'
      }
    });

    render(
      <RouterWrapper>
        <CreateOrderPage />
      </RouterWrapper>
    );

    // Verifica che non ci siano overlay con z-index alto che potrebbero bloccare i tap
    const overlays = document.querySelectorAll('.fixed.inset-0');
    const blockingOverlays = Array.from(overlays).filter(overlay => {
      const style = window.getComputedStyle(overlay);
      const zIndex = parseInt(style.zIndex) || 0;
      const pointerEvents = style.pointerEvents;
      const visibility = style.visibility;
      
      // Overlay è bloccante se ha z-index alto E pointer-events auto E è visibile
      return zIndex >= 40 && pointerEvents !== 'none' && visibility !== 'hidden';
    });

    expect(blockingOverlays).toHaveLength(0);
    
    // Log per debug in caso di problemi
    if (blockingOverlays.length > 0) {
      console.warn('Blocking overlays found:', blockingOverlays.map(el => ({
        className: el.className,
        zIndex: window.getComputedStyle(el).zIndex,
        pointerEvents: window.getComputedStyle(el).pointerEvents,
        visibility: window.getComputedStyle(el).visibility
      })));
    }
  });

  it('should have accessible quantity controls', () => {
    render(
      <RouterWrapper>
        <CreateOrderPage />
      </RouterWrapper>
    );

    // Verifica che i controlli quantità siano accessibili (non coperti da overlay)
    const quantityButtons = screen.queryAllByLabelText(/quantità/i);
    
    quantityButtons.forEach(button => {
      const rect = button.getBoundingClientRect();
      const elementAtPoint = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
      
      // Il pulsante dovrebbe essere l'elemento in primo piano o un suo discendente
      expect(
        button.contains(elementAtPoint) || button === elementAtPoint
      ).toBe(true);
    });
  });
});
