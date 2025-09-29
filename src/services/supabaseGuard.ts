/**
 * Guardrail Supabase per prevenire duplicati nella tabella 'vini'
 * 
 * Questo wrapper blocca le operazioni di scrittura (insert, upsert, update, delete)
 * sulla tabella 'vini' per mantenere l'app in modalità read-only.
 * 
 * I vini devono essere sincronizzati solo da Google Sheet → Supabase.
 */

import { supabase } from '../lib/supabase';

// Errore personalizzato per operazioni bloccate
export class ReadOnlyViniError extends Error {
  constructor(operation: string, table: string) {
    super(`OPERAZIONE BLOCCATA: ${operation} su tabella '${table}' non permessa. App è read-only su 'vini'.`);
    this.name = 'ReadOnlyViniError';
  }
}

// Operazioni di scrittura bloccate
const BLOCKED_OPERATIONS = ['insert', 'upsert', 'update', 'delete'] as const;
type BlockedOperation = typeof BLOCKED_OPERATIONS[number];

/**
 * Verifica se un'operazione su una tabella deve essere bloccata
 */
function shouldBlockOperation(table: string, operation: string): boolean {
  return table === 'vini' && BLOCKED_OPERATIONS.includes(operation as BlockedOperation);
}

/**
 * Wrapper del client Supabase con guardrail per tabella 'vini'
 */
export const supabaseGuarded = {
  ...supabase,
  
  from: (table: string) => {
    const originalFrom = supabase.from(table);
    
    // Se non è la tabella 'vini', ritorna il client normale
    if (table !== 'vini') {
      return originalFrom;
    }
    
    // Per la tabella 'vini', wrappa le operazioni di scrittura
    return {
      ...originalFrom,
      
      // Blocca INSERT
      insert: (...args: any[]) => {
        const operation = 'insert';
        const data = args[0];
        
        // Verifica rischio duplicati
        checkPotentialDuplicate(data);
        logBlockedOperation(operation, table, data);
        
        if (import.meta.env.DEV) {
          console.warn('⚠️ DEV MODE: Operazione bloccata ma non genera errore');
          return Promise.resolve({ data: null, error: null });
        }
        
        throw new ReadOnlyViniError(operation, table);
      },
      
      // Blocca UPSERT
      upsert: (...args: any[]) => {
        const operation = 'upsert';
        const data = args[0];
        
        // Verifica rischio duplicati
        checkPotentialDuplicate(data);
        logBlockedOperation(operation, table, data);
        
        if (import.meta.env.DEV) {
          console.warn('⚠️ DEV MODE: Operazione bloccata ma non genera errore');
          return Promise.resolve({ data: null, error: null });
        }
        
        throw new ReadOnlyViniError(operation, table);
      },
      
      // Blocca UPDATE
      update: (...args: any[]) => {
        const operation = 'update';
        console.warn(`🚫 GUARDRAIL: ${operation} bloccato su tabella '${table}'`);
        console.warn('📋 Dati bloccati:', args[0]);
        
        if (import.meta.env.DEV) {
          console.warn('⚠️ DEV MODE: Operazione bloccata ma non genera errore');
          return {
            ...originalFrom.update(args[0]),
            // Override dei metodi di esecuzione
            eq: () => Promise.resolve({ data: null, error: null }),
            neq: () => Promise.resolve({ data: null, error: null }),
            gt: () => Promise.resolve({ data: null, error: null }),
            gte: () => Promise.resolve({ data: null, error: null }),
            lt: () => Promise.resolve({ data: null, error: null }),
            lte: () => Promise.resolve({ data: null, error: null }),
            like: () => Promise.resolve({ data: null, error: null }),
            ilike: () => Promise.resolve({ data: null, error: null }),
            is: () => Promise.resolve({ data: null, error: null }),
            in: () => Promise.resolve({ data: null, error: null }),
            contains: () => Promise.resolve({ data: null, error: null }),
            containedBy: () => Promise.resolve({ data: null, error: null }),
            rangeGt: () => Promise.resolve({ data: null, error: null }),
            rangeGte: () => Promise.resolve({ data: null, error: null }),
            rangeLt: () => Promise.resolve({ data: null, error: null }),
            rangeLte: () => Promise.resolve({ data: null, error: null }),
            rangeAdjacent: () => Promise.resolve({ data: null, error: null }),
            overlaps: () => Promise.resolve({ data: null, error: null }),
            textSearch: () => Promise.resolve({ data: null, error: null }),
            match: () => Promise.resolve({ data: null, error: null }),
            not: () => Promise.resolve({ data: null, error: null }),
            or: () => Promise.resolve({ data: null, error: null }),
            filter: () => Promise.resolve({ data: null, error: null })
          };
        }
        
        throw new ReadOnlyViniError(operation, table);
      },
      
      // Blocca DELETE
      delete: (...args: any[]) => {
        const operation = 'delete';
        console.warn(`🚫 GUARDRAIL: ${operation} bloccato su tabella '${table}'`);
        
        if (import.meta.env.DEV) {
          console.warn('⚠️ DEV MODE: Operazione bloccata ma non genera errore');
          return {
            ...originalFrom.delete(),
            // Override dei metodi di esecuzione
            eq: () => Promise.resolve({ data: null, error: null }),
            neq: () => Promise.resolve({ data: null, error: null }),
            gt: () => Promise.resolve({ data: null, error: null }),
            gte: () => Promise.resolve({ data: null, error: null }),
            lt: () => Promise.resolve({ data: null, error: null }),
            lte: () => Promise.resolve({ data: null, error: null }),
            like: () => Promise.resolve({ data: null, error: null }),
            ilike: () => Promise.resolve({ data: null, error: null }),
            is: () => Promise.resolve({ data: null, error: null }),
            in: () => Promise.resolve({ data: null, error: null }),
            contains: () => Promise.resolve({ data: null, error: null }),
            containedBy: () => Promise.resolve({ data: null, error: null }),
            rangeGt: () => Promise.resolve({ data: null, error: null }),
            rangeGte: () => Promise.resolve({ data: null, error: null }),
            rangeLt: () => Promise.resolve({ data: null, error: null }),
            rangeLte: () => Promise.resolve({ data: null, error: null }),
            rangeAdjacent: () => Promise.resolve({ data: null, error: null }),
            overlaps: () => Promise.resolve({ data: null, error: null }),
            textSearch: () => Promise.resolve({ data: null, error: null }),
            match: () => Promise.resolve({ data: null, error: null }),
            not: () => Promise.resolve({ data: null, error: null }),
            or: () => Promise.resolve({ data: null, error: null }),
            filter: () => Promise.resolve({ data: null, error: null })
          };
        }
        
        throw new ReadOnlyViniError(operation, table);
      },
      
      // Mantieni operazioni di lettura
      select: originalFrom.select.bind(originalFrom)
    };
  }
};

