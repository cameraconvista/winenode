
// Utility per sanitizzazione input e prevenzione XSS
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Rimuovi tag HTML base
    .replace(/javascript:/gi, '') // Rimuovi javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Rimuovi event handlers
    .substring(0, 1000); // Limita lunghezza
};

export const sanitizeNumericInput = (input: string | number): number => {
  if (typeof input === 'number') return Math.max(0, input);
  
  const cleaned = String(input).replace(/[^\d.,]/g, '');
  const numeric = parseFloat(cleaned.replace(',', '.'));
  
  return isNaN(numeric) ? 0 : Math.max(0, numeric);
};

export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleaned = email.trim().toLowerCase();
  
  return emailRegex.test(cleaned) ? cleaned : '';
};

export const validateWineData = (wine: any): boolean => {
  if (!wine.name || wine.name.length < 2) return false;
  if (wine.cost && (isNaN(wine.cost) || wine.cost < 0)) return false;
  if (wine.quantity && (isNaN(wine.quantity) || wine.quantity < 0)) return false;
  
  return true;
};
