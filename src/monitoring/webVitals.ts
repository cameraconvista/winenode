/**
 * Web Vitals monitoring leggero - solo produzione
 * Nessun impatto su bundle iniziale, lazy import condizionale
 */

interface WebVitalsMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

type WebVitalsCallback = (metric: WebVitalsMetric) => void;

/**
 * Stub per Web Vitals quando libreria non disponibile
 */
const webVitalsStub = {
  getCLS: (cb: WebVitalsCallback) => console.debug('Web Vitals: CLS stub called'),
  getFID: (cb: WebVitalsCallback) => console.debug('Web Vitals: FID stub called'),
  getFCP: (cb: WebVitalsCallback) => console.debug('Web Vitals: FCP stub called'),
  getLCP: (cb: WebVitalsCallback) => console.debug('Web Vitals: LCP stub called'),
  getTTFB: (cb: WebVitalsCallback) => console.debug('Web Vitals: TTFB stub called'),
};

/**
 * Callback di default per metriche - logga in console.debug
 */
const defaultMetricHandler = (metric: WebVitalsMetric) => {
  console.debug(`Web Vitals: ${metric.name}`, {
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    delta: metric.delta
  });
};

/**
 * Callback con integrazione GA4 (se configurato)
 */
const ga4MetricHandler = (metric: WebVitalsMetric) => {
  // Prova a inviare a GA4 se disponibile
  if (typeof gtag !== 'undefined' && import.meta.env.VITE_GA4_MEASUREMENT_ID) {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      custom_parameter_1: metric.rating,
    });
  }
  
  // Fallback a console.debug (mascherando valori sensibili)
  const maskedMetric = {
    ...metric,
    id: metric.id.substring(0, 8) + '***' // Maschera ID per privacy
  };
  console.debug(`Web Vitals: ${maskedMetric.name}`, maskedMetric);
};

/**
 * Inizializza Web Vitals monitoring
 * Solo in produzione, lazy import per non impattare bundle
 */
export const initWebVitals = async (callback: WebVitalsCallback = defaultMetricHandler): Promise<void> => {
  // Solo in produzione
  if (import.meta.env.DEV) {
    console.debug('Web Vitals: Skipped in development mode');
    return;
  }

  try {
    // Import del pacchetto ufficiale web-vitals
    const webVitals = await import('web-vitals');

    // Inizializza tutte le metriche Core Web Vitals
    webVitals.onCLS(callback);
    webVitals.onINP(callback); // FID è deprecato, sostituito da INP
    webVitals.onFCP(callback);
    webVitals.onLCP(callback);
    webVitals.onTTFB(callback);

    console.debug('Web Vitals: Monitoring initialized');
  } catch (error) {
    console.debug('Web Vitals: Failed to initialize', error);
  }
};

/**
 * Versione con integrazione GA4 (se configurato)
 */
export const initWebVitalsWithGA4 = (): void => {
  // Usa il callback GA4 se measurement ID è configurato
  const callback = import.meta.env.VITE_GA4_MEASUREMENT_ID ? ga4MetricHandler : defaultMetricHandler;
  initWebVitals(callback);
};

/**
 * Hook React per Web Vitals (opzionale)
 * Nota: Richiede React import nel componente che lo usa
 */
export const useWebVitals = (callback?: WebVitalsCallback) => {
  // Hook disponibile solo se React è già importato nel contesto
  try {
    // @ts-ignore - React potrebbe non essere disponibile
    const { useEffect } = require('react');
    useEffect(() => {
      initWebVitals(callback);
    }, [callback]);
  } catch {
    // React non disponibile, skip hook
    console.debug('Web Vitals: React hook not available');
  }
};

// Dichiarazione globale per gtag (se presente)
declare global {
  function gtag(...args: any[]): void;
}
