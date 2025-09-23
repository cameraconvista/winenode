import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSizeTextOptions {
  text: string;
  minFontSize?: number;
  maxFontSize?: number;
  paddingHorizontal?: number;
  caretWidth?: number;
  marginSafety?: number;
}

export const useAutoSizeText = ({
  text,
  minFontSize = 12,
  maxFontSize = 20,
  paddingHorizontal = 32, // padding totale orizzontale (16px * 2)
  caretWidth = 0, // larghezza caret (se presente)
  marginSafety = 4 // margine di sicurezza
}: UseAutoSizeTextOptions) => {
  const elementRef = useRef<HTMLElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const calculateOptimalFontSize = useCallback(() => {
    const element = elementRef.current;
    if (!element || !text) return;

    const container = element.closest('.btn-tutti') as HTMLElement;
    if (!container) return;

    // Ottieni la larghezza disponibile del container
    const containerWidth = container.offsetWidth;
    const availableWidth = containerWidth - paddingHorizontal - caretWidth - marginSafety;

    if (availableWidth <= 0) return;

    // Crea un elemento temporaneo per misurare il testo
    const measureElement = document.createElement('span');
    measureElement.style.position = 'absolute';
    measureElement.style.visibility = 'hidden';
    measureElement.style.whiteSpace = 'nowrap';
    measureElement.style.fontFamily = getComputedStyle(element).fontFamily;
    measureElement.style.fontWeight = getComputedStyle(element).fontWeight;
    measureElement.textContent = text;
    document.body.appendChild(measureElement);

    let optimalFontSize = maxFontSize;

    // Algoritmo di bisezione per trovare la dimensione ottimale
    let low = minFontSize;
    let high = maxFontSize;
    
    while (high - low > 0.5) {
      const mid = (low + high) / 2;
      measureElement.style.fontSize = `${mid}px`;
      
      if (measureElement.offsetWidth <= availableWidth) {
        low = mid;
        optimalFontSize = mid;
      } else {
        high = mid;
      }
    }

    // Applica la dimensione ottimale
    element.style.fontSize = `${optimalFontSize}px`;
    
    // Pulisci l'elemento temporaneo
    document.body.removeChild(measureElement);
  }, [text, minFontSize, maxFontSize, paddingHorizontal, caretWidth, marginSafety]);

  const setupResizeObserver = useCallback(() => {
    if (!elementRef.current) return;

    // Cleanup precedente observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    // Crea nuovo ResizeObserver
    resizeObserverRef.current = new ResizeObserver((entries) => {
      // Debounce per evitare troppi ricalcoli
      setTimeout(calculateOptimalFontSize, 100);
    });

    const container = elementRef.current.closest('.btn-tutti');
    if (container) {
      resizeObserverRef.current.observe(container);
    }
  }, [calculateOptimalFontSize]);

  useEffect(() => {
    // Calcola al mount e quando cambia il testo
    setTimeout(calculateOptimalFontSize, 0);
    setupResizeObserver();

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [text, calculateOptimalFontSize, setupResizeObserver]);

  // Ricalcola su resize della finestra
  useEffect(() => {
    const handleResize = () => {
      setTimeout(calculateOptimalFontSize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [calculateOptimalFontSize]);

  return { elementRef };
};
