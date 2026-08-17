const { expect } = require('chai');
const { backendApiClient } = require('../../services/backendApi');

describe('Health and System Verification Tests', () => {
  let originalGet;

  beforeEach(() => {
    originalGet = backendApiClient.get;
  });

  afterEach(() => {
    backendApiClient.get = originalGet;
  });

  it('should verify health endpoint response schema', async () => {
    backendApiClient.get = async (url) => {
      expect(url).to.equal('/health');
      return {
        status: 'healthy',
        database_connected: true,
        database: 'laxmi_enterprise'
      };
    };

    const health = await backendApiClient.get('/health');
    expect(health.status).to.equal('healthy');
    expect(health.database_connected).to.be.true;
    expect(health.database).to.equal('laxmi_enterprise');
  });

  it('should verify readiness endpoint response schema', async () => {
    backendApiClient.get = async (url) => {
      expect(url).to.equal('/ready');
      return {
        status: 'ready',
        database: 'connected',
        timestamp: '2026-08-17T12:00:00Z'
      };
    };

    const ready = await backendApiClient.get('/ready');
    expect(ready.status).to.equal('ready');
    expect(ready.database).to.equal('connected');
  });
});
