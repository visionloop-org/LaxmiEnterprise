const { expect } = require('chai');
const { restAssignmentService } = require('../../services/restAssignmentService');
const { backendApiClient } = require('../../services/backendApi');

describe('RestAssignmentService', () => {
  let originalPost, originalDelete, originalGet;

  beforeEach(() => {
    originalPost = backendApiClient.post;
    originalDelete = backendApiClient.delete;
    originalGet = backendApiClient.get;
  });

  afterEach(() => {
    backendApiClient.post = originalPost;
    backendApiClient.delete = originalDelete;
    backendApiClient.get = originalGet;
  });

  describe('assignVehicle', () => {
    it('should assign a vehicle to an employee', async () => {
      const mockAssignment = {
        sessionId: 'SESSION123',
        employeeId: 'EMP001',
        vehicleId: 'VH001',
        assignedAt: '2024-01-01T09:00:00Z',
        assignedBy: 'ADMIN001',
        unassignedAt: null,
        unassignedBy: null
      };

      backendApiClient.post = async (url, data) => {
        expect(url).to.equal('/assignments/sessions/SESSION123/vehicles/VH001/employees/EMP001');
        return mockAssignment;
      };

      const result = await restAssignmentService.assignVehicle('SESSION123', 'VH001', 'EMP001');

      expect(result.sessionId).to.equal('SESSION123');
      expect(result.employeeId).to.equal('EMP001');
      expect(result.vehicleId).to.equal('VH001');
      expect(result.assignedAt).to.equal('2024-01-01T09:00:00Z');
      expect(result.assignedBy).to.equal('ADMIN001');
      expect(result.unassignedAt).to.be.null;
      expect(result.unassignedBy).to.be.null;
    });
  });

  describe('unassignVehicle', () => {
    it('should unassign a vehicle from an employee', async () => {
      const mockAssignment = {
        sessionId: 'SESSION123',
        employeeId: 'EMP001',
        vehicleId: 'VH001',
        assignedAt: '2024-01-01T09:00:00Z',
        assignedBy: 'ADMIN001',
        unassignedAt: '2024-01-01T17:00:00Z',
        unassignedBy: 'ADMIN001'
      };

      backendApiClient.delete = async (url) => {
        expect(url).to.equal('/assignments/sessions/SESSION123/employees/EMP001');
        return mockAssignment;
      };

      const result = await restAssignmentService.unassignVehicle('SESSION123', 'EMP001');

      expect(result.sessionId).to.equal('SESSION123');
      expect(result.employeeId).to.equal('EMP001');
      expect(result.unassignedAt).to.equal('2024-01-01T17:00:00Z');
      expect(result.unassignedBy).to.equal('ADMIN001');
    });
  });

  describe('getVehicleAssignments', () => {
    it('should get all assignments for a vehicle in a session', async () => {
      const mockAssignments = [
        {
          sessionId: 'SESSION123',
          employeeId: 'EMP001',
          vehicleId: 'VH001',
          assignedAt: '2024-01-01T09:00:00Z',
          assignedBy: 'ADMIN001',
          unassignedAt: null,
          unassignedBy: null
        },
        {
          sessionId: 'SESSION123',
          employeeId: 'EMP002',
          vehicleId: 'VH001',
          assignedAt: '2024-01-01T09:05:00Z',
          assignedBy: 'ADMIN001',
          unassignedAt: null,
          unassignedBy: null
        }
      ];

      backendApiClient.get = async (url) => {
        expect(url).to.equal('/assignments/sessions/SESSION123/vehicles/VH001');
        return mockAssignments;
      };

      const result = await restAssignmentService.getVehicleAssignments('SESSION123', 'VH001');

      expect(result).to.have.lengthOf(2);
      expect(result[0].employeeId).to.equal('EMP001');
      expect(result[1].employeeId).to.equal('EMP002');
    });

    it('should return empty array if no assignments', async () => {
      backendApiClient.get = async (url) => {
        return [];
      };

      const result = await restAssignmentService.getVehicleAssignments('SESSION123', 'VH001');

      expect(result).to.have.lengthOf(0);
    });
  });

  describe('getEmployeeAssignment', () => {
    it('should get assignment for a specific employee in a session', async () => {
      const mockAssignment = {
        sessionId: 'SESSION123',
        employeeId: 'EMP001',
        vehicleId: 'VH001',
        assignedAt: '2024-01-01T09:00:00Z',
        assignedBy: 'ADMIN001',
        unassignedAt: null,
        unassignedBy: null
      };

      backendApiClient.get = async (url) => {
        expect(url).to.equal('/assignments/sessions/SESSION123/employees/EMP001');
        return mockAssignment;
      };

      const result = await restAssignmentService.getEmployeeAssignment('SESSION123', 'EMP001');

      expect(result.sessionId).to.equal('SESSION123');
      expect(result.employeeId).to.equal('EMP001');
      expect(result.vehicleId).to.equal('VH001');
    });
  });

  describe('mapBackendToFrontend', () => {
    it('should map backend assignment to frontend format', () => {
      const backendAssignment = {
        sessionId: 'SESSION123',
        employeeId: 'EMP001',
        vehicleId: 'VH001',
        assignedAt: '2024-01-01T09:00:00Z',
        assignedBy: 'ADMIN001',
        unassignedAt: '2024-01-01T17:00:00Z',
        unassignedBy: 'ADMIN001'
      };

      const frontend = restAssignmentService.mapBackendToFrontend(backendAssignment);

      expect(frontend.sessionId).to.equal('SESSION123');
      expect(frontend.employeeId).to.equal('EMP001');
      expect(frontend.vehicleId).to.equal('VH001');
      expect(frontend.assignedAt).to.equal('2024-01-01T09:00:00Z');
      expect(frontend.assignedBy).to.equal('ADMIN001');
      expect(frontend.unassignedAt).to.equal('2024-01-01T17:00:00Z');
      expect(frontend.unassignedBy).to.equal('ADMIN001');
    });

    it('should handle null unassignment fields', () => {
      const backendAssignment = {
        sessionId: 'SESSION123',
        employeeId: 'EMP001',
        vehicleId: 'VH001',
        assignedAt: '2024-01-01T09:00:00Z',
        assignedBy: 'ADMIN001',
        unassignedAt: null,
        unassignedBy: null
      };

      const frontend = restAssignmentService.mapBackendToFrontend(backendAssignment);

      expect(frontend.unassignedAt).to.be.null;
      expect(frontend.unassignedBy).to.be.null;
    });
  });

  describe('mapFrontendToBackend', () => {
    it('should map frontend assignment to backend format', () => {
      const frontendAssignment = {
        sessionId: 'SESSION123',
        employeeId: 'EMP001',
        vehicleId: 'VH001',
        assignedBy: 'ADMIN001'
      };

      const backend = restAssignmentService.mapFrontendToBackend(frontendAssignment);

      expect(backend.sessionId).to.equal('SESSION123');
      expect(backend.employeeId).to.equal('EMP001');
      expect(backend.vehicleId).to.equal('VH001');
      expect(backend.assignedBy).to.equal('ADMIN001');
    });

    it('should handle partial assignment data', () => {
      const partialAssignment = {
        sessionId: 'SESSION123',
        employeeId: 'EMP001',
        vehicleId: 'VH001'
      };

      const backend = restAssignmentService.mapFrontendToBackend(partialAssignment);

      expect(backend.sessionId).to.equal('SESSION123');
      expect(backend.employeeId).to.equal('EMP001');
      expect(backend.vehicleId).to.equal('VH001');
      expect(backend.assignedBy).to.be.undefined;
    });
  });
});