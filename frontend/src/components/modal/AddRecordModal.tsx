import { useState, useEffect, type FormEvent } from 'react'
import Modal from './Modal'
import type { ColumnDef } from '../../utils/constants'

interface AddRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
  columns: ColumnDef<any>[]
  title: string
  /** Текущий пользователь для автозаполнения who_in */
  currentUser?: string
  /** Вариант записей для определения набора полей */
  variant?: 'ip' | 'ioc' | 'white-ip'
}

// Полный словарь стран (ISO 3166-1 alpha-2)
const VALID_COUNTRIES = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AP', 'AR', 'AT', 'AU', 'AW', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BM', 'BN', 'BO', 'BQ', 'BR',
  'BS', 'BT', 'BV', 'BW', 'BX', 'BY', 'BZ', 'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK',
  'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
  'DO', 'DZ', 'EA', 'EC', 'EE', 'EG', 'EH', 'EM', 'EP', 'ER', 'ES', 'ET', 'EU', 'FI',
  'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GC', 'GD', 'GE', 'GG', 'GH', 'GI', 'GL',
  'GM', 'GN', 'GQ', 'GR', 'GS', 'GT', 'GW', 'GY', 'HK', 'HN', 'HR', 'HT', 'HU', 'IB',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE',
  'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI',
  'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MG', 'MH', 'MK',
  'ML', 'MM', 'MN', 'MO', 'MP', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OA', 'OM', 'PA', 'PE',
  'PG', 'PH', 'PK', 'PL', 'PT', 'PW', 'PY', 'QA', 'QZ', 'RO', 'RS', 'RU', 'RW', 'SA',
  'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
  'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO',
  'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG',
  'VN', 'VU', 'WO', 'WS', 'XN', 'XU', 'XV', 'XX', 'YE', 'ZA', 'ZM', 'ZW',
]

// Подсказки для полей
const FIELD_HINTS: Record<string, string> = {
  date: 'Формат: ДД.ММ.ГГГГ, время добавится автоматически',
  from_source: 'Максимум 64 символа',
  letter: 'Максимум 24 символа',
  domain: 'Максимум 64 символа',
  ip: 'Формат: xxx.xxx.xxx.xxx (точки ставьте сами)',
  country: 'Две заглавные буквы (если страна не известна то пиши XX)',
  owner: 'Максимум 64 символа',
  note_in: 'Максимум 128 символов',
  date_in: 'Заполняется автоматически',
  who_in: 'Заполняется автоматически',
  indicator: 'Кодировка определяется автоматически по длине хеша',
}

// Placeholder для полей
const FIELD_PLACEHOLDERS: Record<string, string> = {
  date: '01.01.2024',
  from_source: 'example@source.com',
  letter: 'п.4',
  domain: 'example.com',
  ip: '192.168.1.1',
  country: 'RU',
  owner: 'Организация',
  note_in: 'Примечание к внесению',
  indicator: 'd41d8cd98f00b204e9800998ecf8427e',
}

// Поля для IP записей (левая колонка)
const IP_LEFT_FIELDS = ['date', 'from_source', 'letter', 'domain', 'ip', 'country', 'owner']
// Поля для IP записей (правая колонка)
const IP_RIGHT_FIELDS = ['note_in', 'date_in', 'who_in']

// Поля для IOC записей (левая колонка)
const IOC_LEFT_FIELDS = ['date', 'from_source', 'letter', 'indicator']
// Поля для IOC записей (правая колонка)
const IOC_RIGHT_FIELDS = ['note_in', 'date_in', 'who_in']

// Поля для White IP записей (левая колонка)
const WHITE_IP_LEFT_FIELDS = ['date', 'from_source', 'letter', 'ip']
// Поля для White IP записей (правая колонка)
const WHITE_IP_RIGHT_FIELDS = ['note_in', 'date_in', 'who_in']

// Валидация IP-адреса
function isValidIP(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every((part) => {
    const num = parseInt(part, 10)
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part
  })
}

// Валидация страны (2 заглавные буквы из словаря)
function isValidCountry(country: string): boolean {
  return VALID_COUNTRIES.includes(country.toUpperCase())
}

// Валидация даты в формате ДД.ММ.ГГГГ
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false
  const trimmed = dateStr.trim()
  // Проверка формата ДД.ММ.ГГГГ
  const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!match) return false

  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)

  // Проверка диапазонов
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (year < 1900 || year > 2100) return false

  // Проверка количества дней в месяце
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day > daysInMonth) return false

  return true
}

// Валидация hex (для IOC)
function isValidHex(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str)
}

// Получить текущую дату в формате ДД.ММ.ГГГГ
function getCurrentDate(): string {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  return `${day}.${month}.${year}`
}

