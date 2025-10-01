import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWineRows } from './hooks/useWineRows';
import { WineTableHeader } from './components/WineTableHeader';
import { WineTableRow } from './components/WineTableRow';

export default function TabellaViniPage() {
  const navigate = useNavigate();
  const { rows, updateRow, addRow, removeRow, clearAllRows } = useWineRows();

  const handleSave = () => {
    // Filtra solo le righe con almeno il nome del vino compilato
    const validRows = rows.filter(row => row.nomeVino.trim() !== '');
    
    if (validRows.length === 0) {
      alert('Inserisci almeno un vino per salvare la tabella.');
      return;
    }

    // Qui potresti implementare la logica di salvataggio
    console.log('Righe da salvare:', validRows);
    alert(`Salvate ${validRows.length} righe di vini.`);
  };

  const handleClearAll = () => {
    if (window.confirm('Sei sicuro di voler cancellare tutti i dati?')) {
      clearAllRows();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <WineTableHeader
        onBack={() => navigate(-1)}
        onHome={() => navigate('/')}
        onSave={handleSave}
        onAddRow={addRow}
      />

      <div className="p-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">#</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Tipologia</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Nome Vino</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Produttore</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Provenienza</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Costo (€)</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Vendita (€)</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Margine (€)</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Fornitore</th>
                  <th className="p-3 text-center text-sm font-medium text-gray-700">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <WineTableRow
                    key={row.id}
                    row={row}
                    index={index}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Totale righe: {rows.length} | Righe compilate: {rows.filter(row => row.nomeVino.trim() !== '').length}
          </div>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Cancella Tutto
          </button>
        </div>
      </div>
    </div>
  );
}
