/**
 * EmployeeManagementTable Component
 * Searchable, paginated table of all employees with rate editing and deletion actions
 */

import { StatusBadge } from '@laxmi/shared'

const CATEGORIES = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']
const PAGE_SIZE = 25

export default function EmployeeManagementTable({
  employees,
  filteredEmps,
  pagedEmps,
  empSearch,
  setEmpSearch,
  empCat,
  setEmpCat,
  empPage,
  setEmpPage,
  onOpenBulkEditor,
  onExportPayroll,
  onEditEmployee,
  onDeleteEmployee,
  getEffectiveBase
}) {
  const totalPages = Math.ceil(filteredEmps.length / PAGE_SIZE)

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">👷 Employee Master &amp; Compensation</h2>
          <p className="panel-subtitle">{filteredEmps.length} of {employees.length} employees</p>
        </div>
        <div className="panel-actions">
          <button className="btn btn-sm btn-indigo" onClick={onOpenBulkEditor}>⚡ Bulk Edit</button>
          <button className="export-button" onClick={onExportPayroll}>↓ Export CSV</button>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search name, ID or contractor…"
          value={empSearch}
          onChange={e => { setEmpSearch(e.target.value); setEmpPage(1) }}
        />
        <select
          className="select-filter"
          value={empCat}
          onChange={e => { setEmpCat(e.target.value); setEmpPage(1) }}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="toolbar-spacer" />
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          {pagedEmps.length} of {filteredEmps.length} shown
        </span>
      </div>

      <div className="table-scroll-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Contractor</th>
              <th>Base Rate</th>
              <th>Extra (h)</th>
              <th>Incentive</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedEmps.length === 0 ? (
              <tr><td colSpan="9" className="empty-row">No employees match filters.</td></tr>
            ) : (
              pagedEmps.map(emp => (
                <tr key={emp.id}>
                  <td className="text-mono font-bold">{emp.id}</td>
                  <td>{emp.name}</td>
                  <td><span className="badge badge-neutral">{emp.category}</span></td>
                  <td>{emp.contractor || <span className="text-muted">In-House</span>}</td>
                  <td>₹{getEffectiveBase(emp)}</td>
                  <td>{emp.extraHours ? `${emp.extraHours}h` : '—'}</td>
                  <td>{emp.incentive ? `₹${emp.incentive}` : '—'}</td>
                  <td><StatusBadge status={emp.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-sky" onClick={() => onEditEmployee(emp)}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-sm btn-red" onClick={() => onDeleteEmployee(emp.id, emp.name)}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-sm btn-gray"
            disabled={empPage === 1}
            onClick={() => setEmpPage(p => p - 1)}
          >
            ← Prev
          </button>
          <span className="page-indicator">Page {empPage} of {totalPages}</span>
          <button
            className="btn btn-sm btn-gray"
            disabled={empPage === totalPages}
            onClick={() => setEmpPage(p => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
