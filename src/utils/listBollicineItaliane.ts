export interface WineData {
  nome: string;
  anno?: string;
  produttore?: string;
  provenienza?: string;
  fornitore?: string;
  costo?: string;
  vendita?: string;
  margine?: string;
}

export const listBollicineItalianeWines = async (): Promise<WineData[]> => {
  return []
}

export const exportBollicineItalianeTable = async (): Promise<string> => {
  return "❌ Nessun vino trovato";
};

export const showBollicineInConsole = async () => {
  console.clear();
  await listBollicineItalianeWines();
  const table = await exportBollicineItalianeTable();
  console.log(table);
};