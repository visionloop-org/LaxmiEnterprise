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
    originalIsAuthenticated = authService.isAuthenticated;
  });

  afterEach(() => {
    restEmployeeService.fetchEmployees = originalFetchEmployees;
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
      restEmployeeService.fetchEmployees = async (filters) => {
        expect(filters.category).to.equal('Driver');
        expect(filters.status).to.equal('active');
        return [];
      };

      renderHook(() => useEmployees({ category: 'Driver', status: 'active' }), { wrapper });

      await waitFor(() => {
        expect(restEmployeeService.fetchEmployees).to.have.been.called;
      });
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
    it('should update employee attendance', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.fetchEmployees = async () => [
        { id: 'EMP001', name: 'John Doe', category: 'Driver', status: 'active', attendance: 'Absent' }
      ];
      restEmployeeService.updateAttendance = async (sessionId, employeeId, status, arrivalTime, remarks) => {
        return { id: employeeId, name: 'John Doe', category: 'Driver', status: 'active', attendance: status };
      };

      const { result } = renderHook(() => useUpdateAttendance(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
      });

      await result.current.mutate({
        sessionId: 'SESSION123',
        employeeId: 'EMP001',
        status: 'On Time',
        arrivalTime: '09:00',
        remarks: 'On time'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
    });

    it('should optimistically update attendance', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.fetchEmployees = async () => [
        { id: 'EMP001', name: 'John Doe', category: 'Driver', status: 'active', attendance: 'Absent' }
      ];
      restEmployeeService.updateAttendance = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { id: 'EMP001', name: 'John Doe', category: 'Driver', status: 'active', attendance: 'On Time' };
      };

      const { result } = renderHook(() => useUpdateAttendance(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
      });

      result.current.mutate({
        sessionId: 'SESSION123',
        employeeId: 'EMP001',
        status: 'On Time',
        arrivalTime: '09:00'
      });

      // Check optimistic update happened
      await waitFor(() => {
        const employees = queryClient.getQueryData(['employees']);
        expect(employees[0].attendance).to.equal('On Time');
      });
    });
  });

  describe('useAddEmployee', () => {
    it('should add new employee', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.fetchEmployees = async () => [];
      restEmployeeService.addEmployee = async (employeeData) => {
        return { ...employeeData, id: 'EMP001' };
      };

      const { result } = renderHook(() => useAddEmployee(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
      });

      await result.current.mutate({
        name: 'Jane Smith',
        category: 'Helper',
        status: 'active'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
    });

    it('should optimistically add employee to list', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.fetchEmployees = async () => [];
      restEmployeeService.addEmployee = async (employeeData) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { ...employeeData, id: 'EMP001' };
      };

      const { result } = renderHook(() => useAddEmployee(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
      });

      result.current.mutate({
        name: 'Jane Smith',
        category: 'Helper',
        status: 'active'
      });

      // Check optimistic update happened
      await waitFor(() => {
        const employees = queryClient.getQueryData(['employees']);
        expect(employees).to.have.lengthOf(1);
        expect(employees[0].name).to.equal('Jane Smith');
      });
    });
  });

  describe('useUpdateEmployee', () => {
    it('should update existing employee', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.fetchEmployees = async () => [
        { id: 'EMP001', name: 'John Doe', category: 'Driver', status: 'active' }
      ];
      restEmployeeService.updateEmployee = async (employeeId, updateData) => {
        return { id: employeeId, ...updateData };
      };

      const { result } = renderHook(() => useUpdateEmployee(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
      });

      await result.current.mutate({
        employeeId: 'EMP001',
        updateData: { name: 'John Updated' }
      });

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
    });
  });

  describe('useApproveEmployee', () => {
    it('should approve employee', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.fetchEmployees = async () => [
        { id: 'EMP001', name: 'John Doe', category: 'Driver', status: 'pending' }
      ];
      restEmployeeService.approveEmployee = async (employeeId) => {
        return { id: employeeId, name: 'John Doe', category: 'Driver', status: 'active' };
      };

      const { result } = renderHook(() => useApproveEmployee(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
      });

      await result.current.mutate('EMP001');

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
    });
  });

  describe('useRejectEmployee', () => {
    it('should reject employee', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.fetchEmployees = async () => [
        { id: 'EMP001', name: 'John Doe', category: 'Driver', status: 'pending' }
      ];
      restEmployeeService.rejectEmployee = async (employeeId) => {
        return { id: employeeId, name: 'John Doe', category: 'Driver', status: 'rejected' };
      };

      const { result } = renderHook(() => useRejectEmployee(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
      });

      await result.current.mutate('EMP001');

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
    });
  });

  describe('useDeleteEmployee', () => {
    it('should delete employee', async () => {
      authService.isAuthenticated = () => true;
      restEmployeeService.fetchEmployees = async () => [
        { id: 'EMP001', name: 'John Doe', category: 'Driver', status: 'active' }
      ];
      restEmployeeService.deleteEmployee = async (employeeId) => {
        // Delete doesn't return anything
      };

      const { result } = renderHook(() => useDeleteEmployee(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).to.exist;
      });

      await result.current.mutate('EMP001');

      await waitFor(() => {
        expect(result.current.isSuccess).to.be.true;
      });
    });
  });
});