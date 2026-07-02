import type { ColumnDef } from '../../utils/constants'

interface TableHeaderProps {
  columns: ColumnDef<any>[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSort: (column: string) => void
}

export default function TableHeader({ columns, sortBy, sortOrder, onSort }: TableHeaderProps) {
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