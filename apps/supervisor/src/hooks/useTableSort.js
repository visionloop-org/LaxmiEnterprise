import { useState } from 'react'

export function useTableSort() {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortData = (data, category, employees) => {
    if (!sortConfig.key) return data

    const sorted = [...data].sort((a, b) => {
      let aValue, bValue

      if (category === 'Vehicles') {
        switch (sortConfig.key) {
          case 'id':
            aValue = a.id
            bValue = b.id
            break
          case 'number':
            aValue = a.number
            bValue = b.number
            break
          case 'type':
            aValue = a.type
            bValue = b.type
            break
          case 'status':
            aValue = a.status
            bValue = b.status
            break
          case 'capacity':
            const aAssignments = employees.filter(e => e.assignedVehicle === a.id).length
            const bAssignments = employees.filter(e => e.assignedVehicle === b.id).length
            aValue = aAssignments
            bValue = bAssignments
            break
          default:
            return 0
        }
      } else {
        switch (sortConfig.key) {
          case 'id':
            aValue = a.id
            bValue = b.id
            break
          case 'name':
            aValue = a.name
            bValue = b.name
            break
          case 'category':
            aValue = a.category
            bValue = b.category
            break
          case 'attendance':
            aValue = a.attendance || ''
            bValue = b.attendance || ''
            break
          case 'arrivalTime':
            aValue = a.arrivalTime || ''
            bValue = b.arrivalTime || ''
            break
          case 'vehicle':
            aValue = a.assignedVehicle || ''
            bValue = b.assignedVehicle || ''
            break
          default:
            return 0
        }
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }

  return { sortConfig, handleSort, sortData }
}
