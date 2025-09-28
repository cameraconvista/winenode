import { useState, useEffect } from 'react';
import { Filter, Plus, Database, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PhosphorCart from '~icons/ph/shopping-cart-light';
import PhosphorFunnel from '~icons/ph/funnel-light';
import PhosphorBell from '~icons/ph/bell-light';
import PhosphorMagnifyingGlass from '~icons/ph/magnifying-glass-light';
import FilterModal from '../components/FilterModal';
import WineDetailsModal from '../components/WineDetailsModal';
import HomeInventoryModal from '../components/HomeInventoryModal';
import CarrelloOrdiniModal from '../components/modals/CarrelloOrdiniModal';
import NuovoOrdineModal from '../components/modals/NuovoOrdineModal';
import { WineSearchBar } from '../components/search/WineSearchBar';
import OrdersPinModal from '../components/security/OrdersPinModal';

import useWines from '../hooks/useWines';
import { useAutoSizeText } from '../hooks/useAutoSizeText';
import { useCarrelloOrdini } from '../hooks/useCarrelloOrdini';
import { useNuovoOrdine } from '../hooks/useNuovoOrdine';
import { useWineSearch } from '../hooks/useWineSearch';
import { useOrdersPinGate } from '../hooks/useOrdersPinGate';
import { supabase } from '../lib/supabase';
import { isFeatureEnabled } from '../config/features';

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

  // Hook per gestire il PIN gate degli ordini
  const {
    isOrdersUnlocked,
    isPinModalOpen,
    isLocked,
    lockoutCountdown,
    attempts,
    openPinModal,
    closePinModal,
    validatePin,
    unlock
  } = useOrdersPinGate();

  // Handler per il click del carrello con PIN gate
  const handleCarrelloClick = () => {
    if (isOrdersUnlocked) {
      openCarrelloModal();
    } else {
      openPinModal();
    }
  };

  // Handler per PIN valido
  const handleValidPin = () => {
    unlock();
    openCarrelloModal();
  };

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
  

  // Prima applico i filtri esistenti, poi la ricerca se abilitata
  const baseFilteredWines = wines
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

  // Hook ricerca vini (solo se feature abilitata)
  const wineSearch = useWineSearch(baseFilteredWines);

  // Applico la ricerca se feature abilitata e ricerca attiva
  const filteredWines = isFeatureEnabled('searchLens') && wineSearch.isFiltering 
    ? wineSearch.filteredWines.filter(wine => baseFilteredWines.some(bw => bw.id === wine.id))
    : baseFilteredWines;

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
    
    // Chiudi modale immediatamente per UX fluida
    handleCloseInventoryModal();
    
    // Animazione di conferma
    setAnimatingInventory(editingWine.id);
    
    try {
      await updateWineInventory(editingWine.id, newValue);
      console.log('✅ Giacenza aggiornata con successo');
    } catch (error) {
      console.error('❌ Errore aggiornamento giacenza:', error);
    } finally {
      // Rimuovi animazione dopo 1 secondo
      setTimeout(() => setAnimatingInventory(null), 1000);
    }
  };



  if (!isAuthenticated) return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <p className="text-app-text">Effettua l'accesso per vedere i tuoi vini</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-app-accent"></div>
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
          {/* Barra di ricerca (se feature abilitata) */}
          {isFeatureEnabled('searchLens') && (
            <WineSearchBar
              isOpen={wineSearch.isSearchOpen}
              searchQuery={wineSearch.searchQuery}
              onQueryChange={wineSearch.updateQuery}
              onClose={wineSearch.closeSearch}
              onClear={wineSearch.clearSearch}
            />
          )}

          {filteredWines.length === 0 ? (
            <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
              {wines.length === 0 ? 'Nessun vino nel tuo inventario' : 'Nessun vino trovato con i filtri selezionati'}
            </p>
          ) : (
            <div 
              className="space-y-0.5 sm:space-y-1 overflow-x-hidden w-full"
              style={{
                paddingBottom: 'calc(64pt + env(safe-area-inset-bottom, 0px) + 12pt)'
              }}
            >
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
                      <PhosphorBell 
                        className="flex-shrink-0 mr-2" 
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          color: 'var(--danger)' 
                        }}
                        aria-hidden="true" 
                      />
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
        {/* Gruppo icone a sinistra */}
        <div className="nav-icons-group">
          <button 
            onClick={handleCarrelloClick}
            className="nav-btn btn-ordine"
            title="Carrello Ordini"
          >
            <PhosphorCart className="icon" aria-hidden="true" />
          </button>
          
          <button 
            onClick={() => setShowFilterModal(true)} 
            className="nav-btn btn-filtri"
            title="Filtri"
            style={{ 
              background: (filters.wineType || filters.supplier) ? '#d4a300' : 'transparent',
              color: (filters.wineType || filters.supplier) ? 'white' : 'var(--text)',
              borderRadius: '8px',
              border: 'none',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
              WebkitAppearance: 'none',
              appearance: 'none'
            } as React.CSSProperties}
          >
            <PhosphorFunnel 
              className="icon" 
              aria-hidden="true"
              style={{
                color: (filters.wineType || filters.supplier) ? 'white' : 'var(--text)'
              }}
            />
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
            <PhosphorBell 
              className="icon" 
              aria-hidden="true"
              style={{
                color: filters.showAlertsOnly ? 'white' : 'var(--text)'
              }}
            />
          </button>
          
          {/* Icona lente ricerca (se feature abilitata) */}
          {isFeatureEnabled('searchLens') && (
            <button
              onClick={wineSearch.toggleSearch}
              className="nav-btn btn-search"
              title={wineSearch.isSearchOpen ? "Chiudi ricerca" : "Cerca vini"}
              aria-label={wineSearch.isSearchOpen ? "Chiudi ricerca" : "Apri ricerca"}
              style={{ 
                background: wineSearch.isSearchOpen ? 'var(--accent)' : 'transparent',
                color: wineSearch.isSearchOpen ? 'white' : 'var(--text)',
                borderRadius: '8px',
                border: 'none',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
                WebkitAppearance: 'none',
                appearance: 'none'
              } as React.CSSProperties}
            >
              <PhosphorMagnifyingGlass 
                className="icon" 
                aria-hidden="true"
                style={{
                  color: wineSearch.isSearchOpen ? 'white' : 'var(--text)'
                }}
              />
            </button>
          )}
        </div>
        
        {/* Pulsante "Tutti" a destra */}
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
        wines={wines}
      />
      <WineDetailsModal wine={selectedWine} open={showWineDetailsModal} onOpenChange={setShowWineDetailsModal} onUpdateWine={handleUpdateWine} suppliers={suppliers} />

      <HomeInventoryModal
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
        onAvanti={handleAvanti}
      />

      <OrdersPinModal
        open={isPinModalOpen}
        onClose={closePinModal}
        onValidPin={handleValidPin}
        onInvalidPin={() => {}} // Gestito internamente dal modale
        validatePin={validatePin}
        isLocked={isLocked}
        lockoutCountdown={lockoutCountdown}
        attempts={attempts}
      />
      
    </div>
  );
}