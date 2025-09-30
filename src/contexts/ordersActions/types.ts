import { Ordine, OrdineDettaglio } from '../../services/ordiniService';

export interface OrdersActionsContextType {
  aggiungiOrdine: (ordine: Omit<Ordine, 'id'>) => Promise<void>;
  aggiornaStatoOrdine: (ordineId: string, nuovoStato: Ordine['stato']) => Promise<void>;
  aggiornaQuantitaOrdine: (ordineId: string, dettagli: OrdineDettaglio[]) => void;
  confermaRicezioneOrdine: (ordineId: string) => Promise<void>;
  confermaRicezioneOrdineConQuantita: (ordineId: string, quantitaConfermate?: Record<string, number>) => Promise<void>;
  eliminaOrdineInviato: (ordineId: string) => Promise<void>;
  eliminaOrdineStorico: (ordineId: string) => Promise<void>;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  ordineId: string;
  details: any;
  user: string;
}
