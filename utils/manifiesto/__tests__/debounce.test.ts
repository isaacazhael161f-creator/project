/**
 * Debounce Utility Tests
 * Tests for debouncing functionality used in performance optimizations
 */

import { debounce, throttle } from '../performance';

describe('Debounce and Throttle Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls when called multiple times', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledWith('third');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should execute immediately when immediate flag is true', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300, true);

      debouncedFn('immediate');
      expect(mockFn).toHaveBeenCalledWith('immediate');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Subsequent calls should be debounced
      debouncedFn('debounced');
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple arguments', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('arg1', 'arg2', 'arg3');
      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should work with different delay times', () => {
      const mockFn = jest.fn();
      const shortDebounce = debounce(mockFn, 100);
      const longDebounce = debounce(mockFn, 500);

      shortDebounce('short');
      longDebounce('long');

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('short');
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(400);
      expect(mockFn).toHaveBeenCalledWith('long');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('throttle', () => {
    it('should limit function execution frequency', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 300);

      throttledFn('first');
      expect(mockFn).toHaveBeenCalledWith('first');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Subsequent calls within the limit should be ignored
      throttledFn('second');
      throttledFn('third');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // After the limit, next call should execute
      jest.advanceTimersByTime(300);
      throttledFn('fourth');
      expect(mockFn).toHaveBeenCalledWith('fourth');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid successive calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      // Make 10 rapid calls
      for (let i = 0; i < 10; i++) {
        throttledFn(`call-${i}`);
      }

      // Only the first call should execute immediately
      expect(mockFn).toHaveBeenCalledWith('call-0');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // After the throttle period, next call should work
      jest.advanceTimersByTime(100);
      throttledFn('after-throttle');
      expect(mockFn).toHaveBeenCalledWith('after-throttle');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should work with different throttle limits', () => {
      const mockFn = jest.fn();
      const fastThrottle = throttle(mockFn, 50);
      const slowThrottle = throttle(mockFn, 200);

      fastThrottle('fast');
      slowThrottle('slow');

      expect(mockFn).toHaveBeenCalledTimes(2);

      // Fast throttle should allow next call sooner
      jest.advanceTimersByTime(50);
      fastThrottle('fast-2');
      expect(mockFn).toHaveBeenCalledTimes(3);

      // Slow throttle should still be throttled
      slowThrottle('slow-2');
      expect(mockFn).toHaveBeenCalledTimes(3);

      jest.advanceTimersByTime(150);
      slowThrottle('slow-3');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle high-frequency debounced calls efficiently', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 50);

      const startTime = Date.now();

      // Make 1000 rapid calls
      for (let i = 0; i < 1000; i++) {
        debouncedFn(`call-${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete quickly
      expect(mockFn).not.toHaveBeenCalled(); // No execution yet

      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call-999'); // Last call wins
    });

    it('should handle high-frequency throttled calls efficiently', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 50);

      const startTime = Date.now();

      // Make 1000 rapid calls
      for (let i = 0; i < 1000; i++) {
        throttledFn(`call-${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete quickly
      expect(mockFn).toHaveBeenCalledTimes(1); // Only first call executes
      expect(mockFn).toHaveBeenCalledWith('call-0');
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with repeated debounce calls', () => {
      const mockFn = jest.fn();
      
      // Create and use many debounced functions
      for (let i = 0; i < 100; i++) {
        const debouncedFn = debounce(mockFn, 10);
        debouncedFn(`test-${i}`);
      }

      jest.advanceTimersByTime(10);
      expect(mockFn).toHaveBeenCalledTimes(100);
    });

    it('should not leak memory with repeated throttle calls', () => {
      const mockFn = jest.fn();
      
      // Create and use many throttled functions
      for (let i = 0; i < 100; i++) {
        const throttledFn = throttle(mockFn, 10);
        throttledFn(`test-${i}`);
      }

      expect(mockFn).toHaveBeenCalledTimes(100); // Each throttle instance executes once
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero delay debounce', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn('test');
      jest.advanceTimersByTime(0);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should handle zero limit throttle', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 0);

      throttledFn('test');
      expect(mockFn).toHaveBeenCalledWith('test');
      
      // With zero limit, the throttle should allow immediate subsequent calls
      jest.advanceTimersByTime(1);
      throttledFn('test2');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle functions that throw errors', () => {
      const errorFn = jest.fn((arg: string) => {
        throw new Error('Test error');
      });
      const debouncedErrorFn = debounce(errorFn, 100);

      expect(() => {
        debouncedErrorFn('test');
        jest.advanceTimersByTime(100);
      }).toThrow('Test error');
    });

    it('should preserve function context', () => {
      const obj = {
        value: 'test',
        method: jest.fn(function(this: any) {
          return this.value;
        })
      };

      const debouncedMethod = debounce(obj.method.bind(obj), 100);
      debouncedMethod();
      jest.advanceTimersByTime(100);

      expect(obj.method).toHaveBeenCalled();
    });
  });
});