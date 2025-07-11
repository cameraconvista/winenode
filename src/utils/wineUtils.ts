import { WineRow } from "../lib/constants";

export interface WineData {
  nomeVino: string;
  anno: string | null;
  produttore: string;
  provenienza: string;
  fornitore: string | null;
  costo: number | null;
  vendita: number | null;
  margine: number | null;
}

function parseEuro(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function parseCsvWineRows(data: string[][], categoria: string): WineData[] {
  if (data.length < 2) return [];

  const headers = data[0].map(h => h.trim().toLowerCase());
  console.log(`📋 Headers trovati per ${categoria}:`, headers);

  const col = (label: string) => headers.findIndex(h => h.includes(label.toLowerCase()));

  const idxNome = col("nome");
  const idxAnno = col("anno");
  const idxProduttore = col("produttore");
  const idxProvenienza = col("provenienza");
  const idxFornitore = col("fornitore");
  const idxCosto = col("costo");
  const idxVendita = col("vendita");
  const idxMargine = col("margine");

  return data.slice(1)
    .filter(row =>
      row.length > 1 &&
      !row[0]?.toLowerCase().includes("nome vino") &&
      row[0]?.trim() !== categoria &&
      row[0]?.trim() !== ""
    )
    .map(row => {
      const wine: WineData = {
        nomeVino: row[idxNome]?.trim() || '',
        anno: row[idxAnno]?.trim() || null,
        produttore: row[idxProduttore]?.trim() || '',
        provenienza: row[idxProvenienza]?.trim() || '',
        fornitore: (() => {
          const fornitore = row[idxFornitore]?.trim();
          if (!fornitore || 
              fornitore.toLowerCase() === 'non specificato' ||
              fornitore.toLowerCase().includes('non specif')) {
            return null;
          }
          return fornitore;
        })(),
        costo: parseEuro(row[idxCosto]),
        vendita: parseEuro(row[idxVendita]),
        margine: parseEuro(row[idxMargine])
      };

      return wine;
    })
    .filter(w => w.nomeVino.length > 0);
}

export function buildEmptyRows(count: number): WineRow[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `empty-${idx}`,
    nomeVino: "",
    anno: "",
    produttore: "",
    provenienza: "",
    giacenza: 0,
    fornitore: "",
    tipologia: "",
  }));
}
