import { memo } from 'react'

function CategoryTabs({ categories, categoryFilter, setCategoryFilter, getCategoryCount }) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex gap-1 px-4 py-2 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat} ({getCategoryCount(cat)})
          </button>
        ))}
      </div>
    </div>
  )
}

export default memo(CategoryTabs)
