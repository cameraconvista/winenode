import { useEffect, useState } from "react";
import useSuppliers from "../hooks/useSuppliers";
import useWines from '../hooks/useWines';
import { useOrdini } from "../hooks/useOrdini";

interface OrdineModalProps {
  open: boolean;
  onClose: () => void;
  onFornitoreSelezionato: (fornitore: string) => void;
}

export default function OrdineModal({ open, onClose, onFornitoreSelezionato }: OrdineModalProps) {
  const { suppliers, isLoading, error } = useSuppliers();
  const { wines } = useWines();
  const { salvaOrdine } = useOrdini();
  const [selectedFornitore, setSelectedFornitore] = useState<string>("");
  const [selectedFornitoreId, setSelectedFornitoreId] = useState<string>("");
  const [step, setStep] = useState<"fornitore" | "vini" | "riassunto" | "conferma" | "successo">("fornitore");
  const [ordineQuantities, setOrdineQuantities] = useState<Record<number, number>>({});
  const [ordineMode, setOrdineMode] = useState<Record<number, 'bottiglie' | 'cartoni'>>({});
  const [ordineData, setOrdineData] = useState<{
    fornitore: string;
    fornitore_id: string;
    vini: Array<{
      id: number;
      nome: string;
      quantita: number;
      giacenza_attuale: number;
      prezzo_unitario: number;
    }>;
    totale: number;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedFornitore("");
      setStep("fornitore");
      setOrdineQuantities({});
      setOrdineMode({});
      setOrdineData(null);
    }
  }, [open]);

  const handleAvanti = () => {
    if (selectedFornitore) {
      // Trova l'ID del fornitore selezionato
      const supplier = suppliers.find(s => s.nome === selectedFornitore);
      if (supplier) {
        setSelectedFornitoreId(supplier.id);
      }
      setStep("vini");
    }
  };

  const filteredWines = wines.filter(
    (w) => w.supplier === selectedFornitore
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-w-xl w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-cream">Nuovo Ordine</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Chiudi"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step 1: selezione fornitore */}
        {step === "fornitore" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">Seleziona un fornitore per iniziare:</p>

            <div className="relative">
              <select
                value={selectedFornitore}
                onChange={(e) => setSelectedFornitore(e.target.value)}
                disabled={isLoading}
                className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white appearance-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">
                  {isLoading
                    ? "Caricamento fornitori..."
                    : error
                    ? `Errore: ${error}`
                    : suppliers.length === 0
                    ? "Nessun fornitore trovato"
                    : "Scegli un fornitore..."}
                </option>
                {!error &&
                  suppliers.map((f) => (
                    <option key={f.id} value={f.nome}>
                      {f.nome}
                    </option>
                  ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="flex justify-end pt-2 gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleAvanti}
                disabled={!selectedFornitore || isLoading}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-medium rounded-lg"
              >
                Avanti
              </button>
            </div>
          </div>
        )}

        {/* Step 2: vini del fornitore */}
        {step === "vini" && (
          <div className="space-y-4 text-white">
            <h3 className="text-lg font-semibold">Vini collegati a <strong>{selectedFornitore}</strong>:</h3>
            <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
              {filteredWines.map((w) => {
                const isLowStock = w.inventory <= w.minStock;
                return (
                  <div 
                    key={w.id} 
                    className={`rounded-lg p-4 border-l-4 transition-all duration-200 ${
                      isLowStock 
                        ? 'bg-red-900/20 border-red-500 shadow-red-500/10 shadow-lg' 
                        : 'bg-gray-700/50 border-amber-500'
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Intestazione vino */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-base">{w.name}</h4>
                          {w.description && (
                            <p className="text-sm text-gray-300">
                              {w.description} {w.vintage && `(${w.vintage})`}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-sm font-bold ${isLowStock ? 'text-red-300' : 'text-white'}`}>
                            Giacenza: {w.inventory}
                          </p>
                          {isLowStock && (
                            <span className="text-xs bg-red-600 text-white px-2 py-1 inline-block">
                              ⚠️ Sotto soglia
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Input quantità con selezione bottiglie/cartoni per singolo vino */}
                      <div className="flex flex-col gap-3 pt-2 border-t border-gray-600/50">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <label className="text-sm text-gray-300 font-medium">
                              Quantità da ordinare:
                            </label>
                            {/* Mostra ordine minimo se impostato */}
                            {w.ordineMinimo && w.ordineMinimo > 0 && (
                              <div className="text-xs text-blue-300 mt-1 flex items-center gap-1">
                                <span className="text-blue-400">📦</span>
                                Ordine minimo: {w.ordineMinimo} {w.unitaOrdine === 'cartoni' ? `bottiglie (${Math.floor(w.ordineMinimo / 6)} cartoni)` : 'bottiglie'}
                              </div>
                            )}
                          </div>
                          {/* Toggle individuale bottiglie/cartoni per questo vino */}
                          <div className="flex bg-gray-700 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => {
                                const currentMode = ordineMode[w.id] || 'bottiglie';
                                if (currentMode !== 'bottiglie') {
                                  // Reset solo la quantità di questo vino quando cambio modalità
                                  setOrdineQuantities(prev => ({
                                    ...prev,
                                    [w.id]: 0
                                  }));
                                  setOrdineMode(prev => ({
                                    ...prev,
                                    [w.id]: 'bottiglie'
                                  }));
                                }
                              }}
                              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                (ordineMode[w.id] || 'bottiglie') === 'bottiglie'
                                  ? 'bg-amber-600 text-white'
                                  : 'text-gray-300 hover:text-white'
                              }`}
                            >
                              Bottiglie
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const currentMode = ordineMode[w.id] || 'bottiglie';
                                if (currentMode !== 'cartoni') {
                                  // Reset solo la quantità di questo vino quando cambio modalità
                                  setOrdineQuantities(prev => ({
                                    ...prev,
                                    [w.id]: 0
                                  }));
                                  setOrdineMode(prev => ({
                                    ...prev,
                                    [w.id]: 'cartoni'
                                  }));
                                }
                              }}
                              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                (ordineMode[w.id] || 'bottiglie') === 'cartoni'
                                  ? 'bg-amber-600 text-white'
                                  : 'text-gray-300 hover:text-white'
                              }`}
                            >
                              Cartoni
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const currentQty = ordineQuantities[w.id] || 0;
                                const currentMode = ordineMode[w.id] || 'bottiglie';
                                if (currentMode === 'cartoni') {
                                  // Modalità cartoni: decrementa di 1 cartone (6 bottiglie)
                                  const newValue = Math.max(0, currentQty - 6);
                                  setOrdineQuantities(prev => ({
                                    ...prev,
                                    [w.id]: newValue
                                  }));
                                } else {
                                  // Modalità bottiglie: decrementa di 1 bottiglia
                                  const newValue = Math.max(0, currentQty - 1);
                                  setOrdineQuantities(prev => ({
                                    ...prev,
                                    [w.id]: newValue
                                  }));
                                }
                              }}
                              className="w-8 h-8 bg-red-600/80 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={
                                (ordineMode[w.id] || 'bottiglie') === 'cartoni'
                                  ? Math.floor((ordineQuantities[w.id] || 0) / 6)
                                  : (ordineQuantities[w.id] || 0)
                              }
                              onChange={(e) => {
                                const inputValue = Math.max(0, parseInt(e.target.value) || 0);
                                const currentMode = ordineMode[w.id] || 'bottiglie';
                                if (currentMode === 'cartoni') {
                                  // Modalità cartoni: converte cartoni in bottiglie (1 cartone = 6 bottiglie)
                                  setOrdineQuantities(prev => ({
                                    ...prev,
                                    [w.id]: inputValue * 6
                                  }));
                                } else {
                                  // Modalità bottiglie: valore diretto
                                  setOrdineQuantities(prev => ({
                                    ...prev,
                                    [w.id]: inputValue
                                  }));
                                }
                              }}
                              className="w-16 h-8 bg-gray-800 border border-gray-600 rounded text-center text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentQty = ordineQuantities[w.id] || 0;
                                const currentMode = ordineMode[w.id] || 'bottiglie';
                                if (currentMode === 'cartoni') {
                                  // Modalità cartoni: incrementa di 1 cartone (6 bottiglie)
                                  setOrdineQuantities(prev => ({
                                    ...prev,
                                    [w.id]: currentQty + 6
                                  }));
                                } else {
                                  // Modalità bottiglie: incrementa di 1 bottiglia
                                  setOrdineQuantities(prev => ({
                                    ...prev,
                                    [w.id]: currentQty + 1
                                  }));
                                }
                              }}
                              className="w-8 h-8 bg-green-600/80 hover:bg-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>

                          {/* Visualizzazione conversione */}
                          <div className="text-right text-xs text-gray-400">
                            {(ordineMode[w.id] || 'bottiglie') === 'cartoni' ? (
                              <div>
                                <p>{Math.floor((ordineQuantities[w.id] || 0) / 6)} cartone/i</p>
                                <p>= {ordineQuantities[w.id] || 0} bottiglie</p>
                              </div>
                            ) : (
                              <div>
                                <p>{ordineQuantities[w.id] || 0} bottiglia/e</p>
                                <p>= {Math.floor((ordineQuantities[w.id] || 0) / 6)} cartoni + {(ordineQuantities[w.id] || 0) % 6}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredWines.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 italic">Nessun vino trovato per questo fornitore.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setStep("fornitore")}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Indietro
              </button>
              <button
                onClick={() => {
                  const selectedWines = filteredWines.filter(w => ordineQuantities[w.id] > 0);
                  const viniConPrezzo = selectedWines.map(w => ({
                    id: parseInt(w.id.toString()) || 0, // Assicurati che sia un numero
                    nome: w.name,
                    quantita: ordineQuantities[w.id],
                    giacenza_attuale: w.inventory,
                    prezzo_unitario: w.cost || 0 // Usa il campo 'cost' per il prezzo di acquisto
                  }));

                  const totale = viniConPrezzo.reduce((sum, vino) => 
                    sum + (vino.quantita * (Number(vino.prezzo_unitario) || 0)), 0
                  );

                  setOrdineData({
                    fornitore: selectedFornitore,
                    fornitore_id: selectedFornitoreId,
                    vini: viniConPrezzo,
                    totale: totale
                  });

                  setStep("riassunto");
                }}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg"
              >
                Conferma Ordine ({Object.values(ordineQuantities).reduce((a, b) => a + b, 0)} bottiglie)
              </button>
            </div>
          </div>
        )}

        {/* Step 3: riassunto ordine */}
        {step === "riassunto" && ordineData && (
          <div className="space-y-4 text-white">
            <div className="text-center border-b border-gray-600 pb-4">
              <h3 className="text-xl font-bold text-amber-400">📋 Riepilogo Ordine</h3>
              <p className="text-gray-300 mt-2">Fornitore: <strong>{ordineData.fornitore}</strong></p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4 max-h-60 overflow-y-auto">
              <h4 className="font-semibold mb-3 text-amber-400">Dettaglio Ordine:</h4>
              <div className="space-y-2">
                {ordineData.vini.map((vino) => (
                  <div key={vino.id} className="flex justify-between items-center py-2 border-b border-gray-600/50 last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{vino.nome}</p>
                      <p className="text-xs text-gray-400">
                        {vino.quantita} bottiglie × €{(Number(vino.prezzo_unitario) || 0).toFixed(2)} cad. (costo acquisto)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">
                        €{(vino.quantita * (Number(vino.prezzo_unitario) || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-4 text-center">
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-semibold">Totale Ordine:</span>
                <span className="text-2xl font-bold text-green-400">
                  €{ordineData.totale.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <div>{ordineData.vini.reduce((sum, v) => sum + v.quantita, 0)} bottiglie totali</div>
                <div className="text-amber-300 font-medium">⚠️ Prezzi IVA esclusa</div>
                <div className="text-xs text-gray-400">Calcolato sui costi di acquisto</div>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => setStep("vini")}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                ← Modifica Ordine
              </button>

              <button
                onClick={async () => {
                  console.log('✅ Conferma ordine diretta - salvataggio:', ordineData);

                  try {
                    // Salva ordine direttamente nel database
                    const ordineId = await salvaOrdine(ordineData);
                    if (!ordineId) {
                      alert('Errore nel salvataggio dell\'ordine. Riprova.');
                      return;
                    }

                    console.log('✅ Ordine confermato e salvato con ID:', ordineId);

                    // Vai al passo di successo
                    setStep("successo");
                  } catch (error) {
                    console.error('Errore salvataggio ordine:', error);
                    alert('Errore nel salvataggio dell\'ordine. Riprova.');
                  }
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center gap-2 text-lg transition-colors"
              >
                ✅ CONFERMA
              </button>

              <button
                onClick={() => {
                  console.log('Preparazione ordine per WhatsApp:', ordineData);

                  // Genera messaggio WhatsApp ottimizzato per mobile
                  const dataOrdine = new Date().toLocaleDateString('it-IT');
                  const oraOrdine = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

                  // Versione compatta per mobile
                  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                  let messaggio;
                  if (isMobile) {
                    // Messaggio compatto per mobile (senza ID ordine perché non ancora salvato)
                    messaggio = `🍷 NUOVO ORDINE\n` +
                      `📅 ${dataOrdine} ${oraOrdine}\n` +
                      `🏪 ${ordineData.fornitore}\n\n` +
                      ordineData.vini.map((v, index) => 
                        `${index + 1}. ${v.nome}\n` +
                        `   ${v.quantita} bot x €${(Number(v.prezzo_unitario) || 0).toFixed(2)} = €${(v.quantita * (Number(v.prezzo_unitario) || 0)).toFixed(2)}`
                      ).join('\n') +
                      `\n\n💰 TOTALE: €${ordineData.totale.toFixed(2)} (IVA ESC.)\n` +
                      `🍾 Tot: ${ordineData.vini.reduce((sum, v) => sum + v.quantita, 0)} bottiglie\n\n` +
                      `Confermate disponibilità. Grazie!`;
                  } else {
                    // Messaggio completo per desktop (senza ID ordine perché non ancora salvato)
                    messaggio = `🍷 *NUOVO ORDINE*\n\n` +
                      `📅 *Data:* ${dataOrdine} alle ${oraOrdine}\n` +
                      `🏪 *Fornitore:* ${ordineData.fornitore}\n\n` +
                      `*DETTAGLIO ORDINE:*\n` +
                      ordineData.vini.map((v, index) => 
                        `${index + 1}. *${v.nome}*\n` +
                        `   Quantità: ${v.quantita} bottiglie\n` +
                        `   Costo: €${(Number(v.prezzo_unitario) || 0).toFixed(2)} cad. (IVA esclusa)\n` +
                        `   Subtotale: €${(v.quantita * (Number(v.prezzo_unitario) || 0)).toFixed(2)}\n`
                      ).join('\n') +
                      `\n💰 *TOTALE ORDINE: €${ordineData.totale.toFixed(2)}* (IVA ESCLUSA)\n` +
                      `🍾 *Totale bottiglie: ${ordineData.vini.reduce((sum, v) => sum + v.quantita, 0)}*\n\n` +
                      `⚠️ *Nota: Tutti i prezzi sono IVA esclusa*\n\n` +
                      `Confermate la disponibilità e i tempi di consegna. Grazie! 🙏`;
                  }

                  // Encoding sicuro per mobile
                  const encoded = encodeURIComponent(messaggio);

                  // Apri WhatsApp con gestione ottimizzata per mobile
                  if (isMobile) {
                    // Strategia migliorata per mobile
                    try {
                      // Prova prima WhatsApp Web mobile che è più affidabile
                      const whatsappWebUrl = `https://wa.me/?text=${encoded}`;

                      // Su iOS usa il link diretto
                      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                        window.location.href = whatsappWebUrl;
                      } else {
                        // Su Android prova prima l'app nativa
                        const whatsappUrl = `whatsapp://send?text=${encoded}`;

                        // Crea un link nascosto per test
                        const testLink = document.createElement('a');
                        testLink.href = whatsappUrl;
                        testLink.style.display = 'none';
                        document.body.appendChild(testLink);

                        // Tenta di aprire l'app nativa
                        const startTime = Date.now();
                        window.location.href = whatsappUrl;

                        // Se dopo 2 secondi siamo ancora nella pagina, apri WhatsApp Web
                        setTimeout(() => {
                          if (Date.now() - startTime > 1900) {
                            window.open(whatsappWebUrl, '_blank');
                          }
                          document.body.removeChild(testLink);
                        }, 2000);
                      }
                    } catch (error) {
                      console.error('Errore apertura WhatsApp mobile:', error);
                      // Fallback sicuro su WhatsApp Web
                      window.open(`https://wa.me/?text=${encoded}`, '_blank');
                    }
                  } else {
                    // Su desktop usa WhatsApp Web
                    window.open(`https://wa.me/?text=${encoded}`, '_blank');
                  }

                  // Vai al passo di conferma dopo aver aperto WhatsApp
                  setStep("conferma");
                }}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center gap-2 text-lg"
              >
                📱 Invia via WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Step 4: conferma dopo invio WhatsApp */}
        {step === "conferma" && ordineData && (
          <div className="space-y-4 text-white">
            <div className="text-center border-b border-gray-600 pb-4">
              <h3 className="text-xl font-bold text-amber-400">📱 Messaggio WhatsApp Inviato</h3>
              <p className="text-gray-300 mt-2">Hai inviato il messaggio al fornitore <strong>{ordineData.fornitore}</strong>?</p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-300 mb-3">
                Per completare l'ordine, conferma di aver inviato il messaggio WhatsApp al fornitore.
                L'ordine verrà salvato nel sistema solo dopo la conferma.
              </p>

              <div className="text-xs text-gray-400 bg-gray-800/50 rounded p-3">
                <p className="font-medium text-amber-300 mb-2">📋 Riepilogo ordine da confermare:</p>
                <p>🏪 Fornitore: {ordineData.fornitore}</p>
                <p>🍷 Articoli: {ordineData.vini.length}</p>
                <p>🍾 Bottiglie totali: {ordineData.vini.reduce((sum, v) => sum + v.quantita, 0)}</p>
                <p>💰 Totale: €{ordineData.totale.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => setStep("riassunto")}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                ← Torna Indietro
              </button>

              <button
                onClick={() => {
                  // Non inviare, torna al riassunto per reinviare
                  setStep("riassunto");
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                ❌ Non Inviato
              </button>

              <button
                onClick={async () => {
                  console.log('Conferma invio WhatsApp - salvataggio ordine:', ordineData);

                  // Salva ordine nel database solo dopo conferma invio
                  const ordineId = await salvaOrdine(ordineData);
                  if (!ordineId) {
                    alert('Errore nel salvataggio dell\'ordine. Riprova.');
                    return;
                  }

                  console.log('✅ Ordine salvato con ID:', ordineId);

                  // Chiudi il modale e notifica il parent
                  onFornitoreSelezionato(selectedFornitore);
                  onClose();
                }}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center gap-2"
              >
                ✅ Sì, Inviato - Salva Ordine
              </button>
            </div>
          </div>
        )}

        {/* Step 5: successo dopo salvataggio */}
        {step === "successo" && ordineData && (
          <div className="space-y-4 text-white">
            <div className="text-center border-b border-gray-600 pb-4">
              <h3 className="text-xl font-bold text-green-400">✅ Ordine Confermato e Salvato!</h3>
              <p className="text-gray-300 mt-2">L'ordine per <strong>{ordineData.fornitore}</strong> è stato salvato con successo nel sistema.</p>
            </div>

            <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4 text-center">
              <div className="flex justify-center items-center mb-3">
                <span className="text-3xl text-green-400">🎉</span>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <div>Ordine salvato nel database</div>
                <div>Stato: <span className="text-yellow-400 font-medium">Sospeso</span></div>
                <div className="text-green-300 font-medium">Pronto per essere gestito</div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  // Chiudi il modale e notifica il parent
                  onFornitoreSelezionato(selectedFornitore);
                  onClose();
                }}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center gap-2 text-lg transition-colors"
              >
                ✅ OK, Chiudi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}