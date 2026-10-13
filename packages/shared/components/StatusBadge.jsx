/**
 * Reusable StatusBadge Component
 * Maps status keys to color-coded badge pills
 */

const STATUS_MAP = {
  active:           { label: 'Active',          cls: 'badge-success' },
  pending_approval: { label: 'Pending',         cls: 'badge-warning' },
  pending:          { label: 'Pending',         cls: 'badge-warning' },
  rejected:         { label: 'Rejected',        cls: 'badge-error'   },
  inactive:         { label: 'Inactive',        cls: 'badge-neutral' },
  available:        { label: 'Available',       cls: 'badge-success' },
  in_use:           { label: 'In Use',          cls: 'badge-warning' },
  maintenance:      { label: 'Maintenance',     cls: 'badge-error'   },
  dispatched:       { label: 'Dispatched',      cls: 'badge-blue'    },
  reached_location: { label: 'At Site',         cls: 'badge-warning' },
  delivered:        { label: 'Delivered',       cls: 'badge-success' },
  returned:         { label: 'Returned',        cls: 'badge-neutral' },
  on_time:          { label: 'On Time',         cls: 'badge-success' },
  arrived:          { label: 'Arrived',         cls: 'badge-warning' },
  absent:           { label: 'Absent',          cls: 'badge-error'   },
}

export function StatusBadge({ status, className = '', showDot = true }) {
  const b = STATUS_MAP[status] || { label: status || '—', cls: 'badge-neutral' }
  return (
    <span className={`badge ${b.cls} ${className}`.trim()}>
      {showDot && (
        <span 
          className="badge-dot" 
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            opacity: 0.85,
            flexShrink: 0
          }} 
        />
      )}
      <span>{b.label}</span>
    </span>
  )
}

export default StatusBadge
