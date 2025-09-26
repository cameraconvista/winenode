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
            {/* Fornitore */}
            <div className="p-4 border-b" style={{ borderColor: '#e2d6aa', background: '#f9f9f9' }}>
              <h3 className="font-medium" style={{ color: '#541111' }}>
                {fornitore}
              </h3>
            </div>

            {/* Lista righe scrollabile */}
            <div className="p-4 space-y-3">
              {dettagli.map((dettaglio, index) => {
                const currentQuantity = modifiedQuantities[index] ?? dettaglio.quantity;
                
                return (
                  <div key={index} className="bg-white rounded-lg border p-4" style={{ borderColor: '#e2d6aa' }}>
                    {/* Riga 1: Nome vino */}
                    <div className="mb-2">
                      <h4 className="font-medium text-sm truncate" style={{ color: '#541111' }}>
                        {dettaglio.wineName}
                      </h4>
                    </div>
                    
                    {/* Riga 2: Meta info + quantità */}
                    <div className="flex items-center justify-between text-xs" style={{ color: '#7a4a30' }}>
                      <div className="flex-1 truncate">
                        {dettaglio.unit} • €{dettaglio.unitPrice.toFixed(2)}/cad • €{(currentQuantity * dettaglio.unitPrice).toFixed(2)}
                      </div>
                      
                      {/* Quantità cliccabile */}
                      <div
                        onClick={() => handleQuantityClick(index)}
                        className="ml-3 px-3 py-1 rounded border cursor-pointer transition-all duration-200 hover:bg-gray-50 flex-shrink-0"
                        style={{ 
                          borderColor: '#e2d6aa',
                          background: 'white'
                        }}
                      >
                        <span className="text-sm font-bold" style={{ color: '#541111' }}>
                          {currentQuantity}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Riepilogo */}
            <div className="p-4">
              <div className="p-3 rounded border" style={{ borderColor: '#e2d6aa', background: '#f9f9f9' }}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium" style={{ color: '#7a4a30' }}>
                      {ORDINI_LABELS.gestioneInline.riepilogo.totaleConfermato}
                    </span>
                    <span className="ml-2 font-bold" style={{ color: '#541111' }}>
                      {totalConfermato}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: '#7a4a30' }}>
                      {ORDINI_LABELS.gestioneInline.riepilogo.valoreConfermato}
                    </span>
                    <span className="ml-2 font-bold" style={{ color: '#541111' }}>
                      €{valoreConfermato.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* NAVBAR FISSA */}
        <nav className="mobile-navbar">
          <button
            onClick={handleCancel}
            className="nav-btn"
            title="Annulla"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            title="Conferma Modifiche"
            style={{ 
              background: '#16a34a',
              color: '#fff9dc',
              marginLeft: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            CONFERMA MODIFICHE
          </button>
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
