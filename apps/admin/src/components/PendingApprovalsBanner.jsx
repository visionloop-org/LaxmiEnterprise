/**
 * PendingApprovalsBanner Component
 * Alert banner showing supervisor requests for new on-demand labour with Approve/Reject buttons
 */

import { StatusBadge } from '@laxmi/shared'

export default function PendingApprovalsBanner({
  pendingEmps,
  onApprove,
  onReject
}) {
  if (!pendingEmps || pendingEmps.length === 0) return null

  return (
    <div className="alert-banner alert-warning">
      <div>
        <h3>⚠️ Pending Employee Requests ({pendingEmps.length})</h3>
        <p>Shift supervisors requested additional workers on-site. Approve to add them to today's active payroll roster.</p>
      </div>
      <div className="table-scroll-wrapper" style={{ marginTop: '0.75rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Contractor</th>
              <th>Requested By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingEmps.map(emp => (
              <tr key={emp.id}>
                <td className="text-mono font-bold">{emp.id}</td>
                <td>{emp.name}</td>
                <td>
                  <StatusBadge status="active" />
                  <span style={{ marginLeft: 4 }}>{emp.category}</span>
                </td>
                <td>{emp.contractor || '—'}</td>
                <td>{emp.requestedBy || 'Supervisor'}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-green" onClick={() => onApprove(emp.id)}>
                      ✓ Approve
                    </button>
                    <button className="btn btn-sm btn-red" onClick={() => onReject(emp.id)}>
                      ✗ Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
