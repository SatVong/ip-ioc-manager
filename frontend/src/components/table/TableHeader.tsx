import { useState, useEffect, useRef } from 'react'
import type { ColumnDef } from '../../utils/constants'

interface TableHeaderProps {
  columns: ColumnDef<any>[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSort: (column: string) => void
  /** Фильтры для отображения в заголовке */
  filters?: Record<string, string>
  /** Обработчик изменения фильтра */
  onFilterChange?: (key: string, value: string) => void
}

function FilterInput({ value, colKey, onFilterChange }: { value: string; colKey: string; onFilterChange: (key: string, value: string) => void }) {
  const [local, setLocal] = useState(value)
  const onFilterChangeRef = useRef(onFilterChange)
  onFilterChangeRef.current = onFilterChange
  const colKeyRef = useRef(colKey)
  colKeyRef.current = colKey

  // Sync when external value changes (e.g., on clear all)
  useEffect(() => {
    setLocal(value)
  }, [value])

  // Debounce: fire onFilterChange 400ms after last keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) {
        onFilterChangeRef.current(colKeyRef.current, local)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [local, value])

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder="Фильтр..."
      className="w-full px-1.5 py-1 rounded border text-[10px] outline-none transition-colors"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderColor: value ? 'var(--color-primary)' : 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    />
  )
}

export default function TableHeader({ columns, sortBy, sortOrder, onSort, filters, onFilterChange }: TableHeaderProps) {
  return (
    <thead>
      <tr>
        {columns.map((col) => (
          <th
            key={col.key as string}
            className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
            style={{
              color: 'var(--color-text-secondary)',
              borderBottom: '1px solid var(--color-border)',
              width: col.width,
            }}
            onClick={() => col.sortable !== false && onSort(col.key as string)}
            title={col.sortable !== false ? `Сортировать по "${col.label}"` : undefined}
          >
            <div className="flex items-center gap-1">
              <span>{col.label}</span>
              {col.sortable !== false && sortBy === col.key && (
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  {sortOrder === 'asc' ? (
                    <path d="M6 2l4 6H2z" />
                  ) : (
                    <path d="M6 10l4-6H2z" />
                  )}
                </svg>
              )}
            </div>
            {/* Фильтр под заголовком колонки — для всех filterable колонок */}
            {col.filterable && onFilterChange && (
              <div className="mt-1 relative" onClick={(e) => e.stopPropagation()}>
                <FilterInput
                  key={`filter-${col.key as string}`}
                  value={filters?.[col.key as string] || ''}
                  colKey={col.key as string}
                  onFilterChange={onFilterChange}
                />
                {filters?.[col.key as string] && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onFilterChange(col.key as string, '') }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-80"
                    style={{ color: 'var(--color-danger)' }}
                    title="Сбросить фильтр"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </th>
        ))}
        <th
          className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
          style={{
            color: 'var(--color-text-secondary)',
            borderBottom: '1px solid var(--color-border)',
            width: '100px',
          }}
        >
          Действия
        </th>
      </tr>
    </thead>
  )
}