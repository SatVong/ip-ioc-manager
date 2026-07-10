import type { ColumnDef } from '../../utils/constants'
import TableHeader from './TableHeader'
import TableRow from './TableRow'

interface DataTableProps<T extends { id: number }> {
  data: T[]
  columns: ColumnDef<any>[]
  loading: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSort: (column: string) => void
  onToggleMse: (record: T, mse: number) => void
  onEdit: (record: T, key: string, value: string) => void
  onDelete: (record: T) => void
  onOpenException: (record: T) => void
  isRecordExcluded: (record: T) => boolean
  canEdit: boolean
  canDelete: boolean
  variant?: 'ip' | 'ioc' | 'white-ip'
  emptyMessage?: string
  /** Активные mse для подсветки в квадратиках */
  activeMses?: number[]
  /** Фильтры для отображения в заголовке таблицы */
  filters?: Record<string, string>
  /** Обработчик изменения фильтра */
  onFilterChange?: (key: string, value: string) => void
}

export default function DataTable<T extends { id: number }>({
  data,
  columns,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onToggleMse,
  onEdit,
  onDelete,
  onOpenException,
  isRecordExcluded,
  canEdit,
  canDelete,
  variant = 'ip',
  emptyMessage = 'Нет данных',
  activeMses,
  filters,
  onFilterChange,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {emptyMessage}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="w-full">
        <TableHeader
          columns={columns}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          filters={filters}
          onFilterChange={onFilterChange}
        />
        <tbody>
          {data.map((record) => (
            <TableRow
              key={record.id}
              record={record}
              columns={columns}
              isExcluded={isRecordExcluded(record)}
              onToggleMse={onToggleMse}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenException={onOpenException}
              canEdit={canEdit}
              canDelete={canDelete}
              variant={variant}
              activeMses={activeMses}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}