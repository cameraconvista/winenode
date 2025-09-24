import { OrderDraft } from '../state/orderDraft.store';

export interface CreateOrderRequest {
  supplierId: string;
  supplierName: string;
  lines: {
    wineId: number;
    unit: 'bottiglie' | 'cartoni';
    quantity: number;
  }[];
  totalBottles: number;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  message: string;
}

/**
 * Servizio per la gestione degli ordini
 */
export class OrderService {
  /**
   * Crea un nuovo ordine
   */
  static async createOrder(draft: OrderDraft, totalBottles: number): Promise<CreateOrderResponse> {
    if (!draft.supplierId || !draft.supplierName) {
      throw new Error('Fornitore non selezionato');
    }

    if (draft.lines.length === 0) {
      throw new Error('Nessun vino selezionato');
    }

    const request: CreateOrderRequest = {
      supplierId: draft.supplierId,
      supplierName: draft.supplierName,
      lines: draft.lines,
      totalBottles
    };

    try {
      // Simula chiamata API - sostituire con vera implementazione
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simula successo/errore random per testing
      if (Math.random() > 0.8) {
        throw new Error('Errore server: impossibile creare ordine');
      }

      const orderId = `ORD-${Date.now()}`;
      
      return {
        success: true,
        orderId,
        message: `Ordine ${orderId} creato con successo`
      };
    } catch (error) {
      console.error('Errore creazione ordine:', error);
      throw error;
    }
  }

  /**
   * Valida un draft prima dell'invio
   */
  static validateDraft(draft: OrderDraft): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!draft.supplierId) {
      errors.push('Fornitore non selezionato');
    }

    if (draft.lines.length === 0) {
      errors.push('Nessun vino selezionato');
    }

    draft.lines.forEach((line, index) => {
      if (line.quantity <= 0) {
        errors.push(`Riga ${index + 1}: quantità deve essere maggiore di 0`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
