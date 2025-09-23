import { useState, useEffect } from 'react';
import { Filter, Plus, Database, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FilterModal from '../components/FilterModal';
import WineDetailsModal from '../components/WineDetailsModal';
import CarrelloModal from '../components/CarrelloModal';

import useWines from '../hooks/useWines';
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
  const [showCarrelloModal, setShowCarrelloModal] = useState(false);
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [activeTab, setActiveTab] = useState("TUTTI I VINI");
  const [animatingInventory, setAnimatingInventory] = useState<string | null>(null);
  const [showOrdineModal, setShowOrdineModal] = useState(false);
  

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
    const matchesAlerts = !filters.showAlertsOnly || wine.inventory <= wine.minStock;

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

  const handleInventoryClick = (e: React.MouseEvent, wine: WineType) => {
    e.stopPropagation();
    setEditingInventoryId(wine.id);
    setEditingValue(wine.inventory.toString());
  };

  const handleInventorySave = async () => {
    if (editingInventoryId === null) return;
    const value = parseInt(editingValue);
    if (!isNaN(value) && value >= 0) {
      console.log('🔄 Salvataggio manuale giacenza:', editingInventoryId, 'valore:', value);
      await handleInventoryChange(editingInventoryId, value);
    } else {
      console.warn('⚠️ Valore giacenza non valido:', editingValue);
      // Reset al valore precedente in caso di errore
      const wine = wines.find(w => w.id === editingInventoryId);
      if (wine) setEditingValue(wine.inventory.toString());
    }
    setEditingInventoryId(null);
    setEditingValue('');
  };

  const handleTabChange = (category: string) => {
    setActiveTab(category);
  };

  const handleFornitoreSelezionato = (fornitore: string) => {
    console.log('Fornitore selezionato:', fornitore);
    setShowOrdineModal(false);
    // TODO: Implementare navigazione a pagina ordine con fornitore preselezionato
  };

  const handleUpdateWine = async (id: string, updates: Partial<WineType>): Promise<void> => {
    await updateWine(id, updates);
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
    <div className="homepage-container h-screen flex flex-col overflow-hidden bg-app-bg" style={{ 
      width: '100vw',
      maxWidth: '100%'
    }}>
      <header className="app-topbar flex-shrink-0">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <div className="logo-wrap">
            {/* Logo brand fuori dalla status bar */}
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





      <main className="flex-1 max-w-4xl mx-auto w-full flex flex-col" style={{ 
        paddingTop: '78px', // CAMBIATO: padding invece di margin per evitare conflitti
        height: '100vh', // SEMPLIFICATO: altezza piena viewport
        paddingBottom: 'calc(52px + env(safe-area-inset-bottom))' // Toolbar compatta + safe area
      }}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-3" style={{
          maxHeight: '100%',
          scrollBehavior: 'smooth',
          touchAction: 'pan-y', // Solo scroll verticale
          WebkitOverflowScrolling: 'touch', // Smooth scrolling su iOS
          overscrollBehavior: 'none', // RAFFORZATO: nessun rubber band
          position: 'relative', // Assicura che sia un contenitore di scroll indipendente
          zIndex: 1, // Sotto header e toolbar
          paddingTop: '8px', // AGGIUNTO: spazio sopra per primo elemento
          paddingBottom: '8px' // AGGIUNTO: spazio sotto per ultimo elemento
        }}>
          

          {filteredWines.length === 0 ? (
            <p className="text-center text-app-muted text-sm">
              {wines.length === 0 ? 'Nessun vino nel tuo inventario' : 'Nessun vino trovato con i filtri selezionati'}
            </p>
          ) : (
            <div className="space-y-0.5 sm:space-y-1 overflow-x-hidden w-full">
              {filteredWines.map(wine => (
                <div key={wine.id} className="wine-card bg-app-surface-2 border border-app-border rounded-lg p-1.5 sm:p-2 overflow-x-hidden w-full max-w-full" style={{ 
                  boxShadow: 'var(--shadow)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}>
                  <div className="flex items-center justify-between gap-2 sm:gap-3 overflow-x-hidden w-full">
                    <div className="flex-1 cursor-pointer overflow-x-hidden min-w-0" onClick={() => handleWineClick(wine)}>
                      <div className="flex flex-col gap-0.5 sm:gap-1 overflow-x-hidden min-w-0">
                        {/* Prima riga: Nome vino tutto maiuscolo */}
                        <div className="text-xs sm:text-sm font-semibold truncate overflow-x-hidden uppercase leading-tight text-app-text">
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
                            <span className="text-app-warn font-medium">{wine.supplier}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {wine.inventory <= wine.minStock && (
                      <span className="alert-icon flex-shrink-0"></span>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                      <button 
                        onClick={e => { e.stopPropagation(); handleInventoryChange(wine.id, wine.inventory - 1); }} 
                        disabled={wine.inventory <= 0} 
                        className="bg-app-danger hover:bg-app-danger/80 disabled:bg-app-muted/50 text-white rounded-full flex items-center justify-center font-bold transition-all duration-200 touch-manipulation shadow-sm mobile-button-small"
                      >
                        −
                      </button>
                      {editingInventoryId === wine.id ? (
                        <input
                          type="number"
                          value={editingValue}
                          onChange={e => setEditingValue(e.target.value)}
                          onBlur={handleInventorySave}
                          className="w-11 h-7 sm:w-12 sm:h-8 bg-app-surface border border-app-border rounded text-app-text text-center text-xs sm:text-sm"
                          autoFocus
                          min="0"
                        />
                      ) : (
                        <span 
                          onClick={e => handleInventoryClick(e, wine)} 
                          className={`text-app-text font-bold text-sm sm:text-base cursor-pointer min-w-[28px] sm:min-w-[32px] text-center py-1 px-1.5 sm:px-2 transition-all duration-200 ${
                            animatingInventory === wine.id ? 'animate-pulse bg-app-warn/20 rounded' : ''
                          }`}
                        >
                          {wine.inventory || 0}
                        </span>
                      )}
                      <button 
                        onClick={e => { e.stopPropagation(); handleInventoryChange(wine.id, wine.inventory + 1); }} 
                        className="bg-app-accent hover:bg-app-accent/80 text-white rounded-full flex items-center justify-center font-bold transition-all duration-200 touch-manipulation shadow-sm mobile-button-small"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* TOOLBAR FISSA IN BASSO - UI POLISH v5 */}
      <footer className="bottom-toolbar">
        <button 
          onClick={() => setShowCarrelloModal(true)} 
          className="nav-btn btn-ordine"
          title="Nuovo Ordine"
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
          title="Mostra solo vini in esaurimento"
          style={{ 
            background: filters.showAlertsOnly ? 'var(--surface-hover)' : 'transparent'
          }}
        >
          <div className="icon"></div>
          <span className="label">Allert</span>
        </button>
        
        <button
          onClick={() => {/* Toggle dropdown logic */}}
          className="nav-btn btn-tutti"
          title="Seleziona categoria"
        >
          <span className="label">
            {activeTab === 'TUTTI I VINI' ? 'Tutti' : 
             activeTab === 'BOLLICINE ITALIANE' ? 'Bollicine IT' :
             activeTab === 'BOLLICINE FRANCESI' ? 'Bollicine FR' :
             activeTab === 'BIANCHI' ? 'Bianchi' :
             activeTab === 'ROSSI' ? 'Rossi' :
             activeTab === 'ROSATI' ? 'Rosati' :
             activeTab === 'VINI DOLCI' ? 'Dolci' : 'Tutti'}
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
      </footer>

      <FilterModal 
        open={showFilterModal} 
        onOpenChange={setShowFilterModal} 
        filters={filters} 
        onFiltersChange={setFilters}
        suppliers={suppliers}
        wines={wines}
      />
      <WineDetailsModal wine={selectedWine} open={showWineDetailsModal} onOpenChange={setShowWineDetailsModal} onUpdateWine={handleUpdateWine} suppliers={suppliers} />
      <CarrelloModal 
        open={showCarrelloModal} 
        onClose={() => setShowCarrelloModal(false)} 
        onFornitoreSelezionato={handleFornitoreSelezionato} 
      />
      
    </div>
  );
}