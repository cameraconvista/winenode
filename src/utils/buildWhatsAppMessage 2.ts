/**
 * Utility per generazione messaggio WhatsApp ordine vini
 * Esclude sempre i prezzi, include solo dati essenziali
 */

export interface OrderDetail {
  wineName: string;
  vintage?: string;
  quantity: number;
  unit: 'bottiglie' | 'cartoni';
}

/**
 * Costruisce il messaggio WhatsApp per ordine vini
 * @param orderDetails Array dettagli ordine (senza prezzi)
 * @param date Data ordine
 * @returns Stringa formattata per WhatsApp
 */
export function buildWhatsAppMessage(
  orderDetails: OrderDetail[],
  date: Date = new Date()
): string {
  const lines: string[] = [];
  
  // Intestazione fissa
  lines.push('Camera con Vista');
  lines.push('Ordine vini');
  
  // Data in formato italiano
  const formattedDate = date.toLocaleDateString('it-IT');
  lines.push(`Data: ${formattedDate}`);
  
  // Elenco articoli (solo nome, annata opzionale, quantità, unità)
  orderDetails.forEach(item => {
    let line = `• ${item.wineName}`;
    
    // Aggiungi annata se presente
    if (item.vintage) {
      line += ` ${item.vintage}`;
    }
    
    // Quantità e unità (capitalizza prima lettera)
    const unit = item.unit.charAt(0).toUpperCase() + item.unit.slice(1);
    line += ` — x${item.quantity} ${unit}`;
    
    lines.push(line);
  });
  
  // Normalizzazione per WhatsApp
  let message = lines.join('\n');
  
  // Rimuovi spazi superflui all'inizio di ogni riga
  message = message.replace(/^\s+/gm, '');
  
  // Assicura che i fine riga siano \n (non \r\n)
  message = message.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  return message;
}

/**
 * Costruisce URL WhatsApp con messaggio precompilato
 * @param message Testo messaggio
 * @returns URL wa.me con testo encodato
 */
export function buildWhatsAppUrl(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Costruisce URL WhatsApp Web per desktop
 * @param message Testo messaggio
 * @returns URL web.whatsapp.com con testo encodato
 */
export function buildWebWhatsAppUrl(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://web.whatsapp.com/send?text=${encodedMessage}`;
}

/**
 * Costruisce URL WhatsApp fallback per app mobile
 * @param message Testo messaggio
 * @returns URL whatsapp:// con testo encodato
 */
export function buildWhatsAppFallbackUrl(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `whatsapp://send?text=${encodedMessage}`;
}

/**
 * Rileva se il dispositivo è mobile (iOS/Android)
 * @returns true se mobile, false se desktop
 */
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
}
