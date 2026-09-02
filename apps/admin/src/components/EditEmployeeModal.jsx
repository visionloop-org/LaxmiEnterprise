/**
 * EditEmployeeModal Component
 * Modal dialog for modifying worker profile, rates, contractor, and employment status
 */

const CATEGORIES = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']

export default function EditEmployeeModal({
  editingEmp,
  setEditingEmp,
  onSaveEdit,
  getEffectiveBase
}) {
  if (!editingEmp) return null

  const b = editingEmp.baseRate ? parseFloat(editingEmp.baseRate) : getEffectiveBase(editingEmp)
  const h = parseFloat(editingEmp.extraHours) || 0
  const i = parseFloat(editingEmp.incentive) || 0
  const t = b + h * (b / 8) * 1.5 + i

  return (
    <div className="modal-overlay">
      <div className="edit-modal-sheet">
        <h3>✏️ Edit Employee — {editingEmp.name}</h3>
        <form onSubmit={onSaveEdit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-control"
              type="text"
              value={editingEmp.name}
              onChange={e => setEditingEmp({ ...editingEmp, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-control"
              value={editingEmp.category}
              onChange={e => setEditingEmp({ ...editingEmp, category: e.target.value })}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Contractor / Agency</label>
            <input
              className="form-control"
              type="text"
              placeholder="e.g. Jai Bhavani Labour (or leave blank for In-House)"
              value={editingEmp.contractor || ''}
              onChange={e => setEditingEmp({ ...editingEmp, contractor: e.target.value })}
            />
          </div>

          <div className="form-row" style={{ marginBottom: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Base Rate (₹)</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={editingEmp.baseRate ?? getEffectiveBase(editingEmp)}
                onChange={e => setEditingEmp({ ...editingEmp, baseRate: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Extra Duty (h)</label>
              <input
                className="form-control"
                type="number"
                min="0"
                step="0.5"
                value={editingEmp.extraHours ?? 0}
                onChange={e => setEditingEmp({ ...editingEmp, extraHours: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Incentive (₹)</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={editingEmp.incentive ?? 0}
                onChange={e => setEditingEmp({ ...editingEmp, incentive: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={editingEmp.status}
              onChange={e => setEditingEmp({ ...editingEmp, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="rejected">Rejected</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Live compensation preview */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 6,
            padding: '10px 12px',
            marginBottom: 12,
            fontSize: '0.82rem',
            color: '#15803d'
          }}>
            <strong>Est. Daily Pay:</strong> ₹{b} base + ₹{Math.round(h * (b / 8) * 1.5)} overtime + ₹{i} incentive = <strong>₹{Math.round(t)}</strong>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-blue" style={{ flex: 1 }}>Save Changes</button>
            <button type="button" className="btn btn-gray" onClick={() => setEditingEmp(null)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
