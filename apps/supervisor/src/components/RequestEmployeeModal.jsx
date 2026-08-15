import { useState } from 'react'
import { useAddEmployee } from '@laxmi/shared'

export default function RequestEmployeeModal({ isOpen, onClose, notify }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Workers')
  const [phone, setPhone] = useState('')
  const [contractor, setContractor] = useState('')
  const [baseRate, setBaseRate] = useState('')
  const [remarks, setRemarks] = useState('')

  const addEmployeeMutation = useAddEmployee()

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const newEmpId = `EMP${Math.floor(1000 + Math.random() * 9000)}`
    
    try {
      await addEmployeeMutation.mutateAsync({
        id: newEmpId,
        employeeId: newEmpId,
        name: name.trim(),
        category,
        phone: phone.trim() || null,
        contractor: contractor.trim() || null,
        baseRate: baseRate ? parseFloat(baseRate) : null,
        remarks: remarks.trim() || null,
        status: 'pending_approval'
      })

      if (notify) {
        notify('success', `Employee request for "${name}" submitted! Awaiting Admin approval.`)
      }
      onClose()
    } catch (err) {
      if (notify) {
        notify('error', err.message || 'Failed to submit employee request.')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Request New Employee</h2>
            <p className="text-xs text-gray-500">Submitted to Admin for verification &amp; approval</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Workers">Workers (Daily ₹500)</option>
              <option value="Drivers">Drivers (Daily ₹800)</option>
              <option value="Chalan Men">Chalan Men (Daily ₹650)</option>
              <option value="Office">Office (Daily ₹750)</option>
              <option value="Extra Labour">Extra Labour (Daily ₹450)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contractor / Vendor</label>
            <input
              type="text"
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
              placeholder="e.g. Laxmi Staffing Services"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Daily Base Rate (₹)</label>
            <input
              type="number"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
              placeholder="Optional override"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Temporary site allocation reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="submit"
              disabled={addEmployeeMutation.isLoading}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {addEmployeeMutation.isLoading ? 'Submitting...' : 'Submit for Admin Approval'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
