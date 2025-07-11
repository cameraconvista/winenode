` tags.

```typescript
import React, { useState } from 'react';
import { X, User, Save } from 'lucide-react';
import { supabase, authManager, isSupabaseAvailable } from '../lib/supabase';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierAdded: () => void;
}

export default function AddSupplierModal({ 
  isOpen, 
  onClose, 
  onSupplierAdded 
}: AddSupplierModalProps) {
  const [nome, setNome] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      setError('Nome fornitore è obbligatorio');
      return;
    }

    if (!isSupabaseAvailable || !authManager.isAuthenticated()) {
      setError('Errore di autenticazione');
      return;
    }

    const userId = authManager.getUserId();
    if (!userId) {
      setError('ID utente non disponibile');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Aggiunta nuovo fornitore:', nome.trim());

      const { data, error: supabaseError } = await supabase!
        .from('fornitori')
        .insert({
          nome: nome.trim().toUpperCase(),
          user_id: userId
        })
        .select()
        .single();

      if (supabaseError) {
        console.error('Errore Supabase:', supabaseError);

        if (supabaseError.code === '23505') {
          setError('Un fornitore con questo nome esiste già');
        } else {
          setError(`Errore database: ${supabaseError.message}`);
        }
        return;
      }

      console.log('✅ Fornitore aggiunto con successo:', data);

      // Reset form
      setNome('');

      // Notifica il parent component
      onSupplierAdded();

      // Chiudi modal
      onClose();

    } catch (err: any) {
      console.error('❌ Errore nell\'aggiunta del fornitore:', err);
      setError(`Errore inaspettato: ${err.message || 'Operazione fallita'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNome('');
      setError('');
      onClose();
    }
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNome(e.target.value.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800/90 border border-gray-700 rounded-xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-lg font-bold text-cream">NUOVO FORNITORE</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-cream hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nome Fornitore */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Fornitore *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={nome}
                onChange={handleNomeChange}
                placeholder="NOME FORNITORE"
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-cream placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent uppercase"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? 'Salvando...' : 'Aggiungi Fornitore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}