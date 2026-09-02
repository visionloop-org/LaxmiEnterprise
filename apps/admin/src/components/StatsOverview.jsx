/**
 * StatsOverview Component
 * Displays primary KPI metrics and fleet utilization stats
 */

export default function StatsOverview({
  totalEmps,
  presentCount,
  totalBase,
  totalOvertime,
  totalIncentives,
  grandTotal,
  totalVehs,
  inUseVehs,
  activeTripsCount
}) {
  return (
    <>
      {/* ── KPI Stats ── */}
      <div className="stats-grid">
        <div className="stat-card stat-card--total">
          <h3>Total Workforce</h3>
          <p className="stat-value">{totalEmps}</p>
        </div>
        <div className="stat-card stat-card--present">
          <h3>Present Today</h3>
          <p className="stat-value">{presentCount}</p>
        </div>
        <div className="stat-card stat-card--wages">
          <h3>Regular Wages</h3>
          <p className="stat-value">₹{totalBase.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card stat-card--overtime">
          <h3>Overtime (1.5×)</h3>
          <p className="stat-value">₹{Math.round(totalOvertime).toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card stat-card--incentive">
          <h3>Incentives</h3>
          <p className="stat-value">₹{Math.round(totalIncentives).toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card stat-card--total-pay">
          <h3>Net Payroll</h3>
          <p className="stat-value">₹{Math.round(grandTotal).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* ── Secondary stat row: Vehicles & Trips ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div className="stat-card" style={{ flex: '1 1 160px', '--accent': '#0ea5e9' }}>
          <h3>Total Vehicles</h3>
          <p className="stat-value" style={{ color: '#0ea5e9' }}>{totalVehs}</p>
        </div>
        <div className="stat-card" style={{ flex: '1 1 160px', '--accent': '#f59e0b' }}>
          <h3>Fleet In Use</h3>
          <p className="stat-value" style={{ color: '#f59e0b' }}>{inUseVehs}</p>
        </div>
        <div className="stat-card" style={{ flex: '1 1 160px', '--accent': '#10b981' }}>
          <h3>Active Trips</h3>
          <p className="stat-value" style={{ color: '#10b981' }}>{activeTripsCount}</p>
        </div>
      </div>
    </>
  )
}
