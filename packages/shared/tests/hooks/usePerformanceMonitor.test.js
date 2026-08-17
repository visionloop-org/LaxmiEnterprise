import { expect } from 'chai';
import { renderHook, act } from '@testing-library/react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor.js';

describe('usePerformanceMonitor Hook', () => {
  let createdMarks = [];
  let originalMark;

  beforeEach(() => {
    createdMarks = [];
    if (typeof performance !== 'undefined') {
      originalMark = performance.mark;
      performance.mark = (name) => {
        createdMarks.push(name);
        if (originalMark) {
          try { originalMark.call(performance, name); } catch (_) {}
        }
      };
    }
  });

  afterEach(() => {
    if (typeof performance !== 'undefined' && originalMark) {
      performance.mark = originalMark;
    }
  });

  it('should track render count and mount time', () => {
    const { result, rerender } = renderHook(() => usePerformanceMonitor('TestComponent'));

    expect(result.current.renderCount).to.equal(1);
    expect(result.current.mountTime).to.be.a('number');

    rerender();

    expect(result.current.renderCount).to.equal(2);
  });

  it('should measure async operations with measureAsync', async () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    const res = await result.current.measureAsync('fetchData', async () => {
      return { success: true, count: 42 };
    });

    expect(res).to.deep.equal({ success: true, count: 42 });
  });

  it('should propagate errors in measureAsync', async () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    let errorCaught = null;
    try {
      await result.current.measureAsync('failingOp', async () => {
        throw new Error('API connection failed');
      });
    } catch (err) {
      errorCaught = err;
    }

    expect(errorCaught).to.exist;
    expect(errorCaught.message).to.equal('API connection failed');
  });

  it('should record performance marks with mark()', () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    act(() => {
      result.current.mark('table_rendered');
    });

    expect(createdMarks).to.include('TestComponent:table_rendered');
  });
});
