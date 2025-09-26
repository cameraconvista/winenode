/**
 * UTILITY PULSANTI STANDARD WINENODE
 * Funzioni per garantire consistenza nei pulsanti dell'app
 */

export interface StandardButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'neutral';
  size?: 'normal' | 'large';
  disabled?: boolean;
}

/**
 * Genera gli stili standard per i pulsanti dell'app
 * PATTERN DEFINITIVO basato su RiepilogoOrdinePage e CreaOrdinePage
 */
export function getStandardButtonStyles({ variant, size = 'normal', disabled = false }: StandardButtonProps) {
  const baseClasses = "px-6 py-3 rounded-lg font-medium transition-colors";
  
  const colors = {
    primary: {
      background: disabled ? '#9b9b9b' : '#16a34a',
      color: '#fff9dc'
    },
    secondary: {
      background: disabled ? '#f3f4f6' : 'white',
      color: disabled ? '#9ca3af' : '#541111'
    },
    danger: {
      background: disabled ? '#9b9b9b' : '#dc2626',
      color: '#fff9dc'
    },
    neutral: {
      background: disabled ? '#9b9b9b' : '#6b7280',
      color: '#fff9dc'
    }
  };

  const selectedColors = colors[variant];

  return {
    className: baseClasses,
    style: {
      background: selectedColors.background,
      color: selectedColors.color,
      opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap' as const,
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  };
}

/**
 * Layout standard per navbar con due pulsanti
 * PATTERN DEFINITIVO: un pulsante a sinistra, uno a destra con marginLeft auto
 */
export function getNavbarTwoButtonLayout() {
  return {
    containerClasses: "mobile-navbar",
    leftButtonStyle: {
      // Pulsante sinistro: dimensioni normali
    },
    rightButtonStyle: {
      // Pulsante destro: marginLeft auto per allineamento a destra
      marginLeft: 'auto'
    }
  };
}

/**
 * ESEMPI D'USO:
 * 
 * // Pulsante primario standard
 * const primaryBtn = getStandardButtonStyles({ variant: 'primary' });
 * <button className={primaryBtn.className} style={primaryBtn.style}>CONFERMA</button>
 * 
 * // Pulsante secondario disabilitato
 * const secondaryBtn = getStandardButtonStyles({ variant: 'secondary', disabled: true });
 * <button className={secondaryBtn.className} style={secondaryBtn.style}>Annulla</button>
 * 
 * // Layout navbar standard
 * const navLayout = getNavbarTwoButtonLayout();
 * <nav className={navLayout.containerClasses}>
 *   <button style={navLayout.leftButtonStyle}>Annulla</button>
 *   <button style={navLayout.rightButtonStyle}>CONFERMA</button>
 * </nav>
 */
