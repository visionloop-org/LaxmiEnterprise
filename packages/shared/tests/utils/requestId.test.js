import assert from 'assert';
import { generateRequestId, extractRequestId, createRequestTracker } from '../../utils/requestId.js';

describe('RequestId Utility', () => {
  describe('generateRequestId', () => {
    it('should generate a string starting with REQ-', () => {
      const id = generateRequestId();
      assert.strictEqual(typeof id, 'string');
      assert.match(id, /^REQ-\d+-[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      assert.notStrictEqual(id1, id2);
    });
  });

  describe('extractRequestId', () => {
    it('should extract X-Request-ID from headers', () => {
      const headers = new Map([['X-Request-ID', 'REQ-12345-abc']]);
      const id = extractRequestId(headers);
      assert.strictEqual(id, 'REQ-12345-abc');
    });

    it('should return null when no header is present', () => {
      const headers = new Map();
      const id = extractRequestId(headers);
      assert.strictEqual(id, null);
    });

    it('should handle null or undefined headers safely', () => {
      assert.strictEqual(extractRequestId(null), null);
      assert.strictEqual(extractRequestId(undefined), null);
    });
  });

  describe('createRequestTracker', () => {
    it('should initialize with correct properties', () => {
      const tracker = createRequestTracker('REQ-999');
      assert.strictEqual(tracker.requestId, 'REQ-999');
      assert.strictEqual(typeof tracker.startTime, 'number');
      assert.strictEqual(tracker.duration, null);
      assert.strictEqual(tracker.success, null);
      assert.strictEqual(tracker.error, null);
    });

    it('should record success and calculate duration', () => {
      const tracker = createRequestTracker('REQ-999');
      tracker.markSuccess();
      assert.strictEqual(tracker.success, true);
      assert.strictEqual(typeof tracker.duration, 'number');
      assert.ok(tracker.duration >= 0);
    });

    it('should record error and calculate duration', () => {
      const tracker = createRequestTracker('REQ-999');
      const err = new Error('Request failed');
      tracker.markError(err);
      assert.strictEqual(tracker.success, false);
      assert.strictEqual(tracker.error, err);
      assert.strictEqual(typeof tracker.duration, 'number');
    });
  });
});
