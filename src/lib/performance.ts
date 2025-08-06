// ============================================================================
// PERFORMANCE MONITORING & ANALYTICS
// ============================================================================

import { toast } from 'sonner';
import config from '@/config/app';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface UserAction {
  action: string;
  component: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private userActions: UserAction[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = config.features.analytics;

  constructor() {
    if (this.isEnabled && typeof window !== 'undefined') {
      this.setupObservers();
      this.trackPageLoad();
    }
  }

  private setupObservers(): void {
    // Track navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
              this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
              this.recordMetric('first_paint', navEntry.loadEventStart - navEntry.fetchStart);
            }
          });
        });
        
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }

      // Track resource loading
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              if (resourceEntry.duration > 1000) { // Only track slow resources
                this.recordMetric('slow_resource_load', resourceEntry.duration, {
                  resource: resourceEntry.name,
                  size: resourceEntry.transferSize
                });
              }
            }
          });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }

      // Track long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric('long_task', entry.duration, {
              startTime: entry.startTime
            });
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }
  }

  private trackPageLoad(): void {
    // Track initial page load
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.recordMetric('initial_page_load', loadTime);
      
      // Track memory usage if available
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used_mb', memory.usedJSHeapSize / (1024 * 1024));
        this.recordMetric('memory_total_mb', memory.totalJSHeapSize / (1024 * 1024));
      }
    });
  }

  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log performance issues
    this.checkPerformanceThresholds(metric);
  }

  recordUserAction(action: string, component: string, metadata?: Record<string, any>): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      
      const userAction: UserAction = {
        action,
        component,
        timestamp: Date.now(),
        duration,
        metadata
      };

      this.userActions.push(userAction);
      
      // Keep only last 500 user actions
      if (this.userActions.length > 500) {
        this.userActions = this.userActions.slice(-500);
      }

      // Track slow user interactions
      if (duration > 100) {
        this.recordMetric('slow_user_action', duration, {
          action,
          component,
          ...metadata
        });
      }
    };
  }

  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds = {
      page_load_time: 3000,
      dom_content_loaded: 1500,
      slow_resource_load: 2000,
      long_task: 50,
      slow_user_action: 200,
      memory_used_mb: 100
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    
    if (threshold && metric.value > threshold) {
      console.warn(`Performance issue detected: ${metric.name} = ${metric.value}ms (threshold: ${threshold}ms)`);
      
      if (config.app.debugMode) {
        toast.warning(`Performance issue: ${metric.name} took ${Math.round(metric.value)}ms`);
      }
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  getUserActions(component?: string): UserAction[] {
    if (component) {
      return this.userActions.filter(action => action.component === component);
    }
    return [...this.userActions];
  }

  getPerformanceSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    // Group metrics by name and calculate statistics
    const metricGroups = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.name]) {
        groups[metric.name] = [];
      }
      groups[metric.name].push(metric.value);
      return groups;
    }, {} as Record<string, number[]>);

    Object.entries(metricGroups).forEach(([name, values]) => {
      summary[name] = {
        count: values.length,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        recent: values.slice(-10) // Last 10 values
      };
    });

    // Add user action statistics
    summary.userActions = {
      totalActions: this.userActions.length,
      averageActionTime: this.userActions.length > 0 
        ? this.userActions.reduce((sum, action) => sum + (action.duration || 0), 0) / this.userActions.length
        : 0,
      slowActions: this.userActions.filter(action => (action.duration || 0) > 200).length
    };

    return summary;
  }

  // Measure function execution time
  measure<T>(name: string, fn: () => T, component: string = 'unknown'): T {
    const endMeasurement = this.recordUserAction(name, component);
    
    try {
      const result = fn();
      endMeasurement();
      return result;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }

  // Measure async function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>, component: string = 'unknown'): Promise<T> {
    const endMeasurement = this.recordUserAction(name, component);
    
    try {
      const result = await fn();
      endMeasurement();
      return result;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }

  // Export performance data for analysis
  exportData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      userActions: this.userActions,
      summary: this.getPerformanceSummary(),
      config: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    return JSON.stringify(data, null, 2);
  }

  // Clear all data
  clear(): void {
    this.metrics = [];
    this.userActions = [];
  }

  // Cleanup observers
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  performanceMonitor.destroy();
});

// React hook for performance monitoring
export function usePerformanceMonitor(component: string) {
  const measureAction = (actionName: string, metadata?: Record<string, any>) => {
    return performanceMonitor.recordUserAction(actionName, component, metadata);
  };

  const measureFunction = <T>(name: string, fn: () => T): T => {
    return performanceMonitor.measure(name, fn, component);
  };

  const measureAsyncFunction = <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureAsync(name, fn, component);
  };

  return {
    measureAction,
    measureFunction,
    measureAsyncFunction,
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor)
  };
}

export default performanceMonitor;