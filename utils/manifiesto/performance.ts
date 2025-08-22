/**
 * Performance Monitoring and Optimization Utilities
 * Provides tools for measuring and optimizing app performance
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  /**
   * Start measuring a performance metric
   */
  startMeasure(name: string, metadata?: Record<string, any>): void {
    const startTime = performance.now();
    this.metrics.set(name, {
      name,
      startTime,
      metadata,
    });

    // Mark the start for Performance API
    if (typeof performance.mark === 'function') {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * End measuring a performance metric
   */
  endMeasure(name: string): PerformanceMetric | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
    };

    this.metrics.set(name, completedMetric);

    // Mark the end and measure for Performance API
    if (typeof performance.mark === 'function' && typeof performance.measure === 'function') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    return completedMetric;
  }

  /**
   * Get a specific metric
   */
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    if (typeof performance.clearMarks === 'function') {
      performance.clearMarks();
    }
    if (typeof performance.clearMeasures === 'function') {
      performance.clearMeasures();
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    averageDuration: number;
    slowestMetric: PerformanceMetric | null;
    fastestMetric: PerformanceMetric | null;
  } {
    const completedMetrics = Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        slowestMetric: null,
        fastestMetric: null,
      };
    }

    const durations = completedMetrics.map(m => m.duration!);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    const slowestMetric = completedMetrics.reduce((slowest, current) => 
      (current.duration! > slowest.duration!) ? current : slowest
    );
    
    const fastestMetric = completedMetrics.reduce((fastest, current) => 
      (current.duration! < fastest.duration!) ? current : fastest
    );

    return {
      totalMetrics: completedMetrics.length,
      averageDuration,
      slowestMetric,
      fastestMetric,
    };
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.handleNavigationEntry(entry as PerformanceNavigationTiming);
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.handleResourceEntry(entry as PerformanceResourceTiming);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Observe long tasks
      if ('longtask' in PerformanceObserver.supportedEntryTypes) {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.handleLongTaskEntry(entry);
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      }
    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
    }
  }

  private handleNavigationEntry(entry: PerformanceNavigationTiming): void {
    const loadTime = entry.loadEventEnd - entry.startTime;
    this.metrics.set('page-load', {
      name: 'page-load',
      startTime: entry.startTime,
      endTime: entry.loadEventEnd,
      duration: loadTime,
      metadata: {
        domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
        firstPaint: entry.responseStart - entry.startTime,
        type: 'navigation',
      },
    });
  }

  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    // Track slow resource loads
    const duration = entry.responseEnd - entry.startTime;
    if (duration > 1000) { // Resources taking more than 1 second
      this.metrics.set(`slow-resource-${Date.now()}`, {
        name: `slow-resource-${entry.name}`,
        startTime: entry.startTime,
        endTime: entry.responseEnd,
        duration,
        metadata: {
          url: entry.name,
          size: entry.transferSize,
          type: 'resource',
        },
      });
    }
  }

  private handleLongTaskEntry(entry: PerformanceEntry): void {
    // Track long tasks that block the main thread
    this.metrics.set(`long-task-${Date.now()}`, {
      name: 'long-task',
      startTime: entry.startTime,
      endTime: entry.startTime + entry.duration,
      duration: entry.duration,
      metadata: {
        type: 'longtask',
      },
    });
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring function performance
 */
export const measurePerformance = (name?: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startMeasure(metricName, {
        args: args.length,
        className: target.constructor.name,
        methodName: propertyKey,
      });

      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endMeasure(metricName);
        return result;
      } catch (error) {
        performanceMonitor.endMeasure(metricName);
        throw error;
      }
    };

    return descriptor;
  };
};

/**
 * Hook for measuring component render performance
 */
export const useMeasureRender = (componentName: string) => {
  const React = require('react');
  React.useEffect(() => {
    performanceMonitor.startMeasure(`${componentName}-render`);
    
    return () => {
      performanceMonitor.endMeasure(`${componentName}-render`);
    };
  });
};

/**
 * Get current memory usage (if available)
 */
export const getMemoryUsage = (): MemoryUsage | null => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
    };
  }
  return null;
};

/**
 * Monitor memory usage over time
 */
export const monitorMemoryUsage = (intervalMs: number = 5000): () => void => {
  const measurements: MemoryUsage[] = [];
  
  const interval = setInterval(() => {
    const usage = getMemoryUsage();
    if (usage) {
      measurements.push(usage);
      
      // Keep only last 100 measurements
      if (measurements.length > 100) {
        measurements.shift();
      }
      
      // Warn if memory usage is high
      if (usage.percentage > 80) {
        console.warn(`High memory usage detected: ${usage.percentage.toFixed(1)}%`);
      }
    }
  }, intervalMs);

  return () => {
    clearInterval(interval);
    console.log('Memory usage measurements:', measurements);
  };
};

/**
 * Optimize images for better performance
 */
export const optimizeImageLoading = () => {
  // Add intersection observer for lazy loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): T => {
  let timeout: any = null;
  
  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  }) as T;
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

/**
 * Measure and log component performance
 */
export const withPerformanceLogging = <P extends object>(
  WrappedComponent: any,
  componentName?: string
) => {
  const React = require('react');
  const name = componentName || WrappedComponent.displayName || WrappedComponent.name;
  
  return React.memo((props: P) => {
    React.useEffect(() => {
      performanceMonitor.startMeasure(`${name}-mount`);
      
      return () => {
        performanceMonitor.endMeasure(`${name}-mount`);
      };
    }, []);

    React.useEffect(() => {
      performanceMonitor.startMeasure(`${name}-render`);
      performanceMonitor.endMeasure(`${name}-render`);
    });

    return React.createElement(WrappedComponent, props);
  });
};