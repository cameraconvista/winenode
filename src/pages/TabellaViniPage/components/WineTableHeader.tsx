import React from 'react';
import { ArrowLeft, Home, Save, Plus } from 'lucide-react';

interface WineTableHeaderProps {
  onBack: () => void;
  onHome: () => void;
  onSave: () => void;
  onAddRow: () => void;
}

export const WineTableHeader: React.FC<WineTableHeaderProps> = ({
  onBack,
  onHome,
  onSave,
  onAddRow
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={onHome}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Home className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 ml-2">
          Tabella Vini
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onAddRow}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Aggiungi Riga
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          Salva
        </button>
      </div>
    </div>
  );
};
