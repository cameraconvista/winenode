import React, { memo } from 'react';

interface AddCategoryModalProps {
  showModal: boolean;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const AddCategoryModal = memo(function AddCategoryModal({
  showModal,
  newCategoryName,
  setNewCategoryName,
  onClose,
  onConfirm
}: AddCategoryModalProps) {
  if (!showModal) return null;

  const handleClose = () => {
    onClose();
    setNewCategoryName("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-cream">Aggiungi Categoria</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-cream"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Categoria
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Es: Dessert, Champagne..."
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-cream rounded px-4 py-2 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={onConfirm}
              disabled={!newCategoryName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-cream rounded px-4 py-2 transition-colors"
            >
              Aggiungi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
