/**
 * SessionUnlockPanel Component
 * Allows admin to reset a finalized session for emergency corrections
 */

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function SessionUnlockPanel({
  showSessionPanel,
  setShowSessionPanel,
  sessionId,
  setSessionId,
  unlocking,
  onUnlockSession
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">🔧 Admin Tools</h2>
          <p className="panel-subtitle">Reset finalized sessions &amp; other admin-exclusive actions</p>
        </div>
        <button
          className={`panel-toggle ${showSessionPanel ? 'open' : ''}`}
          onClick={() => setShowSessionPanel(v => !v)}
        >
          {showSessionPanel ? 'Collapse' : 'Expand'} <ChevronDown />
        </button>
      </div>
      {showSessionPanel && (
        <div className="panel-body">
          <div className="alert-banner alert-info" style={{ marginBottom: 0 }}>
            <h3>🔓 Reset a Finalized Attendance Session</h3>
            <p>
              If edits are required after a supervisor has finalized a daily session, enter the
              Session ID to reopen it for editing. This action is logged.
            </p>
            <form className="session-unlock-form" onSubmit={onUnlockSession}>
              <input
                type="text"
                placeholder="Session ID, e.g. SES-2026-08-16-Shift-A"
                value={sessionId}
                onChange={e => setSessionId(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-sky"
                disabled={unlocking}
              >
                {unlocking ? 'Unlocking…' : '🔓 Reset Session'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
