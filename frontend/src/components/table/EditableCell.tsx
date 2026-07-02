import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import type { ColumnType } from '../../utils/constants'

interface EditableCellProps {
  value: unknown
  type?: ColumnType
  onSave: (value: string) => void
  onCancel: () => void
}

export default function EditableCell({ value, type, onSave, onCancel }: EditableCellProps) {
  const [editValue, setEditValue] = useState(String(value ?? ''))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(editValue)
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const inputType = type === 'date' ? 'text' : 'text'

  return (
    <input
      ref={inputRef}
      type={inputType}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={() => onSave(editValue)}
      onKeyDown={handleKeyDown}
      className="w-full px-2 py-1 rounded border text-sm outline-none"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderColor: 'var(--color-primary)',
        color: 'var(--color-text)',
      }}
    />
  )
}