export default function AddRecordModal({ isOpen, onClose, onSave, columns, title, currentUser = '', variant = 'ip' }: AddRecordModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Инициализация полей при открытии
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {
        date_in: getCurrentDate(),
        who_in: currentUser,
      }
      setFormData(initial)
      setErrors({})
    }
  }, [isOpen, currentUser])

  const editableColumns = columns.filter(
    (col) => col.type !== 'readonly' && col.key !== 'mses'
  )

  // Определяем набор полей в зависимости от variant
  const getLeftFields = (): string[] => {
    switch (variant) {
      case 'ioc': return IOC_LEFT_FIELDS
      case 'white-ip': return WHITE_IP_LEFT_FIELDS
      default: return IP_LEFT_FIELDS
    }
  }

  const getRightFields = (): string[] => {
    switch (variant) {
      case 'ioc': return IOC_RIGHT_FIELDS
      case 'white-ip': return WHITE_IP_RIGHT_FIELDS
      default: return IP_RIGHT_FIELDS
    }
  }

  // Валидация одного поля
  const validateField = (key: string, value: string): string => {
    const col = columns.find((c) => c.key === key)
    if (!col) return ''

    const trimmed = value.trim()

    // Проверка обязательных полей (с * в label)
    if (col.label.includes('*') && !trimmed) {
      return 'Поле обязательно'
    }

    if (!trimmed) return ''

    // Валидация IP
    if (col.type === 'ip') {
      if (!isValidIP(trimmed)) {
        return 'Неверный формат IP: xxx.xxx.xxx.xxx (0-255)'
      }
    }

    // Валидация страны
    if (key === 'country') {
      if (!isValidCountry(trimmed.toUpperCase())) {
        return 'Неверный код страны. Две заглавные буквы (RU, US, JP) или XX'
      }
    }

    // Валидация даты (для полей date и date_in)
    if (col.type === 'date' || key === 'date' || key === 'date_in') {
      if (key !== 'date_in' && !isValidDate(trimmed)) {
        return 'Неверный формат даты. Используйте ДД.ММ.ГГГГ'
      }
    }

    // Валидация длины
    if (key === 'from_source' && value.length > 64) {
      return 'Максимум 64 символа'
    }
    if (key === 'letter' && value.length > 24) {
      return 'Максимум 24 символа'
    }
    if (key === 'domain' && value.length > 64) {
      return 'Максимум 64 символа'
    }
    if (key === 'owner' && value.length > 64) {
      return 'Максимум 64 символа'
    }
    if (key === 'note_in' && value.length > 128) {
      return 'Максимум 128 символов'
    }

    // Валидация IOC (hex)
    if (key === 'indicator' && trimmed) {
      if (!isValidHex(trimmed)) {
        const badChar = trimmed.split('').find(c => !/[0-9a-fA-F]/.test(c))
        const pos = trimmed.indexOf(badChar || '') + 1
        return `Неверный формат: найден недопустимый символ "${badChar}" на позиции ${pos}. Допустимы только hex-символы (0-9, a-f)`
      }
    }

    return ''
  }

  // Валидация всех полей
  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {}
    for (const col of editableColumns) {
      const key = col.key as string
      const value = formData[key] || ''
      const error = validateField(key, value)
      if (error) {
        newErrors[key] = error
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Обработчик изменения поля с real-time валидацией
  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    // Real-time валидация
    const error = validateField(key, value)
    setErrors((prev) => {
      const next = { ...prev }
      if (error) {
        next[key] = error
      } else {
        delete next[key]
      }
      return next
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return

    const data: Record<string, unknown> = {}
    for (const col of editableColumns) {
      const key = col.key as string
      const value = formData[key] || ''
      if (key === 'country') {
        data[key] = value.trim().toUpperCase()
      } else {
        data[key] = value.trim()
      }
    }
    // Добавляем date_in и who_in если их нет
    if (!data.date_in) data.date_in = getCurrentDate()
    if (!data.who_in) data.who_in = currentUser
    onSave(data)
    setFormData({})
    setErrors({})
    onClose()
  }

  const handleCancel = () => {
    setFormData({})
    setErrors({})
    onClose()
  }

  const renderField = (col: ColumnDef<any>) => {
    const key = col.key as string
    const isAutoField = key === 'date_in' || key === 'who_in'
    const hint = FIELD_HINTS[key]
    const placeholder = FIELD_PLACEHOLDERS[key] || col.label
    const error = errors[key]
    const isRequired = col.label.includes('*')

    return (
      <div key={key}>
        <label
          className="block text-xs font-medium mb-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {col.label}
          {isRequired && <span className="text-red-500"> *</span>}
        </label>
        <input
          type="text"
          value={formData[key] || ''}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
          style={{
            backgroundColor: isAutoField ? 'var(--color-card-bg)' : 'var(--color-bg)',
            borderColor: error ? '#ef4444' : 'var(--color-border)',
            color: 'var(--color-text)',
            opacity: isAutoField ? 0.7 : 1,
          }}
          placeholder={placeholder}
          readOnly={isAutoField}
          maxLength={
            key === 'from_source' ? 64 :
            key === 'letter' ? 24 :
            key === 'domain' ? 64 :
            key === 'owner' ? 64 :
            key === 'note_in' ? 128 :
            undefined
          }
        />
        {hint && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {hint}
          </p>
        )}
        {error && (
          <p className="text-[10px] mt-0.5" style={{ color: '#ef4444' }}>
            {error}
          </p>
        )}
      </div>
    )
  }

  const leftFields = getLeftFields()
  const rightFields = getRightFields()

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={`Добавить: ${title}`} width="700px">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {/* Левая колонка */}
          <div className="space-y-3">
            {editableColumns
              .filter((col) => leftFields.includes(col.key as string))
              .map(renderField)}
          </div>
          {/* Правая колонка */}
          <div className="space-y-3">
            {editableColumns
              .filter((col) => rightFields.includes(col.key as string))
              .map(renderField)}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            type="button"
            onClick={handleCancel}
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