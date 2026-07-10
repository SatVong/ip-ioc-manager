import type { ColumnDef } from '../../utils/constants'
import GlobalSearch from './GlobalSearch'

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
              Сбросить все фильтры
            </button>
          )}
        </div>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Всего: <strong style={{ color: 'var(--color-text)' }}>{total}</strong>
        </span>
      </div>
    </div>
  )
}