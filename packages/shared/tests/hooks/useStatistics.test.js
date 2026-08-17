import { expect } from 'chai';
import { useStatistics } from '../../../../apps/supervisor/src/hooks/useStatistics.js';

describe('useStatistics Hook & Helper', () => {
  const mockEmployees = [
    { id: 'EMP001', name: 'Alice Smith', category: 'Workers', attendance: 'on_time', assignedVehicle: 'VH001' },
    { id: 'EMP002', name: 'Bob Jones', category: 'Drivers', attendance: 'arrived', assignedVehicle: 'VH001' },
    { id: 'EMP003', name: 'Charlie Day', category: 'Chalan Men', attendance: 'absent', labourRequest: 'minimum' },
    { id: 'EMP004', name: 'David Miller', category: 'Office', attendance: null },
    { id: 'EMP005', name: 'Edward Norton', category: 'Extra Labour', attendance: null }
  ];

  const mockVehicles = [
    { id: 'VH001', number: 'TN-01-AA-1111', status: 'in_use', capacity: 8, locked: false },
    { id: 'VH002', number: 'TN-02-BB-2222', status: 'available', capacity: 8, locked: false },
    { id: 'VH003', number: 'TN-03-CC-3333', status: 'maintenance', capacity: 8, locked: true }
  ];

  it('should return correct category counts including Vehicles', () => {
    const stats = useStatistics(mockEmployees, mockVehicles);

    expect(stats.getCategoryCount('All')).to.equal(5);
    expect(stats.getCategoryCount('Workers')).to.equal(1);
    expect(stats.getCategoryCount('Drivers')).to.equal(1);
    expect(stats.getCategoryCount('Chalan Men')).to.equal(1);
    expect(stats.getCategoryCount('Office')).to.equal(1);
    expect(stats.getCategoryCount('Extra Labour')).to.equal(1);
    expect(stats.getCategoryCount('Vehicles')).to.equal(3);
  });

  it('should return correct attendance counts', () => {
    const stats = useStatistics(mockEmployees, mockVehicles);

    expect(stats.totalCount).to.equal(5);
    expect(stats.completedCount).to.equal(3);
    expect(stats.pendingCount).to.equal(2);
    expect(stats.onTimeCount).to.equal(1);
    expect(stats.arrivedCount).to.equal(1);
    expect(stats.absentCount).to.equal(1);
    expect(stats.getAttendanceCount('Present')).to.equal(2);
    expect(stats.getAttendanceCount('Absent')).to.equal(1);
  });

  it('should return correct vehicle efficiency metrics', () => {
    const stats = useStatistics(mockEmployees, mockVehicles);

    expect(stats.assignedVehicles).to.have.lengthOf(1);
    expect(stats.lockedVehicles).to.equal(1);
    expect(stats.currentVehicleAssignments).to.equal(2);
    expect(stats.totalVehicleCapacity).to.equal(24);
  });

  it('should handle empty or undefined lists safely without throwing', () => {
    const stats = useStatistics([], []);

    expect(stats.totalCount).to.equal(0);
    expect(stats.getCategoryCount('Vehicles')).to.equal(0);
    expect(stats.getCategoryCount('All')).to.equal(0);
  });
});
