import React from 'react';
import useWines from '../../hooks/useWines';

import { useManualInsertState } from './hooks/useManualInsertState';
import { useManualInsertSelectors } from './hooks/useManualInsertSelectors';
import { useManualInsertHandlers } from './hooks/useManualInsertHandlers';

import { Header } from './components/Header';
import { TextInputArea } from './components/TextInputArea';
import { CategorySelector } from './components/CategorySelector';
import { SupplierInput } from './components/SupplierInput';
import { ThresholdInputs } from './components/ThresholdInputs';
import { ActionsBar } from './components/ActionsBar';
import { AddCategoryModal } from './modals/AddCategoryModal';
import { ConfirmSaveModal } from './modals/ConfirmSaveModal';

export default function ManualWineInsertPage() {
  const { refreshWines } = useWines();

  // Stato locale consolidato
  const {
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
  } = useManualInsertState();

  // Selettori e derive memoizzate
  const { conteggioRighe } = useManualInsertSelectors(righeRiconosciute);

  // Handlers memoizzati
  const {
    ottimizzaTesto,
    aggiungiCategoria,
    richiediConferma,
    salvaVini
  } = useManualInsertHandlers({
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
  });

  return (
    <div 
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)",
      }}
    >
      <Header />

      {/* Contenuto principale */}
      <div 
        className="max-w-xl mx-auto"
        style={{ 
          padding: "20px"
        }}
      >
        {/* Titolo principale */}
        <h1 className="text-2xl font-bold text-center text-cream mb-6">
          INSERISCI LISTA VINI
        </h1>

        <TextInputArea
          testo={testo}
          setTesto={setTesto}
          conteggioRighe={conteggioRighe}
          onOttimizzaTesto={ottimizzaTesto}
        />

        <div className="mb-4">
          {/* Messaggio di errore */}
          {showErrorMessage && (
            <div className="mb-3 p-3 rounded-lg border border-yellow-500 bg-yellow-500/10">
              <p className="text-yellow-300 text-sm font-medium">
                ⚠️ Seleziona almeno una tipologia di vino prima di salvare la lista.
              </p>
            </div>
          )}

          {/* Messaggio di successo */}
          {showSuccessMessage && (
            <div className="mb-3 p-3 rounded-lg border border-green-500 bg-green-500/10">
              <p className="text-green-300 text-sm font-medium">
                ✅ Lista vini salvata con successo!
              </p>
            </div>
          )}

          <CategorySelector
            selectedTipologia={selectedTipologia}
            setSelectedTipologia={setSelectedTipologia}
            onAddCategory={() => setShowAddCategoryModal(true)}
          />
        </div>

        <SupplierInput
          fornitore={fornitore}
          setFornitore={setFornitore}
        />

        <ThresholdInputs
          sogliaMinima={sogliaMinima}
          setSogliaMinima={setSogliaMinima}
          giacenza={giacenza}
          setGiacenza={setGiacenza}
        />

        <ActionsBar
          onRichiediConferma={richiediConferma}
        />
      </div>

      <AddCategoryModal
        showModal={showAddCategoryModal}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        onClose={() => setShowAddCategoryModal(false)}
        onConfirm={aggiungiCategoria}
      />

      <ConfirmSaveModal
        showModal={showConfirmModal}
        confirmAction={confirmAction}
        selectedTipologia={selectedTipologia}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onConfirm={salvaVini}
      />
    </div>
  );
}
