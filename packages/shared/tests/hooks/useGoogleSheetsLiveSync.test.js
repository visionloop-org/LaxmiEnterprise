import { expect } from 'chai';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useGoogleSheetsLiveSync } from '../../hooks/useGoogleSheetsLiveSync.js';
import { googleSheetsService } from '../../services/googleSheetsService.js';

describe('useGoogleSheetsLiveSync Hook', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  it('should initialize with current sync status', () => {
    const { result } = renderHook(() => useGoogleSheetsLiveSync({ autoSync: false }), { wrapper });

    expect(result.current.isSyncing).to.be.false;
    expect(result.current.isConfigured).to.be.a('boolean');
    expect(result.current.syncNow).to.be.a('function');
    expect(result.current.invalidateCache).to.be.a('function');
  });

  it('should react to SYNC_COMPLETED events from googleSheetsService', () => {
    let syncSuccessCalled = false;
    const { result } = renderHook(() => useGoogleSheetsLiveSync({
      autoSync: false,
      onSyncSuccess: () => { syncSuccessCalled = true; }
    }), { wrapper });

    const nowIso = new Date().toISOString();
    act(() => {
      googleSheetsService.notifyListeners('SYNC_COMPLETED', {
        timestamp: nowIso,
        tables: ['employees', 'vehicles']
      });
    });

    expect(result.current.lastSyncTime).to.equal(nowIso);
    expect(syncSuccessCalled).to.be.true;
  });

  it('should handle SYNC_ERROR events gracefully', () => {
    let syncErrorMsg = null;
    const { result } = renderHook(() => useGoogleSheetsLiveSync({
      autoSync: false,
      onSyncError: (msg) => { syncErrorMsg = msg; }
    }), { wrapper });

    act(() => {
      googleSheetsService.notifyListeners('SYNC_ERROR', { error: 'Network timeout' });
    });

    expect(result.current.syncError).to.equal('Network timeout');
    expect(syncErrorMsg).to.equal('Network timeout');
  });
});
