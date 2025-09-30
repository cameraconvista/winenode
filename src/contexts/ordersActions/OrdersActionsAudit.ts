import { useCallback, useRef } from 'react';
import { isFeatureEnabled } from '../../config/featureFlags';
import { AuditEntry } from './types';

export function useOrdersActionsAudit() {
  const throttleRef = useRef<Map<string, number>>(new Map());

  // Audit trail function with throttling
  const logAuditEvent = useCallback((action: string, ordineId: string, details: any) => {
    if (!isFeatureEnabled('AUDIT_LOGS')) return;

    const key = `${action}-${ordineId}`;
    const now = Date.now();
    const lastLog = throttleRef.current.get(key);

    // Throttle: max 1 log per second per action-ordine combination
    if (lastLog && now - lastLog < 1000) {
      return;
    }

    throttleRef.current.set(key, now);

    const auditEntry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      ordineId,
      details,
      user: 'current_user' // TODO: get from auth context
    };

    console.log('📋 AUDIT:', auditEntry);
    // TODO: Save to audit table in database
  }, []);

  return {
    logAuditEvent
  };
}
