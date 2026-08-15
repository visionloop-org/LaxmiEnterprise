import { memo } from 'react'
import ButtonGroup from './ButtonGroup'

function LabourRequestButtons({ value, onChange, disabled = false }) {
  return (
    <ButtonGroup>
      <button
        onClick={() => onChange('minimum')}
        disabled={disabled}
        title="Request Minimum required labour"
        className={`px-3 py-1.5 text-xs font-semibold transition-colors border-r border-gray-300 ${
          value === 'minimum'
            ? 'bg-blue-600 text-white shadow-inner font-bold'
            : 'bg-white text-gray-700 hover:bg-blue-50'
        } disabled:opacity-50`}
      >
        Min
      </button>
      <button
        onClick={() => onChange('more')}
        disabled={disabled}
        title="Request Maximum / Extra labour"
        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
          value === 'more'
            ? 'bg-orange-600 text-white shadow-inner font-bold'
            : 'bg-white text-gray-700 hover:bg-orange-50'
        } disabled:opacity-50`}
      >
        Max
      </button>
    </ButtonGroup>
  )
}

export default memo(LabourRequestButtons)
