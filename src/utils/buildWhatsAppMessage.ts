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
  
  // Intestazione fissa - Camera con Vista prima
  lines.push('Camera con Vista');
  lines.push('');
  
  // Data in formato italiano con prefisso
  const formattedDate = date.toLocaleDateString('it-IT');
  lines.push(`Ordine vini del ${formattedDate}`);
  lines.push('');
  
  // Elenco articoli (nome, annata opzionale su riga separata per quantità)
  orderDetails.forEach(item => {
    let line = `• ${item.wineName}`;
    
    // Aggiungi annata se presente
    if (item.vintage) {
      line += ` ${item.vintage}`;
    }
    
    lines.push(line);
    
    // Quantità e unità su riga separata, allineata sotto la prima lettera del nome (dopo il bullet)
    const unit = item.unit.charAt(0).toLowerCase() + item.unit.slice(1);
    lines.push(`  Nr ${item.quantity} ${unit}`); // 2 spazi per allineare sotto la prima lettera
  });
  
  // Normalizza CRLF → LF e trim finale
  const message = lines.join('\n').replace(/\r?\n/g, '\n').trim();
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
 * Costruisce URL WhatsApp per app mobile (priorità)
 * @param message Testo messaggio
 * @returns URL whatsapp:// con testo encodato
 */
export function buildWhatsAppMobileUrl(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `whatsapp://send?text=${encodedMessage}`;
}

/**
 * Costruisce URL WhatsApp web fallback
 * @param message Testo messaggio
 * @returns URL web.whatsapp.com con testo encodato
 */
export function buildWhatsAppWebUrl(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://web.whatsapp.com/send?text=${encodedMessage}`;
}
