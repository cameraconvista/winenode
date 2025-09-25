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
    completatoIl: "Completato il",
    riepilogoConfermato: "confermato"
  },

  // Gestione inline ordini creati
  gestioneInline: {
    titolo: "Modifica quantità",
    colonne: {
      prodotto: "Prodotto",
      unita: "Unità", 
      modificaQuantita: "Modifica quantità"
    },
    riepilogo: {
      totaleConfermato: "Totale confermato:",
      valoreConfermato: "Valore confermato:"
    },
    azioni: {
      confermaModifiche: "Conferma modifiche",
      annulla: "Annulla"
    },
    messaggi: {
      quantitaAggiornata: "Quantità aggiornate con successo",
      erroreAggiornamento: "Errore durante l'aggiornamento delle quantità"
    }
  },

  // Dialog conferma archiviazione
  qtyModal: {
    confirmArchive: {
      title: "Conferma archiviazione",
      body: "Vuoi confermare le modifiche alle quantità e archiviare l'ordine? Questa operazione aggiornerà le giacenze e sposterà l'ordine negli Archiviati.",
      confirm: "Conferma e archivia",
      cancel: "Annulla"
    },
    header: {
      title: "Modifica quantità",
      subtitle: "Seleziona le nuove quantità ricevute"
    }
  }
} as const;

// Type helper per garantire type safety
export type OrdiniLabelsType = typeof ORDINI_LABELS;
