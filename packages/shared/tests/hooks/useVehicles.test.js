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
    originalIsAuthenticated = authService.isAuthenticated;
  });

  afterEach(() => {
    restVehicleService.fetchVehicles = originalFetchVehicles;
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
      restVehicleService.fetchVehicles = async (filters) => {
        expect(filters.vehicle_type).to.equal('Truck');
        expect(filters.status).to.equal('Available');
        return [];
      };

      renderHook(() => useVehicles({ vehicle_type: 'Truck', status: 'Available' }), { wrapper });

      await waitFor(() => {
        expect(restVehicleService.fetchVehicles).to.have.been.called;
      });
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
      restVehicleService.fetchVehicles = async () => [
        { id: 'VH001', name: 'VH001', category: 'Vehicles', capacity: 10, status: 'Available', active: true }
      ];
      restVehicleService.updateStatus = async (vehicleNumber, status) => {
        return { id: vehicleNumber, name: vehicleNumber, category: 'Vehicles', capacity: 10, status: status, active: true };
      };

      const { result } = renderHook(() => useUpdateVehicleStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
      });

      await result.current.mutate({
        vehicleNumber: 'VH001',
        status: 'In Use'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
    });
  });

  describe('useAddVehicle', () => {
    it('should add new vehicle', async () => {
      authService.isAuthenticated = () => true;
      restVehicleService.fetchVehicles = async () => [];
      restVehicleService.addVehicle = async (vehicleData) => {
        return { ...vehicleData, id: 'VH001' };
      };

      const { result } = renderHook(() => useAddVehicle(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
      });

      await result.current.mutate({
        id: 'VH001',
        category: 'Truck',
        capacity: 10,
        status: 'Available',
        active: true
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
    });
  });

  describe('useUpdateVehicle', () => {
    it('should update existing vehicle', async () => {
      authService.isAuthenticated = () => true;
      restVehicleService.fetchVehicles = async () => [
        { id: 'VH001', name: 'VH001', category: 'Vehicles', capacity: 10, status: 'Available', active: true }
      ];
      restVehicleService.updateVehicle = async (vehicleNumber, updateData) => {
        return { id: vehicleNumber, name: vehicleNumber, category: 'Vehicles', ...updateData };
      };

      const { result } = renderHook(() => useUpdateVehicle(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
      });

      await result.current.mutate({
        vehicleNumber: 'VH001',
        updateData: { status: 'In Use', capacity: 12 }
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
    });
  });
});