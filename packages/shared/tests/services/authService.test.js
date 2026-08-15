const { expect } = require('chai');
const { authService } = require('../../services/authService');
const { backendApiClient, AuthError } = require('../../services/backendApi');

describe('AuthService', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.localStorage.clear();
    backendApiClient.token = null;
    authService.logout();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ access_token: 'test-token-123' })
      };
      
      global.fetch = async () => mockResponse;

      const result = await authService.login('testuser', 'testpass');
      
      expect(result.access_token).to.equal('test-token-123');
      expect(backendApiClient.token).to.equal('test-token-123');
      expect(localStorage.getItem('auth_token')).to.equal('test-token-123');
    });

    it('should throw error on failed login', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ detail: 'Invalid credentials' })
      };
      
      global.fetch = async () => mockResponse;

      try {
        await authService.login('testuser', 'wrongpass');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Invalid credentials');
      }
    });

    it('should set token expiry time on successful login', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ access_token: 'test-token-123' })
      };
      
      global.fetch = async () => mockResponse;

      await authService.login('testuser', 'testpass');
      
      const expiryTime = parseInt(localStorage.getItem('auth_token_expiry'));
      const expectedExpiry = Date.now() + (30 * 60 * 1000) - (5 * 60 * 1000);
      
      expect(expiryTime).to.be.closeTo(expectedExpiry, 1000);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      backendApiClient.token = 'test-token';
      
      const originalGet = backendApiClient.get;
      backendApiClient.get = async () => ({ id: 1, username: 'testuser' });

      const user = await authService.getCurrentUser();
      
      expect(user.id).to.equal(1);
      expect(user.username).to.equal('testuser');
      
      backendApiClient.get = originalGet;
    });

    it('should refresh token on AuthError and retry', async () => {
      backendApiClient.token = 'expired-token';
      let callCount = 0;
      
      const originalGet = backendApiClient.get;
      backendApiClient.get = async () => {
        callCount++;
        if (callCount === 1) {
          throw new AuthError('Token expired');
        }
        return { id: 1, username: 'testuser' };
      };

      const originalLogin = authService.login;
      authService.login = async () => {
        backendApiClient.token = 'new-token';
      };

      // Store credentials for refresh
      localStorage.setItem('auth_credentials', JSON.stringify({ username: 'test', password: 'pass' }));

      const user = await authService.getCurrentUser();
      
      expect(callCount).to.equal(2);
      expect(user.username).to.equal('testuser');
      
      backendApiClient.get = originalGet;
      authService.login = originalLogin;
      localStorage.removeItem('auth_credentials');
    });

    it('should logout on non-AuthError', async () => {
      backendApiClient.token = 'test-token';
      
      const originalGet = backendApiClient.get;
      backendApiClient.get = async () => {
        throw new Error('Network error');
      };

      const originalLogout = authService.logout;
      authService.logout = () => {
        backendApiClient.token = null;
      };

      try {
        await authService.getCurrentUser();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(backendApiClient.token).to.be.null;
      }
      
      backendApiClient.get = originalGet;
      authService.logout = originalLogout;
    });
  });

  describe('refreshToken', () => {
    it('should prevent multiple concurrent refresh attempts', async () => {
      const originalLogin = authService.login;
      authService.login = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        backendApiClient.token = 'new-token';
      };

      localStorage.setItem('auth_credentials', JSON.stringify({ username: 'test', password: 'pass' }));

      const [result1, result2] = await Promise.all([
        authService.refreshToken(),
        authService.refreshToken()
      ]);

      expect(result1).to.equal(result2);
      expect(backendApiClient.token).to.equal('new-token');
      
      authService.login = originalLogin;
    });

    it('should use stored credentials for refresh', async () => {
      localStorage.setItem('auth_credentials', JSON.stringify({ username: 'testuser', password: 'testpass' }));
      
      const originalLogin = authService.login;
      let loginCalled = false;
      authService.login = async (username, password) => {
        loginCalled = true;
        expect(username).to.equal('testuser');
        expect(password).to.equal('testpass');
        backendApiClient.token = 'new-token';
      };

      await authService.refreshToken();
      
      expect(loginCalled).to.be.true;
      authService.login = originalLogin;
    });

    it('should logout if no stored credentials', async () => {
      const originalLogout = authService.logout;
      authService.logout = () => {
        backendApiClient.token = null;
      };

      try {
        await authService.refreshToken();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(AuthError);
        expect(error.message).to.equal('No stored credentials for refresh');
      }
      
      authService.logout = originalLogout;
    });
  });

  describe('ensureAuthenticated', () => {
    it('should throw error if not authenticated', async () => {
      try {
        await authService.ensureAuthenticated();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(AuthError);
        expect(error.message).to.equal('Not authenticated');
      }
    });

    it('should refresh token if expired', async () => {
      backendApiClient.token = 'test-token';
      localStorage.setItem('auth_token_expiry', '0'); // Expired
      
      const originalRefresh = authService.refreshToken;
      let refreshCalled = false;
      authService.refreshToken = async () => {
        refreshCalled = true;
      };

      await authService.ensureAuthenticated();
      
      expect(refreshCalled).to.be.true;
      authService.refreshToken = originalRefresh;
    });

    it('should not refresh if token is valid', async () => {
      backendApiClient.token = 'test-token';
      const futureExpiry = Date.now() + (60 * 60 * 1000);
      localStorage.setItem('auth_token_expiry', futureExpiry.toString());
      
      const originalRefresh = authService.refreshToken;
      let refreshCalled = false;
      authService.refreshToken = async () => {
        refreshCalled = true;
      };

      await authService.ensureAuthenticated();
      
      expect(refreshCalled).to.be.false;
      authService.refreshToken = originalRefresh;
    });
  });

  describe('storeCredentials and clearCredentials', () => {
    it('should store credentials in localStorage', () => {
      authService.storeCredentials('testuser', 'testpass');
      
      const stored = JSON.parse(localStorage.getItem('auth_credentials'));
      expect(stored.username).to.equal('testuser');
      expect(stored.password).to.equal('testpass');
    });

    it('should clear credentials from localStorage', () => {
      authService.storeCredentials('testuser', 'testpass');
      authService.clearCredentials();
      
      expect(localStorage.getItem('auth_credentials')).to.be.null;
    });
  });

  describe('loginWithCredentials', () => {
    it('should store credentials and login', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ access_token: 'test-token-123' })
      };
      
      global.fetch = async () => mockResponse;

      await authService.loginWithCredentials('testuser', 'testpass');
      
      const stored = JSON.parse(localStorage.getItem('auth_credentials'));
      expect(stored.username).to.equal('testuser');
      expect(stored.password).to.equal('testpass');
      expect(backendApiClient.token).to.equal('test-token-123');
    });
  });

  describe('logout', () => {
    it('should clear token and credentials', () => {
      backendApiClient.token = 'test-token';
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('auth_credentials', JSON.stringify({ username: 'test', password: 'pass' }));
      localStorage.setItem('auth_token_expiry', '123456789');

      authService.logout();
      
      expect(backendApiClient.token).to.be.null;
      expect(localStorage.getItem('auth_token')).to.be.null;
      expect(localStorage.getItem('auth_credentials')).to.be.null;
      expect(localStorage.getItem('auth_token_expiry')).to.be.null;
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      backendApiClient.token = 'test-token';
      expect(authService.isAuthenticated()).to.be.true;
    });

    it('should return false when token is null', () => {
      backendApiClient.token = null;
      expect(authService.isAuthenticated()).to.be.false;
    });
  });

  describe('getToken', () => {
    it('should return current token', () => {
      backendApiClient.token = 'test-token';
      expect(authService.getToken()).to.equal('test-token');
    });
  });
});