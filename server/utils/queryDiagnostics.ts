/**
 * Query Performance Diagnostics
 * Modulo read-only per monitoraggio performance query critiche
 * Toggle: DIAGNOSTICS_ENABLED=true (default: false)
 */

interface QueryMetrics {
  count: number;
  totalTime: number;
  avgTime: number;
  maxTime: number;
  lastTime: number;
  slowQueries: number; // count > threshold
}

interface DiagnosticsData {
  supplierQueries: QueryMetrics;
  typeQueries: QueryMetrics;
  userIdQueries: QueryMetrics;
}

class QueryDiagnostics {
  private enabled: boolean;
  private slowThreshold: number = 120; // ms
  private windowSize: number = 100; // keep last N measurements
  private data: DiagnosticsData;

  constructor() {
    this.enabled = process.env.DIAGNOSTICS_ENABLED === 'true';
    this.data = {
      supplierQueries: this.createEmptyMetrics(),
      typeQueries: this.createEmptyMetrics(),
      userIdQueries: this.createEmptyMetrics(),
    };
  }

  private createEmptyMetrics(): QueryMetrics {
    return {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      lastTime: 0,
      slowQueries: 0,
    };
  }

  private updateMetrics(metrics: QueryMetrics, duration: number): void {
    metrics.count++;
    metrics.totalTime += duration;
    metrics.avgTime = metrics.totalTime / metrics.count;
    metrics.maxTime = Math.max(metrics.maxTime, duration);
    metrics.lastTime = duration;
    
    if (duration > this.slowThreshold) {
      metrics.slowQueries++;
    }

    // Reset stats if window size exceeded (rolling window)
    if (metrics.count > this.windowSize) {
      metrics.count = Math.floor(this.windowSize * 0.8); // Keep 80%
      metrics.totalTime = metrics.avgTime * metrics.count;
      metrics.slowQueries = Math.floor(metrics.slowQueries * 0.8);
    }
  }

  /**
   * Wrapper per query filtro supplier
   */
  async measureSupplierQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return queryFn();
    }

    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      this.updateMetrics(this.data.supplierQueries, duration);
      this.logIfSlow('supplier', duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.debug(`[DIAGNOSTICS] Supplier query failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Wrapper per query filtro type
   */
  async measureTypeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return queryFn();
    }

    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      this.updateMetrics(this.data.typeQueries, duration);
      this.logIfSlow('type', duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.debug(`[DIAGNOSTICS] Type query failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Wrapper per query filtro user_id
   */
  async measureUserIdQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return queryFn();
    }

    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      this.updateMetrics(this.data.userIdQueries, duration);
      this.logIfSlow('userId', duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.debug(`[DIAGNOSTICS] UserId query failed after ${duration}ms:`, error);
      throw error;
    }
  }

  private logIfSlow(queryType: string, duration: number): void {
    if (duration > this.slowThreshold) {
      console.debug(`[DIAGNOSTICS] SLOW ${queryType} query: ${duration}ms (threshold: ${this.slowThreshold}ms)`);
    }
  }

  /**
   * Ottieni statistiche correnti (per debug/monitoring)
   */
  getStats(): DiagnosticsData | null {
    if (!this.enabled) {
      return null;
    }

    return JSON.parse(JSON.stringify(this.data)); // Deep clone
  }

  /**
   * Log riepilogo statistiche (chiamato periodicamente)
   */
  logSummary(): void {
    if (!this.enabled || this.data.supplierQueries.count === 0) {
      return;
    }

    const stats = this.getStats()!;
    const supplierSlowPct = (stats.supplierQueries.slowQueries / stats.supplierQueries.count * 100).toFixed(1);
    const typeSlowPct = (stats.typeQueries.slowQueries / stats.typeQueries.count * 100).toFixed(1);
    const userIdSlowPct = (stats.userIdQueries.slowQueries / stats.userIdQueries.count * 100).toFixed(1);

    console.debug('[DIAGNOSTICS] Query Performance Summary:');
    console.debug(`  Supplier: ${stats.supplierQueries.count} queries, avg ${stats.supplierQueries.avgTime.toFixed(1)}ms, ${supplierSlowPct}% slow`);
    console.debug(`  Type: ${stats.typeQueries.count} queries, avg ${stats.typeQueries.avgTime.toFixed(1)}ms, ${typeSlowPct}% slow`);
    console.debug(`  UserId: ${stats.userIdQueries.count} queries, avg ${stats.userIdQueries.avgTime.toFixed(1)}ms, ${userIdSlowPct}% slow`);

    // Alert se troppi query lenti
    const totalQueries = stats.supplierQueries.count + stats.typeQueries.count + stats.userIdQueries.count;
    const totalSlow = stats.supplierQueries.slowQueries + stats.typeQueries.slowQueries + stats.userIdQueries.slowQueries;
    const overallSlowPct = totalSlow / totalQueries * 100;

    if (overallSlowPct >= 25) {
      console.debug(`[DIAGNOSTICS] ⚠️  HIGH SLOW QUERY RATE: ${overallSlowPct.toFixed(1)}% - Consider executing SH-06 (database indices)`);
    }
  }

  /**
   * Reset statistiche
   */
  reset(): void {
    if (!this.enabled) {
      return;
    }

    this.data = {
      supplierQueries: this.createEmptyMetrics(),
      typeQueries: this.createEmptyMetrics(),
      userIdQueries: this.createEmptyMetrics(),
    };
    
    console.debug('[DIAGNOSTICS] Statistics reset');
  }
}

// Singleton instance
export const queryDiagnostics = new QueryDiagnostics();

// Log summary every 5 minutes if enabled
if (process.env.DIAGNOSTICS_ENABLED === 'true') {
  setInterval(() => {
    queryDiagnostics.logSummary();
  }, 5 * 60 * 1000); // 5 minutes
}
