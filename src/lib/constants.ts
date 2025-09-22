// Costanti per WineRow
export interface WineRow {
  id?: string;
  nomeVino: string;
  anno?: string;
  produttore?: string;
  provenienza?: string;
  fornitore?: string;
  tipologia?: string;
  costo?: number;
  vendita?: number;
  giacenza?: number;
}

export const SERVICE_USER_ID = '00000000-0000-0000-0000-000000000001';
