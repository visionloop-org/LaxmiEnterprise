/**
 * Inline confirmation modal — replaces browser confirm() dialogs.
 * Usage: render when `confirmModal` state is non-null.
 * confirmModal = { message, detail?, onConfirm, onCancel, confirmLabel?, danger? }
 */
export default function ConfirmModal({ confirmModal }) {
  if (!confirmModal) return null

  const {
    message,
    detail,
    onConfirm,
    onCancel,
    confirmLabel = 'Confirm',
    danger = false,
  } = confirmModal

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-fade-in">
        <div className="flex items-start gap-3 mb-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <svg className={`h-5 w-5 ${danger ? 'text-red-600' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{message}</h3>
            {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onCancel() }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
