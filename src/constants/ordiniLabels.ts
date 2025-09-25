/**
 * Costanti centralizzate per tutti i testi della pagina Gestisci Ordini
 * Struttura modulare pronta per eventuale i18n futura
 */

export const ORDINI_LABELS = {
  // Tab principali
  tabs: {
    creati: "Creati",
    archiviati: "Archiviati"
  },

  // Badge stati
  badges: {
    creato: "CREATO",
    archiviato: "ARCHIVIATO",
    completato: "COMPLETATO"
  },

  // Messaggi empty state
  emptyState: {
    creati: {
      title: "Nessun ordine creato",
      subtitle: "Crea il tuo primo ordine"
    },
    archiviati: {
      title: "Nessun ordine archiviato", 
      subtitle: "Gli ordini completati appariranno qui"
    },
    default: {
      title: "Nessun ordine",
      subtitle: "Inizia creando un nuovo ordine"
    }
  },

  // Messaggi conferma eliminazione
  eliminazione: {
    creato: "Eliminare questo ordine? L'azione non può essere annullata.",
    archiviato: "Eliminare questo ordine archiviato? Le modifiche andranno perse."
  },

  // Pulsanti azioni
  azioni: {
    visualizza: "Visualizza",
    dettagli: "Dettagli", 
    conferma: "Gestisci",
    confermaRicezione: "Archivia",
    elimina: "Elimina"
  },

  // Titoli e header
  header: {
    titoloPagina: "Gestisci Ordini",
    modaleTitolo: "Elimina Ordine"
  },

  // Dettagli ordine
  dettagli: {
    ordinato: "Data:",
    articoli: "Articoli:", 
    totale: "Totale:",
    completato: "Completato:",
    riepilogoConfermato: "confermato"
  }
} as const;

// Type helper per garantire type safety
export type OrdiniLabelsType = typeof ORDINI_LABELS;
