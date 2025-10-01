import React from 'react';
import { Trash2 } from 'lucide-react';
import { WineRow } from '../types';

interface WineTableRowProps {
  row: WineRow;
  index: number;
  onUpdate: (id: string, field: keyof WineRow, value: string) => void;
  onRemove: (id: string) => void;
}

export const WineTableRow: React.FC<WineTableRowProps> = ({
  row,
  index,
  onUpdate,
  onRemove
}) => {
  const handleInputChange = (field: keyof WineRow, value: string) => {
    onUpdate(row.id, field, value);
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-2 text-sm text-gray-600 text-center">
        {index + 1}
      </td>
      <td className="p-2">
        <select
          value={row.tipologia}
          onChange={(e) => handleInputChange('tipologia', e.target.value)}
          className="w-full p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleziona...</option>
          <option value="ROSSI">ROSSI</option>
          <option value="BIANCHI">BIANCHI</option>
          <option value="BOLLICINE ITALIANE">BOLLICINE ITALIANE</option>
          <option value="BOLLICINE FRANCESI">BOLLICINE FRANCESI</option>
          <option value="ROSATI">ROSATI</option>
          <option value="VINI DOLCI">VINI DOLCI</option>
        </select>
      </td>
      <td className="p-2">
        <input
          type="text"
          value={row.nomeVino}
          onChange={(e) => handleInputChange('nomeVino', e.target.value)}
          className="w-full p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nome del vino"
        />
      </td>
      <td className="p-2">
        <input
          type="text"
          value={row.produttore}
          onChange={(e) => handleInputChange('produttore', e.target.value)}
          className="w-full p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Produttore"
        />
      </td>
      <td className="p-2">
        <input
          type="text"
          value={row.provenienza}
          onChange={(e) => handleInputChange('provenienza', e.target.value)}
          className="w-full p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Provenienza"
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          step="0.01"
          value={row.costo}
          onChange={(e) => handleInputChange('costo', e.target.value)}
          className="w-full p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          step="0.01"
          value={row.vendita}
          onChange={(e) => handleInputChange('vendita', e.target.value)}
          className="w-full p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
      </td>
      <td className="p-2">
        <input
          type="text"
          value={row.margine}
          readOnly
          className="w-full p-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-600"
          placeholder="Auto"
        />
      </td>
      <td className="p-2">
        <input
          type="text"
          value={row.fornitore}
          onChange={(e) => handleInputChange('fornitore', e.target.value)}
          className="w-full p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Fornitore"
        />
      </td>
      <td className="p-2 text-center">
        <button
          onClick={() => onRemove(row.id)}
          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          title="Rimuovi riga"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};
