// ============================================================================
// COMPREHENSIVE AUDIT LOGGING SYSTEM
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { performanceMonitor } from '@/lib/performance';

export interface AuditEvent {
  id?: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'create' | 'read' | 'update' | 'delete' | 'auth' | 'system' | 'security';
  success: boolean;
  errorMessage?: string;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  category?: string;
  severity?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  page: number;
  pageSize: number;
}

export interface AuditSummary {
  totalEvents: number;
  eventsByCategory: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  topUsers: Array<{ userId: string; userEmail?: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
  recentEvents: AuditEvent[];
  securityAlerts: AuditEvent[];
}

class AuditLogger {
  private batchSize = 50;
  private batchTimeout = 5000; // 5 seconds
  private eventQueue: AuditEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isEnabled = true;
  private currentUser: { id: string; email?: string } | null = null;

  constructor() {
    this.setupBatchProcessing();
    this.setupUserSession();
  }

  private setupBatchProcessing(): void {
    // Process batch when page is about to unload
    window.addEventListener('beforeunload', () => {
      this.flushBatch();
    });

    // Process batch periodically
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.processBatch();
      }
    }, this.batchTimeout);
  }

  private async setupUserSession(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.currentUser = {
          id: user.id,
          email: user.email
        };
      }
    } catch (error) {
      console.warn('Failed to get current user for audit logging:', error);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.currentUser = {
          id: session.user.id,
          email: session.user.email
        };
      } else {
        this.currentUser = null;
      }
    });
  }

  // Main logging method
  async log(
    action: string,
    resource: string,
    options: {
      resourceId?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      metadata?: Record<string, any>;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      category?: 'create' | 'read' | 'update' | 'delete' | 'auth' | 'system' | 'security';
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    if (!this.isEnabled) return;

    const event: AuditEvent = {
      userId: this.currentUser?.id,
      userEmail: this.currentUser?.email,
      action,
      resource,
      resourceId: options.resourceId,
      oldValues: options.oldValues,
      newValues: options.newValues,
      metadata: {
        ...options.metadata,
        url: window.location.href,
        referrer: document.referrer
      },
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
      timestamp: new Date(),
      severity: options.severity || 'low',
      category: options.category || this.inferCategory(action),
      success: options.success !== false,
      errorMessage: options.errorMessage
    };

    // Add to queue for batch processing
    this.eventQueue.push(event);

    // Process immediately for high severity events
    if (event.severity === 'critical' || event.severity === 'high') {
      await this.processBatch();
    } else if (this.eventQueue.length >= this.batchSize) {
      await this.processBatch();
    }

    // Check for security alerts
    this.checkSecurityAlerts(event);
  }

  // Convenience methods for common actions
  async logCreate(resource: string, resourceId: string, newValues: Record<string, any>): Promise<void> {
    await this.log('create', resource, {
      resourceId,
      newValues,
      category: 'create',
      severity: 'low'
    });
  }

  async logRead(resource: string, resourceId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('read', resource, {
      resourceId,
      metadata,
      category: 'read',
      severity: 'low'
    });
  }

  async logUpdate(
    resource: string,
    resourceId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>
  ): Promise<void> {
    await this.log('update', resource, {
      resourceId,
      oldValues,
      newValues,
      category: 'update',
      severity: 'medium'
    });
  }

  async logDelete(resource: string, resourceId: string, oldValues: Record<string, any>): Promise<void> {
    await this.log('delete', resource, {
      resourceId,
      oldValues,
      category: 'delete',
      severity: 'high'
    });
  }

  async logAuth(action: string, success: boolean, metadata?: Record<string, any>, errorMessage?: string): Promise<void> {
    await this.log(action, 'auth', {
      category: 'auth',
      severity: success ? 'medium' : 'high',
      success,
      metadata,
      errorMessage
    });
  }

  async logSecurity(action: string, metadata?: Record<string, any>, errorMessage?: string): Promise<void> {
    await this.log(action, 'security', {
      category: 'security',
      severity: 'critical',
      success: !errorMessage,
      metadata,
      errorMessage
    });
  }

  async logSystem(action: string, success: boolean, metadata?: Record<string, any>, errorMessage?: string): Promise<void> {
    await this.log(action, 'system', {
      category: 'system',
      severity: success ? 'low' : 'medium',
      success,
      metadata,
      errorMessage
    });
  }

  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch = [...this.eventQueue];
    this.eventQueue = [];

    const endMeasurement = performanceMonitor.recordUserAction('process_audit_batch', 'AuditLogger');

    try {
      // Insert batch into database
      const { error } = await supabase
        .from('activity_logs')
        .insert(batch.map(event => ({
          user_id: event.userId,
          action: event.action,
          resource_type: event.resource,
          resource_id: event.resourceId,
          details: {
            oldValues: event.oldValues,
            newValues: event.newValues,
            metadata: event.metadata,
            severity: event.severity,
            category: event.category,
            success: event.success,
            errorMessage: event.errorMessage
          },
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          session_id: event.sessionId
        })));

      if (error) {
        console.error('Failed to insert audit logs:', error);
        // Re-queue events for retry
        this.eventQueue.unshift(...batch);
      }
    } catch (error) {
      console.error('Error processing audit batch:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...batch);
    } finally {
      endMeasurement();
    }
  }

  private flushBatch(): void {
    if (this.eventQueue.length > 0) {
      // Use sendBeacon for reliable sending during page unload
      if (navigator.sendBeacon) {
        const data = JSON.stringify(this.eventQueue);
        navigator.sendBeacon('/api/audit-logs', data);
      } else {
        // Fallback to synchronous request
        this.processBatch();
      }
    }
  }

  private inferCategory(action: string): AuditEvent['category'] {
    const actionMap: Record<string, AuditEvent['category']> = {
      create: 'create',
      insert: 'create',
      add: 'create',
      read: 'read',
      view: 'read',
      get: 'read',
      fetch: 'read',
      update: 'update',
      edit: 'update',
      modify: 'update',
      delete: 'delete',
      remove: 'delete',
      destroy: 'delete',
      login: 'auth',
      logout: 'auth',
      register: 'auth',
      authenticate: 'auth'
    };

    return actionMap[action.toLowerCase()] || 'system';
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      // In a real implementation, you might call an IP service
      // For now, return undefined as IP should be captured server-side
      return undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  private checkSecurityAlerts(event: AuditEvent): void {
    // Check for suspicious patterns
    const alerts: string[] = [];

    // Multiple failed login attempts
    if (event.category === 'auth' && !event.success && event.action === 'login') {
      alerts.push('Failed login attempt detected');
    }

    // Unauthorized access attempts
    if (event.category === 'security') {
      alerts.push('Security event detected');
    }

    // Bulk data access
    if (event.action === 'bulk_export' || event.action === 'bulk_delete') {
      alerts.push('Bulk operation detected');
    }

    // Off-hours activity
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      alerts.push('Off-hours activity detected');
    }

    if (alerts.length > 0) {
      console.warn('Security Alert:', alerts.join(', '), event);
      // In a real implementation, you might send alerts to administrators
    }
  }

  // Query audit logs
  async queryLogs(query: AuditQuery): Promise<{ events: AuditEvent[]; totalCount: number }> {
    let supabaseQuery = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (query.userId) {
      supabaseQuery = supabaseQuery.eq('user_id', query.userId);
    }

    if (query.action) {
      supabaseQuery = supabaseQuery.eq('action', query.action);
    }

    if (query.resource) {
      supabaseQuery = supabaseQuery.eq('resource_type', query.resource);
    }

    if (query.dateRange) {
      supabaseQuery = supabaseQuery
        .gte('created_at', query.dateRange.start.toISOString())
        .lte('created_at', query.dateRange.end.toISOString());
    }

    // Apply pagination
    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;
    supabaseQuery = supabaseQuery
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to query audit logs: ${error.message}`);
    }

    const events: AuditEvent[] = (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.details?.metadata?.userEmail,
      action: row.action,
      resource: row.resource_type,
      resourceId: row.resource_id,
      oldValues: row.details?.oldValues,
      newValues: row.details?.newValues,
      metadata: row.details?.metadata,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      sessionId: row.session_id,
      timestamp: new Date(row.created_at),
      severity: row.details?.severity || 'low',
      category: row.details?.category || 'system',
      success: row.details?.success !== false,
      errorMessage: row.details?.errorMessage
    }));

    return {
      events,
      totalCount: count || 0
    };
  }

  // Generate audit summary
  async generateSummary(dateRange?: { start: Date; end: Date }): Promise<AuditSummary> {
    let query = supabase
      .from('activity_logs')
      .select('*');

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to generate audit summary: ${error.message}`);
    }

    const events = data || [];

    // Calculate summary statistics
    const eventsByCategory: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const userCounts: Record<string, { email?: string; count: number }> = {};
    const actionCounts: Record<string, number> = {};
    const securityAlerts: AuditEvent[] = [];

    events.forEach(row => {
      const category = row.details?.category || 'system';
      const severity = row.details?.severity || 'low';

      eventsByCategory[category] = (eventsByCategory[category] || 0) + 1;
      eventsBySeverity[severity] = (eventsBySeverity[severity] || 0) + 1;

      if (row.user_id) {
        if (!userCounts[row.user_id]) {
          userCounts[row.user_id] = { count: 0 };
        }
        userCounts[row.user_id].count++;
        userCounts[row.user_id].email = row.details?.metadata?.userEmail;
      }

      actionCounts[row.action] = (actionCounts[row.action] || 0) + 1;

      // Collect security alerts
      if (category === 'security' || severity === 'critical') {
        securityAlerts.push({
          id: row.id,
          userId: row.user_id,
          action: row.action,
          resource: row.resource_type,
          timestamp: new Date(row.created_at),
          severity: severity as any,
          category: category as any,
          success: row.details?.success !== false,
          errorMessage: row.details?.errorMessage
        });
      }
    });

    const topUsers = Object.entries(userCounts)
      .map(([userId, data]) => ({
        userId,
        userEmail: data.email,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentEvents = events
      .slice(0, 20)
      .map(row => ({
        id: row.id,
        userId: row.user_id,
        action: row.action,
        resource: row.resource_type,
        timestamp: new Date(row.created_at),
        severity: row.details?.severity || 'low',
        category: row.details?.category || 'system',
        success: row.details?.success !== false
      } as AuditEvent));

    return {
      totalEvents: events.length,
      eventsByCategory,
      eventsBySeverity,
      topUsers,
      topActions,
      recentEvents,
      securityAlerts: securityAlerts.slice(0, 10)
    };
  }

  // Enable/disable audit logging
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.flushBatch();
    }
  }

  // Get current status
  getStatus(): {
    enabled: boolean;
    queueSize: number;
    currentUser: { id: string; email?: string } | null;
  } {
    return {
      enabled: this.isEnabled,
      queueSize: this.eventQueue.length,
      currentUser: this.currentUser
    };
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// React hook for audit logging
export function useAuditLogger() {
  return {
    log: auditLogger.log.bind(auditLogger),
    logCreate: auditLogger.logCreate.bind(auditLogger),
    logRead: auditLogger.logRead.bind(auditLogger),
    logUpdate: auditLogger.logUpdate.bind(auditLogger),
    logDelete: auditLogger.logDelete.bind(auditLogger),
    logAuth: auditLogger.logAuth.bind(auditLogger),
    logSecurity: auditLogger.logSecurity.bind(auditLogger),
    logSystem: auditLogger.logSystem.bind(auditLogger),
    queryLogs: auditLogger.queryLogs.bind(auditLogger),
    generateSummary: auditLogger.generateSummary.bind(auditLogger)
  };
}

export default auditLogger;