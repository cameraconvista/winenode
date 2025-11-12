/**
 * OFFLINE INDICATOR COMPONENT - WINENODE
 * 
 * Componente per mostrare lo stato della connessione e operazioni offline.
 * Design non invasivo che si integra perfettamente con l'UI esistente.
 */

import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
  compact?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showWhenOnline = false,
  compact = false
}) => {
  const {
    isOnline,
    isConnecting,
    lastOffline,
    pendingOperations,
    offlineDuration
  } = useNetworkStatus();
  
  // Non mostrare nulla se online e showWhenOnline è false
  if (isOnline && !showWhenOnline) {
    return null;
  }
  
  // Determina stile e messaggio basato su stato
  const getIndicatorStyle = () => {
    if (isConnecting) {
      return {
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-700',
        icon: '🔄'
      };
    } else if (!isOnline) {
      return {
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-700',
        icon: '📡'
      };
    } else {
      return {
        bgColor: 'bg-green-100',
        borderColor: 'border-green-500',
        textColor: 'text-green-700',
        icon: '✅'
      };
    }
  };
  
  const getMessage = () => {
    if (isConnecting) {
      return 'Riconnessione in corso...';
    } else if (!isOnline) {
      const hasOperations = pendingOperations.length > 0;
      const baseMessage = 'Modalità offline attiva';
      
      if (hasOperations) {
        return `${baseMessage} • ${pendingOperations.length} operazioni in coda`;
      }
      
      if (lastOffline && offlineDuration > 60000) {
        const minutes = Math.floor(offlineDuration / 60000);
        return `${baseMessage} • Offline da ${minutes} min`;
      }
      
      return baseMessage;
    } else {
      return 'Connesso';
    }
  };
  
  const getSubMessage = () => {
    if (!isOnline && lastOffline) {
      return `Ultima connessione: ${lastOffline.toLocaleTimeString()}`;
    }
    
    if (isOnline && pendingOperations.length > 0) {
      return `Sincronizzazione ${pendingOperations.length} operazioni...`;
    }
    
    return null;
  };
  
  const style = getIndicatorStyle();
  const message = getMessage();
  const subMessage = getSubMessage();
  
  if (compact) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${style.bgColor} ${style.textColor} ${className}`}>
        <span className="mr-1">{style.icon}</span>
        {!isOnline && pendingOperations.length > 0 && (
          <span className="bg-white bg-opacity-50 rounded-full px-1 text-xs mr-1">
            {pendingOperations.length}
          </span>
        )}
        <span className="truncate">{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    );
  }
  
  return (
    <div className={`${style.bgColor} border-l-4 ${style.borderColor} p-4 mb-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg" role="img" aria-label="connection status">
            {style.icon}
          </span>
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${style.textColor}`}>
            {message}
          </p>
          {subMessage && (
            <p className={`text-xs mt-1 ${style.textColor} opacity-75`}>
              {subMessage}
            </p>
          )}
          {!isOnline && pendingOperations.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium mb-1">Operazioni in coda:</div>
              <div className="space-y-1">
                {pendingOperations.slice(0, 3).map((op) => (
                  <div key={op.id} className="flex items-center text-xs opacity-75">
                    <div className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse"></div>
                    <span className="truncate">
                      {op.type.replace('_', ' ').toLowerCase()}
                      {op.retryCount > 0 && ` (tentativo ${op.retryCount + 1})`}
                    </span>
                  </div>
                ))}
                {pendingOperations.length > 3 && (
                  <div className="text-xs opacity-75">
                    +{pendingOperations.length - 3} altre operazioni
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente compatto per header/navbar
 */
export const OfflineStatusBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <OfflineIndicator 
      className={className}
      showWhenOnline={false}
      compact={true}
    />
  );
};

/**
 * Hook per ottenere solo le info di stato necessarie per UI semplici
 */
export const useOfflineStatus = () => {
  const { isOnline, pendingOperations, lastOffline } = useNetworkStatus();
  
  return {
    isOnline,
    hasQueuedOperations: pendingOperations.length > 0,
    queuedCount: pendingOperations.length,
    lastOffline,
    statusText: isOnline ? 'Online' : 'Offline'
  };
};
