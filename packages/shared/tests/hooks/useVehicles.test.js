import { expect } from 'chai';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { 
  useVehicles, 
  useVehicle, 
  useUpdateVehicleStatus, 
  useAddVehicle, 
  useUpdateVehicle 
} from '../../hooks/useVehicles.js';
import { restVehicleService } from '../../services/restVehicleService.js';
import { authService } from '../../services/authService.js';

describe('useVehicles Hook', () => {
  let queryClient;
  let originalFetchVehicles;
  let originalFetchVehicle;
  let originalUpdateStatus;
  let originalAddVehicle;
  let originalUpdateVehicle;
  let originalIsAuthenticated;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    originalFetchVehicles = restVehicleService.fetchVehicles;
    originalFetchVehicle = restVehicleService.fetchVehicle;
    originalUpdateStatus = restVehicleService.updateStatus;
    originalAddVehicle = restVehicleService.addVehicle;
    originalUpdateVehicle = restVehicleService.updateVehicle;
    originalIsAuthenticated = authService.isAuthenticated;
  });

  afterEach(() => {
    restVehicleService.fetchVehicles = originalFetchVehicles;
    restVehicleService.fetchVehicle = originalFetchVehicle;
    restVehicleService.updateStatus = originalUpdateStatus;
    restVehicleService.addVehicle = originalAddVehicle;
    restVehicleService.updateVehicle = originalUpdateVehicle;
    authService.isAuthenticated = originalIsAuthenticated;
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useVehicles', () => {
    it('should fetch vehicles when authenticated', async () => {
      authService.isAuthenticated = () => true;
      restVehicleService.fetchVehicles = async () => [
        { id: 'VH001', name: 'VH001', category: 'Vehicles', capacity: 10, status: 'Available', active: true }
      ];

      const { result } = renderHook(() => useVehicles(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.have.lengthOf(1);
        expect(result.current.data[0].id).to.equal('VH001');
      });
    });

    it('should not fetch vehicles when not authenticated', async () => {
      authService.isAuthenticated = () => false;
      restVehicleService.fetchVehicles = async () => [];

      const { result } = renderHook(() => useVehicles(), { wrapper });

      expect(result.current.fetchStatus).to.equal('idle');
    });

    it('should pass filters to fetchVehicles', async () => {
      authService.isAuthenticated = () => true;
      let capturedFilters = null;
      restVehicleService.fetchVehicles = async (filters) => {
        capturedFilters = filters;
        return [{ id: 'VH001', name: 'VH001', category: 'Vehicles', capacity: 10, status: 'Available', active: true }];
      };

      const { result } = renderHook(() => useVehicles({ vehicle_type: 'Truck', status: 'Available' }), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.have.lengthOf(1);
      });
      expect(capturedFilters).to.deep.equal({ vehicle_type: 'Truck', status: 'Available' });
    });
  });

  describe('useVehicle', () => {
    it('should fetch single vehicle when authenticated and number provided', async () => {
      authService.isAuthenticated = () => true;
      restVehicleService.fetchVehicle = async (number) => {
        expect(number).to.equal('VH001');
        return { id: 'VH001', name: 'VH001', category: 'Vehicles', capacity: 10, status: 'Available', active: true };
      };

      const { result } = renderHook(() => useVehicle('VH001'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
        expect(result.current.data.id).to.equal('VH001');
      });
    });

    it('should not fetch when vehicleNumber is not provided', () => {
      authService.isAuthenticated = () => true;
      restVehicleService.fetchVehicle = async () => ({});

      const { result } = renderHook(() => useVehicle(null), { wrapper });

      expect(result.current.fetchStatus).to.equal('idle');
    });

    it('should not fetch when not authenticated', () => {
      authService.isAuthenticated = () => false;
      restVehicleService.fetchVehicle = async () => ({});

      const { result } = renderHook(() => useVehicle('VH001'), { wrapper });

      expect(result.current.fetchStatus).to.equal('idle');
    });
  });

  describe('useUpdateVehicleStatus', () => {
    it('should update vehicle status', async () => {
      authService.isAuthenticated = () => true;
      let updatedNumber = null;
      let updatedStatus = null;
      restVehicleService.updateStatus = async (vehicleNumber, status) => {
        updatedNumber = vehicleNumber;
        updatedStatus = status;
        return { id: vehicleNumber, status };
      };

      const { result } = renderHook(() => useUpdateVehicleStatus(), { wrapper });

      result.current.mutate({
        vehicleNumber: 'VH001',
        status: 'In Use'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
      expect(updatedNumber).to.equal('VH001');
      expect(updatedStatus).to.equal('In Use');
    });
  });

  describe('useAddVehicle', () => {
    it('should add new vehicle', async () => {
      authService.isAuthenticated = () => true;
      restVehicleService.addVehicle = async (vehicleData) => {
        return { ...vehicleData, id: 'VH001' };
      };

      const { result } = renderHook(() => useAddVehicle(), { wrapper });

      result.current.mutate({
        id: 'VH001',
        category: 'Truck',
        capacity: 10,
        status: 'Available',
        active: true
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
        expect(result.current.data.id).to.equal('VH001');
      });
    });
  });

  describe('useUpdateVehicle', () => {
    it('should update existing vehicle', async () => {
      authService.isAuthenticated = () => true;
      restVehicleService.updateVehicle = async (vehicleNumber, updateData) => {
        return { id: vehicleNumber, name: vehicleNumber, category: 'Vehicles', ...updateData };
      };

      const { result } = renderHook(() => useUpdateVehicle(), { wrapper });

      result.current.mutate({
        vehicleNumber: 'VH001',
        updateData: { status: 'In Use', capacity: 12 }
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
        expect(result.current.data.capacity).to.equal(12);
      });
    });
  });
});