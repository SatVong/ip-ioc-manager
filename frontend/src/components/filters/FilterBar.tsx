import type { ColumnDef } from '../../utils/constants'
import GlobalSearch from './GlobalSearch'
import ColumnFilter from './ColumnFilter'

interface FilterBarProps {
  columns: ColumnDef<any>[]
  filters: Record<string, string>
  globalSearch: string
  onFilterChange: (key: string, value: string) => void
  onGlobalSearchChange: (value: string) => void
  onClearFilters: () => void
  total: number
}

export default function FilterBar({
  columns,
  filters,
  globalSearch,
  onFilterChange,
  onGlobalSearchChange,
  onClearFilters,
  total,
}: FilterBarProps) {
  const hasFilters = Object.keys(filters).length > 0 || globalSearch.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GlobalSearch value={globalSearch} onChange={onGlobalSearchChange} />
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="px-3 py-2 text-xs rounded-lg transition-colors"
              style={{
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger)',
              }}
            >
              Сбросить фильтры
            </button>
          )}
        </div>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Всего: <strong style={{ color: 'var(--color-text)' }}>{total}</strong>
        </span>
      </div>
      {columns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {columns
            .filter((col) => col.filterable)
            .slice(0, 6)
            .map((col) => (
              <ColumnFilter
                key={col.key as string}
                column={col}
                value={filters[col.key as string] || ''}
                onChange={(value) => onFilterChange(col.key as string, value)}
              />
            ))}
        </div>
      )}
    </div>
  )
}