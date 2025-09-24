import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useOrderDraftStore } from '../state/orderDraft.store';
import NewOrderModal from '../modals/NewOrderModal';

// Mock dei moduli esterni
vi.mock('../../../hooks/useSuppliers', () => ({
  default: () => ({
    suppliers: [
      { id: 'supplier-1', nome: 'Fornitore Test 1' },
      { id: 'supplier-2', nome: 'Fornitore Test 2' }
    ],
    isLoading: false,
    error: null
  })
}));

// Mock di react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Wrapper per React Router
const RouterWrapper = ({ children }: { children: any }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Orders Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOrderDraftStore.getState().clear();
  });

  describe('NewOrderModal → CreateOrderPage Flow', () => {
    it('should navigate to create order page when supplier is selected', async () => {
      const onClose = vi.fn();
      
      render(
        <RouterWrapper>
          <NewOrderModal open={true} onClose={onClose} />
        </RouterWrapper>
      );

      // Verifica che il modale sia visibile
      expect(screen.getByText('Nuovo Ordine')).toBeInTheDocument();

      // Trova e clicca il primo fornitore
      const supplierOption = screen.getByText('Fornitore Test 1');
      fireEvent.click(supplierOption);

      // Clicca il pulsante Avanti
      const avanti = screen.getByText('Avanti');
      fireEvent.click(avanti);

      // Verifica che onClose sia stato chiamato
      expect(onClose).toHaveBeenCalled();

      // Verifica che navigate sia stato chiamato con il path corretto
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/orders/create?supplier=supplier-1');
      });
    });

    it('should not navigate when no supplier is selected', () => {
      const onClose = vi.fn();
      
      render(
        <RouterWrapper>
          <NewOrderModal open={true} onClose={onClose} />
        </RouterWrapper>
      );

      // Clicca Avanti senza selezionare fornitore
      const avanti = screen.getByText('Avanti');
      fireEvent.click(avanti);

      // Verifica che non sia stato chiamato navigate
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should reset selection when modal opens', () => {
      const onClose = vi.fn();
      
      const { rerender } = render(
        <RouterWrapper>
          <NewOrderModal open={false} onClose={onClose} />
        </RouterWrapper>
      );

      // Apri il modale
      rerender(
        <RouterWrapper>
          <NewOrderModal open={true} onClose={onClose} />
        </RouterWrapper>
      );

      // Seleziona un fornitore
      const supplierOption = screen.getByText('Fornitore Test 1');
      fireEvent.click(supplierOption);

      // Chiudi e riapri il modale
      rerender(
        <RouterWrapper>
          <NewOrderModal open={false} onClose={onClose} />
        </RouterWrapper>
      );

      rerender(
        <RouterWrapper>
          <NewOrderModal open={true} onClose={onClose} />
        </RouterWrapper>
      );

      // Verifica che la selezione sia stata resettata
      // (il pulsante Avanti dovrebbe essere disabilitato o non funzionare)
      const avanti = screen.getByText('Avanti');
      fireEvent.click(avanti);
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('OrderDraft Store Integration', () => {
    it('should update store when supplier is set', () => {
      const { setSupplier } = useOrderDraftStore.getState();
      
      setSupplier('supplier-1', 'Fornitore Test');
      
      const { draft } = useOrderDraftStore.getState();
      expect(draft.supplierId).toBe('supplier-1');
      expect(draft.supplierName).toBe('Fornitore Test');
    });

    it('should handle multiple wine selections', () => {
      const { setQuantity, getTotalBottles, getSelectedWinesCount } = useOrderDraftStore.getState();
      
      // Aggiungi vini diversi
      setQuantity(1, 'bottiglie', 12);
      setQuantity(2, 'cartoni', 2); // 2 cartoni = 12 bottiglie
      setQuantity(3, 'bottiglie', 6);
      
      const state = useOrderDraftStore.getState();
      expect(state.getTotalBottles()).toBe(30); // 12 + 12 + 6
      expect(state.getSelectedWinesCount()).toBe(3);
    });

    it('should clear store correctly', () => {
      const { setSupplier, setQuantity, clear } = useOrderDraftStore.getState();
      
      // Popola il store
      setSupplier('supplier-1', 'Test Supplier');
      setQuantity(1, 'bottiglie', 12);
      setQuantity(2, 'cartoni', 2);
      
      // Verifica che sia popolato
      expect(useOrderDraftStore.getState().draft.lines).toHaveLength(2);
      expect(useOrderDraftStore.getState().draft.supplierId).toBe('supplier-1');
      
      // Clear
      clear();
      
      // Verifica che sia vuoto
      const { draft } = useOrderDraftStore.getState();
      expect(draft.lines).toHaveLength(0);
      expect(draft.supplierId).toBeNull();
      expect(draft.supplierName).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <RouterWrapper>
          <NewOrderModal open={true} onClose={vi.fn()} />
        </RouterWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      
      const closeButton = screen.getByLabelText('Chiudi');
      expect(closeButton).toBeInTheDocument();
    });
  });
});
