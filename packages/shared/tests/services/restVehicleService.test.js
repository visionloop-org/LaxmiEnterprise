const { expect } = require('chai');
const { restVehicleService } = require('../../services/restVehicleService');
const { backendApiClient } = require('../../services/backendApi');

describe('RestVehicleService', () => {
  let originalGet, originalPost, originalPatch, originalDelete;

  beforeEach(() => {
    originalGet = backendApiClient.get;
    originalPost = backendApiClient.post;
    originalPatch = backendApiClient.patch;
    originalDelete = backendApiClient.delete;
  });

  afterEach(() => {
    backendApiClient.get = originalGet;
    backendApiClient.post = originalPost;
    backendApiClient.patch = originalPatch;
    backendApiClient.delete = originalDelete;
  });

  describe('fetchVehicles', () => {
    it('should fetch vehicles without filters', async () => {
      const mockVehicles = [
        {
          vehicleNumber: 'VH001',
          vehicleType: 'Truck',
          capacity: 10,
          status: 'Available',
          active: true,
          perRoleCapacity: { Driver: 1, Helper: 9 },
          assignedDriver: 'DRV001'
        }
      ];

      backendApiClient.get = async (url) => {
        expect(url).to.equal('/vehicles/');
        return mockVehicles;
      };

      const result = await restVehicleService.fetchVehicles();

      expect(result).to.have.lengthOf(1);
      expect(result[0].id).to.equal('VH001');
      expect(result[0].name).to.equal('VH001');
      expect(result[0].category).to.equal('Vehicles');
      expect(result[0].capacity).to.equal(10);
    });

    it('should fetch vehicles with vehicle_type filter', async () => {
      backendApiClient.get = async (url) => {
        expect(url).to.include('vehicle_type=Truck');
        return [];
      };

      await restVehicleService.fetchVehicles({ vehicle_type: 'Truck' });
    });

    it('should fetch vehicles with status filter', async () => {
      backendApiClient.get = async (url) => {
        expect(url).to.include('status=Available');
        return [];
      };

      await restVehicleService.fetchVehicles({ status: 'Available' });
    });

    it('should fetch vehicles with active filter', async () => {
      backendApiClient.get = async (url) => {
        expect(url).to.include('active=true');
        return [];
      };

      await restVehicleService.fetchVehicles({ active: true });
    });

    it('should fetch vehicles with multiple filters', async () => {
      backendApiClient.get = async (url) => {
        expect(url).to.include('vehicle_type=Truck');
        expect(url).to.include('status=Available');
        expect(url).to.include('active=true');
        return [];
      };

      await restVehicleService.fetchVehicles({ vehicle_type: 'Truck', status: 'Available', active: true });
    });
  });

  describe('fetchVehicle', () => {
    it('should fetch a single vehicle by number', async () => {
      const mockVehicle = {
        vehicleNumber: 'VH001',
        vehicleType: 'Truck',
        capacity: 10,
        status: 'Available',
        active: true,
        perRoleCapacity: { Driver: 1, Helper: 9 },
        assignedDriver: 'DRV001'
      };

      backendApiClient.get = async (url) => {
        expect(url).to.equal('/vehicles/VH001');
        return mockVehicle;
      };

      const result = await restVehicleService.fetchVehicle('VH001');

      expect(result.id).to.equal('VH001');
      expect(result.name).to.equal('VH001');
      expect(result.capacity).to.equal(10);
    });
  });

  describe('addVehicle', () => {
    it('should add a new vehicle', async () => {
      const newVehicle = {
        id: 'VH002',
        name: 'VH002',
        category: 'Truck',
        capacity: 15,
        status: 'Available',
        active: true,
        perRoleCapacity: { Driver: 1, Helper: 14 },
        assignedDriver: 'DRV002'
      };

      const mockResult = {
        vehicleNumber: 'VH002',
        vehicleType: 'Truck',
        capacity: 15,
        status: 'Available',
        active: true,
        perRoleCapacity: { Driver: 1, Helper: 14 },
        assignedDriver: 'DRV002'
      };

      backendApiClient.post = async (url, data) => {
        expect(url).to.equal('/vehicles/');
        expect(data.vehicleNumber).to.equal('VH002');
        expect(data.vehicleType).to.equal('Truck');
        expect(data.capacity).to.equal(15);
        return mockResult;
      };

      const result = await restVehicleService.addVehicle(newVehicle);

      expect(result.id).to.equal('VH002');
      expect(result.capacity).to.equal(15);
    });

    it('should set default values if not provided', async () => {
      const newVehicle = {
        id: 'VH003',
        capacity: 10
      };

      backendApiClient.post = async (url, data) => {
        expect(data.vehicleType).to.equal('Truck');
        expect(data.status).to.equal('Available');
        expect(data.active).to.be.true;
        return { vehicleNumber: 'VH003', vehicleType: 'Truck', capacity: 10, status: 'Available', active: true };
      };

      await restVehicleService.addVehicle(newVehicle);
    });
  });

  describe('updateVehicle', () => {
    it('should update an existing vehicle', async () => {
      const updateData = {
        status: 'In Use',
        capacity: 12
      };

      const mockResult = {
        vehicleNumber: 'VH001',
        vehicleType: 'Truck',
        capacity: 12,
        status: 'In Use',
        active: true,
        perRoleCapacity: { Driver: 1, Helper: 11 },
        assignedDriver: 'DRV001'
      };

      backendApiClient.patch = async (url, data) => {
        expect(url).to.equal('/vehicles/VH001');
        expect(data.status).to.equal('In Use');
        expect(data.capacity).to.equal(12);
        return mockResult;
      };

      const result = await restVehicleService.updateVehicle('VH001', updateData);

      expect(result.status).to.equal('In Use');
      expect(result.capacity).to.equal(12);
    });

    it('should only include provided fields in update', async () => {
      const updateData = {
        status: 'In Use'
      };

      backendApiClient.patch = async (url, data) => {
        expect(data.status).to.equal('In Use');
        expect(data.capacity).to.be.undefined;
        expect(data.active).to.be.undefined;
        return { vehicleNumber: 'VH001', vehicleType: 'Truck', capacity: 10, status: 'In Use', active: true };
      };

      await restVehicleService.updateVehicle('VH001', updateData);
    });
  });

  describe('mapBackendToFrontend', () => {
    it('should map backend vehicle to frontend format', () => {
      const backendVehicle = {
        vehicleNumber: 'VH001',
        vehicleType: 'Truck',
        capacity: 10,
        status: 'Available',
        active: true,
        perRoleCapacity: { Driver: 1, Helper: 9 },
        assignedDriver: 'DRV001'
      };

      const frontend = restVehicleService.mapBackendToFrontend(backendVehicle);

      expect(frontend.id).to.equal('VH001');
      expect(frontend.name).to.equal('VH001');
      expect(frontend.category).to.equal('Vehicles');
      expect(frontend.capacity).to.equal(10);
      expect(frontend.status).to.equal('Available');
      expect(frontend.active).to.be.true;
      expect(frontend.perRoleCapacity).to.deep.equal({ Driver: 1, Helper: 9 });
      expect(frontend.assignedDriver).to.equal('DRV001');
    });

    it('should handle missing optional fields', () => {
      const backendVehicle = {
        vehicleNumber: 'VH002',
        vehicleType: 'Truck',
        capacity: 5,
        status: 'Available',
        active: true
      };

      const frontend = restVehicleService.mapBackendToFrontend(backendVehicle);

      expect(frontend.id).to.equal('VH002');
      expect(frontend.perRoleCapacity).to.deep.equal({});
      expect(frontend.assignedDriver).to.be.null;
    });

    it('should handle zero capacity', () => {
      const backendVehicle = {
        vehicleNumber: 'VH003',
        vehicleType: 'Truck',
        capacity: 0,
        status: 'Available',
        active: true
      };

      const frontend = restVehicleService.mapBackendToFrontend(backendVehicle);

      expect(frontend.capacity).to.equal(0);
    });
  });

  describe('mapFrontendToBackend', () => {
    it('should map frontend vehicle to backend format', () => {
      const frontendVehicle = {
        id: 'VH001',
        name: 'VH001',
        category: 'Truck',
        capacity: 10,
        status: 'Available',
        active: true,
        perRoleCapacity: { Driver: 1, Helper: 9 },
        assignedDriver: 'DRV001'
      };

      const backend = restVehicleService.mapFrontendToBackend(frontendVehicle);

      expect(backend.vehicleNumber).to.equal('VH001');
      expect(backend.vehicleType).to.equal('Truck');
      expect(backend.capacity).to.equal(10);
      expect(backend.status).to.equal('Available');
      expect(backend.active).to.be.true;
      expect(backend.perRoleCapacity).to.deep.equal({ Driver: 1, Helper: 9 });
      expect(backend.assignedDriver).to.equal('DRV001');
    });

    it('should use name as vehicleNumber if id not provided', () => {
      const frontendVehicle = {
        name: 'VH002',
        category: 'Truck',
        capacity: 10
      };

      const backend = restVehicleService.mapFrontendToBackend(frontendVehicle);

      expect(backend.vehicleNumber).to.equal('VH002');
    });

    it('should set default values if not provided', () => {
      const frontendVehicle = {
        id: 'VH003',
        capacity: 10
      };

      const backend = restVehicleService.mapFrontendToBackend(frontendVehicle);

      expect(backend.vehicleType).to.equal('Truck');
      expect(backend.status).to.equal('Available');
      expect(backend.active).to.be.true;
    });
  });

  describe('mapFrontendToBackendForUpdate', () => {
    it('should map partial frontend vehicle to backend update format', () => {
      const partialVehicle = {
        status: 'In Use',
        capacity: 12
      };

      const backend = restVehicleService.mapFrontendToBackendForUpdate(partialVehicle);

      expect(backend.status).to.equal('In Use');
      expect(backend.capacity).to.equal(12);
      expect(backend.vehicleType).to.be.undefined;
      expect(backend.active).to.be.undefined;
    });

    it('should map id to vehicleNumber', () => {
      const partialVehicle = {
        id: 'VH004'
      };

      const backend = restVehicleService.mapFrontendToBackendForUpdate(partialVehicle);

      expect(backend.vehicleNumber).to.equal('VH004');
    });

    it('should map category to vehicleType', () => {
      const partialVehicle = {
        category: 'Bus'
      };

      const backend = restVehicleService.mapFrontendToBackendForUpdate(partialVehicle);

      expect(backend.vehicleType).to.equal('Bus');
    });
  });
});