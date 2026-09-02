/**
 * BulkCompensationModal Component
 * Allows batch-updating Base Rate, Extra Duty Hours, and Incentives with CSV import/export
 */

const CATEGORIES = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']

export default function BulkCompensationModal({
  bulkOpen,
  setBulkOpen,
  bulkDraft,
  setDraftField,
  batchCat,
  setBatchCat,
  batchBase,
  setBatchBase,
  batchExtra,
  setBatchExtra,
  batchIncentive,
  setBatchIncentive,
  applyBatchPreset,
  bulkSearch,
  setBulkSearch,
  bulkCat,
  setBulkCat,
  bulkFiltered,
  modifiedCount,
  saveBulk,
  downloadTemplate,
  fileInputRef,
  handleCsvUpload,
  getEffectiveBase,
  totalEmployeesCount
}) {
  if (!bulkOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2>⚡ Bulk Compensation &amp; Incentive Editor</h2>
            <p>Adjust Base Rate (₹), Extra Duty Hours, and Incentive Bonus (₹) for all employees</p>
          </div>
          <button className="modal-close" onClick={() => setBulkOpen(false)}>✕</button>
        </div>

        {/* Batch Preset & CSV Row */}
        <div className="modal-toolbar">
          <div className="modal-toolbar-left">
            <span className="batch-label">Batch preset:</span>
            <select
              className="select-filter"
              value={batchCat}
              onChange={e => setBatchCat(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              className="batch-input"
              type="number"
              placeholder="Base Rate (₹)"
              value={batchBase}
              onChange={e => setBatchBase(e.target.value)}
            />
            <input
              className="batch-input"
              type="number"
              placeholder="Extra (h)"
              value={batchExtra}
              onChange={e => setBatchExtra(e.target.value)}
            />
            <input
              className="batch-input"
              type="number"
              placeholder="Incentive (₹)"
              value={batchIncentive}
              onChange={e => setBatchIncentive(e.target.value)}
            />
            <button className="btn btn-indigo btn-sm" onClick={applyBatchPreset}>
              Apply Preset
            </button>
          </div>
          <div className="modal-toolbar-right">
            <button className="btn btn-sky btn-sm" onClick={downloadTemplate}>
              📥 Download Template
            </button>
            <label className="btn btn-green btn-sm" style={{ cursor: 'pointer' }}>
              📤 Upload CSV
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleCsvUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* Filter bar */}
        <div className="modal-filter-bar">
          <div className="flex items-center gap-2">
            <input
              className="search-input"
              type="text"
              placeholder="Filter employees…"
              value={bulkSearch}
              onChange={e => setBulkSearch(e.target.value)}
            />
            <select
              className="select-filter"
              value={bulkCat}
              onChange={e => setBulkCat(e.target.value)}
            >
              <option value="All">All ({totalEmployeesCount})</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            {modifiedCount > 0 ? (
              <span className="modified-counter">⚠️ {modifiedCount} employee(s) modified</span>
            ) : (
              <span className="no-changes-counter">No changes yet</span>
            )}
          </div>
        </div>

        {/* Editable table */}
        <div className="modal-body">
          <table className="data-table sticky-header">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Contractor</th>
                <th>Base Rate (₹)</th>
                <th>Extra Duty (h)</th>
                <th>Incentive (₹)</th>
                <th>Est. Day Total</th>
              </tr>
            </thead>
            <tbody>
              {bulkFiltered.map(emp => {
                const row = bulkDraft[emp.id] || { baseRate: getEffectiveBase(emp), extraHours: 0, incentive: 0 }
                const base = parseFloat(row.baseRate) || 0
                const extraH = parseFloat(row.extraHours) || 0
                const inc = parseFloat(row.incentive) || 0
                const total = base + extraH * (base / 8) * 1.5 + inc
                return (
                  <tr key={emp.id} className={row.modified ? 'row-modified' : ''}>
                    <td className="text-mono font-bold">{emp.id}</td>
                    <td>{emp.name}</td>
                    <td><span className="badge badge-neutral">{emp.category}</span></td>
                    <td className="text-muted">{emp.contractor || 'In-House'}</td>
                    <td>
                      <input
                        className="cell-input"
                        type="number"
                        min="0"
                        value={row.baseRate}
                        onChange={e => setDraftField(emp.id, 'baseRate', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="cell-input"
                        type="number"
                        min="0"
                        step="0.5"
                        value={row.extraHours}
                        onChange={e => setDraftField(emp.id, 'extraHours', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="cell-input"
                        type="number"
                        min="0"
                        value={row.incentive}
                        onChange={e => setDraftField(emp.id, 'incentive', e.target.value)}
                      />
                    </td>
                    <td>
                      <span className="font-bold text-success">
                        ₹{Math.round(total).toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-gray" onClick={() => setBulkOpen(false)}>Cancel</button>
          <button
            className="btn btn-blue"
            onClick={saveBulk}
            disabled={modifiedCount === 0}
          >
            Save All Changes {modifiedCount > 0 && `(${modifiedCount})`}
          </button>
        </div>
      </div>
    </div>
  )
}
