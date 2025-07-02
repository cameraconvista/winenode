import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useWines from "../hooks/useWines";
import { useColumnResize } from "../hooks/useColumnResize";
import ImportaVini from "../components/ImportaVini";
import CategoryTabs from "../components/CategoryTabs";
import SearchAndFilters from "../components/SearchAndFilters";
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
  const { columnWidths, handleMouseDown } = useColumnResize();

  const [wineRows, setWineRows] = useState<WineRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("BOLLICINE ITALIANE");
  const [filters, setFilters] = useState({ search: "", fornitore: "" });
  const [fontSize, setFontSize] = useState(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return (w <= 1024 && w > 480 && h < w) ? 12 : 14;
  });

  // Adatta font size su resize
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const newSize = (w <= 1024 && w > 480 && h < w) ? 12 : 14;
      setFontSize(prev => prev !== newSize ? newSize : prev);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const normalizeType = (type?: string | null) => {
    if (!type) return "";
    const normalized = type.toUpperCase().trim();

    // Mapping esatto delle tipologie importate da Google Sheets
    if (normalized === "BOLLICINE ITALIANE") return "BOLLICINE ITALIANE";
    if (normalized === "BOLLICINE FRANCESI") return "BOLLICINE FRANCESI";
    if (normalized === "BIANCHI") return "BIANCHI";
    if (normalized === "ROSSI") return "ROSSI";
    if (normalized === "ROSATI") return "ROSATI";
    if (normalized === "VINI DOLCI") return "VINI DOLCI";

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
          fornitore: wine.supplier || "",
          tipologia: normalizeType(wine.type),
          ordine: idx
        }))
        .sort((a, b) => a.nomeVino.localeCompare(b.nomeVino, 'it', { sensitivity: 'base' })); // ✅ Ordine alfabetico A-Z

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
        fornitore: wine.supplier || "",
        tipologia: activeTab,
        ordine: idx
      }))
      .sort((a, b) => a.nomeVino.localeCompare(b.nomeVino, 'it', { sensitivity: 'base' })); // ✅ Ordine alfabetico A-Z

    console.log(`📋 Vini filtrati per ${activeTab} (A-Z):`, filtered.length);
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
    const headerHeight = 40; // Altezza header tabella
    const rowHeight = 40; // Altezza singola riga
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

  // Gestione cambiamenti celle
  const handleCellChange = async (rowIndex: number, field: string, value: string) => {
    console.log(`handleCellChange chiamata: riga ${rowIndex}, campo ${field}, valore ${value}`);
    const updatedRows = [...wineRows];
    const row = updatedRows[rowIndex];
    if (!row) return;

    // Se si sta modificando la giacenza, usa la funzione di useWines per sincronizzazione
    if (field === "giacenza") {
      console.log('🔄 Aggiornando giacenza tramite useWines:', row.nomeVino, 'Nuova giacenza:', value);

      // Estrai l'ID dalla stringa (formato: "db-123")
      const wineId = row.id.startsWith('db-') ? row.id.replace('db-', '') : row.id;

      if (wineId) {
        try {
          // Usa la funzione updateWineInventory di useWines per sincronizzazione completa
          const success = await updateWineInventory(wineId, Number(value) || 0);

          if (success) {
            console.log('✅ Giacenza aggiornata correttamente tramite useWines');
            // Lo stato locale verrà aggiornato automaticamente da useWines via useEffect
          } else {
            console.error('❌ Errore aggiornamento giacenza tramite useWines');
            // Refresh per sincronizzare i dati
            await refreshWines();
          }

        } catch (err) {
          console.error('❌ Errore inatteso aggiornamento giacenza:', err);
          await refreshWines();
        }
      } else {
        console.error('❌ ID vino non valido per aggiornamento giacenza:', row.id);
      }
    } else {
      // Per altri campi, aggiorna solo lo stato locale
      (row as any)[field] = value;
      setWineRows(updatedRows);
    }
  };



  const handleRowClick = (index: number, event: React.MouseEvent) => {
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
  };

  

  const lineHeight = fontSize * 1.2;
  const rowHeight = fontSize * 2.5;

  return (
    <div className="h-[95vh] flex flex-col" style={{ background: "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)", minHeight: "100vh", color: "white" }}>
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate("/settings")} className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200" title="Torna alle impostazioni" style={{ filter: "brightness(1.3)", backgroundColor: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <img src="/logo 2 CCV.png" alt="WINENODE" className="h-24 w-auto object-contain" />
            <button onClick={() => navigate("/")} className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors" title="Vai alla home">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001 1m-6 0h6" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-3 py-1 min-h-0">
        <div className="pb-1 mb-2"><ImportaVini /></div>

        <SearchAndFilters
          filters={filters}
          fontSize={fontSize}
          onFiltersChange={setFilters}
          onFontSizeChange={setFontSize}
        />

        <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="rounded-lg shadow-2xl border border-amber-900 overflow-hidden flex-1" style={{ backgroundColor: "#8B4513", minHeight: "300px" }}>
          <div className="h-full overflow-x-hidden overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
            <table className="w-full table-fixed" style={{ borderCollapse: "collapse" }}>
              <WineTableHeader columnWidths={columnWidths} fontSize={fontSize} lineHeight={lineHeight} rowHeight={rowHeight} onMouseDown={handleMouseDown} />
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
              <div className="w-full border border-amber-900 p-3" style={{ backgroundColor: "#2d0505", fontSize, height: 40 }}></div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flexitems-center justify-center h-16 gap-3">{/* Footer content se necessario */}</div>
        </div>
      </footer>
    </div>
  );
}