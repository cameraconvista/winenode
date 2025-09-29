import { useState } from 'react';

export function useManualInsertState() {
  // Stati per i campi form
  const [selectedTipologia, setSelectedTipologia] = useState("");
  const [fornitore, setFornitore] = useState("");
  const [sogliaMinima, setSogliaMinima] = useState("2");
  const [giacenza, setGiacenza] = useState("0");
  const [testo, setTesto] = useState("");
  const [righeRiconosciute, setRigheRiconosciute] = useState(0);
  
  // Stati per i modali
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'add' | 'replace' | null>(null);

  return {
    // Stati form
    selectedTipologia,
    setSelectedTipologia,
    fornitore,
    setFornitore,
    sogliaMinima,
    setSogliaMinima,
    giacenza,
    setGiacenza,
    testo,
    setTesto,
    righeRiconosciute,
    setRigheRiconosciute,
    
    // Stati modali
    showAddCategoryModal,
    setShowAddCategoryModal,
    newCategoryName,
    setNewCategoryName,
    showErrorMessage,
    setShowErrorMessage,
    showSuccessMessage,
    setShowSuccessMessage,
    showConfirmModal,
    setShowConfirmModal,
    confirmAction,
    setConfirmAction
  };
}
