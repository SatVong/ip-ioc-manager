import { useState, type FormEvent } from 'react'
import Modal from './Modal'

interface ExceptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { note_out: string; date_out: string; who_out: string }) => void
  recordLabel: string
}

export default function ExceptionModal({ isOpen, onClose, onSave, recordLabel }: ExceptionModalProps) {
  const [noteOut, setNoteOut] = useState('')
  const [dateOut, setDateOut] = useState(new Date().toLocaleDateString('ru-RU'))
  const [whoOut, setWhoOut] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave({ note_out: noteOut, date_out: dateOut, who_out: whoOut })
    setNoteOut('')
    setWhoOut('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Исключение: ${recordLabel}`} width="450px">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Причина исключения
          </label>
          <textarea
            value={noteOut}
            onChange={(e) => setNoteOut(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
            style={{
              backgroundColor: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
            rows={3}
            placeholder="Укажите причину..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Дата исключения
          </label>
          <input
            type="text"
            value={dateOut}
            onChange={(e) => setDateOut(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Кто исключил
          </label>
          <input
            type="text"
            value={whoOut}
            onChange={(e) => setWhoOut(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
            placeholder="ФИО"
          />
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
            Исключить
          </button>
        </div>
      </form>
    </Modal>
  )
}