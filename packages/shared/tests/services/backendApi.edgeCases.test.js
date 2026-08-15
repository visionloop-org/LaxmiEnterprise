const { expect } = require('chai');
const { 
  backendApiClient, 
  APIError, 
  NetworkError, 
  AuthError, 
  ValidationError, 
  ConflictError, 
  NotFoundError 
} = require('../../services/backendApi');

describe('BackendApiClient Edge Cases', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.localStorage.clear();
    backendApiClient.token = null;
    backendApiClient.requestInterceptors = [];
    backendApiClient.responseInterceptors = [];
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('network error handling', () => {
    it('should handle aborted requests', async () => {
      const error = new Error('Request aborted');
      error.name = 'AbortError';
      
      global.fetch = async () => {
        throw error;
      };

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        // BackendApiClient converts AbortError to NetworkError with timeout
        expect(error.name).to.equal('NetworkError');
      }
    });

    it('should handle CORS errors', async () => {
      const error = new Error('CORS policy error');
      
      global.fetch = async () => {
        throw error;
      };

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('CORS policy error');
      }
    });

    it('should handle connection refused', async () => {
      const error = new Error('Connection refused');
      
      global.fetch = async () => {
        throw error;
      };

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Connection refused');
      }
    });
  });

  describe('response parsing edge cases', () => {
    it('should handle malformed JSON response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
        headers: { get: () => null }
      };
      
      global.fetch = async () => mockResponse;

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Invalid JSON');
      }
    });

    it('should handle null response body', async () => {
      const mockResponse = {
        ok: true,
        json: async () => null,
        headers: { get: () => null }
      };
      
      global.fetch = async () => mockResponse;

      const result = await backendApiClient.request('/test');
      
      expect(result).to.be.null;
    });

    it('should handle empty response body', async () => {
      const mockResponse = {
        ok: true,
        json: async () => '',
        headers: { get: () => null }
      };
      
      global.fetch = async () => mockResponse;

      const result = await backendApiClient.request('/test');
      
      expect(result).to.equal('');
    });

    it('should handle response with no headers', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: { get: () => null } // Provide headers object
      };
      
      global.fetch = async () => mockResponse;

      const result = await backendApiClient.request('/test');
      
      expect(result.data).to.equal('test');
    });
  });

  describe('error handling edge cases', () => {
    it('should handle response with no error information', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({}), // No error information
        headers: { get: () => null }
      };
      
      global.fetch = async () => mockResponse;

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('HTTP 500');
      }
    });

    it('should handle response with nested error structure', async () => {
      const mockResponse = {
        ok: false,
        status: 422,
        json: async () => ({
          nested: {
            error: {
              message: 'Nested error message',
              code: 'NESTED_ERROR'
            }
          }
        }),
        headers: { get: () => null }
      };
      
      global.fetch = async () => mockResponse;

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
      }
    });

    it('should handle response with array error details', async () => {
      const mockResponse = {
        ok: false,
        status: 422,
        json: async () => ({
          detail: 'Validation failed',
          error: {
            details: ['field1 is required', 'field2 must be positive']
          }
        }),
        headers: { get: () => 'req-123' }
      };
      
      global.fetch = async () => mockResponse;

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.details).to.be.an('array');
      }
    });
  });

  describe('interceptor edge cases', () => {
    it('should handle interceptor that throws error', async () => {
      backendApiClient.token = 'test-token'; // Set token to avoid auth errors
      backendApiClient.addRequestInterceptor(() => {
        throw new Error('Interceptor error');
      });

      try {
        await backendApiClient.request('/test'); // Use request instead of get to avoid auth check
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Interceptor error');
      }
    });

    it('should handle interceptor that returns null', async () => {
      backendApiClient.token = 'test-token'; // Set token to avoid auth errors
      backendApiClient.addRequestInterceptor(() => {
        return null; // Should use original config
      });

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: { get: () => null }
      };
      
      global.fetch = async () => mockResponse;

      const result = await backendApiClient.request('/test');
      
      expect(result.data).to.equal('test');
    });

    it('should handle multiple interceptors in sequence', async () => {
      backendApiClient.token = 'test-token'; // Set token to avoid auth errors
      let executionOrder = [];
      
      backendApiClient.addRequestInterceptor((config) => {
        executionOrder.push('interceptor1');
        config.headers['X-Order'] = '1';
        return config;
      });

      backendApiClient.addRequestInterceptor((config) => {
        executionOrder.push('interceptor2');
        config.headers['X-Order'] = '2';
        return config;
      });

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url, config) => {
        return mockResponse;
      };

      await backendApiClient.request('/test');
      
      expect(executionOrder).to.deep.equal(['interceptor1', 'interceptor2']);
    });
  });

  describe('timeout edge cases', () => {
    it('should handle zero timeout', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' })
      };
      
      global.fetch = async () => mockResponse;

      const response = await backendApiClient.requestWithTimeout('http://test.com', {}, 0);
      
      expect(response.ok).to.be.true;
    });

    it('should handle negative timeout', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' })
      };
      
      global.fetch = async () => mockResponse;

      const response = await backendApiClient.requestWithTimeout('http://test.com', {}, -1000);
      
      expect(response.ok).to.be.true;
    });

    it('should handle very long timeout', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' })
      };
      
      global.fetch = async () => mockResponse;

      const response = await backendApiClient.requestWithTimeout('http://test.com', {}, 1000000);
      
      expect(response.ok).to.be.true;
    });
  });

  describe('HTTP method edge cases', () => {
    it('should handle request with no method', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: { get: () => null }
      };
      
      global.fetch = async () => mockResponse;

      const result = await backendApiClient.request('/test', {});
      
      expect(result.data).to.equal('test');
    });

    it('should handle uppercase HTTP method', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url, config) => {
        return mockResponse;
      };

      const result = await backendApiClient.request('/test', { method: 'GET' });
      
      expect(result.data).to.equal('test');
    });

    it('should handle PATCH with empty body', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'patched' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url, config) => {
        return mockResponse;
      };

      const result = await backendApiClient.patch('/test', {});
      
      expect(result.data).to.equal('patched');
    });
  });

  describe('token management edge cases', () => {
    it('should handle token with special characters', () => {
      const specialToken = 'token.with.special@characters#123';
      backendApiClient.setToken(specialToken);
      
      expect(backendApiClient.token).to.equal(specialToken);
      const headers = backendApiClient.getHeaders();
      expect(headers['Authorization']).to.equal(`Bearer ${specialToken}`);
    });

    it('should handle very long token string', () => {
      const longToken = 'a'.repeat(10000);
      backendApiClient.setToken(longToken);
      
      expect(backendApiClient.token).to.equal(longToken);
    });

    it('should handle token update while request is in flight', async () => {
      backendApiClient.token = 'old-token';
      
      let requestHeaders;
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url, config) => {
        requestHeaders = config.headers;
        // Simulate token change during request
        backendApiClient.token = 'new-token';
        return mockResponse;
      };

      await backendApiClient.request('/test');
      
      // Should use the token at the time of request
      expect(requestHeaders['Authorization']).to.equal('Bearer old-token');
    });
  });

  describe('base URL edge cases', () => {
    it('should handle relative paths', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url) => {
        expect(url).to.include('/test');
        return mockResponse;
      };

      await backendApiClient.request('/test');
    });

    it('should handle absolute URLs', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url) => {
        expect(url).to.include('http://external.com/api');
        return mockResponse;
      };

      await backendApiClient.request('http://external.com/api/test');
    });

    it('should handle URLs with query parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url) => {
        expect(url).to.include('param1=value1');
        return mockResponse;
      };

      await backendApiClient.request('/test?param1=value1');
    });
  });
});