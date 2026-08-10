import { memo } from 'react'

function ButtonGroup({ children, className = '' }) {
  return (
    <div className={`inline-flex rounded-lg overflow-hidden border border-gray-300 ${className}`}>
      {children}
    </div>
  )
}

export default memo(ButtonGroup)
