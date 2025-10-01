import { useState, useEffect, useCallback } from 'react';
import { WineRow } from '../types';

export const useWineRows = () => {
  const [rows, setRows] = useState<WineRow[]>([]);

  // Inizializza 30 righe vuote
  useEffect(() => {
    const initialRows: WineRow[] = Array.from({ length: 30 }, (_, index) => ({
      id: `row-${index + 1}`,
      tipologia: '',
      nomeVino: '',
      produttore: '',
      provenienza: '',
      costo: '',
      vendita: '',
      margine: '',
      fornitore: ''
    }));
    setRows(initialRows);
  }, []);

  const updateRow = useCallback((id: string, field: keyof WineRow, value: string) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };

        // Calcola automaticamente il margine se costo e vendita sono presenti
        if (field === 'costo' || field === 'vendita') {
          const costo = parseFloat(field === 'costo' ? value : row.costo) || 0;
          const vendita = parseFloat(field === 'vendita' ? value : row.vendita) || 0;
          const margine = vendita - costo;
          updatedRow.margine = margine > 0 ? margine.toFixed(2) : '';
        }

        return updatedRow;
      }
      return row;
    }));
  }, []);

  const addRow = useCallback(() => {
    const newRow: WineRow = {
      id: `row-${Date.now()}`,
      tipologia: '',
      nomeVino: '',
      produttore: '',
      provenienza: '',
      costo: '',
      vendita: '',
      margine: '',
      fornitore: ''
    };
    setRows(prev => [...prev, newRow]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.filter(row => row.id !== id));
  }, []);

  const clearAllRows = useCallback(() => {
    setRows(prev => prev.map(row => ({
      ...row,
      tipologia: '',
      nomeVino: '',
      produttore: '',
      provenienza: '',
      costo: '',
      vendita: '',
      margine: '',
      fornitore: ''
    })));
  }, []);

  return {
    rows,
    updateRow,
    addRow,
    removeRow,
    clearAllRows
  };
};
