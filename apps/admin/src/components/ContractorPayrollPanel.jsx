/**
 * ContractorPayrollPanel Component
 * Displays contractor agency breakdown of workers, presence, and net wages
 */

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function ContractorPayrollPanel({
  contractorSummary,
  showContractor,
  setShowContractor,
  onExportCsv
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">🏢 Contractor Payroll &amp; Settlement</h2>
          <p className="panel-subtitle">Daily wages, overtime &amp; incentives grouped by contractor</p>
        </div>
        <div className="panel-actions">
          <button className="export-button" onClick={onExportCsv}>↓ Export CSV</button>
          <button
            className={`panel-toggle ${showContractor ? 'open' : ''}`}
            onClick={() => setShowContractor(v => !v)}
          >
            {showContractor ? 'Collapse' : 'Expand'} <ChevronDown />
          </button>
        </div>
      </div>
      {showContractor && (
        <div className="table-scroll-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contractor</th>
                <th>Workers</th>
                <th>Present</th>
                <th>Base Pay</th>
                <th>Overtime (1.5×)</th>
                <th>Incentives</th>
                <th>Net Payable</th>
              </tr>
            </thead>
            <tbody>
              {contractorSummary.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    No contractor data — attendance not yet recorded today.
                  </td>
                </tr>
              ) : (
                contractorSummary.map(c => (
                  <tr key={c.name}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.workers}</td>
                    <td><span className="badge badge-success">{c.present} present</span></td>
                    <td>₹{c.base.toLocaleString('en-IN')}</td>
                    <td>₹{Math.round(c.extra).toLocaleString('en-IN')} <span className="text-muted">({c.extraH}h)</span></td>
                    <td>₹{c.inc.toLocaleString('en-IN')}</td>
                    <td><strong className="text-success">₹{Math.round(c.total).toLocaleString('en-IN')}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
