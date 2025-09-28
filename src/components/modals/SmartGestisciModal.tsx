import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { ORDINI_LABELS } from '../../constants/ordiniLabels';
import { isFeatureEnabled } from '../../config/featureFlags';
import GestisciOrdiniInventoryModal from '../GestisciOrdiniInventoryModal';
import ConfirmArchiveModal from './ConfirmArchiveModal';
import { getStandardButtonStyles, getNavbarTwoButtonLayout } from '../../utils/buttonStyles';
import useWines from '../../hooks/useWines';

interface DettaglioOrdine {
  wineName: string;
  wineDescription?: string; // Produttore/descrizione
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
  const { wines } = useWines();
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

  // Funzione per recuperare il produttore dal nome del vino
  const getWineProducer = (wineName: string) => {
    const wine = wines.find(w => w.name === wineName);
    return wine?.description || null;
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
      <div className="fixed inset-0 z-50" style={{ background: '#fff9dc' }}>
        {/* HEADER FISSO CON LOGO */}
        <header className="mobile-header">
          <div className="header-content">
            <div className="logo-wrap">
              <img src="/logo1.png" alt="WINENODE" loading="eager" />
            </div>
          </div>
        </header>

        {/* HEADER STICKY */}
        <div 
          className="sticky border-b"
          style={{ 
            background: 'var(--bg)', 
            borderColor: '#e2d6aa',
            top: 'calc(var(--safe-top) + 60pt)',
            zIndex: 40,
            paddingTop: '16px',
            paddingBottom: '16px',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          <div className="text-center">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold" style={{ color: '#541111' }}>
                Gestisci Ordine
              </h2>
            </div>
            <p className="text-base" style={{ color: '#7a4a30' }}>
              Fornitore: {fornitore.toUpperCase()}
            </p>
          </div>
        </div>

        {/* CONTENT SCROLLABILE */}
        <main className="mobile-content">
          <div className="wine-list-container" style={{ paddingTop: '16px' }}>

            {/* Lista righe scrollabile */}
            <div className="px-3 py-4 space-y-2">
              {dettagli.map((dettaglio, index) => {
                const currentQuantity = modifiedQuantities[index] ?? dettaglio.quantity;
                const producer = getWineProducer(dettaglio.wineName);
                
                return (
                  <div key={index} className="rounded-lg border py-3 px-4" style={{ background: '#fff2b8', borderColor: '#e2d6aa' }}>
                    {/* Layout: titolo a sinistra, quantità a destra */}
                    <div className="flex items-start justify-between">
                      {/* Nome vino + produttore */}
                      <div className="flex-1 pr-3">
                        <h4 className="font-medium text-sm leading-tight" 
                            style={{ 
                              color: '#541111',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                          {dettaglio.wineName}
                        </h4>
                        {producer && (
                          <p className="text-xs mt-1" style={{ color: '#7a4a30' }}>
                            {producer}
                          </p>
                        )}
                      </div>
                      
                      {/* Box quantità a destra - più compatto */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          onClick={() => handleQuantityClick(index)}
                          className="px-3 py-2 rounded border cursor-pointer transition-all duration-200 hover:bg-gray-50"
                          style={{ 
                            borderColor: '#e2d6aa',
                            background: 'white',
                            minWidth: '44px',
                            minHeight: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <span className="text-base font-bold" style={{ color: '#541111' }}>
                            {currentQuantity}
                          </span>
                        </div>
                        <span className="text-xs mt-1" style={{ color: '#7a4a30' }}>
                          {dettaglio.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </main>

        {/* FOOTER FISSO */}
        <footer 
          className="fixed bottom-0 left-0 right-0 p-4 border-t"
          style={{ 
            background: '#fff9dc', 
            borderColor: '#e2d6aa',
            paddingBottom: 'max(env(safe-area-inset-bottom), 0px) + 16px',
            zIndex: 50
          }}
        >
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-3 rounded-lg font-medium transition-colors"
              style={{ 
                background: 'white', 
                color: '#541111',
                border: '1px solid #e2d6aa',
                minHeight: '44px',
                minWidth: '120px',
                flex: '1',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              Indietro
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 rounded-lg font-medium transition-colors"
              style={{ 
                background: '#16a34a',
                color: '#fff9dc',
                minHeight: '44px',
                minWidth: '120px',
                flex: '1',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              Conferma modifiche
            </button>
          </div>
        </footer>
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
