import { useEffect, useRef, useCallback } from 'react'

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} renderCount - Total number of renders since mount
 * @property {number} mountTime - Timestamp (ms) when the component mounted
 * @property {number|null} lastRenderDuration - Duration of the last render in ms
 * @property {Function} measureAsync - Wraps an async fn and logs its duration
 * @property {Function} mark - Records a named performance mark
 */

/**
 * Performance monitoring hook for tracking component render performance.
 *
 * Integrates with the browser's `performance` API and the shared logger.
 * In development, logs render counts and durations to the console.
 * In production, logs are suppressed unless `VITE_ENABLE_PERFORMANCE_MONITORING=true`.
 *
 * @param {string} componentName - Display name used in log entries
 * @param {Object} [options={}] - Configuration options
 * @param {boolean} [options.logRenders=false] - Whether to log every render (verbose)
 * @param {number} [options.slowRenderThreshold=16] - Renders slower than this (ms) are flagged as slow
 * @returns {PerformanceMetrics}
 *
 * @example
 * function MyComponent() {
 *   const { measureAsync, renderCount } = usePerformanceMonitor('MyComponent')
 *
 *   const loadData = async () => {
 *     return measureAsync('fetch_employees', () => fetchEmployees())
 *   }
 *
 *   return <div>Rendered {renderCount} times</div>
 * }
 */
export function usePerformanceMonitor(componentName, options = {}) {
  const {
    logRenders = false,
    slowRenderThreshold = 16, // ~1 frame at 60fps
  } = options

  const renderCountRef = useRef(0)
  const mountTimeRef = useRef(null)
  const lastRenderStartRef = useRef(null)
  const lastRenderDurationRef = useRef(null)
  const isMonitoringEnabled =
    typeof process !== 'undefined' &&
    process.env &&
    (process.env.NODE_ENV !== 'production' ||
      process.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true')

  // Track mount time on first render
  if (mountTimeRef.current === null) {
    mountTimeRef.current = performance.now()
  }

  // Track render start
  lastRenderStartRef.current = performance.now()

  // Count render and measure duration after paint
  renderCountRef.current += 1
  const currentRender = renderCountRef.current

  useEffect(() => {
    const renderDuration = performance.now() - lastRenderStartRef.current
    lastRenderDurationRef.current = renderDuration

    if (isMonitoringEnabled) {
      const isSlowRender = renderDuration > slowRenderThreshold
      const logData = {
        component: componentName,
        renderCount: currentRender,
        renderDuration: `${renderDuration.toFixed(2)}ms`,
        slow: isSlowRender,
      }

      if (isSlowRender) {
        console.warn(`[Perf] Slow render in <${componentName}>:`, logData)
      } else if (logRenders) {
        console.debug(`[Perf] <${componentName}> render #${currentRender}:`, logData)
      }
    }
  })

  // Log mount / unmount lifecycle
  useEffect(() => {
    if (isMonitoringEnabled) {
      console.debug(`[Perf] <${componentName}> mounted at ${mountTimeRef.current?.toFixed(2)}ms`)
    }
    return () => {
      if (isMonitoringEnabled) {
        const lifetime = performance.now() - (mountTimeRef.current ?? 0)
        console.debug(
          `[Perf] <${componentName}> unmounted after ${lifetime.toFixed(2)}ms ` +
          `(${renderCountRef.current} renders)`
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Wraps an async function and records its execution duration.
   * Useful for measuring API calls, data transforms, or expensive operations.
   *
   * @template T
   * @param {string} operationName - Label for this measurement
   * @param {() => Promise<T>} fn - The async function to measure
   * @returns {Promise<T>} The result of `fn`
   */
  const measureAsync = useCallback(async (operationName, fn) => {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      if (isMonitoringEnabled) {
        console.debug(
          `[Perf] <${componentName}> ${operationName}: ${duration.toFixed(2)}ms`
        )
      }
      return result
    } catch (error) {
      const duration = performance.now() - start
      if (isMonitoringEnabled) {
        console.warn(
          `[Perf] <${componentName}> ${operationName} FAILED after ${duration.toFixed(2)}ms:`,
          error.message
        )
      }
      throw error
    }
  }, [componentName, isMonitoringEnabled])

  /**
   * Records a named performance mark using the browser's Performance API.
   * Marks are visible in DevTools → Performance → Timings.
   *
   * @param {string} markName - A descriptive name for the mark
   */
  const mark = useCallback((markName) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${componentName}:${markName}`)
    }
  }, [componentName])

  return {
    renderCount: renderCountRef.current,
    mountTime: mountTimeRef.current,
    lastRenderDuration: lastRenderDurationRef.current,
    measureAsync,
    mark,
  }
}

export default usePerformanceMonitor
