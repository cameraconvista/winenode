import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { ORDINI_LABELS } from '../../constants/ordiniLabels';
import { isFeatureEnabled } from '../../config/featureFlags';
import GestisciOrdiniInventoryModal from '../GestisciOrdiniInventoryModal';
import ConfirmArchiveModal from './ConfirmArchiveModal';

interface DettaglioOrdine {
  wineName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface SmartGestisciModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (modifiedQuantities: Record<number, number>) => void;
  onArchive?: (modifiedQuantities: Record<number, number>) => void; // Callback per archiviazione
  ordineId: string;
  fornitore: string;
  dettagli: DettaglioOrdine[];
}

export default function SmartGestisciModal({
  isOpen,
  onClose,
  onConfirm,
  onArchive,
  ordineId,
  fornitore,
  dettagli
}: SmartGestisciModalProps) {
  const [modifiedQuantities, setModifiedQuantities] = useState<Record<number, number>>({});
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{index: number, originalValue: number, currentValue: number} | null>(null);
  const [showConfirmArchive, setShowConfirmArchive] = useState(false);

  // Inizializza quantità modificate quando si apre il modale
  useEffect(() => {
    if (isOpen) {
      const initialQuantities = dettagli.reduce((acc, dettaglio, index) => {
        acc[index] = dettaglio.quantity;
        return acc;
      }, {} as Record<number, number>);
      setModifiedQuantities(initialQuantities);
    }
  }, [isOpen, dettagli]);

  const handleQuantityClick = (index: number) => {
    const originalValue = dettagli[index].quantity;
    const currentValue = modifiedQuantities[index] ?? originalValue;
    
    setEditingItem({
      index,
      originalValue,
      currentValue
    });
    setShowQuantityModal(true);
  };

  const handleQuantityConfirm = (newQuantity: number) => {
    if (!editingItem) return;

    setModifiedQuantities(prev => ({
      ...prev,
      [editingItem.index]: newQuantity
    }));
    
    setShowQuantityModal(false);
    setEditingItem(null);
  };

  const handleQuantityCancel = () => {
    setShowQuantityModal(false);
    setEditingItem(null);
  };

  const handleConfirm = () => {
    if (isFeatureEnabled('QTY_MODAL_CONFIRM_ARCHIVE_FLOW') && onArchive) {
      // Mostra dialog di conferma archiviazione
      setShowConfirmArchive(true);
    } else {
      // Comportamento legacy
      onConfirm(modifiedQuantities);
      onClose();
    }
  };

  const handleConfirmArchive = () => {
    if (onArchive) {
      onArchive(modifiedQuantities);
    }
    setShowConfirmArchive(false);
    onClose();
  };

  const handleCancelArchive = () => {
    setShowConfirmArchive(false);
  };

  const handleCancel = () => {
    onClose();
  };

  // Calcola riepilogo
  const totalConfermato = dettagli.reduce((acc, dettaglio, index) => {
    const quantity = modifiedQuantities[index] ?? dettaglio.quantity;
    return acc + quantity;
  }, 0);

  const valoreConfermato = dettagli.reduce((acc, dettaglio, index) => {
    const quantity = modifiedQuantities[index] ?? dettaglio.quantity;
    return acc + (quantity * dettaglio.unitPrice);
  }, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay full-screen */}
      <div className="fixed inset-0 z-50 bg-white">
        {/* HEADER FISSO CON LOGO */}
        <header className="mobile-header">
          <div className="header-content">
            <div className="logo-wrap">
              <img src="/logo1.png" alt="WINENODE" loading="eager" />
            </div>
          </div>
        </header>

        {/* CONTENT SCROLLABILE */}
        <main className="mobile-content">
          <div className="wine-list-container">
            {/* Riga fornitore semplice */}
            <div className="p-4">
              <p className="text-sm font-medium" style={{ color: '#541111' }}>
                Fornitore: {fornitore.toUpperCase()}
              </p>
            </div>

            {/* Lista righe scrollabile */}
            <div className="p-4 space-y-3">
              {dettagli.map((dettaglio, index) => {
                const currentQuantity = modifiedQuantities[index] ?? dettaglio.quantity;
                
                return (
                  <div key={index} className="bg-white rounded-lg border p-4" style={{ borderColor: '#e2d6aa' }}>
                    {/* Nome vino */}
                    <div className="mb-3">
                      <h4 className="font-medium text-sm truncate" style={{ color: '#541111' }}>
                        {dettaglio.wineName}
                      </h4>
                    </div>
                    
                    {/* Quantità centrata con label sotto */}
                    <div className="flex flex-col items-center">
                      <div
                        onClick={() => handleQuantityClick(index)}
                        className="px-4 py-2 rounded border cursor-pointer transition-all duration-200 hover:bg-gray-50"
                        style={{ 
                          borderColor: '#e2d6aa',
                          background: 'white'
                        }}
                      >
                        <span className="text-lg font-bold" style={{ color: '#541111' }}>
                          {currentQuantity}
                        </span>
                      </div>
                      <span className="text-xs mt-1" style={{ color: '#7a4a30' }}>
                        {dettaglio.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </main>

        {/* NAVBAR FISSA */}
        <nav className="mobile-navbar">
          <div className="flex gap-4 justify-center w-full px-4">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-lg font-medium transition-colors"
              title="Annulla"
              style={{ 
                background: '#6b7280',
                color: '#fff9dc',
                whiteSpace: 'nowrap'
              }}
            >
              Annulla
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-lg font-medium transition-colors"
              title="Conferma Modifiche"
              style={{ 
                background: '#16a34a',
                color: '#fff9dc',
                whiteSpace: 'nowrap'
              }}
            >
              CONFERMA MODIFICHE
            </button>
          </div>
        </nav>
      </div>

      {/* Modale quantità */}
      <GestisciOrdiniInventoryModal
        isOpen={showQuantityModal}
        initialValue={editingItem?.currentValue || 0}
        onConfirm={handleQuantityConfirm}
        onCancel={handleQuantityCancel}
        min={0}
        max={100}
        originalValue={editingItem?.originalValue}
      />

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
