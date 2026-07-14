import { useState } from 'react'
import type { ColumnDef } from '../../utils/constants'
import { formatDate, truncate } from '../../utils/formatters'
import MseBadges from './MseBadges'
import EditableCell from './EditableCell'

interface TableRowProps<T> {
  record: T
  columns: ColumnDef<any>[]
  isExcluded: boolean
  onToggleMse: (record: T, mse: number) => void
  onEdit: (record: T, key: string, value: string) => void
  onDelete: (record: T) => void
  onOpenException: (record: T) => void
  canEdit: boolean
  canDelete: boolean
  variant?: 'ip' | 'ioc' | 'white-ip'
  /** Активные mse для подсветки в квадратиках */
  activeMses?: number[]
}

export default function TableRow<T extends { id: number }>({
  record,
  columns,
  isExcluded,
  onToggleMse,
  onEdit,
  onDelete,
  onOpenException,
  canEdit,
  canDelete,
  variant = 'ip',
  activeMses,
}: TableRowProps<T>) {
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const getValue = (obj: unknown, path: string): unknown => {
    return (obj as Record<string, unknown>)[path]
  }

  const renderCell = (col: ColumnDef<any>): React.ReactNode => {
    const value = getValue(record, col.key as string)

    // Если ячейка редактируется
    if (editingKey === col.key && col.type !== 'mse' && col.type !== 'readonly') {
      return (
        <EditableCell
          value={value}
          type={col.type}
          onSave={(newValue) => {
            onEdit(record, col.key as string, newValue)
            setEditingKey(null)
          }}
          onCancel={() => setEditingKey(null)}
        />
      )
    }

    // Кастомный рендеринг по типу
    if (col.type === 'mse') {
      // Колонка "Где внесено" — кликабельные квадратики
      if (col.key === 'mses') {
        return (
          <MseBadges
            mses={Array.isArray(value) ? (value as number[]) : []}
            variant={variant === 'ioc' ? 'ioc' : 'ip'}
            mode="toggle"
            activeMses={activeMses}
            onToggleMse={(mse) => onToggleMse(record, mse)}
          />
        )
      }
      // Остальные mse-колонки — обычные бейджи
      if (Array.isArray(value)) {
        return <MseBadges mses={value as number[]} variant={variant === 'ioc' ? 'ioc' : 'ip'} />
      }
    }

    if (col.type === 'date') {
      return <span className="text-sm">{formatDate(value as string)}</span>
    }

    if (col.type === 'readonly') {
      return <span className="text-sm">{String(value ?? '—')}</span>
    }

    if (col.type === 'encoding') {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase"
          style={{
            backgroundColor: `${value === 'md5' ? '#3b82f6' : value === 'sha1' ? '#8b5cf6' : '#22c55e'}20`,
            color: value === 'md5' ? '#3b82f6' : value === 'sha1' ? '#8b5cf6' : '#22c55e',
          }}
        >
          {value as string}
        </span>
      )
    }

    if (col.type === 'status') {
      const isMalicious = String(value).toLowerCase().includes('malicious')
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: isMalicious ? '#ef444420' : '#22c55e20',
            color: isMalicious ? '#ef4444' : '#22c55e',
          }}
        >
          {value as string || '-'}
        </span>
      )
    }

    // Обычный текст
    return (
      <span className="text-sm block truncate" title={value as string}>
        {truncate(String(value ?? ''), 16) || '—'}
      </span>
    )
  }

  return (
    <tr
      className={`transition-colors hover:opacity-90${isExcluded ? ' hatching-excluded' : ''}`}
      style={{
        borderBottom: '1px solid var(--color-border)',
      }}
      onDoubleClick={() => {
        if (canEdit) onOpenException(record)
      }}
    >
      {columns.map((col) => (
        <td
          key={col.key as string}
          className="px-3 py-2 whitespace-nowrap overflow-hidden"
          style={{ width: col.width, maxWidth: col.width }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            if (canEdit && col.type !== 'mse' && col.type !== 'readonly') {
              setEditingKey(col.key as string)
            }
          }}
        >
          {renderCell(col)}
        </td>
      ))}
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center gap-1">
          {canEdit && (
            <button
              onClick={() => onOpenException(record)}
              className="p-1 rounded transition-colors hover:opacity-80"
              style={{ color: 'var(--color-primary)' }}
              title="Исключить / редактировать исключение"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(record)}
              className="p-1 rounded transition-colors hover:opacity-80"
              style={{ color: 'var(--color-danger)' }}
              title="Удалить"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}