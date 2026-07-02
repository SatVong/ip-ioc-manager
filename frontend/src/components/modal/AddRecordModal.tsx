import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import type { ColumnDef } from '../../utils/constants'

interface AddRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
  columns: ColumnDef<any>[]
  title: string
}

export default function AddRecordModal({ isOpen, onClose, onSave, columns, title }: AddRecordModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setFormData({})
    onClose()
  }

  const editableColumns = columns.filter(
    (col) => col.type !== 'readonly' && col.key !== 'mses'
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Добавить: ${title}`} width="600px">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {editableColumns.map((col) => (
            <div key={col.key as string}>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {col.label}
              </label>
              <input
                type="text"
                value={formData[col.key as string] || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [col.key as string]: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                placeholder={col.label}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Сохранить
          </button>
        </div>
      </form>
    </Modal>
  )
}