import { Ordine } from './types';

// Mappa raw data da database verso Ordine UI
export function mapRawToOrdine(raw: any, fornitoriMap?: Map<string, string>): Ordine {
  // Se abbiamo la join con fornitori, usa il nome dalla join
  let fornitoreNome = 'Fornitore sconosciuto';
  
  // Se abbiamo fornitori dalla join
  if (raw.fornitori && raw.fornitori.nome) {
    fornitoreNome = raw.fornitori.nome;
  }
  // Altrimenti usa la mappa fornitori (fallback 2-step)
  else if (fornitoriMap && raw.fornitore) {
    fornitoreNome = fornitoriMap.get(raw.fornitore) || 'Fornitore sconosciuto';
  }
  // Se non abbiamo join né mappa, ma abbiamo un UUID fornitore, lo usiamo come fallback
  else if (raw.fornitore) {
    fornitoreNome = `Fornitore ${raw.fornitore.substring(0, 8)}...`;
  }

  // Parse dettagli JSON se presente (contenuto o dettagli)
  let dettagli = [];
  try {
    const contenutoField = raw.contenuto || raw.dettagli;
    if (contenutoField) {
      dettagli = typeof contenutoField === 'string' ? JSON.parse(contenutoField) : contenutoField;
    }
  } catch (error) {
    console.warn(`⚠️ Errore parsing contenuto ordine ${raw.id}:`, error);
  }

  // Calcola bottiglie dai dettagli
  const bottiglie = dettagli.reduce((sum: number, item: any) => {
    const quantity = item.quantity || 0;
    const multiplier = item.unit === 'cartoni' ? 6 : 1;
    return sum + (quantity * multiplier);
  }, 0);

  return {
    id: raw.id,
    fornitore: fornitoreNome,
    fornitoreId: raw.fornitore, // UUID fornitore dal DB
    data: raw.data,
    dettagli: dettagli,
    totale: raw.totale || 0,
    bottiglie: bottiglie,
    stato: raw.stato,
    created_at: raw.created_at,
    updated_at: raw.updated_at
  };
}

// Calcola totali da dettagli ordine
export function calculateTotals(dettagli: any[]): { totale: number; bottiglie: number } {
  return dettagli.reduce((acc, item) => ({
    totale: acc.totale + (item.totalPrice || 0),
    bottiglie: acc.bottiglie + ((item.quantity || 0) * (item.unit === 'cartoni' ? 6 : 1))
  }), { totale: 0, bottiglie: 0 });
}
