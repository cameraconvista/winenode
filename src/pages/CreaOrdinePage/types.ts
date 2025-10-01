export interface CreaOrdinePageProps {
  supplier?: string;
}

export interface WineItemProps {
  wine: any;
  ordineItem: any;
  unitPreference: string;
  onQuantityChange: (wineId: string, quantity: number) => void;
  onUnitChange: (wineId: string, unit: string) => void;
}
