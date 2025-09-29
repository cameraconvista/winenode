import React, { Suspense } from 'react';
import { Ordine } from '../../../contexts/OrdiniContext';
import { OrderDetail } from '../../../utils/buildWhatsAppMessage';
import { ORDINI_LABELS } from '../../../constants/ordiniLabels';

// Import diretti per evitare problemi di lazy loading durante il debug
import ConfermaEliminazioneModal from '../../../components/modals/ConfermaEliminazioneModal';
import GestisciOrdiniInventoryModal from '../../../components/GestisciOrdiniInventoryModal';
import SmartGestisciModal from '../../../components/modals/SmartGestisciModal';
import ConfirmArchiveModal from '../../../components/modals/ConfirmArchiveModal';
import WhatsAppOrderModal from '../../../components/modals/WhatsAppOrderModal';

interface ModalsManagerProps {
  // Conferma Eliminazione
  showConfermaEliminazione: boolean;
  onSetShowConfermaEliminazione: (show: boolean) => void;
  ordineToDelete: { id: string; ordine: Ordine; tipo: 'inviato' | 'archiviato' } | null;
  onConfermaEliminazione: () => void;
  getMessaggioEliminazione: string;

  // Quantity Modal
  showQuantityModal: boolean;
  editingQuantity: { ordineId: string; dettaglioIndex: number; currentValue: number; originalValue: number } | null;
  onConfirmQuantityModal: (newQuantity: number) => void;
  onCloseQuantityModal: () => void;

  // Smart Modal
  showSmartModal: boolean;
  smartModalOrdine: Ordine | null;
  onCloseSmartModal: () => void;
  onSmartModalConfirm: (modifiedQuantities: Record<number, number>) => void;
  onSmartModalArchive: (modifiedQuantities: Record<number, number>) => void;

  // Confirm Archive
  showConfirmArchive: boolean;
  pendingArchiveOrder: { ordineId: string; quantities: Record<number, number> } | null;
  onConfirmArchive: () => void;
  onCancelArchive: () => void;
  ordiniInviati: Ordine[];

  // WhatsApp Modal
  showWhatsAppModal: boolean;
  whatsAppOrderDetails: OrderDetail[];
  whatsAppSupplierName: string;
  onCloseWhatsAppModal: () => void;
}

export const ModalsManager: React.FC<ModalsManagerProps> = ({
  // Conferma Eliminazione
  showConfermaEliminazione,
  onSetShowConfermaEliminazione,
  ordineToDelete,
  onConfermaEliminazione,
  getMessaggioEliminazione,

  // Quantity Modal
  showQuantityModal,
  editingQuantity,
  onConfirmQuantityModal,
  onCloseQuantityModal,

  // Smart Modal
  showSmartModal,
  smartModalOrdine,
  onCloseSmartModal,
  onSmartModalConfirm,
  onSmartModalArchive,

  // Confirm Archive
  showConfirmArchive,
  pendingArchiveOrder,
  onConfirmArchive,
  onCancelArchive,
  ordiniInviati,

  // WhatsApp Modal
  showWhatsAppModal,
  whatsAppOrderDetails,
  whatsAppSupplierName,
  onCloseWhatsAppModal
}) => {
  return (
    <>
      {/* Modale Conferma Eliminazione */}
      {showConfermaEliminazione && (
        <ConfermaEliminazioneModal
          isOpen={showConfermaEliminazione}
          onOpenChange={onSetShowConfermaEliminazione}
          onConfirm={onConfermaEliminazione}
          titolo={ORDINI_LABELS.header.modaleTitolo}
          messaggio={getMessaggioEliminazione}
          dettagliOrdine={ordineToDelete ? {
            fornitore: ordineToDelete.ordine.fornitore,
            totale: ordineToDelete.ordine.totale,
            data: ordineToDelete.ordine.data
          } : undefined}
        />
      )}

      {/* Modale Modifica Quantità */}
      {showQuantityModal && editingQuantity && (
        <GestisciOrdiniInventoryModal
          isOpen={showQuantityModal}
          initialValue={editingQuantity.currentValue}
          onConfirm={onConfirmQuantityModal}
          onCancel={onCloseQuantityModal}
          min={0}
          max={100}
          originalValue={editingQuantity.originalValue}
        />
      )}

      {/* Modale Smart Gestisci */}
      {showSmartModal && smartModalOrdine && (
        <SmartGestisciModal
          isOpen={showSmartModal}
          onClose={onCloseSmartModal}
          onConfirm={onSmartModalConfirm}
          onArchive={onSmartModalArchive}
          ordineId={smartModalOrdine.id}
          fornitore={smartModalOrdine.fornitore}
          dettagli={smartModalOrdine.dettagli || []}
        />
      )}

      {/* Dialog Conferma Archiviazione */}
      {showConfirmArchive && pendingArchiveOrder && (
        <ConfirmArchiveModal
          isOpen={showConfirmArchive}
          onConfirm={onConfirmArchive}
          onCancel={onCancelArchive}
          fornitore={ordiniInviati.find(o => o.id === pendingArchiveOrder.ordineId)?.fornitore}
          totalItems={Object.values(pendingArchiveOrder.quantities).reduce((sum, qty) => sum + qty, 0)}
          totalValue={Object.entries(pendingArchiveOrder.quantities).reduce((sum, [index, qty]) => {
            const ordine = ordiniInviati.find(o => o.id === pendingArchiveOrder.ordineId);
            const dettaglio = ordine?.dettagli?.[parseInt(index)];
            return sum + (qty * (dettaglio?.unitPrice || 0));
          }, 0)}
        />
      )}

      {/* Modale WhatsApp */}
      {showWhatsAppModal && (
        <WhatsAppOrderModal
          isOpen={showWhatsAppModal}
          onClose={onCloseWhatsAppModal}
          orderDetails={whatsAppOrderDetails}
          supplierName={whatsAppSupplierName}
        />
      )}
    </>
  );
};
