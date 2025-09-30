import { useCallback } from 'react';
import { Ordine } from '../../services/ordiniService';
import { isFeatureEnabled } from '../../config/featureFlags';
import { useSupabaseOrdini } from '../../hooks/useSupabaseOrdini';
import useWines from '../../hooks/useWines';
import { useOrdersData } from '../orders/OrdersDataContext';
import { useQuantityManagement } from '../orders/QuantityManagementContext';
import { useOrdersActionsState } from './OrdersActionsState';
import { useOrdersActionsAudit } from './OrdersActionsAudit';

export function useOrdersActionsConfirm() {
  const { ordiniInviati, setOrdiniInviati, setOrdiniStorico } = useOrdersData();
  const { getQuantitaConfermate } = useQuantityManagement();
  const { wines, updateWineInventory } = useWines();
  const { isOrderProcessing, setOrderProcessing } = useOrdersActionsState();
  const { logAuditEvent } = useOrdersActionsAudit();
  const supabaseOrdini = useSupabaseOrdini();

  // Conferma ricezione con quantità modificate (operazione atomica)
  const confermaRicezioneOrdineConQuantita = useCallback(async (ordineId: string, quantitaConfermate?: Record<string, number>) => {
    console.log('✅ Confermando ricezione ordine con quantità:', ordineId, quantitaConfermate);
    
    // Idempotency guard - previene doppi click
    if (isFeatureEnabled('IDEMPOTENCY_GUARD') && isOrderProcessing(ordineId)) {
      console.log('⚠️ Ordine già in elaborazione, ignoro richiesta duplicata:', ordineId);
      return;
    }

    // Audit trail - start
    logAuditEvent('CONFERMA_RICEZIONE_CON_QUANTITA_START', ordineId, { quantitaConfermate, timestamp: Date.now() });

    try {
      // Set processing flag
      if (isFeatureEnabled('IDEMPOTENCY_GUARD')) {
        setOrderProcessing(ordineId, true);
      }

      // Trova l'ordine prima di aggiornare lo stato (cerca solo in inviati)
      const ordine = ordiniInviati.find(o => o.id === ordineId);
      
      if (!ordine) {
        logAuditEvent('CONFERMA_RICEZIONE_CON_QUANTITA_ERROR', ordineId, { error: 'Ordine non trovato' });
        return;
      }

      // Se non ci sono quantità modificate, usa la funzione standard
      if (!quantitaConfermate || Object.keys(quantitaConfermate).length === 0) {
        await confermaRicezioneOrdine(ordineId);
        return;
      }

      // Usa l'operazione atomica per applicare quantità e archiviare
      const success = await supabaseOrdini.archiveOrdineWithAppliedQuantities({
        ordineId,
        quantitaConfermate,
        contenutoCorrente: ordine.dettagli || []
      });
      
      if (!success) {
        throw new Error('Errore nell\'archiviazione con quantità applicate');
      }
      
      console.log('✅ Ordine archiviato con quantità confermate applicate');
      
      // Aggiorna giacenze usando le quantità confermate
      if (ordine.dettagli) {
        for (const item of ordine.dettagli) {
          const currentWine = wines.find(w => w.id === item.wineId);
          if (currentWine) {
            const qtyConfermata = quantitaConfermate[item.wineId] ?? item.quantity;
            const currentInventory = currentWine.inventory || 0;
            const bottlesToAdd = qtyConfermata * (item.unit === 'cartoni' ? 6 : 1);
            const newInventory = currentInventory + bottlesToAdd;
            
            console.log(`📦 ${item.wineName}: ${currentInventory} + ${bottlesToAdd} (confermata) = ${newInventory}`);
            await updateWineInventory(item.wineId, newInventory);
          }
        }
      }

      // Crea l'ordine completato con quantità aggiornate
      const dettagliAggiornati = ordine.dettagli?.map(item => ({
        ...item,
        quantity: quantitaConfermate[item.wineId] ?? item.quantity,
        totalPrice: (quantitaConfermate[item.wineId] ?? item.quantity) * item.unitPrice
      })) || [];
      
      const nuovoTotale = dettagliAggiornati.reduce((sum, item) => sum + item.totalPrice, 0);
      const nuoveTotBottiglie = dettagliAggiornati.reduce((sum, item) => {
        return sum + (item.quantity * (item.unit === 'cartoni' ? 6 : 1));
      }, 0);

      const ordineCompletato: Ordine = {
        ...ordine,
        stato: 'archiviato',
        dettagli: dettagliAggiornati,
        totale: nuovoTotale,
        bottiglie: nuoveTotBottiglie
      };
      
      // Aggiungi allo storico (archiviati)
      setOrdiniStorico(prevStorico => {
        const exists = prevStorico.some(o => o.id === ordineId);
        if (exists) {
          console.log('⚠️ Ordine già presente nello storico, evito duplicazione:', ordineId);
          logAuditEvent('CONFERMA_RICEZIONE_CON_QUANTITA_DUPLICATE', ordineId, { warning: 'Ordine già archiviato' });
          return prevStorico;
        }
        return [ordineCompletato, ...prevStorico];
      });
      
      // Rimuovi dalla lista inviati
      setOrdiniInviati(prev => prev.filter(o => o.id !== ordineId));
      console.log('📤 Ordine rimosso da inviati e spostato in archiviati con quantità aggiornate:', ordineId);
      
      // Audit trail - success
      logAuditEvent('CONFERMA_RICEZIONE_CON_QUANTITA_SUCCESS', ordineId, { 
        finalState: 'archiviato',
        movedToStorico: true,
        sourceList: 'inviati',
        quantitaConfermate,
        processingTime: Date.now()
      });

    } catch (error) {
      console.error('❌ Errore durante conferma ricezione con quantità:', error);
      logAuditEvent('CONFERMA_RICEZIONE_CON_QUANTITA_ERROR', ordineId, { error: error.message });
    } finally {
      // Clear processing flag
      if (isFeatureEnabled('IDEMPOTENCY_GUARD')) {
        setOrderProcessing(ordineId, false);
      }
    }
  }, [ordiniInviati, isOrderProcessing, logAuditEvent, setOrderProcessing, supabaseOrdini, wines, updateWineInventory, setOrdiniStorico, setOrdiniInviati]);

  // Conferma ricezione standard
  const confermaRicezioneOrdine = useCallback(async (ordineId: string) => {
    console.log('✅ Confermando ricezione ordine:', ordineId);
    
    // Idempotency guard - previene doppi click
    if (isFeatureEnabled('IDEMPOTENCY_GUARD') && isOrderProcessing(ordineId)) {
      console.log('⚠️ Ordine già in elaborazione, ignoro richiesta duplicata:', ordineId);
      return;
    }

    // Audit trail - start
    logAuditEvent('CONFERMA_RICEZIONE_START', ordineId, { timestamp: Date.now() });

    try {
      // Set processing flag
      if (isFeatureEnabled('IDEMPOTENCY_GUARD')) {
        setOrderProcessing(ordineId, true);
      }

      // Trova l'ordine prima di aggiornare lo stato (cerca solo in inviati)
      const ordine = ordiniInviati.find(o => o.id === ordineId);
      
      if (!ordine) {
        logAuditEvent('CONFERMA_RICEZIONE_ERROR', ordineId, { error: 'Ordine non trovato' });
        return;
      }

      // Ottieni quantità confermate (se presenti) o usa quelle originali
      const quantitaConfermate = getQuantitaConfermate(ordineId);
      const hasQuantitaConfermate = Object.keys(quantitaConfermate).length > 0;
      
      console.log('📊 Quantità confermate disponibili:', hasQuantitaConfermate, quantitaConfermate);

      if (hasQuantitaConfermate && ordine.dettagli) {
        // Usa la funzione atomica apply + archive
        const success = await supabaseOrdini.archiveOrdineWithAppliedQuantities({
          ordineId,
          quantitaConfermate,
          contenutoCorrente: ordine.dettagli
        });
        
        if (!success) {
          throw new Error('Errore nell\'archiviazione con quantità applicate');
        }
        
        console.log('✅ Ordine archiviato con quantità confermate applicate');
        
        // Aggiorna giacenze usando le quantità confermate
        for (const item of ordine.dettagli) {
          const currentWine = wines.find(w => w.id === item.wineId);
          if (currentWine) {
            const qtyConfermata = quantitaConfermate[item.wineId] ?? item.quantity;
            const currentInventory = currentWine.inventory || 0;
            const bottlesToAdd = qtyConfermata * (item.unit === 'cartoni' ? 6 : 1);
            const newInventory = currentInventory + bottlesToAdd;
            
            console.log(`📦 ${item.wineName}: ${currentInventory} + ${bottlesToAdd} (confermata) = ${newInventory}`);
            await updateWineInventory(item.wineId, newInventory);
          }
        }
      } else {
        // Fallback al metodo originale se non ci sono quantità confermate
        console.log('📦 Nessuna quantità confermata, uso metodo originale');
        
        const success = await supabaseOrdini.aggiornaStatoOrdine(ordineId, 'archiviato');
        if (!success) {
          throw new Error('Errore nell\'aggiornamento stato ordine');
        }
        
        // Aggiorna giacenze con quantità originali
        if (ordine.dettagli) {
          console.log('📦 Aggiornamento giacenze con quantità originali');
          
          for (const item of ordine.dettagli) {
            const currentWine = wines.find(w => w.id === item.wineId);
            if (currentWine) {
              const currentInventory = currentWine.inventory || 0;
              const bottlesToAdd = item.quantity * (item.unit === 'cartoni' ? 6 : 1);
              const newInventory = currentInventory + bottlesToAdd;
              
              console.log(`📦 ${item.wineName}: ${currentInventory} + ${bottlesToAdd} = ${newInventory}`);
              await updateWineInventory(item.wineId, newInventory);
            }
          }
        }
      }

      // Crea l'ordine completato con quantità aggiornate se necessario
      let ordineCompletato: Ordine = {
        ...ordine,
        stato: 'archiviato'
      };

      // Se abbiamo quantità confermate, aggiorna i dettagli dell'ordine
      if (hasQuantitaConfermate && ordine.dettagli) {
        const dettagliAggiornati = ordine.dettagli.map(item => ({
          ...item,
          quantity: quantitaConfermate[item.wineId] ?? item.quantity,
          totalPrice: (quantitaConfermate[item.wineId] ?? item.quantity) * item.unitPrice
        }));
        
        const nuovoTotale = dettagliAggiornati.reduce((sum, item) => sum + item.totalPrice, 0);
        const nuoveTotBottiglie = dettagliAggiornati.reduce((sum, item) => {
          return sum + (item.quantity * (item.unit === 'cartoni' ? 6 : 1));
        }, 0);

        ordineCompletato = {
          ...ordineCompletato,
          dettagli: dettagliAggiornati,
          totale: nuovoTotale,
          bottiglie: nuoveTotBottiglie
        };
      }
      
      // Aggiungi allo storico (archiviati)
      setOrdiniStorico(prevStorico => {
        const exists = prevStorico.some(o => o.id === ordineId);
        if (exists) {
          console.log('⚠️ Ordine già presente nello storico, evito duplicazione:', ordineId);
          logAuditEvent('CONFERMA_RICEZIONE_DUPLICATE', ordineId, { warning: 'Ordine già archiviato' });
          return prevStorico;
        }
        return [ordineCompletato, ...prevStorico];
      });
      
      // Rimuovi dalla lista inviati
      setOrdiniInviati(prev => prev.filter(o => o.id !== ordineId));
      console.log('📤 Ordine rimosso da inviati e spostato in archiviati:', ordineId);
      
      // Audit trail - success
      logAuditEvent('CONFERMA_RICEZIONE_SUCCESS', ordineId, { 
        finalState: 'archiviato',
        movedToStorico: true,
        sourceList: 'inviati',
        hasQuantitaConfermate,
        processingTime: Date.now()
      });

      if (isFeatureEnabled('INVENTORY_TX')) {
        console.log('✅ Transazione atomica completata per ordine:', ordineId);
      }
    } catch (error) {
      console.error('❌ Errore durante conferma ricezione:', error);
      logAuditEvent('CONFERMA_RICEZIONE_ERROR', ordineId, { error: error.message });
    } finally {
      // Clear processing flag
      if (isFeatureEnabled('IDEMPOTENCY_GUARD')) {
        setOrderProcessing(ordineId, false);
      }
    }
  }, [ordiniInviati, isOrderProcessing, logAuditEvent, setOrderProcessing, getQuantitaConfermate, supabaseOrdini, wines, updateWineInventory, setOrdiniStorico, setOrdiniInviati]);

  return {
    confermaRicezioneOrdine,
    confermaRicezioneOrdineConQuantita
  };
}
