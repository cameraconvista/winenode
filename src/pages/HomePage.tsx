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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-cream">Effettua l'accesso per vedere i tuoi vini</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-cream">Caricamento vini...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={refreshWines} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg">
          Riprova
        </button>
      </div>
    </div>
  );

  return (
    <div className="homepage-container h-screen flex flex-col overflow-hidden" style={{ 
      background: 'linear-gradient(to bottom right, #1f0202, #2d0505)',
      width: '100vw',
      maxWidth: '100%'
    }}>
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0 fixed top-0 left-0 right-0 z-[100]">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <div className="flex flex-col items-center">
            {/* Logo centrato - ottimizzato per mobile */}
            <img 
              src="/logo 2 CCV.png" 
              alt="WINENODE" 
              className="h-12 sm:h-20 md:h-28 w-auto object-contain -mb-1" 
            />

            {/* Pulsantiera sotto il logo - ottimizzata per mobile */}
            <div className="flex items-center justify-between w-full pb-1 sm:pb-2">
              {/* Gruppo pulsanti a sinistra */}
              <div className="flex gap-1 sm:gap-2">
                {/* RIMOSSO: Pulsante Settings - pagina eliminata */}
                {/* RIMOSSO: Pulsante Archivi - pagina eliminata */}
                <button 
                  onClick={() => setShowCarrelloModal(true)} 
                  title="Nuovo Ordine" 
                  className="text-white hover:text-gray-300 hover:bg-gray-700/50 rounded-lg p-2 sm:p-2 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <span className="text-lg sm:text-xl filter brightness-200 contrast-200">🛒</span>
                </button>
                <button 
                  onClick={() => setShowFilterModal(true)} 
                  title="Filtri" 
                  className={`text-cream hover:text-gray-300 hover:bg-gray-700/50 rounded-lg p-2 sm:p-2 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center relative ${
                    (filters.wineType || filters.supplier) ? 'bg-amber-500/20' : ''
                  }`}
                >
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                  {(filters.wineType || filters.supplier) && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-gray-900 animate-pulse"></span>
                  )}
                </button>
                
              </div>

              {/* Spazio centrale vuoto */}
              <div className="flex-1"></div>

              {/* Gruppo pulsanti a destra */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, showAlertsOnly: !prev.showAlertsOnly }))}
                  className={`flex items-center justify-center px-2 py-2 text-xs font-bold rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] border
                    ${filters.showAlertsOnly 
                      ? 'bg-black/20 border-red-900/20 text-white hover:bg-black/30' 
                      : 'bg-black/20 border-red-900/20 text-gray-300 hover:bg-black/30'
                    }
                  `}
                  title="Mostra solo vini in esaurimento"
                >
                  <span className="text-xs">⚠️</span>
                </button>

                <div className="relative">
                  <select
                    value={activeTab}
                    onChange={(e) => handleTabChange(e.target.value)}
                    className="bg-black/20 border border-red-900/20 rounded-lg px-2 py-2 text-xs text-cream font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 cursor-pointer hover:bg-black/30 transition-all duration-200 appearance-none min-h-[44px] homepage-select-mobile"
                    style={{ 
                      minWidth: '100px',
                      maxWidth: '130px'
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
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>





      <main className="flex-1 max-w-4xl mx-auto w-full flex flex-col overflow-hidden" style={{ 
        marginTop: window.innerWidth <= 640 ? '85px' : 'calc(64px + 68px)', // Ridotto spazio mobile
        height: window.innerWidth <= 640 ? 'calc(100vh - 85px)' : 'calc(100vh - 132px)'
      }}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-3 py-2 sm:py-4" style={{
          maxHeight: '100%',
          scrollBehavior: 'smooth'
        }}>
          

          {filteredWines.length === 0 ? (
            <p className="text-center text-gray-400 text-sm">
              {wines.length === 0 ? 'Nessun vino nel tuo inventario' : 'Nessun vino trovato con i filtri selezionati'}
            </p>
          ) : (
            <div className="space-y-0.5 sm:space-y-1 overflow-x-hidden w-full">
              {filteredWines.map(wine => (
                <div key={wine.id} className="wine-card bg-black/20 border border-red-900/20 rounded-lg p-1.5 sm:p-2 hover:bg-black/30 transition-all duration-200 overflow-x-hidden w-full max-w-full">
                  <div className="flex items-center justify-between gap-2 sm:gap-3 overflow-x-hidden w-full">
                    <div className="flex-1 cursor-pointer overflow-x-hidden min-w-0" onClick={() => handleWineClick(wine)}>
                      <div className="flex flex-col gap-0.5 sm:gap-1 overflow-x-hidden min-w-0">
                        {/* Prima riga: Nome vino tutto maiuscolo */}
                        <div className="text-xs sm:text-sm font-semibold truncate overflow-x-hidden uppercase leading-tight" style={{ color: '#fffbe5' }}>
                          {wine.name}
                        </div>
                        {/* Seconda riga: Anno · Produttore · Fornitore € Prezzo */}
                        <div className="text-xs text-gray-400 truncate overflow-x-hidden leading-tight" style={{ fontSize: '10px' }}>
                          {wine.vintage && (
                            <>
                              <span className="text-gray-400 font-medium">{wine.vintage}</span>
                              <span className="mx-2">·</span>
                            </>
                          )}
                          {wine.description && (
                            <>
                              <span className="text-gray-400 font-medium">{wine.description}</span>
                              <span className="mx-2">·</span>
                            </>
                          )}
                          {wine.supplier && wine.supplier.trim() && wine.supplier.trim() !== 'Non specificato' && (
                            <span className="text-yellow-200 font-medium">{wine.supplier}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {wine.inventory <= wine.minStock && (
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                      <button 
                        onClick={e => { e.stopPropagation(); handleInventoryChange(wine.id, wine.inventory - 1); }} 
                        disabled={wine.inventory <= 0} 
                        className="bg-red-500/80 hover:bg-red-600/90 disabled:bg-gray-600/70 rounded-full flex items-center justify-center font-bold transition-all duration-200 touch-manipulation shadow-sm mobile-button-small"
                      >
                        −
                      </button>
                      {editingInventoryId === wine.id ? (
                        <input
                          type="number"
                          value={editingValue}
                          onChange={e => setEditingValue(e.target.value)}
                          onBlur={handleInventorySave}
                          className="w-11 h-7 sm:w-12 sm:h-8 bg-gray-800 border border-gray-600 rounded text-cream text-center text-xs sm:text-sm"
                          autoFocus
                          min="0"
                        />
                      ) : (
                        <span 
                          onClick={e => handleInventoryClick(e, wine)} 
                          className={`text-cream font-bold text-sm sm:text-base cursor-pointer min-w-[28px] sm:min-w-[32px] text-center py-1 px-1.5 sm:px-2 transition-all duration-200 ${
                            animatingInventory === wine.id ? 'animate-pulse bg-amber-500/20 rounded' : ''
                          }`}
                        >
                          {wine.inventory || 0}
                        </span>
                      )}
                      <button 
                        onClick={e => { e.stopPropagation(); handleInventoryChange(wine.id, wine.inventory + 1); }} 
                        className="bg-green-500/80 hover:bg-green-600/90 rounded-full flex items-center justify-center font-bold transition-all duration-200 touch-manipulation shadow-sm mobile-button-small"
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