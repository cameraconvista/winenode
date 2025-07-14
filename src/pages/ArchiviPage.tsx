import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import useWines from "../hooks/useWines";

import ImportaVini from "../components/ImportaVini";
import CategoryTabs from "../components/CategoryTabs";
import SearchAndFilters, { FornitoreFilter } from "../components/SearchAndFilters";
import WineTableHeader from "../components/WineTableHeader";
import WineTableRow from "../components/WineTableRow";
import { supabase, authManager } from "../lib/supabase";

interface WineRow {
  id: string;
  nomeVino: string;
  anno: string;
  produttore: string;
  provenienza: string;
  giacenza: number;
  fornitore: string;
  tipologia?: string;
}

export default function ArchiviPage() {
  const navigate = useNavigate();
  const { wines: existingWines, refreshWines, updateWineInventory } = useWines();
  // Larghezze colonne adattive per schermo intero senza scroll orizzontale
  const columnWidths = useMemo(() => {
    const w = window.innerWidth;
    
    if (w >= 1200) {
      return {
        "#": "3%",
        nomeVino: "25%",
        anno: "7%", 
        produttore: "22%",
        provenienza: "19%",
        fornitore: "14%",
        giacenza: "10%"
      };
    } else if (w >= 1025) {
      return {
        "#": "3%",
        nomeVino: "23%",
        anno: "7%",
        produttore: "20%", 
        provenienza: "18%",
        fornitore: "18%",
        giacenza: "11%"
      };
    } else if (w >= 768) {
      return {
        "#": "4%",
        nomeVino: "21%",
        anno: "7%",
        produttore: "19%",
        provenienza: "17%", 
        fornitore: "19%",
        giacenza: "13%"
      };
    } else {
      return {
        "#": "5%",
        nomeVino: "20%",
        anno: "7%",
        produttore: "17%",
        provenienza: "15%",
        fornitore: "21%",
        giacenza: "15%"
      };
    }
  }, []);

  const [wineRows, setWineRows] = useState<WineRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("BOLLICINE ITALIANE");
  const [filters, setFilters] = useState({ search: "", fornitore: "" });
  const [fontSize, setFontSize] = useState(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return (w <= 1024 && w > 480 && h < w) ? 12 : 14;
  });

  // Adatta font size su resize e gestisce orientamento mobile
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const newSize = (w <= 1024 && w > 480 && h < w) ? 12 : 14;
      setFontSize(prev => prev !== newSize ? newSize : prev);

      // Forza refresh del layout su mobile per orientamento
      if (w <= 768) {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    };

    // Gestione errori globali per Promise non gestite
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled promise rejection catturata:', event.reason);
      
      // Gestione specifica per errori di autenticazione Google
      if (event.reason && typeof event.reason === 'object') {
        if (event.reason.message && event.reason.message.includes('process is not defined')) {
          console.error('❌ Errore critico autenticazione Google - process not defined');
        } else if (event.reason.message && event.reason.message.includes('google-auth-library')) {
          console.error('❌ Errore libreria autenticazione Google');
        }
      }
      
      event.preventDefault(); // Previene il crash dell'app
    };

    // Gestione errori JavaScript generici
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Errore JavaScript catturato:', event.error);
      if (event.error && event.error.message && event.error.message.includes('process is not defined')) {
        console.error('❌ Errore critico - process is not defined');
      }
      event.preventDefault();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  const normalizeType = (type?: string | null) => {
    if (!type) return "";
    const normalized = type.toUpperCase().trim();

    // Mappatura esatta per categorie del Google Sheet
    if (normalized === "ROSSI" || normalized === "ROSSO") return "ROSSI";
    if (normalized === "BIANCHI" || normalized === "BIANCO") return "BIANCHI";
    if (normalized === "ROSATI" || normalized === "ROSATO") return "ROSATI";
    if (normalized === "BOLLICINE ITALIANE") return "BOLLICINE ITALIANE";
    if (normalized === "BOLLICINE FRANCESI") return "BOLLICINE FRANCESI";
    if (normalized === "VINI DOLCI" || normalized === "DOLCI") return "VINI DOLCI";

    // Fallback per compatibilità con vecchi dati
    if (normalized.includes("BOLLICINE") && normalized.includes("ITALIANA")) return "BOLLICINE ITALIANE";
    if (normalized.includes("BOLLICINE") && normalized.includes("FRANCESE")) return "BOLLICINE FRANCESI";
    if (normalized.includes("BIANCO")) return "BIANCHI";
    if (normalized.includes("ROSSO")) return "ROSSI";
    if (normalized.includes("ROSATO")) return "ROSATI";
    if (normalized.includes("DOLCI")) return "VINI DOLCI";

    return normalized;
  };

  // Carica vini da Supabase e filtra per tab
  useEffect(() => {
    if (!existingWines) return;

    console.log('🔍 Caricamento vini per tab:', activeTab);
    console.log('🍷 Vini disponibili:', existingWines.length);

    const tipologieEscluse = [
      "CHAMPAGNE", "FORTIFICATI", "NATURALI", "NATURALI FRIZZANTI", "RAMATI ORANGE"
    ];

    if (activeTab === "TUTTI I VINI") {
      const filtered = existingWines
        .filter(w => w.name && !tipologieEscluse.includes(normalizeType(w.type)))
        .map((wine, idx) => ({
          id: `db-${wine.id}`,
          nomeVino: wine.name || "",
          anno: wine.vintage || "",
          produttore: wine.description || "",
          provenienza: wine.region || "",
          giacenza: wine.inventory || 0,
          fornitore: (wine.supplier && 
          !wine.supplier.toLowerCase().includes('non specif') &&
          wine.supplier.toLowerCase() !== 'non specificato') 
          ? wine.supplier : "",
          tipologia: normalizeType(wine.type),
          ordine: idx
        }))
        .sort((a, b) => {
          // ✅ Ordinamento alfabetico A-Z ottimizzato per TUTTI I VINI
          return a.nomeVino.localeCompare(b.nomeVino, 'it', { 
            sensitivity: 'base',
            numeric: true,
            ignorePunctuation: true 
          });
        });

      console.log('📋 Vini filtrati per TUTTI I VINI (A-Z):', filtered.length);
      setWineRows(filtered);
      return;
    }

    // Tab specifica
    const filtered = existingWines
      .filter(w => normalizeType(w.type) === activeTab)
      .map((wine, idx) => ({
        id: `db-${wine.id}`,
        nomeVino: wine.name || "",
        anno: wine.vintage || "",
        produttore: wine.description || "",
        provenienza: wine.region || "",
        giacenza: wine.inventory || 0,
        fornitore: (wine.supplier && 
          !wine.supplier.toLowerCase().includes('non specif') &&
          wine.supplier.toLowerCase() !== 'non specificato') 
          ? wine.supplier : "",
        tipologia: activeTab,
        ordine: idx
      }));
      // ✅ RIMOSSO ordinamento alfabetico - mantiene ordine originale Google Sheet

    console.log(`📋 Vini filtrati per ${activeTab} (ordine originale Google Sheet):`, filtered.length);
    setWineRows(filtered);
  }, [existingWines, activeTab]);

  // Filtra righe con ricerca e fornitore
  const filteredRows = useMemo(() => {
    const filtered = wineRows.filter(row => {
      const s = filters.search.toLowerCase();
      const f = filters.fornitore.toLowerCase();
      return (
        (!s || row.nomeVino.toLowerCase().includes(s) || row.produttore.toLowerCase().includes(s) || row.provenienza.toLowerCase().includes(s)) &&
        (!f || row.fornitore.toLowerCase().includes(f))
      );
    });

    // Calcola quante righe vuote aggiungere per riempire la pagina
    const containerHeight = window.innerHeight - 280; // Altezza disponibile per la tabella
    const headerHeight = 32; // Altezza header tabella
    const rowHeight = 24; // Altezza singola riga ridotta
    const availableHeight = containerHeight - headerHeight;
    const maxVisibleRows = Math.floor(availableHeight / rowHeight);

    // Se abbiamo meno righe del massimo visibile, aggiungi righe vuote
    if (filtered.length < maxVisibleRows) {
      const emptyRowsNeeded = maxVisibleRows - filtered.length;
      const emptyRows = Array.from({ length: emptyRowsNeeded }, (_, index) => ({
        id: `empty-${index}`,
        nomeVino: '',
        anno: '',
        produttore: '',
        provenienza: '',
        giacenza: 0,
        fornitore: '',
        tipologia: ''
      }));
      return [...filtered, ...emptyRows];
    }

    return filtered;
  }, [wineRows, filters]);

  // Gestione cambiamenti celle con protezione completa
  const handleCellChange = async (rowIndex: number, field: string, value: string) => {
    try {
      console.log(`handleCellChange chiamata: riga ${rowIndex}, campo ${field}, valore ${value}`);
      const updatedRows = [...wineRows];
      const row = updatedRows[rowIndex];
      if (!row || !row.id || row.id.startsWith('empty-')) return;

      // Se si sta modificando la giacenza, usa la funzione di useWines per sincronizzazione
      if (field === "giacenza") {
        console.log('🔄 Aggiornando giacenza tramite useWines:', row.nomeVino, 'Nuova giacenza:', value);

        // Estrai l'ID dalla stringa (formato: "db-123")
        const wineId = row.id.startsWith('db-') ? row.id.replace('db-', '') : row.id;

        if (wineId && wineId !== 'empty' && !isNaN(Number(wineId))) {
          try {
            // Usa la funzione updateWineInventory di useWines per sincronizzazione completa
            const success = await updateWineInventory(wineId, Number(value) || 0).catch(err => {
              console.error('❌ Errore updateWineInventory:', err);
              return false;
            });

            if (success) {
              console.log('✅ Giacenza aggiornata correttamente tramite useWines');
              // Lo stato locale verrà aggiornato automaticamente da useWines via useEffect
            } else {
              console.error('❌ Errore aggiornamento giacenza tramite useWines');
              // Refresh per sincronizzare i dati
              try {
                await refreshWines().catch(refreshErr => {
                  console.error('❌ Errore durante refresh wines:', refreshErr);
                });
              } catch (refreshErr) {
                console.error('❌ Errore durante refresh wines:', refreshErr);
              }
            }

          } catch (err) {
            console.error('❌ Errore inatteso aggiornamento giacenza:', err);
            try {
              await refreshWines().catch(refreshErr => {
                console.error('❌ Errore durante refresh wines fallback:', refreshErr);
              });
            } catch (refreshErr) {
              console.error('❌ Errore durante refresh wines fallback:', refreshErr);
            }
          }
        } else {
          console.warn('⚠️ ID vino non valido per aggiornamento giacenza:', row.id);
        }
      } else {
        // Per altri campi, aggiorna solo lo stato locale
        (row as any)[field] = value;
        setWineRows(updatedRows);
      }
    } catch (globalErr) {
      console.error('❌ Errore globale in handleCellChange:', globalErr);
      // Previeni propagazione dell'errore
      return Promise.resolve();
    }
  };



  const handleRowClick = (index: number, event: React.MouseEvent) => {
    try {
      // Verifica che la riga non sia vuota
      const row = filteredRows[index];
      if (!row || row.id.startsWith('empty-')) {
        return; // Non selezionare righe vuote
      }

      if (event.ctrlKey || event.metaKey) {
        setSelectedRows(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
      } else if (event.shiftKey && selectedRows.length) {
        const last = selectedRows[selectedRows.length - 1];
        const start = Math.min(last, index);
        const end = Math.max(last, index);
        setSelectedRows(Array.from({ length: end - start + 1 }, (_, i) => start + i));
      } else {
        setSelectedRows([index]);
      }
    } catch (err) {
      console.error('❌ Errore in handleRowClick:', err);
    }
  };



  const lineHeight = fontSize * 1.2;
  const rowHeight = Math.max(32, fontSize * 2.2);

  return (
    <div className="min-h-screen flex flex-col" style={{ 
      background: "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)", 
      color: "white"
    }}>
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button onClick={() => navigate("/settings")} className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200" title="Torna alle impostazioni" style={{ filter: "brightness(1.3)", backgroundColor: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1"></div>
            <button
              onClick={() => navigate("/")}
              className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-105"
              title="Vai alla home"
              style={{
                filter: "brightness(1.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)"
              }}
            >
              <Home className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full min-h-0">
        <div className="pb-2 mb-3"><ImportaVini /></div>



        <div className="bg-black/20 border border-red-900/30 rounded-lg backdrop-blur-sm p-3 mb-3">
          <div className="flex items-center gap-4 w-full">
            {/* 1. Cerca vini */}
            <div className="flex-none w-1/3 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cerca vino, produttore, regione..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ fontSize: `${fontSize}px` }}
              />
            </div>

            {/* 2. Filtro fornitori */}
            <div className="flex-shrink-0">
              <select
                value={filters.fornitore}
                onChange={(e) => setFilters({ ...filters, fornitore: e.target.value })}
                className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ fontSize: `${fontSize}px` }}
              >
                <option value="">Tutti i fornitori</option>
                <option value="BOLOGNA VINI">BOLOGNA VINI</option>
                <option value="ALTRO">ALTRO</option>
              </select>
            </div>

            {/* 3. Modifica dimensione testo */}
            <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2">
              <button
                onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                className="text-white hover:text-amber-400 transition-colors"
                title="Riduci dimensione testo"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
              <span className="text-white text-sm min-w-[20px] text-center">
                {fontSize}
              </span>
              <button
                onClick={() => setFontSize(Math.min(20, fontSize + 1))}
                className="text-white hover:text-amber-400 transition-colors"
                title="Aumenta dimensione testo"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>

            {/* 4. Esporta excel */}
            <button
              className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors"
              onClick={() => window.open("https://docs.google.com/spreadsheets/d/1slvYCYuQ78Yf9fsRL1yR5xkW2kshOcQVe8E2HsvGZ8Y/edit?usp=sharing", "_blank")}
              title="Apri Google Sheet"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm">EXCEL</span>
            </button>

            {/* 5. Statistiche */}
            <div className="text-white text-sm font-medium whitespace-nowrap ml-auto">
              <span>Vini totali: </span>
              <span className="text-amber-400 font-bold">{wineRows.length}</span>
              <span className="mx-3">In Esaurimento: </span>
              <span className="text-red-400 font-bold">{wineRows.filter(wine => wine.giacenza <= 5).length}</span>
              <span className="mx-3">Disponibili: </span>
              <span className="text-green-400 font-bold">{wineRows.filter(wine => wine.giacenza > 5).length}</span>
            </div>
          </div>
        </div>

        <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="rounded-lg shadow-2xl border border-amber-900 overflow-hidden flex-1" style={{ backgroundColor: "#8B4513", minHeight: "500px" }}>
          <div className="h-full overflow-x-hidden overflow-y-auto" style={{ 
            maxHeight: window.innerWidth >= 1025 ? "calc(100vh - 400px)" : "calc(100vh - 320px)",
            minHeight: window.innerWidth >= 1025 ? "600px" : "500px",
            width: "100%"
          }}>
            <table className="w-full" style={{ 
              borderCollapse: "collapse",
              tableLayout: "fixed",
              width: "100%",
              maxWidth: "100%"
            }}>
              <WineTableHeader columnWidths={columnWidths} fontSize={fontSize} lineHeight={lineHeight} rowHeight={rowHeight} />
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-white text-center py-10 font-semibold">
                      {wineRows.length === 0 ? 'Nessun vino trovato per questa categoria' : 'Nessun vino corrisponde ai filtri'}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <WineTableRow 
                      key={row.id} 
                      row={row} 
                      index={index} 
                      isSelected={selectedRows.includes(index)} 
                      columnWidths={columnWidths} 
                      fontSize={fontSize} 
                      onRowClick={handleRowClick} 
                      onCellChange={handleCellChange} 
                    />
                  ))
                )}
              </tbody>
            </table>
            <div className="sticky bottom-0 z-40 bg-[#8B4513] border-t-2 border-amber-900 shadow-lg">
              <div className="w-full border border-amber-900 p-2" style={{ backgroundColor: "#2d0505", fontSize, height: 32 }}></div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16 gap-3">{/* Footer content se necessario */}</div>
        </div>
      </footer>
    </div>
  );
}