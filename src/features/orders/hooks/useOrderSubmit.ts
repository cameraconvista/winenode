import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderDraftStore } from '../state/orderDraft.store';
import { OrderService } from '../services/orderService';

export function useOrderSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { draft, getTotalBottles, clear } = useOrderDraftStore();

  const submitOrder = async () => {
    setError(null);
    setSuccess(null);
    
    // Validazione preliminare
    const validation = OrderService.validateDraft(draft);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setIsSubmitting(true);

    try {
      const totalBottles = getTotalBottles();
      const response = await OrderService.createOrder(draft, totalBottles);
      
      if (response.success) {
        setSuccess(response.message);
        
        // Pulisci il draft dopo successo
        clear();
        
        // NON navigare automaticamente - lascia che l'utente veda il messaggio di successo
        // L'utente può tornare manualmente con il pulsante Indietro
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      console.error('Errore submit ordine:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    submitOrder,
    isSubmitting,
    error,
    success,
    clearMessages,
    canSubmit: draft.lines.length > 0 && !isSubmitting
  };
}
