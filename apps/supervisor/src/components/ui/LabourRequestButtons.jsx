import { memo } from 'react'
import ButtonGroup from './ButtonGroup'

function LabourRequestButtons({ value, onChange, disabled = false }) {
  return (
    <ButtonGroup>
      <button
        onClick={() => onChange('minimum')}
        disabled={disabled}
        className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-gray-300 ${
          value === 'minimum'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        Min
      </button>
      <button
        onClick={() => onChange('more')}
        disabled={disabled}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
          value === 'more'
            ? 'bg-orange-500 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        More
      </button>
    </ButtonGroup>
  )
}

export default memo(LabourRequestButtons)
