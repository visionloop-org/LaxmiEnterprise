/**
 * Performance Monitor for Laxmi Enterprise
 * Tracks Web Vitals and custom performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.isBrowser = typeof window !== 'undefined';
  }

  initialize() {
    if (!this.isBrowser) {
      return;
    }

    // Track Web Vitals if available
    if ('PerformanceObserver' in window) {
      this.trackWebVitals();
    }

    // Track custom metrics
    this.trackCustomMetrics();
  }

  trackWebVitals() {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1];
        this.recordMetric('LCP', lcp.startTime, 'ms');
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP tracking not supported:', e);
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fid = entries[0];
        this.recordMetric('FID', fid.processingStart - fid.startTime, 'ms');
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID tracking not supported:', e);
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('CLS', clsValue, 'score');
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS tracking not supported:', e);
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries[0];
        this.recordMetric('FCP', fcp.startTime, 'ms');
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      this.observers.push(fcpObserver);
    } catch (e) {
      console.warn('FCP tracking not supported:', e);
    }
  }

  trackCustomMetrics() {
    // Track Time to First Byte (TTFB)
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      this.recordMetric('TTFB', ttfb, 'ms');
    }

    // Track DOM Content Loaded
    if (performance.timing) {
      const domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
      this.recordMetric('DOMContentLoad', domContentLoaded, 'ms');
    }

    // Track Window Load
    if (performance.timing) {
      const windowLoad = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.recordMetric('WindowLoad', windowLoad, 'ms');
    }
  }

  recordMetric(name, value, unit = 'ms') {
    const metric = {
      name,
      value,
      unit,
      timestamp: Date.now()
    };
    this.metrics.set(name, metric);
    
    // Log if value exceeds thresholds
    this.checkThresholds(name, value, unit);
  }

  checkThresholds(name, value, unit) {
    const thresholds = {
      'LCP': { warning: 2500, critical: 4000 },
      'FID': { warning: 100, critical: 300 },
      'CLS': { warning: 0.1, critical: 0.25 },
      'FCP': { warning: 1800, critical: 3000 },
      'TTFB': { warning: 600, critical: 1000 }
    };

    const threshold = thresholds[name];
    if (threshold && unit === 'ms') {
      if (value > threshold.critical) {
        console.warn(`CRITICAL: ${name} = ${value}${unit} (threshold: ${threshold.critical}${unit})`);
      } else if (value > threshold.warning) {
        console.warn(`WARNING: ${name} = ${value}${unit} (threshold: ${threshold.warning}${unit})`);
      }
    }
  }

  getMetric(name) {
    return this.metrics.get(name);
  }

  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Measure async function execution time
  async measureAsync(name, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration, 'ms');
      throw error;
    }
  }

  // Measure sync function execution time
  measure(name, fn) {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration, 'ms');
      throw error;
    }
  }

  // Create performance mark
  mark(name) {
    if (this.isBrowser && performance.mark) {
      performance.mark(name);
    }
  }

  // Measure time between marks
  measureMark(name, startMark, endMark) {
    if (this.isBrowser && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        if (measure) {
          this.recordMetric(name, measure.duration, 'ms');
        }
      } catch (e) {
        console.warn('Mark measurement failed:', e);
      }
    }
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Get performance summary
  getSummary() {
    const metrics = this.getAllMetrics();
    return {
      webVitals: {
        LCP: metrics.LCP?.value,
        FID: metrics.FID?.value,
        CLS: metrics.CLS?.value,
        FCP: metrics.FCP?.value
      },
      loadTimes: {
        TTFB: metrics.TTFB?.value,
        DOMContentLoad: metrics.DOMContentLoad?.value,
        WindowLoad: metrics.WindowLoad?.value
      },
      customMetrics: Object.entries(metrics)
        .filter(([name]) => !['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'DOMContentLoad', 'WindowLoad'].includes(name))
        .reduce((acc, [name, metric]) => {
          acc[name] = metric.value;
          return acc;
        }, {})
    };
  }
}

// Singleton instance
let performanceMonitorInstance = null;

function getPerformanceMonitor() {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
}

const performanceMonitor = getPerformanceMonitor();

export { PerformanceMonitor, getPerformanceMonitor, performanceMonitor };
export default getPerformanceMonitor;