import React, { useState, useEffect } from 'react';
import { X, User, Save } from 'lucide-react';
import { supabase, authManager, isSupabaseAvailable } from '../lib/supabase';
import { Supplier } from '../hooks/useSuppliers';

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierUpdated: () => void;
  supplier: Supplier | null;
}

export default function EditSupplierModal({
  isOpen,
  onClose,
  onSupplierUpdated,
  supplier
}: EditSupplierModalProps) {
  const [nome, setNome] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setNome(supplier.nome || '');
    }
  }, [supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      alert('Il nome del fornitore è obbligatorio');
      return;
    }

    if (!supplier) {
      alert('Nessun fornitore selezionato');
      return;
    }

    if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
      alert('Errore: Supabase non configurato o utente non autenticato');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('fornitori')
        .update({ nome: nome.trim() })
        .eq('id', supplier.id);

      if (error) throw error;

      console.log('✅ Fornitore aggiornato:', nome);
      onSupplierUpdated();
      onClose();
    } catch (error) {
      console.error('❌ Errore aggiornamento fornitore:', error);
      alert('Errore durante l\'aggiornamento del fornitore');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-semibold text-white">Modifica Fornitore</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Fornitore *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Inserisci nome fornitore"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading || !nome.trim()}
              className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Aggiornamento...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Aggiorna
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}