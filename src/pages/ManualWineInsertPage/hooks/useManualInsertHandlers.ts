import { useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { getUserId } from '../../../config/constants';

interface UseManualInsertHandlersProps {
  // State setters
  setTesto: (text: string) => void;
  setRigheRiconosciute: (count: number) => void;
  setSelectedTipologia: (tipologia: string) => void;
  setNewCategoryName: (name: string) => void;
  setShowAddCategoryModal: (show: boolean) => void;
  setShowErrorMessage: (show: boolean) => void;
  setShowSuccessMessage: (show: boolean) => void;
  setShowConfirmModal: (show: boolean) => void;
  setConfirmAction: (action: 'add' | 'replace' | null) => void;
  setFornitore: (fornitore: string) => void;
  
  // State values
  testo: string;
  selectedTipologia: string;
  newCategoryName: string;
  fornitore: string;
  sogliaMinima: string;
  giacenza: string;
  
  // External hooks
  refreshWines: () => Promise<void>;
}

export function useManualInsertHandlers({
  setTesto,
  setRigheRiconosciute,
  setSelectedTipologia,
  setNewCategoryName,
  setShowAddCategoryModal,
  setShowErrorMessage,
  setShowSuccessMessage,
  setShowConfirmModal,
  setConfirmAction,
  setFornitore,
  testo,
  selectedTipologia,
  newCategoryName,
  fornitore,
  sogliaMinima,
  giacenza,
  refreshWines
}: UseManualInsertHandlersProps) {

  // Memoizza parsing del testo per performance
  const parseWineText = useCallback((inputText: string): string[] => {
    // Pulisce caratteri invisibili e sostituisce con newline standard
    const cleanText = inputText
      .replace(/[\u2028\r]/g, '\n')     // converte \u2028 e \r in newline classico
      .replace(/\n{2,}/g, '\n')         // rimuove righe vuote multiple

    // Divide per righe e rimuove righe vuote
    return cleanText.split('\n').map(line => line.trim()).filter(line => line !== '');
  }, []);

  const ottimizzaTesto = useCallback(() => {
    // Funzione AI disabilitata - solo parsing semplice
    const righe = parseWineText(testo);
    const risultatoFinale = righe.join('\n');
    setTesto(risultatoFinale);
    setRigheRiconosciute(righe.length);

    // Il contatore viene aggiornato automaticamente tramite stato React
  }, [parseWineText, testo, setTesto, setRigheRiconosciute]);

  const aggiungiCategoria = useCallback(async () => {
    if (!newCategoryName.trim()) return;

    try {
      // App senza autenticazione - usa SERVICE_USER_ID
      const { error } = await supabase
        .from("categorie")
        .insert({
          user_id: getUserId(),
          nome: newCategoryName.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(error);
        toast.error("Errore nell'aggiunta della categoria.");
      } else {
        setSelectedTipologia(newCategoryName.trim());
        toast.success("Categoria aggiunta con successo!");
        setNewCategoryName("");
        setShowAddCategoryModal(false);
      }
    } catch (error) {
      console.error("Errore:", error);
      toast.error("Errore durante l'aggiunta della categoria.");
    }
  }, [newCategoryName, setSelectedTipologia, setNewCategoryName, setShowAddCategoryModal]);

  const richiediConferma = useCallback((sostituisci: boolean) => {
    // 1. Controlla che sia stato selezionato un tipo di vino
    if (!selectedTipologia || selectedTipologia === "") {
      setShowErrorMessage(true);
      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => {
        setShowErrorMessage(false);
      }, 5000);
      return;
    }

    // 2. Mostra modal di conferma
    setConfirmAction(sostituisci ? 'replace' : 'add');
    setShowConfirmModal(true);
  }, [selectedTipologia, setShowErrorMessage, setConfirmAction, setShowConfirmModal]);

  const salvaVini = useCallback(async (sostituisci: boolean) => {

    // 2. Usa il valore dello stato React (fonte unica di verità)
    const testoVini = testo;

    // 3. Usa parseWineText per processare correttamente il testo
    const lista = parseWineText(testoVini);

    if (lista.length === 0) return toast.warning("Nessun vino da salvare.");

    try {
      // App senza autenticazione - usa SERVICE_USER_ID
      const userId = getUserId();

      // 4. Se sostituisci === true, cancella i vecchi vini dell'utente in quella categoria
      if (sostituisci) {
        // Cancella i vini esistenti per quella categoria
        const { error: deleteError } = await supabase
          .from("vini")
          .delete()
          .eq("user_id", userId)
          .eq("tipologia", selectedTipologia.toLowerCase());

        if (deleteError) {
          console.error(deleteError);
          return toast.error("Errore nella cancellazione dei vini esistenti.");
        }
      }

      // 5. Inserisci i nuovi vini nella tabella vini
      const viniDaSalvare = lista.map((nomeVino) => ({
        nome_vino: nomeVino,
        tipologia: selectedTipologia.toLowerCase(),
        fornitore: fornitore || "Da definire",
        min_stock: parseInt(sogliaMinima) || 2,
        vendita: 0,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data: viniInseriti, error: insertError } = await supabase
        .from("vini")
        .insert(viniDaSalvare)
        .select('id');

      if (insertError) {
        console.error(insertError);
        return toast.error("Errore nell'inserimento dei vini.");
      }

      // 6. Inserisci le giacenze nella tabella giacenza
      const giacenzeDaSalvare = viniInseriti.map((vino) => ({
        vino_id: vino.id,
        giacenza: parseInt(giacenza) || 0,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: giacenzaError } = await supabase
        .from("giacenza")
        .insert(giacenzeDaSalvare);

      if (giacenzaError) {
        console.error(giacenzaError);
        toast.error("Errore nel salvataggio delle giacenze.");
      } else {
        // Mostra messaggio di successo
        setShowSuccessMessage(true);
        // Nascondi il messaggio dopo 5 secondi
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);

        // Refresh della lista vini per aggiornarla nell'homepage
        await refreshWines();

        // Reset completo dei campi dopo il salvataggio
        setTesto("");
        setRigheRiconosciute(0);
        setSelectedTipologia("");
        // selectedTipologia già resettato sopra
        setFornitore("");

        // Il contatore viene aggiornato automaticamente tramite stato React
      }

    } catch (error) {
      console.error("Errore generale:", error);
      toast.error("Errore durante il salvataggio.");
    }
  }, [testo, parseWineText, selectedTipologia, fornitore, sogliaMinima, giacenza, refreshWines, setShowSuccessMessage, setTesto, setRigheRiconosciute, setSelectedTipologia, setFornitore]);

  return {
    parseWineText,
    ottimizzaTesto,
    aggiungiCategoria,
    richiediConferma,
    salvaVini
  };
}
