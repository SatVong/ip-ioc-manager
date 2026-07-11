import { useState, type FormEvent } from 'react'
import Modal from './Modal'

interface ExceptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { note_out: string; date_out: string; who_out: string }) => void
  record: { id: number; note_out?: string | null; date_out?: string | null; who_out?: string | null } | null
  currentUser: string
  variant?: 'ip' | 'ioc' | 'white-ip'
}

function formatDateForInput(): string {
  const now = new Date()
  const d = String(now.getDate()).padStart(2, '0')
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const y = now.getFullYear()
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${d}.${m}.${y} ${h}:${min}`
}

export default function ExceptionModal({ isOpen, onClose, onSave, record, currentUser, variant = 'ip' }: ExceptionModalProps) {
  const isEdit = !!(record?.note_out && record.note_out !== '-' && record.note_out !== '')
  const [noteOut, setNoteOut] = useState(record?.note_out || '')
  const [dateOut] = useState(record?.date_out || formatDateForInput())
  const [whoOut] = useState(record?.who_out || currentUser)
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!noteOut.trim()) {
      setError('Поле "Причина исключения" не заполнено')
      return
    }
    setError('')
    onSave({ note_out: noteOut.trim(), date_out: dateOut, who_out: whoOut })
    onClose()
  }

  const handleClear = () => {
    if (!window.confirm('Очистить запись исключения?')) return
    onSave({ note_out: '', date_out: '', who_out: '' })
    onClose()
  }

  const recordLabel = variant === 'ip' ? 'IP' : variant === 'ioc' ? 'IOC' : 'White IP'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${isEdit ? 'Редактирование исключения' : 'Исключение записи'}: ${recordLabel} #${record?.id}`} width="500px">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Предупреждение */}
        <div
          className="px-3 py-2 rounded-lg text-xs"
          style={{
            backgroundColor: '#f59e0b20',
            color: '#92400e',
            border: '1px solid #f59e0b40',
          }}
        >
          После исключения не забудьте про отметки в столбце "Где внесено"
        </div>

        {/* Причина исключения */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Причина исключения {!isEdit && <span className="text-red-500"> *</span>}
          </label>
          <textarea
            value={noteOut}
            onChange={(e) => {
              setNoteOut(e.target.value)
              setError('')
            }}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
            style={{
              backgroundColor: 'var(--color-bg)',
              borderColor: error ? '#ef4444' : 'var(--color-border)',
              color: 'var(--color-text)',
            }}
            rows={3}
            placeholder="Укажите причину исключения..."
            maxLength={128}
            autoFocus
          />
          {error && (
            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{error}</p>
          )}
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Максимум 128 символов
          </p>
        </div>

        {/* Дата исключения (не редактируется) */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Дата исключения
          </label>
          <input
            type="text"
            value={dateOut}
            readOnly
            className="w-full px-3 py-2 rounded-lg border text-sm opacity-70"
            style={{
              backgroundColor: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Кто исключил (не редактируется) */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Кто исключил
          </label>
          <input
            type="text"
            value={whoOut}
            readOnly
            className="w-full px-3 py-2 rounded-lg border text-sm opacity-70"
            style={{
              backgroundColor: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        <div className="flex justify-between items-center pt-4">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
                style={{
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                }}
              >
                Очистить запись
              </button>
            )}
          </div>
          <div className="flex gap-2">
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
              {isEdit ? 'Сохранить изменения' : 'Исключить'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}