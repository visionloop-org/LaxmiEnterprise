import { memo } from 'react'
import ButtonGroup from './ButtonGroup'

function VehicleSelect({ value, onChange, vehicles, disabled = false, employees = [], employeeCategory = '' }) {
  const getVehicleCapacity = (vehicleId) => {
    const assignments = employees.filter(e => e.assignedVehicle === vehicleId)
    const driverCount = assignments.filter(e => e.category === 'Drivers').length
    const chalanManCount = assignments.filter(e => e.category === 'Chalan Men').length
    const workerCount = assignments.filter(e => 
      e.category === 'Workers' || e.category === 'Extra Labour'
    ).length
    return { driverCount, chalanManCount, workerCount, total: assignments.length }
  }

  const getVehicleScore = (vehicle, capacity) => {
    // Score vehicles based on suitability for employee's category
    let score = 0
    
    // Prefer vehicles that can accept this category
    if (employeeCategory === 'Drivers' && capacity.driverCount === 0) score += 10
    if (employeeCategory === 'Chalan Men' && capacity.chalanManCount === 0) score += 10
    if ((employeeCategory === 'Workers' || employeeCategory === 'Extra Labour') && capacity.workerCount < 6) score += 10
    
    // Prefer vehicles with more total capacity available
    score += (8 - capacity.total) * 2
    
    // Prefer unlocked vehicles
    if (!vehicle.locked) score += 5
    
    // Prefer available vehicles over in_use
    if (vehicle.status === 'available') score += 3
    
    return score
  }

  const sortedVehicles = [...vehicles].sort((a, b) => {
    const capacityA = getVehicleCapacity(a.id)
    const capacityB = getVehicleCapacity(b.id)
    const scoreA = getVehicleScore(a, capacityA)
    const scoreB = getVehicleScore(b, capacityB)
    return scoreB - scoreA
  })

  return (
    <ButtonGroup>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border-0 focus:ring-0 appearance-none pr-8 disabled:opacity-50"
      >
        <option value="">Select Vehicle</option>
        {sortedVehicles.map(v => {
          const capacity = getVehicleCapacity(v.id)
          const isFull = capacity.total >= 8
          const canAccept = 
            (employeeCategory === 'Drivers' && capacity.driverCount < 1) ||
            (employeeCategory === 'Chalan Men' && capacity.chalanManCount < 1) ||
            ((employeeCategory === 'Workers' || employeeCategory === 'Extra Labour') && capacity.workerCount < 6) ||
            !employeeCategory
          
          return (
            <option 
              key={v.id} 
              value={v.id}
              disabled={v.locked || isFull || !canAccept}
            >
              {v.number || v.name || v.id}{v.type ? ` (${v.type})` : ''} - D:{capacity.driverCount}/1 C:{capacity.chalanManCount}/1 W:{capacity.workerCount}/6
              {v.locked ? ' [LOCKED]' : ''}
              {isFull ? ' [FULL]' : ''}
              {!canAccept && !isFull && !v.locked ? ' [NO CAPACITY]' : ''}
            </option>
          )
        })}
      </select>
    </ButtonGroup>
  )
}

export default memo(VehicleSelect)
