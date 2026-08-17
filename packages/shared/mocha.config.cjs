const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: false,
  resources: 'usable'
});

const { performance } = require('perf_hooks');
global.window = dom.window;
global.document = dom.window.document;
global.performance = performance;
global.localStorage = {
  getItem: (key) => global.localStorage._store[key] || null,
  setItem: (key, value) => { global.localStorage._store[key] = value.toString(); },
  removeItem: (key) => { delete global.localStorage._store[key]; },
  clear: () => { global.localStorage._store = {}; },
  _store: {}
};

// Mock import.meta.env for Vite
global.import = {
  meta: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:8000/api/v1'
    }
  }
};

// Add default fetch mock that can be overridden in tests
global.fetch = () => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({}),
  headers: {
    get: () => null
  }
});