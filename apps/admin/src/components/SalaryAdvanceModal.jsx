import { useState } from 'react'

/**
 * SalaryAdvanceModal Component
 * Allows Admin to issue, track, and settle mid-month cash advances (Peshgi / Khata)
 * Fully compliant with the PdfCraft design system.
 */
export default function SalaryAdvanceModal({ isOpen, onClose, employees = [], advances = [], onSaveAdvance, onSettleAdvance }) {
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [activeTab, setActiveTab] = useState('list') // 'list' | 'issue'

  if (!isOpen) return null

  const handleIssue = (e) => {
    e.preventDefault()
    if (!selectedEmpId || !amount || Number(amount) <= 0) {
      alert('Please select an employee and enter a valid advance amount.')
      return
    }

    const emp = employees.find(e => e.id === selectedEmpId)
    const newAdvance = {
      id: `ADV-${Date.now()}`,
      employeeId: selectedEmpId,
      employeeName: emp ? emp.name : 'Unknown',
      amount: parseFloat(amount),
      reason: reason.trim() || 'General Emergency / Personal Expense',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      approvedBy: 'Admin'
    }

    onSaveAdvance(newAdvance)
    setAmount('')
    setReason('')
    setSelectedEmpId('')
    setActiveTab('list')
  }

  const pendingAdvances = advances.filter(a => a.status !== 'deducted')
  const totalPendingAmount = pendingAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0)

  return (
    <div className="modal-overlay">
      <div className="modal-sheet" style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2>📒 Salary Advance &amp; Khata Ledger</h2>
            <p>Track mid-month cash advances (Peshgi) — auto-deducted during final bank payout</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 24px', borderBottom: '1px solid #334155', background: '#0f172a' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: activeTab === 'list' ? '#2563eb' : '#1e293b',
              color: '#fff',
              border: '1px solid #3b82f6',
              fontWeight: 600
            }}
            onClick={() => setActiveTab('list')}
          >
            📋 Active Advances ({pendingAdvances.length}) · ₹{totalPendingAmount.toLocaleString('en-IN')}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: activeTab === 'issue' ? '#059669' : '#1e293b',
              color: '#fff',
              border: '1px solid #10b981',
              fontWeight: 600
            }}
            onClick={() => setActiveTab('issue')}
          >
            ➕ Issue New Advance
          </button>
        </div>

        <div style={{ padding: '20px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
          {activeTab === 'issue' ? (
            <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Select Employee *
                </label>
                <select
                  className="select-filter"
                  style={{ width: '100%', padding: '8px 12px' }}
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id}) · {emp.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Advance Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="50"
                  className="search-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                  placeholder="e.g. 500, 1000, 2000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Reason / Notes
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                  placeholder="e.g. Festival advance, medical urgency, fuel allowance"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-sm" onClick={() => setActiveTab('list')}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm"
                  style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', fontWeight: 600 }}
                >
                  Confirm &amp; Record Advance
                </button>
              </div>
            </form>
          ) : (
            <div>
              {pendingAdvances.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                  <p style={{ fontSize: '14px', margin: 0 }}>✓ No pending advances recorded.</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>All workers are settled clean with zero deductions.</p>
                </div>
              ) : (
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Worker</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAdvances.map(adv => (
                      <tr key={adv.id}>
                        <td>{adv.date}</td>
                        <td>
                          <strong>{adv.employeeName || adv.employeeId}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>ID: {adv.employeeId}</span>
                        </td>
                        <td style={{ color: '#ef4444', fontWeight: 700 }}>₹{Number(adv.amount).toLocaleString('en-IN')}</td>
                        <td style={{ fontSize: '12px', color: '#94a3b8' }}>{adv.reason}</td>
                        <td>
                          <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                            <span className="badge-dot" /> To Deduct
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ fontSize: '10px', padding: '3px 7px', background: '#334155', color: '#f8fafc', border: '1px solid #475569' }}
                            onClick={() => onSettleAdvance(adv.id)}
                            title="Mark as already deducted or settled manually"
                          >
                            Mark Settled
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
