const { expect } = require('chai');
const { restEmployeeService } = require('../../services/restEmployeeService');
const { backendApiClient } = require('../../services/backendApi');

describe('RestEmployeeService', () => {
  let originalGet, originalPost, originalPut, originalDelete;

  beforeEach(() => {
    originalGet = backendApiClient.get;
    originalPost = backendApiClient.post;
    originalPut = backendApiClient.put;
    originalDelete = backendApiClient.delete;
  });

  afterEach(() => {
    backendApiClient.get = originalGet;
    backendApiClient.post = originalPost;
    backendApiClient.put = originalPut;
    backendApiClient.delete = originalDelete;
  });

  describe('fetchEmployees', () => {
    it('should fetch employees without filters', async () => {
      const mockEmployees = [
        {
          employeeId: 'EMP001',
          name: 'John Doe',
          category: 'Driver',
          photoPath: '/photos/john.jpg',
          status: 'active',
          contractor: 'ABC Corp',
          remarks: 'Experienced driver'
        }
      ];

      backendApiClient.get = async (url) => {
        expect(url).to.equal('/employees/');
        return mockEmployees;
      };

      const result = await restEmployeeService.fetchEmployees();

      expect(result).to.have.lengthOf(1);
      expect(result[0].id).to.equal('EMP001');
      expect(result[0].name).to.equal('John Doe');
      expect(result[0].category).to.equal('Driver');
    });

    it('should fetch employees with category filter', async () => {
      backendApiClient.get = async (url) => {
        expect(url).to.include('category=Driver');
        return [];
      };

      await restEmployeeService.fetchEmployees({ category: 'Driver' });
    });

    it('should fetch employees with status filter', async () => {
      backendApiClient.get = async (url) => {
        expect(url).to.include('status=active');
        return [];
      };

      await restEmployeeService.fetchEmployees({ status: 'active' });
    });

    it('should fetch employees with multiple filters', async () => {
      backendApiClient.get = async (url) => {
        expect(url).to.include('category=Driver');
        expect(url).to.include('status=active');
        return [];
      };

      await restEmployeeService.fetchEmployees({ category: 'Driver', status: 'active' });
    });
  });

  describe('fetchEmployee', () => {
    it('should fetch a single employee by ID', async () => {
      const mockEmployee = {
        employeeId: 'EMP001',
        name: 'John Doe',
        category: 'Driver',
        photoPath: '/photos/john.jpg',
        status: 'active',
        contractor: 'ABC Corp',
        remarks: 'Experienced driver'
      };

      backendApiClient.get = async (url) => {
        expect(url).to.equal('/employees/EMP001');
        return mockEmployee;
      };

      const result = await restEmployeeService.fetchEmployee('EMP001');

      expect(result.id).to.equal('EMP001');
      expect(result.name).to.equal('John Doe');
    });
  });

  describe('updateAttendance', () => {
    it('should update employee attendance', async () => {
      const mockResult = {
        employeeId: 'EMP001',
        name: 'John Doe',
        category: 'Driver',
        photoPath: '/photos/john.jpg',
        status: 'active',
        contractor: 'ABC Corp',
        remarks: 'Updated attendance'
      };

      backendApiClient.put = async (url, data) => {
        expect(url).to.equal('/attendance/sessions/SESSION123/employees/EMP001');
        expect(data.status).to.equal('on_time');
        expect(data.arrivalTime).to.equal('09:00');
        expect(data.remarks).to.equal('On time');
        return mockResult;
      };

      const result = await restEmployeeService.updateAttendance(
        'SESSION123',
        'EMP001',
        'On Time',
        '09:00',
        'On time'
      );

      expect(result.id).to.equal('EMP001');
    });

    it('should map attendance status correctly', async () => {
      backendApiClient.put = async (url, data) => {
        expect(data.status).to.equal('on_time');
        return { employeeId: 'EMP001', name: 'Test', category: 'Driver', status: 'active' };
      };

      await restEmployeeService.updateAttendance('SESSION123', 'EMP001', 'On Time');
    });

    it('should handle null arrival time and remarks', async () => {
      backendApiClient.put = async (url, data) => {
        expect(data.arrivalTime).to.be.null;
        expect(data.remarks).to.be.null;
        return { employeeId: 'EMP001', name: 'Test', category: 'Driver', status: 'active' };
      };

      await restEmployeeService.updateAttendance('SESSION123', 'EMP001', 'Absent');
    });
  });

  describe('addEmployee', () => {
    it('should add a new employee', async () => {
      const newEmployee = {
        id: 'EMP002',
        name: 'Jane Smith',
        category: 'Helper',
        photo: '/photos/jane.jpg',
        status: 'active',
        contractor: 'XYZ Corp',
        remarks: 'New hire'
      };

      const mockResult = {
        employeeId: 'EMP002',
        name: 'Jane Smith',
        category: 'Helper',
        photoPath: '/photos/jane.jpg',
        status: 'active',
        contractor: 'XYZ Corp',
        remarks: 'New hire'
      };

      backendApiClient.post = async (url, data) => {
        expect(url).to.equal('/employees/');
        expect(data.employeeId).to.equal('EMP002');
        expect(data.name).to.equal('Jane Smith');
        return mockResult;
      };

      const result = await restEmployeeService.addEmployee(newEmployee);

      expect(result.id).to.equal('EMP002');
      expect(result.name).to.equal('Jane Smith');
    });

    it('should set default status if not provided', async () => {
      const newEmployee = {
        id: 'EMP003',
        name: 'Bob Johnson',
        category: 'Driver'
      };

      backendApiClient.post = async (url, data) => {
        expect(data.status).to.equal('active');
        return { employeeId: 'EMP003', name: 'Bob Johnson', category: 'Driver', status: 'active' };
      };

      await restEmployeeService.addEmployee(newEmployee);
    });
  });

  describe('updateEmployee', () => {
    it('should update an existing employee', async () => {
      const updateData = {
        name: 'John Updated',
        category: 'Driver'
      };

      const mockResult = {
        employeeId: 'EMP001',
        name: 'John Updated',
        category: 'Driver',
        photoPath: '/photos/john.jpg',
        status: 'active',
        contractor: 'ABC Corp',
        remarks: 'Updated'
      };

      backendApiClient.put = async (url, data) => {
        expect(url).to.equal('/employees/EMP001');
        expect(data.name).to.equal('John Updated');
        expect(data.category).to.equal('Driver');
        return mockResult;
      };

      const result = await restEmployeeService.updateEmployee('EMP001', updateData);

      expect(result.name).to.equal('John Updated');
    });

    it('should only include provided fields in update', async () => {
      const updateData = {
        name: 'John Updated'
      };

      backendApiClient.put = async (url, data) => {
        expect(data.name).to.equal('John Updated');
        expect(data.category).to.be.undefined;
        expect(data.status).to.be.undefined;
        return { employeeId: 'EMP001', name: 'John Updated', category: 'Driver', status: 'active' };
      };

      await restEmployeeService.updateEmployee('EMP001', updateData);
    });
  });

  describe('approveEmployee', () => {
    it('should approve an employee', async () => {
      const mockResult = {
        employeeId: 'EMP001',
        name: 'John Doe',
        category: 'Driver',
        photoPath: '/photos/john.jpg',
        status: 'active',
        contractor: 'ABC Corp',
        remarks: 'Approved'
      };

      backendApiClient.post = async (url, data) => {
        expect(url).to.equal('/employees/EMP001/approve');
        expect(data).to.deep.equal({});
        return mockResult;
      };

      const result = await restEmployeeService.approveEmployee('EMP001');

      expect(result.id).to.equal('EMP001');
    });
  });

  describe('rejectEmployee', () => {
    it('should reject an employee', async () => {
      const mockResult = {
        employeeId: 'EMP001',
        name: 'John Doe',
        category: 'Driver',
        photoPath: '/photos/john.jpg',
        status: 'rejected',
        contractor: 'ABC Corp',
        remarks: 'Rejected'
      };

      backendApiClient.post = async (url, data) => {
        expect(url).to.equal('/employees/EMP001/reject');
        expect(data).to.deep.equal({});
        return mockResult;
      };

      const result = await restEmployeeService.rejectEmployee('EMP001');

      expect(result.id).to.equal('EMP001');
      expect(result.status).to.equal('rejected');
    });
  });

  describe('deleteEmployee', () => {
    it('should delete an employee', async () => {
      backendApiClient.delete = async (url) => {
        expect(url).to.equal('/employees/EMP001');
      };

      await restEmployeeService.deleteEmployee('EMP001');
    });
  });

  describe('mapBackendToFrontend', () => {
    it('should map backend employee to frontend format', () => {
      const backendEmployee = {
        employeeId: 'EMP001',
        name: 'John Doe',
        category: 'Driver',
        photoPath: '/photos/john.jpg',
        status: 'active',
        contractor: 'ABC Corp',
        remarks: 'Test remarks'
      };

      const frontend = restEmployeeService.mapBackendToFrontend(backendEmployee);

      expect(frontend.id).to.equal('EMP001');
      expect(frontend.name).to.equal('John Doe');
      expect(frontend.category).to.equal('Driver');
      expect(frontend.photo).to.equal('/photos/john.jpg');
      expect(frontend.attendance).to.be.null;
      expect(frontend.arrivalTime).to.be.null;
      expect(frontend.assignedVehicle).to.be.null;
      expect(frontend.labourRequest).to.be.null;
      expect(frontend.status).to.equal('active');
      expect(frontend.contractor).to.equal('ABC Corp');
      expect(frontend.remarks).to.equal('Test remarks');
    });
  });

  describe('mapFrontendToBackend', () => {
    it('should map frontend employee to backend format', () => {
      const frontendEmployee = {
        id: 'EMP001',
        name: 'John Doe',
        category: 'Driver',
        photo: '/photos/john.jpg',
        status: 'active',
        contractor: 'ABC Corp',
        remarks: 'Test remarks'
      };

      const backend = restEmployeeService.mapFrontendToBackend(frontendEmployee);

      expect(backend.employeeId).to.equal('EMP001');
      expect(backend.name).to.equal('John Doe');
      expect(backend.category).to.equal('Driver');
      expect(backend.photoPath).to.equal('/photos/john.jpg');
      expect(backend.status).to.equal('active');
      expect(backend.contractor).to.equal('ABC Corp');
      expect(backend.remarks).to.equal('Test remarks');
    });
  });

  describe('mapFrontendToBackendForUpdate', () => {
    it('should map partial frontend employee to backend update format', () => {
      const partialEmployee = {
        name: 'John Updated',
        category: 'Helper'
      };

      const backend = restEmployeeService.mapFrontendToBackendForUpdate(partialEmployee);

      expect(backend.name).to.equal('John Updated');
      expect(backend.category).to.equal('Helper');
      expect(backend.photoPath).to.be.undefined;
      expect(backend.status).to.be.undefined;
    });
  });

  describe('mapAttendanceStatus', () => {
    it('should map frontend status to backend format', () => {
      expect(restEmployeeService.mapAttendanceStatus('On Time')).to.equal('on_time');
      expect(restEmployeeService.mapAttendanceStatus('Arrived')).to.equal('arrived');
      expect(restEmployeeService.mapAttendanceStatus('Absent')).to.equal('absent');
      expect(restEmployeeService.mapAttendanceStatus('on_time')).to.equal('on_time');
    });

    it('should return original status if not in map', () => {
      expect(restEmployeeService.mapAttendanceStatus('unknown')).to.equal('unknown');
    });
  });

  describe('mapAttendanceStatusFromBackend', () => {
    it('should map backend status to frontend format', () => {
      expect(restEmployeeService.mapAttendanceStatusFromBackend('on_time')).to.equal('On Time');
      expect(restEmployeeService.mapAttendanceStatusFromBackend('arrived')).to.equal('Arrived');
      expect(restEmployeeService.mapAttendanceStatusFromBackend('absent')).to.equal('Absent');
    });

    it('should return original status if not in map', () => {
      expect(restEmployeeService.mapAttendanceStatusFromBackend('unknown')).to.equal('unknown');
    });
  });
});