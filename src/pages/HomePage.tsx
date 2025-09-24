import { useState, useEffect } from 'react';
import { Filter, Plus, Database, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FilterModal from '../components/FilterModal';
import WineDetailsModal from '../components/WineDetailsModal';
import InventoryModal from '../components/InventoryModal';
import CarrelloOrdiniModal from '../components/modals/CarrelloOrdiniModal';
import NuovoOrdineModal from '../components/modals/NuovoOrdineModal';

import useWines from '../hooks/useWines';
import { useAutoSizeText } from '../hooks/useAutoSizeText';
import { useCarrelloOrdini } from '../hooks/useCarrelloOrdini';
import { useNuovoOrdine } from '../hooks/useNuovoOrdine';
import { supabase } from '../lib/supabase';

import { WineType } from '../hooks/useWines';

export default function HomePage() {
  const navigate = useNavigate();
  const {
    wines,
    suppliers,
    loading,
    error,
    refreshWines,
    updateWineInventory,
    updateWine
  } = useWines();

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // App senza autenticazione - sempre autenticato
    setIsAuthenticated(true);
  }, []);

  const [filters, setFilters] = useState({ wineType: '', supplier: '', showAlertsOnly: false });
  const [selectedWine, setSelectedWine] = useState<WineType | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showWineDetailsModal, setShowWineDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("TUTTI I VINI");
  const [animatingInventory, setAnimatingInventory] = useState<string | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingWine, setEditingWine] = useState<WineType | null>(null);

  // Hook per gestire il modale Nuovo Ordine
  const {
    isNuovoOrdineModalOpen,
    openNuovoOrdineModal,
    closeNuovoOrdineModal,
    handleAvanti
  } = useNuovoOrdine();

  // Hook per gestire il modale Carrello Ordini
  const {
    isCarrelloModalOpen,
    openCarrelloModal,
    closeCarrelloModal,
    handleNuovoOrdine,
    handleGestisciOrdini
  } = useCarrelloOrdini({ onNuovoOrdine: openNuovoOrdineModal });

  // Auto-sizing per il testo del chip "Tutti"
  const chipDisplayText = activeTab === 'TUTTI I VINI' ? 'Tutti' : 
                         activeTab === 'BOLLICINE ITALIANE' ? 'Bollicine IT' :
                         activeTab === 'BOLLICINE FRANCESI' ? 'Bollicine FR' :
                         activeTab === 'BIANCHI' ? 'Bianchi' :
                         activeTab === 'ROSSI' ? 'Rossi' :
                         activeTab === 'ROSATI' ? 'Rosati' :
                         activeTab === 'VINI DOLCI' ? 'Dolci' : 'Tutti';

  const { elementRef: chipTextRef } = useAutoSizeText({
    text: chipDisplayText,
    minFontSize: 12,
    maxFontSize: 20,
    paddingHorizontal: 32, // 16px * 2 dal CSS
    caretWidth: 0, // nessun caret visibile
    marginSafety: 6
  });
  

  const filteredWines = wines
    .filter(wine => {
    const normalizedType = (wine.type || '').toLowerCase(); // ✅ FIX crash

    // Esclude le righe che sono solo nomi di tipologie (senza produttore/descrizione)
    const isTypeHeaderOnly = !wine.description && !wine.supplier && 
      (wine.name === "BIANCHI" || wine.name === "ROSSI" || wine.name === "ROSATI" || 
       wine.name === "BOLLICINE ITALIANE" || wine.name === "BOLLICINE FRANCESI" || 
       wine.name === "VINI DOLCI");

    if (isTypeHeaderOnly) {
      return false;
    }

    const matchesCategory = 
      activeTab === "TUTTI I VINI" ||
      (activeTab === "BOLLICINE ITALIANE" && (normalizedType === "bollicine italiane" || normalizedType === "bollicine")) ||
      (activeTab === "BOLLICINE FRANCESI" && normalizedType === "bollicine francesi") ||
      (activeTab === "BIANCHI" && (normalizedType === "bianchi" || normalizedType === "bianco")) ||
      (activeTab === "ROSSI" && (normalizedType === "rossi" || normalizedType === "rosso")) ||
      (activeTab === "ROSATI" && (normalizedType === "rosati" || normalizedType === "rosato")) ||
      (activeTab === "VINI DOLCI" && (normalizedType === "vini dolci" || normalizedType === "dolce"));

    const matchesType = !filters.wineType || normalizedType === filters.wineType;
    const matchesSupplier = !filters.supplier || wine.supplier === filters.supplier;
    // Logica alert: se showAlertsOnly è true, mostra SOLO vini con giacenza <= minStock
    const isInAlert = wine.inventory <= wine.minStock;
    const matchesAlerts = !filters.showAlertsOnly || isInAlert;
    

    return matchesCategory && matchesType && matchesSupplier && matchesAlerts;
  })
  .sort((a, b) => {
    // ✅ Ordinamento alfabetico A-Z SOLO per "TUTTI I VINI"
    if (activeTab === "TUTTI I VINI") {
      return a.name.localeCompare(b.name, 'it', { 
        sensitivity: 'base',
        numeric: true,
        ignorePunctuation: true 
      });
    }
    // ✅ Per le singole tipologie, mantieni ordine originale del database/Google Sheet
    return 0;
  });

  const handleInventoryChange = async (id: string, value: number) => {
    const adjusted = Math.max(0, value);
    console.log('🔄 Aggiornamento giacenza:', id, 'da', wines.find(w => w.id === id)?.inventory, 'a', adjusted);

    // Aggiornamento ottimistico per feedback immediato
    const previousInventory = wines.find(w => w.id === id)?.inventory || 0;

    const success = await updateWineInventory(id, adjusted);
    if (success) {
      console.log('✅ Giacenza salvata correttamente su Supabase');
      // Trigger animation feedback
      setAnimatingInventory(id);
      setTimeout(() => setAnimatingInventory(null), 600);
    } else {
      console.error('❌ Errore aggiornamento giacenza - rollback a:', previousInventory);
      // In caso di errore, forza il refresh per sincronizzare
      await refreshWines();
    }
  };

  const handleWineClick = (wine: WineType) => {
    setSelectedWine(wine);
    setShowWineDetailsModal(true);
  };


  const handleTabChange = (category: string) => {
    setActiveTab(category);
  };


  const handleUpdateWine = async (id: string, updates: Partial<WineType>): Promise<void> => {
    await updateWine(id, updates);
  };

  // Gestione Modale Giacenza
  const handleOpenInventoryModal = (wine: WineType) => {
    setEditingWine(wine);
    setShowInventoryModal(true);
  };

  const handleCloseInventoryModal = () => {
    setShowInventoryModal(false);
    setEditingWine(null);
  };

  const handleConfirmInventory = async (newValue: number) => {
    if (!editingWine) return;
    
    const previousValue = editingWine.inventory;
    
    // Chiudi modale immediatamente per UX fluida
    handleCloseInventoryModal();
    
    // Update ottimistico + sync backend
    try {
      await handleInventoryChange(editingWine.id, newValue);
      console.log('✅ Giacenza aggiornata con successo');
    } catch (error) {
      // Rollback + toast su errore
      console.error('❌ Errore salvataggio giacenza, rollback a:', previousValue);
      // TODO: Aggiungere toast di errore se necessario
    }
  };



  if (!isAuthenticated) return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <p className="text-app-text">Effettua l'accesso per vedere i tuoi vini</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-app-warn border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-app-text">Caricamento vini...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <div className="text-center">
        <p className="text-app-danger mb-4">{error}</p>
        <button onClick={refreshWines} className="bg-app-accent hover:bg-app-accent/80 text-white px-4 py-2 rounded-lg">
          Riprova
        </button>
      </div>
    </div>
  );

  return (
    <div className="homepage-container" style={{ 
      width: '100vw',
      height: '100vh',
      maxWidth: '100%',
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--bg)'
    }}>
      {/* HEADER FISSO */}
      <header className="mobile-header">
        <div className="header-content">
          <div className="logo-wrap">
            <picture>
              <source type="image/webp" srcSet="/logo1.webp" />
              <img 
                src="/logo1.png" 
                alt="WINENODE"
                loading="eager"
              />
            </picture>
          </div>
        </div>
      </header>

      {/* CONTENT-LISTA SCROLLABILE */}
      <main className="mobile-content">
        <div className="wine-list-container"
          style={{
            height: '100%',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none',
            touchAction: 'pan-y',
            scrollBehavior: 'smooth'
          }}
        >
          

          {filteredWines.length === 0 ? (
            <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
              {wines.length === 0 ? 'Nessun vino nel tuo inventario' : 'Nessun vino trovato con i filtri selezionati'}
            </p>
          ) : (
            <div className="space-y-0.5 sm:space-y-1 overflow-x-hidden w-full">
              {filteredWines.map(wine => (
                <div key={wine.id} className="wine-card rounded-lg overflow-x-hidden w-full max-w-full" style={{ 
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  padding: '6px 8px',
                  boxShadow: 'var(--shadow)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}>
                  <div className="flex items-center justify-between gap-2 sm:gap-3 overflow-x-hidden w-full">
                    <div className="flex-1 cursor-pointer overflow-x-hidden min-w-0" onClick={() => handleWineClick(wine)}>
                      <div className="flex flex-col gap-0.5 sm:gap-1 overflow-x-hidden min-w-0">
                        {/* Prima riga: Nome vino tutto maiuscolo */}
                        <div className="text-xs sm:text-sm font-semibold truncate overflow-x-hidden uppercase leading-tight" style={{ color: 'var(--text)' }}>
                          {wine.name}
                        </div>
                        {/* Seconda riga: Anno · Produttore · Fornitore € Prezzo */}
                        <div className="text-xs truncate overflow-x-hidden leading-tight" style={{ fontSize: '10px' }}>
                          {wine.vintage && (
                            <>
                              <span className="vintage" style={{ color: 'var(--muted-text)' }}>{wine.vintage}</span>
                              {(wine.description || (wine.supplier && wine.supplier.trim() && wine.supplier.trim() !== 'Non specificato')) && (
                                <span className="mx-2" style={{ color: 'var(--muted-text)' }}>·</span>
                              )}
                            </>
                          )}
                          {wine.description && (
                            <>
                              <span className="producer" style={{ color: 'var(--muted-text)' }}>{wine.description}</span>
                              {wine.supplier && wine.supplier.trim() && wine.supplier.trim() !== 'Non specificato' && (
                                <span className="mx-2" style={{ color: 'var(--muted-text)' }}>·</span>
                              )}
                            </>
                          )}
                          {wine.supplier && wine.supplier.trim() && wine.supplier.trim() !== 'Non specificato' && (
                            <span className="font-medium" style={{ color: 'var(--warn)' }}>{wine.supplier}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {wine.inventory <= wine.minStock && (
                      <span className="alert-icon flex-shrink-0"></span>
                    )}
                    <div className="flex items-center flex-shrink-0 ml-auto">
                      <span 
                        onClick={e => { 
                          e.stopPropagation(); 
                          handleOpenInventoryModal(wine);
                        }}
                        className={`font-bold text-sm sm:text-base cursor-pointer text-center py-2 px-2 transition-all duration-200 rounded-lg ${
                          animatingInventory === wine.id ? 'animate-pulse' : ''
                        }`}
                        style={{ 
                          color: wine.inventory <= wine.minStock ? 'var(--danger)' : 'var(--text)',
                          minWidth: '44px',
                          minHeight: '44px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: animatingInventory === wine.id ? 'var(--warn)' : 'transparent',
                          fontWeight: wine.inventory <= wine.minStock ? 'bold' : 'normal'
                        }}
                      >
                        {wine.inventory || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* NAVBAR FISSA IN BASSO */}
      <nav className="mobile-navbar">
        <button 
          onClick={openCarrelloModal}
          className="nav-btn btn-ordine"
          title="Carrello Ordini"
        >
          <div className="icon"></div>
          <span className="label">Ordine</span>
        </button>
        
        <button 
          onClick={() => setShowFilterModal(true)} 
          className="nav-btn btn-filtri"
          title="Filtri"
        >
          <div className="icon"></div>
          <span className="label">Filtri</span>
          {(filters.wineType || filters.supplier) && (
            <div className="badge"></div>
          )}
        </button>
        
        <button
          onClick={() => setFilters(prev => ({ ...prev, showAlertsOnly: !prev.showAlertsOnly }))}
          className="nav-btn btn-allert"
          title={filters.showAlertsOnly ? "Mostra tutti i vini" : "Mostra solo vini in esaurimento"}
          style={{ 
            background: filters.showAlertsOnly ? 'var(--danger)' : 'transparent',
            color: filters.showAlertsOnly ? 'white' : 'var(--text)',
            borderRadius: '8px',
            border: 'none',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            WebkitAppearance: 'none',
            appearance: 'none'
          } as React.CSSProperties}
        >
          <div className="icon" style={{
            background: filters.showAlertsOnly ? 'white' : 'var(--text)',
            WebkitMask: 'url("/allert.png") center/contain no-repeat',
            mask: 'url("/allert.png") center/contain no-repeat'
          }}></div>
          <span className="label" style={{
            color: filters.showAlertsOnly ? 'white' : 'var(--text)'
          }}>Alert</span>
        </button>
        
        <button
          onClick={() => {/* Toggle dropdown logic */}}
          className="nav-btn btn-tutti"
          title="Seleziona categoria"
          aria-label={`Filtro attivo: ${activeTab}`}
        >
          <span 
            ref={chipTextRef}
            className="label"
            style={{ 
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
              width: '100%'
            }}
          >
            {chipDisplayText}
          </span>
          <select
            value={activeTab}
            onChange={(e) => handleTabChange(e.target.value)}
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              opacity: 0, 
              cursor: 'pointer' 
            }}
          >
            <option value="TUTTI I VINI">TUTTI</option>
            <option value="BOLLICINE ITALIANE">Bollicine IT</option>
            <option value="BOLLICINE FRANCESI">Bollicine FR</option>
            <option value="BIANCHI">Bianchi</option>
            <option value="ROSSI">Rossi</option>
            <option value="ROSATI">Rosati</option>
            <option value="VINI DOLCI">Vini Dolci</option>
          </select>
        </button>
      </nav>

      <FilterModal 
        open={showFilterModal} 
        onOpenChange={setShowFilterModal} 
        filters={filters} 
        onFiltersChange={setFilters}
        suppliers={suppliers}
        wines={wines}
      />
      <WineDetailsModal wine={selectedWine} open={showWineDetailsModal} onOpenChange={setShowWineDetailsModal} onUpdateWine={handleUpdateWine} suppliers={suppliers} />

      <InventoryModal
        isOpen={showInventoryModal}
        initialValue={editingWine?.inventory || 0}
        onConfirm={handleConfirmInventory}
        onCancel={handleCloseInventoryModal}
        min={0}
        max={999}
      />

      <CarrelloOrdiniModal
        isOpen={isCarrelloModalOpen}
        onOpenChange={closeCarrelloModal}
        onNuovoOrdine={handleNuovoOrdine}
        onGestisciOrdini={handleGestisciOrdini}
      />

      <NuovoOrdineModal
        isOpen={isNuovoOrdineModalOpen}
        onOpenChange={closeNuovoOrdineModal}
        suppliers={suppliers}
        onAvanti={handleAvanti}
      />
      
    </div>
  );
}