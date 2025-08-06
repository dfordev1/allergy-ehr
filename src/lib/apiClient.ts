// ============================================================================
// ENHANCED API CLIENT WITH RETRY LOGIC AND ERROR RECOVERY
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface ApiClientConfig {
  retry: RetryConfig;
  timeout: number;
  enableOfflineQueue: boolean;
}

const DEFAULT_CONFIG: ApiClientConfig = {
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  },
  timeout: 30000,
  enableOfflineQueue: false
};

class EnhancedApiClient {
  private config: ApiClientConfig;
  private offlineQueue: Array<() => Promise<any>> = [];
  private isOnline: boolean = navigator.onLine;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast.warning('You are offline. Changes will be saved when connection is restored.');
    });
  }

  private async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    toast.success('Connection restored. Syncing offline changes...');
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const operation of queue) {
      try {
        await operation();
      } catch (error) {
        console.error('Failed to sync offline operation:', error);
        // Re-queue failed operations
        this.offlineQueue.push(operation);
      }
    }

    if (this.offlineQueue.length === 0) {
      toast.success('All offline changes synced successfully!');
    }
  }

  private calculateDelay(attempt: number): number {
    const delay = this.config.retry.baseDelay * Math.pow(this.config.retry.backoffFactor, attempt);
    return Math.min(delay, this.config.retry.maxDelay);
  }

  private isRetryableError(error: any): boolean {
    // Network errors
    if (!navigator.onLine) return true;
    
    // HTTP status codes that should be retried
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    if (error.status && retryableStatuses.includes(error.status)) return true;
    
    // Supabase specific errors
    if (error.code === 'PGRST301') return true; // Connection timeout
    if (error.message?.includes('network')) return true;
    if (error.message?.includes('timeout')) return true;
    
    return false;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'API operation'
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.retry.maxRetries; attempt++) {
      try {
        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), this.config.timeout)
        );

        const result = await Promise.race([operation(), timeoutPromise]);
        
        // Success - clear any previous error notifications
        return result as T;
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on the last attempt
        if (attempt === this.config.retry.maxRetries) break;
        
        // Only retry if it's a retryable error
        if (!this.isRetryableError(error)) break;
        
        const delay = this.calculateDelay(attempt);
        console.warn(`${context} failed (attempt ${attempt + 1}/${this.config.retry.maxRetries + 1}). Retrying in ${delay}ms...`, error);
        
        // Show retry notification for user awareness
        if (attempt === 0) {
          toast.loading(`${context} failed. Retrying...`, { id: context });
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    toast.dismiss(context);
    
    // If offline and queue is enabled, add to offline queue
    if (!this.isOnline && this.config.enableOfflineQueue) {
      this.offlineQueue.push(() => operation());
      toast.info('Operation queued for when connection is restored');
      throw new Error('Operation queued for offline sync');
    }

    throw lastError;
  }

  // Enhanced Supabase query wrapper
  async query<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    context: string = 'Database query'
  ): Promise<{ data: T | null; error: any }> {
    return this.executeWithRetry(async () => {
      const result = await queryFn();
      
      if (result.error) {
        // Enhance error with context
        result.error.context = context;
        throw result.error;
      }
      
      return result;
    }, context);
  }

  // Batch operations with transaction-like behavior
  async batch<T>(
    operations: Array<() => Promise<T>>,
    context: string = 'Batch operation'
  ): Promise<T[]> {
    const results: T[] = [];
    const completedOps: number[] = [];

    try {
      for (let i = 0; i < operations.length; i++) {
        const result = await this.executeWithRetry(operations[i], `${context} (${i + 1}/${operations.length})`);
        results.push(result);
        completedOps.push(i);
      }
      return results;
    } catch (error) {
      // Attempt to rollback completed operations if possible
      console.error(`Batch operation failed at step ${completedOps.length + 1}. Completed steps:`, completedOps);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('patients').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // Get connection status
  getConnectionStatus(): { online: boolean; queueSize: number } {
    return {
      online: this.isOnline,
      queueSize: this.offlineQueue.length
    };
  }
}

// Export singleton instance
export const apiClient = new EnhancedApiClient({
  enableOfflineQueue: true,
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffFactor: 2
  }
});

// Export for testing with different configs
export { EnhancedApiClient };