import { memo } from 'react'

function EmployeeAvatar({ photo, name }) {
  return (
    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs">
      {photo ? (
        <img src={photo} alt={name} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <span>{name.split(' ').map(n => n[0]).join('')}</span>
      )}
    </div>
  )
}

export default memo(EmployeeAvatar)
