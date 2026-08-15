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

describe('BackendApiClient', () => {
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

  describe('Error Classes', () => {
    it('should create APIError with correct properties', () => {
      const error = new APIError('Test error', 500, 'TEST_CODE', { detail: 'Test details' }, 'req-123');
      
      expect(error.name).to.equal('APIError');
      expect(error.message).to.equal('Test error');
      expect(error.status).to.equal(500);
      expect(error.code).to.equal('TEST_CODE');
      expect(error.details).to.deep.equal({ detail: 'Test details' });
      expect(error.requestId).to.equal('req-123');
    });

    it('should create NetworkError with correct properties', () => {
      const error = new NetworkError('Network error', 503, 'req-456');
      
      expect(error.name).to.equal('NetworkError');
      expect(error.message).to.equal('Network error');
      expect(error.status).to.equal(503);
      expect(error.code).to.equal('NETWORK_ERROR');
      expect(error.requestId).to.equal('req-456');
    });

    it('should create AuthError with correct properties', () => {
      const error = new AuthError('Unauthorized', 'req-789');
      
      expect(error.name).to.equal('AuthError');
      expect(error.message).to.equal('Unauthorized');
      expect(error.status).to.equal(401);
      expect(error.code).to.equal('UNAUTHORIZED');
      expect(error.requestId).to.equal('req-789');
    });

    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Validation failed', { field: 'error' }, 'req-abc');
      
      expect(error.name).to.equal('ValidationError');
      expect(error.message).to.equal('Validation failed');
      expect(error.status).to.equal(422);
      expect(error.code).to.equal('VALIDATION_ERROR');
      expect(error.details).to.deep.equal({ field: 'error' });
      expect(error.requestId).to.equal('req-abc');
    });

    it('should create ConflictError with correct properties', () => {
      const error = new ConflictError('Conflict', { reason: 'duplicate' }, 'req-def');
      
      expect(error.name).to.equal('ConflictError');
      expect(error.message).to.equal('Conflict');
      expect(error.status).to.equal(409);
      expect(error.code).to.equal('CONFLICT');
      expect(error.details).to.deep.equal({ reason: 'duplicate' });
      expect(error.requestId).to.equal('req-def');
    });

    it('should create NotFoundError with correct properties', () => {
      const error = new NotFoundError('Not found', 'req-ghi');
      
      expect(error.name).to.equal('NotFoundError');
      expect(error.message).to.equal('Not found');
      expect(error.status).to.equal(404);
      expect(error.code).to.equal('NOT_FOUND');
      expect(error.requestId).to.equal('req-ghi');
    });
  });

  describe('setToken', () => {
    it('should set token and store in localStorage', () => {
      backendApiClient.setToken('test-token');
      
      expect(backendApiClient.token).to.equal('test-token');
      expect(localStorage.getItem('auth_token')).to.equal('test-token');
    });

    it('should remove token from localStorage when set to null', () => {
      localStorage.setItem('auth_token', 'old-token');
      backendApiClient.setToken(null);
      
      expect(backendApiClient.token).to.be.null;
      expect(localStorage.getItem('auth_token')).to.be.null;
    });
  });

  describe('Interceptors', () => {
    it('should add and execute request interceptors', async () => {
      backendApiClient.addRequestInterceptor((config) => {
        config.headers['X-Custom'] = 'custom-value';
        return config;
      });

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: {
          get: () => null
        }
      };
      
      global.fetch = async (url, config) => {
        expect(config.headers['X-Custom']).to.equal('custom-value');
        return mockResponse;
      };

      await backendApiClient.get('/test');
    });

    it('should add and execute response interceptors', async () => {
      let interceptorCalled = false;
      backendApiClient.addResponseInterceptor((response) => {
        interceptorCalled = true;
        return response;
      });

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: {
          get: () => null
        }
      };
      
      global.fetch = async () => mockResponse;

      await backendApiClient.get('/test');
      
      expect(interceptorCalled).to.be.true;
    });
  });

  describe('getHeaders', () => {
    it('should return default headers', () => {
      const headers = backendApiClient.getHeaders();
      
      expect(headers['Content-Type']).to.equal('application/json');
      expect(headers['Authorization']).to.be.undefined;
    });

    it('should include authorization header when token is set', () => {
      backendApiClient.token = 'test-token';
      const headers = backendApiClient.getHeaders();
      
      expect(headers['Authorization']).to.equal('Bearer test-token');
    });
  });

  describe('requestWithTimeout', () => {
    it('should throw NetworkError on timeout', async () => {
      // Mock fetch to never resolve
      global.fetch = async () => {
        return new Promise(() => {}); // Never resolves
      };

      try {
        await backendApiClient.requestWithTimeout('http://test.com', {}, 100);
        expect.fail('Should have thrown timeout error');
      } catch (error) {
        expect(error.message).to.equal('Request timeout');
        expect(error.status).to.equal(408);
      }
    });

    it('should resolve before timeout', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' })
      };
      
      global.fetch = async () => mockResponse;

      const response = await backendApiClient.requestWithTimeout('http://test.com', {}, 5000);
      
      expect(response.ok).to.be.true;
    });
  });

  describe('retryRequest', () => {
    it('should retry on NetworkError with 5xx status', async () => {
      let attemptCount = 0;
      
      global.fetch = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          const error = new Error('Network error');
          error.status = 500;
          throw error;
        }
        return {
          ok: true,
          json: async () => ({ data: 'test' }),
          headers: { get: () => null }
        };
      };

      const result = await backendApiClient.retryRequest('/test', { method: 'GET' });
      
      expect(attemptCount).to.equal(3);
      expect(result.data).to.equal('test');
    });

    it('should not retry on non-retryable errors', async () => {
      let attemptCount = 0;
      
      global.fetch = async () => {
        attemptCount++;
        throw new Error('Non-retryable error');
      };

      try {
        await backendApiClient.retryRequest('/test', { method: 'GET' });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(attemptCount).to.equal(1);
      }
    });

    it('should give up after max retries', async () => {
      let attemptCount = 0;
      
      global.fetch = async () => {
        attemptCount++;
        const error = new Error('Network error');
        error.status = 500;
        throw error;
      };

      try {
        await backendApiClient.retryRequest('/test', { method: 'GET' });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(attemptCount).to.equal(4); // initial + 3 retries
      }
    });
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url, config) => {
        return mockResponse;
      };

      const result = await backendApiClient.request('/test');
      
      expect(result.data).to.equal('test');
    });

    it('should throw AuthError on 401 response', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
        headers: { get: () => 'req-123' }
      };
      
      global.fetch = async () => mockResponse;

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown AuthError');
      } catch (error) {
        expect(error).to.be.instanceOf(AuthError);
        expect(error.message).to.equal('Unauthorized');
        expect(error.requestId).to.equal('req-123');
      }
    });

    it('should throw NotFoundError on 404 response', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' }),
        headers: { get: () => 'req-456' }
      };
      
      global.fetch = async () => mockResponse;

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).to.be.instanceOf(NotFoundError);
        expect(error.message).to.equal('Not found');
      }
    });

    it('should throw ConflictError on 409 response', async () => {
      const mockResponse = {
        ok: false,
        status: 409,
        json: async () => ({ detail: 'Conflict', error: { details: { reason: 'duplicate' } } }),
        headers: { get: () => 'req-789' }
      };
      
      global.fetch = async () => mockResponse;

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown ConflictError');
      } catch (error) {
        expect(error).to.be.instanceOf(ConflictError);
        expect(error.details).to.deep.equal({ reason: 'duplicate' });
      }
    });

    it('should throw ValidationError on 422 response', async () => {
      const mockResponse = {
        ok: false,
        status: 422,
        json: async () => ({ detail: 'Validation error', error: { details: { field: 'invalid' } } }),
        headers: { get: () => 'req-abc' }
      };
      
      global.fetch = async () => mockResponse;

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.details).to.deep.equal({ field: 'invalid' });
      }
    });

    it('should throw NetworkError on 5xx response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Server error' }),
        headers: { get: () => 'req-def' }
      };
      
      global.fetch = async () => mockResponse;

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown NetworkError');
      } catch (error) {
        expect(error).to.be.instanceOf(NetworkError);
        expect(error.status).to.equal(500);
      }
    });

    it('should throw APIError on other error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Bad request' }),
        headers: { get: () => 'req-ghi' }
      };
      
      global.fetch = async () => mockResponse;

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown APIError');
      } catch (error) {
        expect(error).to.be.instanceOf(APIError);
        expect(error.status).to.equal(400);
      }
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = async () => {
        throw new Error('Network connection failed');
      };

      try {
        await backendApiClient.request('/test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Network connection failed');
      }
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url, config) => {
        expect(config.method).to.equal('GET');
        return mockResponse;
      };

      await backendApiClient.get('/test');
    });

    it('should make POST request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'created' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url, config) => {
        expect(config.method).to.equal('POST');
        expect(JSON.parse(config.body)).to.deep.equal({ name: 'test' });
        return mockResponse;
      };

      await backendApiClient.post('/test', { name: 'test' });
    });

    it('should make PUT request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'updated' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url, config) => {
        expect(config.method).to.equal('PUT');
        expect(JSON.parse(config.body)).to.deep.equal({ name: 'updated' });
        return mockResponse;
      };

      await backendApiClient.put('/test', { name: 'updated' });
    });

    it('should make PATCH request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'patched' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url, config) => {
        expect(config.method).to.equal('PATCH');
        expect(JSON.parse(config.body)).to.deep.equal({ name: 'patched' });
        return mockResponse;
      };

      await backendApiClient.patch('/test', { name: 'patched' });
    });

    it('should make DELETE request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'deleted' }),
        headers: { get: () => null }
      };
      
      global.fetch = async (url, config) => {
        expect(config.method).to.equal('DELETE');
        return mockResponse;
      };

      await backendApiClient.delete('/test');
    });
  });
});