/**
 * Utility per logging delle operazioni bloccate
 */
export function logBlockedOperation(operation: string, table: string, data?: any) {
  console.group(`🚫 GUARDRAIL SUPABASE - Operazione Bloccata`);
  console.warn(`📋 Operazione: ${operation}`);
  console.warn(`🗂️ Tabella: ${table}`);
  if (data) {
    console.warn(`📊 Dati:`, data);
  }
  console.warn(`⚠️ Motivo: App deve essere read-only su tabella 'vini'`);
  console.warn(`💡 Soluzione: I vini devono essere sincronizzati da Google Sheet → Supabase`);
  console.warn(`🚨 PREVENZIONE DUPLICATI: Operazione bloccata per mantenere integrità dati`);
  console.groupEnd();
}

/**
 * Verifica se un'operazione potrebbe creare duplicati
 */
export function checkPotentialDuplicate(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  // Controlla se contiene campi che potrebbero creare duplicati
  const duplicateRiskFields = ['nome_vino', 'produttore', 'anno', 'fornitore'];
  const hasRiskFields = duplicateRiskFields.some(field => data[field] !== undefined);
  
  if (hasRiskFields) {
    console.warn('🚨 RISCHIO DUPLICATI: Operazione contiene campi che potrebbero creare duplicati');
    console.warn('📋 Campi a rischio:', duplicateRiskFields.filter(field => data[field] !== undefined));
  }
  
  return hasRiskFields;
}

export default supabaseGuarded;
