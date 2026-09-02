/**
 * FleetManagementTable Component
 * Displays vehicle fleet status, passenger limits, assigned drivers, and active dispatch trips
 */

import { StatusBadge } from '@laxmi/shared'

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

const PAGE_SIZE = 25

export default function FleetManagementTable({
  vehicles,
  filteredVehs,
  pagedVehs,
  vehSearch,
  setVehSearch,
  vehPage,
  setVehPage,
  trips,
  showTrips,
  setShowTrips,
  onExportVehicles
}) {
  const totalPages = Math.ceil(filteredVehs.length / PAGE_SIZE)

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">🚛 Vehicle Fleet &amp; Logistics</h2>
          <p className="panel-subtitle">{vehicles.length} vehicles registered</p>
        </div>
        <div className="panel-actions">
          <button className="export-button" onClick={onExportVehicles}>↓ Export CSV</button>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search registration or type…"
          value={vehSearch}
          onChange={e => { setVehSearch(e.target.value); setVehPage(1) }}
        />
        <span className="toolbar-spacer" />
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          {pagedVehs.length} of {filteredVehs.length} shown
        </span>
      </div>

      <div className="table-scroll-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Assigned Driver</th>
            </tr>
          </thead>
          <tbody>
            {pagedVehs.length === 0 ? (
              <tr><td colSpan="5" className="empty-row">No vehicles match filters.</td></tr>
            ) : (
              pagedVehs.map(veh => (
                <tr key={veh.id || veh.number}>
                  <td className="text-mono font-bold">{veh.number}</td>
                  <td>{veh.type}</td>
                  <td>{veh.capacity || 8} seats</td>
                  <td><StatusBadge status={veh.status} /></td>
                  <td>{veh.assignedDriver || <span className="text-muted">Unassigned</span>}</td>
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
            disabled={vehPage === 1}
            onClick={() => setVehPage(p => p - 1)}
          >
            ← Prev
          </button>
          <span className="page-indicator">Page {vehPage} of {totalPages}</span>
          <button
            className="btn btn-sm btn-gray"
            disabled={vehPage === totalPages}
            onClick={() => setVehPage(p => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Active Trips Tracker ── */}
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            📍 Live Dispatch Trips ({trips.length})
          </h3>
          <button
            className={`panel-toggle ${showTrips ? 'open' : ''}`}
            onClick={() => setShowTrips(v => !v)}
          >
            {showTrips ? 'Hide Trips' : 'View Trips'} <ChevronDown />
          </button>
        </div>

        {showTrips && (
          <div className="table-scroll-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Vehicle</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Departure</th>
                  <th>Driver</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr><td colSpan="6" className="empty-row">No active trips dispatched today.</td></tr>
                ) : (
                  trips.map(t => (
                    <tr key={t.id || t.tripId}>
                      <td className="text-mono">{t.tripId || t.id}</td>
                      <td className="font-bold">{t.vehicleId}</td>
                      <td>{t.destination}</td>
                      <td><StatusBadge status={t.status?.toLowerCase().replace(/\s+/g, '_')} /></td>
                      <td>{t.departureTime || '—'}</td>
                      <td>{t.driverName || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
