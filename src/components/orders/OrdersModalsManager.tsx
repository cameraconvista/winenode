// refactor: gestore modali con lazy loading per performance
import React, { Suspense, lazy } from 'react';
import { Ordine, QuantityEditState, ArchivePendingState } from '../../types/orders';
import { OrderDetail } from '../../utils/buildWhatsAppMessage';
import { ORDINI_LABELS } from '../../constants/ordiniLabels';

// Lazy loading dei modali per code splitting
const ConfermaEliminazioneModal = lazy(() => import('../modals/ConfermaEliminazioneModal'));
const WhatsAppOrderModal = lazy(() => import('../modals/WhatsAppOrderModal'));
const QuantityPicker = lazy(() => import('../QuantityPicker'));
const GestisciOrdiniInventoryModal = lazy(() => import('../GestisciOrdiniInventoryModal'));
const SmartGestisciModal = lazy(() => import('../modals/SmartGestisciModal'));
const ConfirmArchiveModal = lazy(() => import('../modals/ConfirmArchiveModal'));

interface OrdersModalsManagerProps {
  // Stati modali
  showQuantityModal: boolean;
  editingQuantity: QuantityEditState | null;
  showSmartModal: boolean;
  smartModalOrdine: Ordine | null;
  showConfirmArchive: boolean;
  pendingArchiveOrder: ArchivePendingState | null;
  showWhatsAppModal: boolean;
  whatsAppOrderDetails: OrderDetail[];
  whatsAppSupplierName: string;
  
  // Stati eliminazione
  ordineToDelete: any;
  showConfermaEliminazione: boolean;
  
  // Handlers
  onCloseQuantityModal: () => void;
  onConfirmQuantityModal: (newQuantity: number) => void;
  onCloseSmartModal: () => void;
  onSmartModalConfirm: (modifiedQuantities: Record<number, number>) => void;
  onSmartModalArchive: (modifiedQuantities: Record<number, number>) => void;
  onConfirmArchive: () => void;
  onCancelArchive: () => void;
  onCloseWhatsAppModal: () => void;
  onConfermaEliminazione: () => void;
  onCloseConfermaEliminazione: () => void;
  
  // Funzioni helper
  getMessaggioEliminazione: () => string;
}

// Componente fallback per Suspense
const ModalFallback = () => (
  <div 
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    style={{ backdropFilter: 'blur(2px)' }}
  >
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
    </div>
  </div>
);

export const OrdersModalsManager: React.FC<OrdersModalsManagerProps> = ({
  // Stati modali
  showQuantityModal,
  editingQuantity,
  showSmartModal,
  smartModalOrdine,
  showConfirmArchive,
  pendingArchiveOrder,
  showWhatsAppModal,
  whatsAppOrderDetails,
  whatsAppSupplierName,
  
  // Stati eliminazione
  ordineToDelete,
  showConfermaEliminazione,
  
  // Handlers
  onCloseQuantityModal,
  onConfirmQuantityModal,
  onCloseSmartModal,
  onSmartModalConfirm,
  onSmartModalArchive,
  onConfirmArchive,
  onCancelArchive,
  onCloseWhatsAppModal,
  onConfermaEliminazione,
  onCloseConfermaEliminazione,
  
  // Funzioni helper
  getMessaggioEliminazione
}) => {
  return (
    <>
      {/* Modale Quantità */}
      {showQuantityModal && editingQuantity && (
        <Suspense fallback={<ModalFallback />}>
          <GestisciOrdiniInventoryModal
            isOpen={showQuantityModal}
            currentValue={editingQuantity.currentValue}
            onConfirm={onConfirmQuantityModal}
            title="Modifica Quantità"
            min={0}
            max={999}
          />
        </Suspense>
      )}

      {/* Smart Modal per gestione completa ordine */}
      {showSmartModal && smartModalOrdine && (
        <Suspense fallback={<ModalFallback />}>
          <SmartGestisciModal
            isOpen={showSmartModal}
            ordine={smartModalOrdine}
            onClose={onCloseSmartModal}
            onConfirm={onSmartModalConfirm}
            onArchive={onSmartModalArchive}
          />
        </Suspense>
      )}

      {/* Modale Conferma Archiviazione */}
      {showConfirmArchive && pendingArchiveOrder && (
        <Suspense fallback={<ModalFallback />}>
          <ConfirmArchiveModal
            isOpen={showConfirmArchive}
            onConfirm={onConfirmArchive}
            onCancel={onCancelArchive}
            title="Conferma Archiviazione"
            message="Archiviare questo ordine con le quantità modificate?"
            confirmText="Archivia"
            cancelText="Annulla"
          />
        </Suspense>
      )}

      {/* Modale WhatsApp */}
      {showWhatsAppModal && (
        <Suspense fallback={<ModalFallback />}>
          <WhatsAppOrderModal
            isOpen={showWhatsAppModal}
            onClose={onCloseWhatsAppModal}
            orderDetails={whatsAppOrderDetails}
            supplierName={whatsAppSupplierName}
          />
        </Suspense>
      )}

      {/* Modale Conferma Eliminazione */}
      {showConfermaEliminazione && ordineToDelete && (
        <Suspense fallback={<ModalFallback />}>
          <ConfermaEliminazioneModal
            isOpen={showConfermaEliminazione}
            onClose={onCloseConfermaEliminazione}
            onConfirm={onConfermaEliminazione}
            title={ORDINI_LABELS.header.eliminaOrdine}
            message={getMessaggioEliminazione()}
            confirmText={ORDINI_LABELS.azioni.elimina}
            cancelText="Annulla"
          />
        </Suspense>
      )}
    </>
  );
};

export default OrdersModalsManager;
