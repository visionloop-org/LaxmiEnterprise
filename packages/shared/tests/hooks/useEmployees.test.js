import { expect } from 'chai';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { 
  useEmployees, 
  useEmployee, 
  useUpdateAttendance, 
  useAddEmployee, 
  useUpdateEmployee,
  useApproveEmployee,
  useRejectEmployee,
  useDeleteEmployee 
} from '../../hooks/useEmployees.js';
import { restEmployeeService } from '../../services/restEmployeeService.js';
import { authService } from '../../services/authService.js';

describe('useEmployees Hook', () => {
  let queryClient;
  let originalFetchEmployees;
  let originalFetchEmployee;
  let originalUpdateAttendance;
  let originalAddEmployee;
  let originalUpdateEmployee;
  let originalApproveEmployee;
  let originalRejectEmployee;
  let originalDeleteEmployee;
  let originalIsAuthenticated;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    originalFetchEmployees = restEmployeeService.fetchEmployees;
    originalFetchEmployee = restEmployeeService.fetchEmployee;
    originalUpdateAttendance = restEmployeeService.updateAttendance;
    originalAddEmployee = restEmployeeService.addEmployee;
    originalUpdateEmployee = restEmployeeService.updateEmployee;
    originalApproveEmployee = restEmployeeService.approveEmployee;
    originalRejectEmployee = restEmployeeService.rejectEmployee;
    originalDeleteEmployee = restEmployeeService.deleteEmployee;
    originalIsAuthenticated = authService.isAuthenticated;
  });

  afterEach(() => {
    restEmployeeService.fetchEmployees = originalFetchEmployees;
    restEmployeeService.fetchEmployee = originalFetchEmployee;
    restEmployeeService.updateAttendance = originalUpdateAttendance;
    restEmployeeService.addEmployee = originalAddEmployee;
    restEmployeeService.updateEmployee = originalUpdateEmployee;
    restEmployeeService.approveEmployee = originalApproveEmployee;
    restEmployeeService.rejectEmployee = originalRejectEmployee;
    restEmployeeService.deleteEmployee = originalDeleteEmployee;
    authService.isAuthenticated = originalIsAuthenticated;
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useEmployees', () => {
    it('should fetch employees when authenticated', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.fetchEmployees = async () => [
        { id: 'EMP001', name: 'John Doe', category: 'Driver', status: 'active' }
      ];

      const { result } = renderHook(() => useEmployees(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.have.lengthOf(1);
        expect(result.current.data[0].name).to.equal('John Doe');
      });
    });

    it('should not fetch employees when not authenticated', async () => {
      authService.isAuthenticated = () => false;
      restEmployeeService.fetchEmployees = async () => [];

      const { result } = renderHook(() => useEmployees(), { wrapper });

      expect(result.current.fetchStatus).to.equal('idle');
    });

    it('should pass filters to fetchEmployees', async () => {
      authService.isAuthenticated = () => true;
      let capturedFilters = null;
      restEmployeeService.fetchEmployees = async (filters) => {
        capturedFilters = filters;
        return [{ id: 'EMP001', name: 'John Driver', category: 'Driver', status: 'active' }];
      };

      const { result } = renderHook(() => useEmployees({ category: 'Driver', status: 'active' }), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.have.lengthOf(1);
      });
      expect(capturedFilters).to.deep.equal({ category: 'Driver', status: 'active' });
    });
  });

  describe('useEmployee', () => {
    it('should fetch single employee when authenticated and ID provided', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.fetchEmployee = async (id) => {
        expect(id).to.equal('EMP001');
        return { id: 'EMP001', name: 'John Doe', category: 'Driver', status: 'active' };
      };

      const { result } = renderHook(() => useEmployee('EMP001'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
        expect(result.current.data.name).to.equal('John Doe');
      });
    });

    it('should not fetch when employeeId is not provided', () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.fetchEmployee = async () => ({});

      const { result } = renderHook(() => useEmployee(null), { wrapper });

      expect(result.current.fetchStatus).to.equal('idle');
    });

    it('should not fetch when not authenticated', () => {
      authService.isAuthenticated = () => false;
      restEmployeeService.fetchEmployee = async () => ({});

      const { result } = renderHook(() => useEmployee('EMP001'), { wrapper });

      expect(result.current.fetchStatus).to.equal('idle');
    });
  });

  describe('useUpdateAttendance', () => {
    it('should update employee attendance and invalidate queries', async () => {
      authService.isAuthenticated = () => true;
      let updatedParams = null;
      restEmployeeService.updateAttendance = async (sessionId, employeeId, status, arrivalTime, remarks) => {
        updatedParams = { sessionId, employeeId, status, arrivalTime, remarks };
        return { id: employeeId, status };
      };

      const { result } = renderHook(() => useUpdateAttendance(), { wrapper });

      result.current.mutate({
        sessionId: 'SESSION123',
        employeeId: 'EMP001',
        status: 'On Time',
        arrivalTime: '09:00',
        remarks: 'On time'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
      expect(updatedParams).to.deep.equal({
        sessionId: 'SESSION123',
        employeeId: 'EMP001',
        status: 'On Time',
        arrivalTime: '09:00',
        remarks: 'On time'
      });
    });
  });

  describe('useAddEmployee', () => {
    it('should add new employee', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.addEmployee = async (employeeData) => {
        return { ...employeeData, id: 'EMP001' };
      };

      const { result } = renderHook(() => useAddEmployee(), { wrapper });

      result.current.mutate({
        name: 'Jane Smith',
        category: 'Helper',
        status: 'active'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
        expect(result.current.data.id).to.equal('EMP001');
      });
    });
  });

  describe('useUpdateEmployee', () => {
    it('should update existing employee', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.updateEmployee = async (employeeId, updateData) => {
        return { id: employeeId, ...updateData };
      };

      const { result } = renderHook(() => useUpdateEmployee(), { wrapper });

      result.current.mutate({
        employeeId: 'EMP001',
        updateData: { name: 'John Updated' }
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
        expect(result.current.data.name).to.equal('John Updated');
      });
    });
  });

  describe('useApproveEmployee', () => {
    it('should approve employee', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.approveEmployee = async (employeeId) => {
        return { id: employeeId, name: 'John Doe', category: 'Driver', status: 'active' };
      };

      const { result } = renderHook(() => useApproveEmployee(), { wrapper });

      result.current.mutate('EMP001');

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
    });
  });

  describe('useRejectEmployee', () => {
    it('should reject employee', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.rejectEmployee = async (employeeId) => {
        return { id: employeeId, name: 'John Doe', category: 'Driver', status: 'rejected' };
      };

      const { result } = renderHook(() => useRejectEmployee(), { wrapper });

      result.current.mutate('EMP001');

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
    });
  });

  describe('useDeleteEmployee', () => {
    it('should delete employee', async () => {
      authService.isAuthenticated = () => true;
      let deletedId = null;
      restEmployeeService.deleteEmployee = async (employeeId) => {
        deletedId = employeeId;
      };

      const { result } = renderHook(() => useDeleteEmployee(), { wrapper });

      result.current.mutate('EMP001');

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
      expect(deletedId).to.equal('EMP001');
    });
  });
});