// Utility per prefetch non invasivo delle rotte
// Zero side-effects visivi, ottimizzazione navigazione

interface PrefetchOptions {
  priority?: 'high' | 'low';
  timeout?: number;
}

// Cache per evitare prefetch duplicati
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch di una route tramite dynamic import
 * Utilizzabile su hover/touch per ridurre latenza percepita
 */
export const prefetchRoute = async (
  importer: () => Promise<any>,
  routeName: string,
  options: PrefetchOptions = {}
): Promise<void> => {
  // Evita prefetch duplicati
  if (prefetchedRoutes.has(routeName)) {
    return;
  }

  try {
    // Timeout per evitare prefetch troppo lunghi
    const timeout = options.timeout || 3000;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Prefetch timeout')), timeout)
    );

    await Promise.race([importer(), timeoutPromise]);
    
    prefetchedRoutes.add(routeName);
    console.log(`✅ Prefetched route: ${routeName}`);
  } catch (error) {
    console.warn(`⚠️ Failed to prefetch ${routeName}:`, error);
  }
};

/**
 * Prefetch su idle per rotte ad alta probabilità
 * Utilizza requestIdleCallback per non impattare performance
 */
export const prefetchOnIdle = (
  importer: () => Promise<any>,
  routeName: string,
  options: PrefetchOptions = {}
): void => {
  // Verifica supporto requestIdleCallback
  if (typeof requestIdleCallback === 'undefined') {
    // Fallback per browser non supportati
    setTimeout(() => prefetchRoute(importer, routeName, options), 1000);
    return;
  }

  requestIdleCallback(
    () => {
      prefetchRoute(importer, routeName, options);
    },
    { timeout: 5000 } // Max 5s di attesa per idle
  );
};

/**
 * Hook per prefetch su mouse enter/touch start
 * Da utilizzare sui link di navigazione principali
 */
export const usePrefetchOnHover = () => {
  const handlePrefetch = (
    importer: () => Promise<any>,
    routeName: string
  ) => {
    return {
      onMouseEnter: () => prefetchRoute(importer, routeName, { priority: 'high' }),
      onTouchStart: () => prefetchRoute(importer, routeName, { priority: 'high' }),
      // Prevenire comportamenti indesiderati
      onFocus: () => prefetchRoute(importer, routeName, { priority: 'low' })
    };
  };

  return { handlePrefetch };
};

/**
 * Prefetch automatico delle rotte principali su idle
 * Da chiamare una volta all'avvio dell'app
 */
export const initMainRoutesPrefetch = (): void => {
  // Rotte ad alta probabilità di navigazione
  const highPriorityRoutes = [
    {
      name: 'gestisci-ordini',
      importer: () => import('../pages/GestisciOrdiniPage')
    },
    {
      name: 'fornitori', 
      importer: () => import('../pages/FornitoriPage')
    },
    {
      name: 'crea-ordine',
      importer: () => import('../pages/CreaOrdinePage')
    }
  ];

  // Prefetch con delay progressivo per evitare congestione
  highPriorityRoutes.forEach((route, index) => {
    setTimeout(() => {
      prefetchOnIdle(route.importer, route.name, { priority: 'low' });
    }, index * 500); // Delay di 500ms tra prefetch
  });
};

/**
 * Reset cache prefetch (utile per testing/development)
 */
export const resetPrefetchCache = (): void => {
  prefetchedRoutes.clear();
  console.log('🔄 Prefetch cache cleared');
};
