import { useState } from 'react'
import type { ColumnDef } from '../../utils/constants'
import { formatDate, truncate } from '../../utils/formatters'
import MseBadges from './MseBadges'
import EditableCell from './EditableCell'

interface TableRowProps<T> {
  record: T
  columns: ColumnDef<any>[]
  isExcluded: boolean
  onToggleMse: (record: T) => void
  onEdit: (record: T, key: string, value: string) => void
  onDelete: (record: T) => void
  onOpenException: (record: T) => void
  canEdit: boolean
  canDelete: boolean
  variant?: 'ip' | 'ioc' | 'white-ip'
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
    if (col.type === 'mse' && Array.isArray(value)) {
      return <MseBadges mses={value as number[]} variant={variant === 'ioc' ? 'ioc' : 'ip'} />
    }

    if (col.type === 'date') {
      return <span className="text-sm">{formatDate(value as string)}</span>
    }

    if (col.type === 'readonly') {
      return <span className="text-sm">{formatDate(value as string)}</span>
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
      <span className="text-sm" title={value as string}>
        {truncate(String(value ?? ''), 40) || '—'}
      </span>
    )
  }

  return (
    <tr
      className="transition-colors hover:opacity-90"
      style={{
        backgroundColor: isExcluded ? '#fef2f2' : undefined,
        borderBottom: '1px solid var(--color-border)',
      }}
      onDoubleClick={() => {
        if (canEdit) onOpenException(record)
      }}
    >
      {columns.map((col) => (
        <td
          key={col.key as string}
          className="px-3 py-2 whitespace-nowrap"
          style={{ maxWidth: col.width }}
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
              onClick={() => onToggleMse(record)}
              className="p-1 rounded transition-colors hover:opacity-80"
              style={{ color: 'var(--color-primary)' }}
              title="Изменить МСЭ"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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