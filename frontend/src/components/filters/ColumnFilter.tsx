import { useState, type KeyboardEvent } from 'react'
import type { ColumnDef } from '../../utils/constants'

interface ColumnFilterProps {
  column: ColumnDef<any>
  value: string
  onChange: (key: string, value: string) => void
}

export default function ColumnFilter({ column, value, onChange }: ColumnFilterProps) {
  const [local, setLocal] = useState(value)

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onChange(column.key as string, local)
    }
  }

  if (column.type === 'mse' || column.type === 'readonly') return null

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onChange(column.key as string, local)}
      placeholder={`Фильтр: ${column.label}`}
      className="w-full px-2 py-1.5 rounded border text-xs outline-none transition-colors"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderColor: value ? 'var(--color-primary)' : 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    />
  )
}