/**
 * Compatibility Layer per Nomenclatura
 * Gestisce mapping tra terminologia server (supplier) e frontend (fornitore)
 */

export interface CompatibilityMapping {
  supplier: string;
  fornitore: string;
}

/**
 * Mappa "supplier" → "fornitore" per compatibilità frontend
 */
export function mapSupplierToFornitore(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => mapSupplierToFornitore(item));
  }
  
  if (typeof data === 'object') {
    const mapped = { ...data };
    
    // Mappa supplier → fornitore se presente
    if ('supplier' in mapped) {
      mapped.fornitore = mapped.supplier;
      // Mantieni anche supplier per retrocompatibilità
    }
    
    return mapped;
  }
  
  return data;
}

/**
 * Mappa "fornitore" → "supplier" per compatibilità database
 */
export function mapFornitoreToSupplier(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => mapFornitoreToSupplier(item));
  }
  
  if (typeof data === 'object') {
    const mapped = { ...data };
    
    // Mappa fornitore → supplier se presente
    if ('fornitore' in mapped) {
      mapped.supplier = mapped.fornitore;
      delete mapped.fornitore; // Rimuovi per pulizia database
    }
    
    return mapped;
  }
  
  return data;
}

/**
 * Middleware per mapping automatico delle risposte
 */
export function responseCompatibilityMiddleware(req: any, res: any, next: any) {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    const mappedData = mapSupplierToFornitore(data);
    return originalJson.call(this, mappedData);
  };
  
  next();
}

/**
 * Middleware per mapping automatico delle richieste
 */
export function requestCompatibilityMiddleware(req: any, res: any, next: any) {
  if (req.body) {
    req.body = mapFornitoreToSupplier(req.body);
  }
  
  if (req.query) {
    req.query = mapFornitoreToSupplier(req.query);
  }
  
  next();
}
