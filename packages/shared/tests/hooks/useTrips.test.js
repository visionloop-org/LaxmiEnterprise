import { expect } from 'chai';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { 
  useTrips, 
  useTrip, 
  useCreateTrip, 
  useUpdateTripStatus 
} from '../../hooks/useTrips.js';
import { restTripService } from '../../services/restTripService.js';
import { authService } from '../../services/authService.js';

describe('useTrips Hook', () => {
  let queryClient;
  let originalFetchTrips;
  let originalFetchTrip;
  let originalCreateTrip;
  let originalUpdateTripStatus;
  let originalIsAuthenticated;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    originalFetchTrips = restTripService.fetchTrips;
    originalFetchTrip = restTripService.fetchTrip;
    originalCreateTrip = restTripService.createTrip;
    originalUpdateTripStatus = restTripService.updateTripStatus;
    originalIsAuthenticated = authService.isAuthenticated;
  });

  afterEach(() => {
    restTripService.fetchTrips = originalFetchTrips;
    restTripService.fetchTrip = originalFetchTrip;
    restTripService.createTrip = originalCreateTrip;
    restTripService.updateTripStatus = originalUpdateTripStatus;
    authService.isAuthenticated = originalIsAuthenticated;
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useTrips', () => {
    it('should fetch trips when authenticated', async () => {
      authService.isAuthenticated = () => true;
      restTripService.fetchTrips = async () => [
        { id: 'TRIP001', sessionId: 'SESSION123', vehicleId: 'VH001', status: 'In Progress' }
      ];

      const { result } = renderHook(() => useTrips(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.have.lengthOf(1);
        expect(result.current.data[0].id).to.equal('TRIP001');
      });
    });

    it('should not fetch trips when not authenticated', async () => {
      authService.isAuthenticated = () => false;
      restTripService.fetchTrips = async () => [];

      const { result } = renderHook(() => useTrips(), { wrapper });

      expect(result.current.fetchStatus).to.equal('idle');
    });

    it('should pass filters to fetchTrips', async () => {
      authService.isAuthenticated = () => true;
      let capturedFilters = null;
      restTripService.fetchTrips = async (filters) => {
        capturedFilters = filters;
        return [{ id: 'TRIP001', sessionId: 'SESSION123', vehicleId: 'VH001', status: 'In Progress' }];
      };

      const { result } = renderHook(() => useTrips({ sessionId: 'SESSION123', vehicleId: 'VH001', status: 'In Progress' }), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.have.lengthOf(1);
      });
      expect(capturedFilters).to.deep.equal({ sessionId: 'SESSION123', vehicleId: 'VH001', status: 'In Progress' });
    });
  });

  describe('useTrip', () => {
    it('should fetch single trip when authenticated and ID provided', async () => {
      authService.isAuthenticated = () => true;
      restTripService.fetchTrip = async (tripId) => {
        expect(tripId).to.equal('TRIP001');
        return { id: 'TRIP001', sessionId: 'SESSION123', vehicleId: 'VH001', status: 'In Progress' };
      };

      const { result } = renderHook(() => useTrip('TRIP001'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
        expect(result.current.data.id).to.equal('TRIP001');
      });
    });

    it('should not fetch when tripId is not provided', () => {
      authService.isAuthenticated = () => true;
      restTripService.fetchTrip = async () => ({});

      const { result } = renderHook(() => useTrip(null), { wrapper });

      expect(result.current.fetchStatus).to.equal('idle');
    });

    it('should not fetch when not authenticated', () => {
      authService.isAuthenticated = () => false;
      restTripService.fetchTrip = async () => ({});

      const { result } = renderHook(() => useTrip('TRIP001'), { wrapper });

      expect(result.current.fetchStatus).to.equal('idle');
    });
  });

  describe('useCreateTrip', () => {
    it('should create new trip', async () => {
      authService.isAuthenticated = () => true;
      restTripService.createTrip = async (tripData) => {
        return { ...tripData, id: 'TRIP001' };
      };

      const { result } = renderHook(() => useCreateTrip(), { wrapper });

      result.current.mutate({
        sessionId: 'SESSION123',
        vehicleId: 'VH001',
        status: 'Scheduled'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
        expect(result.current.data.id).to.equal('TRIP001');
      });
    });
  });

  describe('useUpdateTripStatus', () => {
    it('should update trip status', async () => {
      authService.isAuthenticated = () => true;
      let updatedPayload = null;
      restTripService.updateTripStatus = async (tripId, data) => {
        updatedPayload = { tripId, ...data };
        return { id: tripId, sessionId: 'SESSION123', vehicleId: 'VH001', ...data };
      };

      const { result } = renderHook(() => useUpdateTripStatus(), { wrapper });

      result.current.mutate({
        tripId: 'TRIP001',
        status: 'Completed',
        locationName: 'Site A',
        remarks: 'Trip completed successfully'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
      expect(updatedPayload).to.deep.equal({
        tripId: 'TRIP001',
        status: 'Completed',
        locationName: 'Site A',
        receiverName: undefined,
        remarks: 'Trip completed successfully'
      });
    });
  });
});