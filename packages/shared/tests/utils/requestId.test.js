const { expect } = require('chai');
const { generateRequestId, extractRequestId, createRequestTracker } = require('../../utils/requestId');

describe('RequestId Utility', () => {
  describe('generateRequestId', () => {
    it('should generate a string starting with REQ-', () => {
      const id = generateRequestId();
      expect(id).to.be.a('string');
      expect(id).to.match(/^REQ-\d+-[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).to.not.equal(id2);
    });
  });

  describe('extractRequestId', () => {
    it('should extract X-Request-ID from headers', () => {
      const headers = new Map([['X-Request-ID', 'REQ-12345-abc']]);
      const id = extractRequestId(headers);
      expect(id).to.equal('REQ-12345-abc');
    });

    it('should return null when no header is present', () => {
      const headers = new Map();
      const id = extractRequestId(headers);
      expect(id).to.be.null;
    });

    it('should handle null or undefined headers safely', () => {
      expect(extractRequestId(null)).to.be.null;
      expect(extractRequestId(undefined)).to.be.null;
    });
  });

  describe('createRequestTracker', () => {
    it('should initialize with correct properties', () => {
      const tracker = createRequestTracker('REQ-999');
      expect(tracker.requestId).to.equal('REQ-999');
      expect(tracker.startTime).to.be.a('number');
      expect(tracker.duration).to.be.null;
      expect(tracker.success).to.be.null;
      expect(tracker.error).to.be.null;
    });

    it('should record success and calculate duration', () => {
      const tracker = createRequestTracker('REQ-999');
      tracker.markSuccess();
      expect(tracker.success).to.be.true;
      expect(tracker.duration).to.be.a('number');
      expect(tracker.duration).to.be.at.least(0);
    });

    it('should record error and calculate duration', () => {
      const tracker = createRequestTracker('REQ-999');
      const err = new Error('Request failed');
      tracker.markError(err);
      expect(tracker.success).to.be.false;
      expect(tracker.error).to.equal(err);
      expect(tracker.duration).to.be.a('number');
    });
  });
});
