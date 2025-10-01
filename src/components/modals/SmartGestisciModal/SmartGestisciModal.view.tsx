import React, { lazy, Suspense } from 'react';
import { SmartGestisciModalProps, EditingItem } from './types';
import { Header } from './parts/Header';
import { OrderList } from './parts/OrderList';
import { Footer } from './parts/Footer';
import { NavBar } from './parts/NavBar';
import ConfirmArchiveModal from '../ConfirmArchiveModal';

// Lazy loading per risolvere conflitto static/dynamic import
const GestisciOrdiniInventoryModal = lazy(() => import('../../GestisciOrdiniInventoryModal'));

interface SmartGestisciModalViewProps extends SmartGestisciModalProps {
  // State
  modifiedQuantities: Record<number, number>;
  showQuantityModal: boolean;
  editingItem: EditingItem | null;
  showConfirmArchive: boolean;
  
  // Derived values
  totalConfermato: number;
  valoreConfermato: number;
  getWineProducer: (wineName: string) => string | null;
  
  // Handlers
  handleQuantityClick: (index: number) => void;
  handleQuantityConfirm: (newQuantity: number) => void;
  handleQuantityCancel: () => void;
  handleConfirm: () => void;
  handleConfirmArchive: () => void;
  handleCancelArchive: () => void;
  handleCancel: () => void;
}

export function SmartGestisciModalView({
  isOpen,
  fornitore,
  dettagli,
  modifiedQuantities,
  showQuantityModal,
  editingItem,
  showConfirmArchive,
  totalConfermato,
  valoreConfermato,
  getWineProducer,
  handleQuantityClick,
  handleQuantityConfirm,
  handleQuantityCancel,
  handleConfirm,
  handleConfirmArchive,
  handleCancelArchive,
  handleCancel
}: SmartGestisciModalViewProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay full-screen */}
      <div className="fixed inset-0 z-50" style={{ background: '#fff9dc' }}>
        <Header fornitore={fornitore} />
        
        <OrderList 
          dettagli={dettagli}
          modifiedQuantities={modifiedQuantities}
          getWineProducer={getWineProducer}
          onQuantityClick={handleQuantityClick}
        />
        
        <Footer 
          totalConfermato={totalConfermato}
          valoreConfermato={valoreConfermato}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
        
        <NavBar onBack={handleCancel} />
      </div>

      {/* Modale quantità */}
      <Suspense fallback={null}>
        <GestisciOrdiniInventoryModal
          isOpen={showQuantityModal}
          initialValue={editingItem?.currentValue || 0}
          onConfirm={handleQuantityConfirm}
          onCancel={handleQuantityCancel}
          min={0}
          max={100}
          originalValue={editingItem?.originalValue}
        />
      </Suspense>

      {/* Dialog Conferma Archiviazione */}
      <ConfirmArchiveModal
        isOpen={showConfirmArchive}
        onConfirm={handleConfirmArchive}
        onCancel={handleCancelArchive}
        fornitore={fornitore}
        totalItems={totalConfermato}
        totalValue={valoreConfermato}
      />
    </>
  );
}
