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
    // Lazy import condizionale - fallback a stub se non disponibile
    let webVitals;
    try {
      // Dynamic import con string per evitare risoluzione statica
      const moduleName = 'web-vitals';
      webVitals = await import(/* @vite-ignore */ moduleName);
    } catch {
      console.debug('Web Vitals: Library not available, using stub');
      webVitals = webVitalsStub;
    }

    // Inizializza tutte le metriche Core Web Vitals
    webVitals.getCLS(callback);
    webVitals.getFID(callback);
    webVitals.getFCP(callback);
    webVitals.getLCP(callback);
    webVitals.getTTFB(callback);

    console.debug('Web Vitals: Monitoring initialized');
  } catch (error) {
    console.debug('Web Vitals: Failed to initialize', error);
  }
};

/**
 * Versione con integrazione GA4 (se configurato)
 */
export const initWebVitalsWithGA4 = (measurementId?: string): void => {
  const sendToGA4 = (metric: WebVitalsMetric) => {
    // Prova a inviare a GA4 se disponibile
    if (typeof gtag !== 'undefined' && measurementId) {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_parameter_1: metric.rating,
      });
    }
    
    // Fallback a console.debug
    defaultMetricHandler(metric);
  };

  initWebVitals(sendToGA4);
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
