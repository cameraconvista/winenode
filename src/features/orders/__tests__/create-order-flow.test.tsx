import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateOrderPage from '../pages/CreateOrderPage';
import { useOrderDraftStore } from '../state/orderDraft.store';

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
        minStock: 5,
        description: 'Vino di test'
      }
    ],
    isLoading: false,
    error: null
  })
}));

// Mock OrderService per controllare successo/errore
vi.mock('../services/orderService', () => ({
  OrderService: {
    createOrder: vi.fn(),
    validateDraft: vi.fn(() => ({ valid: true, errors: [] }))
  }
}));

const RouterWrapper = ({ children }: { children: any }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CreateOrderPage Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOrderDraftStore.getState().clear();
    
    // Mock URL params per supplier
    Object.defineProperty(window, 'location', {
      value: { search: '?supplier=supplier-1' },
      writable: true
    });
  });

  describe('Overlay Check', () => {
    it('should not have blocking overlay elements', () => {
      render(
        <RouterWrapper>
          <CreateOrderPage />
        </RouterWrapper>
      );

      // Verifica assenza overlay bloccanti
      const overlays = document.querySelectorAll('.fixed.inset-0');
      const blockingOverlays = Array.from(overlays).filter(overlay => {
        const style = window.getComputedStyle(overlay);
        const zIndex = parseInt(style.zIndex) || 0;
        const pointerEvents = style.pointerEvents;
        const visibility = style.visibility;
        
        return zIndex >= 40 && pointerEvents !== 'none' && visibility !== 'hidden';
      });

      expect(blockingOverlays).toHaveLength(0);
    });
  });

  describe('Quantity Controls', () => {
    it('should update quantity and total immediately on +/- click', async () => {
      render(
        <RouterWrapper>
          <CreateOrderPage />
        </RouterWrapper>
      );

      // Attendi che il componente sia renderizzato
      await waitFor(() => {
        expect(screen.getByText('Vino Test')).toBeInTheDocument();
      });

      // Trova i pulsanti +/-
      const increaseButton = screen.getByLabelText('Aumenta quantità');
      const decreaseButton = screen.getByLabelText('Diminuisci quantità');

      // Clicca + per aumentare quantità
      fireEvent.click(increaseButton);

      // Verifica aggiornamento immediato
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Quantità nella riga
        expect(screen.getByText(/1 bottiglie/)).toBeInTheDocument(); // Totale nel footer
      });

      // Clicca + ancora
      fireEvent.click(increaseButton);
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText(/2 bottiglie/)).toBeInTheDocument();
      });

      // Clicca - per diminuire
      fireEvent.click(decreaseButton);
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText(/1 bottiglie/)).toBeInTheDocument();
      });
    });
  });

  describe('Unit Toggle', () => {
    it('should change unit and maintain converted quantity', async () => {
      render(
        <RouterWrapper>
          <CreateOrderPage />
        </RouterWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Vino Test')).toBeInTheDocument();
      });

      // Imposta 6 bottiglie
      const increaseButton = screen.getByLabelText('Aumenta quantità');
      for (let i = 0; i < 6; i++) {
        fireEvent.click(increaseButton);
      }

      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
      });

      // Cambia a cartoni
      const cartoniButton = screen.getByText('Cartoni');
      fireEvent.click(cartoniButton);

      // Verifica conversione: 6 bottiglie = 1 cartone
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('cartoni')).toBeInTheDocument();
        expect(screen.getByText(/6 bottiglie/)).toBeInTheDocument(); // Totale rimane 6 bottiglie
      });

      // Torna a bottiglie
      const bottiglieButton = screen.getByText('Bottiglie');
      fireEvent.click(bottiglieButton);

      // Verifica conversione: 1 cartone = 6 bottiglie
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('bottiglie')).toBeInTheDocument();
      });
    });
  });

  describe('Submit Functionality', () => {
    it('should show success message and redirect on successful submit', async () => {
      const { OrderService } = await import('../services/orderService');
      
      // Mock successo
      vi.mocked(OrderService.createOrder).mockResolvedValue({
        success: true,
        orderId: 'ORD-123',
        message: 'Ordine creato con successo'
      });

      render(
        <RouterWrapper>
          <CreateOrderPage />
        </RouterWrapper>
      );

      // Aggiungi quantità
      await waitFor(() => {
        expect(screen.getByText('Vino Test')).toBeInTheDocument();
      });

      const increaseButton = screen.getByLabelText('Aumenta quantità');
      fireEvent.click(increaseButton);

      // Clicca conferma ordine
      const confirmButton = screen.getByRole('button', { name: /conferma ordine/i });
      fireEvent.click(confirmButton);

      // Verifica loading state
      await waitFor(() => {
        expect(screen.getByText('Invio in corso...')).toBeInTheDocument();
      });

      // Verifica messaggio di successo
      await waitFor(() => {
        expect(screen.getByText('Successo!')).toBeInTheDocument();
        expect(screen.getByText('Ordine creato con successo')).toBeInTheDocument();
      });
    });

    it('should show error message and stay on page on failed submit', async () => {
      const { OrderService } = await import('../services/orderService');
      
      // Mock errore
      vi.mocked(OrderService.createOrder).mockRejectedValue(
        new Error('Errore server: impossibile creare ordine')
      );

      render(
        <RouterWrapper>
          <CreateOrderPage />
        </RouterWrapper>
      );

      // Aggiungi quantità
      await waitFor(() => {
        expect(screen.getByText('Vino Test')).toBeInTheDocument();
      });

      const increaseButton = screen.getByLabelText('Aumenta quantità');
      fireEvent.click(increaseButton);

      // Clicca conferma ordine
      const confirmButton = screen.getByRole('button', { name: /conferma ordine/i });
      fireEvent.click(confirmButton);

      // Verifica messaggio di errore
      await waitFor(() => {
        expect(screen.getByText('Errore')).toBeInTheDocument();
        expect(screen.getByText('Errore server: impossibile creare ordine')).toBeInTheDocument();
      });

      // Verifica che siamo ancora nella pagina (pulsante conferma visibile)
      expect(screen.getByRole('button', { name: /conferma ordine/i })).toBeInTheDocument();
    });

    it('should disable submit button when no items selected', () => {
      render(
        <RouterWrapper>
          <CreateOrderPage />
        </RouterWrapper>
      );

      const confirmButton = screen.getByRole('button', { name: /conferma ordine/i });
      expect(confirmButton).toBeDisabled();
    });
  });
});
