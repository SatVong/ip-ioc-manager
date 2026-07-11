import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import type { ColumnType } from '../../utils/constants'

interface EditableCellProps {
  value: unknown
  type?: ColumnType
  onSave: (value: string) => void
  onCancel: () => void
}

// Валидация IP-адреса
function isValidIP(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every((part) => {
    const num = parseInt(part, 10)
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part
  })
}

// Валидация даты в формате ДД.ММ.ГГГГ или ДД.ММ.ГГГГ ЧЧ:ММ
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false
  const trimmed = dateStr.trim()
  // Сначала пробуем с временем
  let match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/)
  if (match) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)
    const hours = parseInt(match[4], 10)
    const minutes = parseInt(match[5], 10)
    if (month < 1 || month > 12) return false
    if (day < 1 || day > 31) return false
    if (year < 1900 || year > 2100) return false
    if (hours < 0 || hours > 23) return false
    if (minutes < 0 || minutes > 59) return false
    const daysInMonth = new Date(year, month, 0).getDate()
    if (day > daysInMonth) return false
    return true
  }
  // Пробуем без времени
  match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!match) return false
  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (year < 1900 || year > 2100) return false
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day > daysInMonth) return false
  return true
}

// Валидация страны (2 заглавные буквы)
function isValidCountry(country: string): boolean {
  return /^[A-Z]{2}$/.test(country.toUpperCase())
}

// Валидация hex (для IOC)
function isValidHex(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str)
}

// Валидация CIDR: xxx.xxx.xxx.xxx/xx или "-"
function isValidCIDR(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed === '-') return true
  const cidrRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/
  const match = trimmed.match(cidrRegex)
  if (!match) return false
  for (let i = 1; i <= 4; i++) {
    const num = parseInt(match[i], 10)
    if (num < 0 || num > 255) return false
  }
  const prefix = parseInt(match[5], 10)
  if (prefix < 0 || prefix > 32) return false
  return true
}

export default function EditableCell({ value, type, onSave, onCancel }: EditableCellProps) {
  const [editValue, setEditValue] = useState(String(value ?? ''))
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const validate = (val: string): string => {
    const trimmed = val.trim()
    if (!trimmed) return ''

    if (type === 'ip') {
      if (!isValidIP(trimmed)) {
        return 'Неверный формат IP: xxx.xxx.xxx.xxx (0-255)'
      }
    }

    if (type === 'date') {
      if (!isValidDate(trimmed)) {
        return 'Неверный формат даты. Используйте ДД.ММ.ГГГГ или ДД.ММ.ГГГГ ЧЧ:ММ'
      }
    }

    if (type === 'country') {
      if (!isValidCountry(trimmed)) {
        return 'Две заглавные буквы (RU, US, JP) или XX'
      }
    }

    if (type === 'hash') {
      if (!isValidHex(trimmed)) {
        const badChar = trimmed.split('').find(c => !/[0-9a-fA-F]/.test(c))
        return `Неверный формат: найден недопустимый символ "${badChar}". Допустимы только hex-символы (0-9, a-f)`
      }
    }

    if (type === 'cidr') {
      if (!isValidCIDR(trimmed)) {
        return 'Неверный формат. Используйте xxx.xxx.xxx.xxx/xx или "-"'
      }
    }

    return ''
  }

  const handleSave = () => {
    const validationError = validate(editValue)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    onSave(editValue)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => {
          setEditValue(e.target.value)
          if (error) setError('')
        }}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1 rounded border text-sm outline-none"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderColor: error ? '#ef4444' : 'var(--color-primary)',
          color: 'var(--color-text)',
        }}
      />
      {error && (
        <p className="text-[10px] mt-0.5" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}
    </div>
  )
}