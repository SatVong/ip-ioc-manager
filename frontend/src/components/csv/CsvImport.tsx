import { useState, useRef, type ChangeEvent } from 'react'
import Modal from '../modal/Modal'
import type { ColumnDef } from '../../utils/constants'
import { VALID_COUNTRIES } from './csvValidation'

interface CsvImportProps {
  onImport: (data: Record<string, string>[]) => void
  columns: ColumnDef<any>[]
  /** Текущий пользователь для автозаполнения who_in */
  currentUser?: string
}

interface ValidationError {
  row: number
  column: string
  message: string
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

// Валидация CIDR: xxx.xxx.xxx.xxx/xx или "-"
function isValidCIDR(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed === '-' || trimmed === '') return true
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

// Валидация даты в формате ДД.ММ.ГГГГ или ДД.ММ.ГГГГ ЧЧ:ММ
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false
  const trimmed = dateStr.trim()
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

// Валидация hex
function isValidHex(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str)
}

// Валидация страны
function isValidCountry(country: string): boolean {
  return VALID_COUNTRIES.includes(country.toUpperCase())
}

// Получить текущую дату и время в формате ДД.ММ.ГГГГ ЧЧ:ММ
function getCurrentDateTime(): string {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

export default function CsvImport({ onImport, columns, currentUser = '' }: CsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter((line) => line.trim())
      if (lines.length < 2) return

      const headers = lines[0].split(',').map((h) => h.trim())

      // Строим маппинг: русский заголовок из CSV → английский ключ колонки
      // Например: "IP-адрес" → "ip", "Страна" → "country"
      const headerToKeyMap: Record<string, string> = {}
      for (const header of headers) {
        const col = columns.find((c) => c.label === header)
        if (col) {
          headerToKeyMap[header] = col.key as string
        }
      }

      // Парсим записи, мапя русские заголовки на английские ключи
      const records = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim())
        const record: Record<string, string> = {}
        headers.forEach((header, i) => {
          const mappedKey = headerToKeyMap[header]
          if (mappedKey) {
            record[mappedKey] = values[i] || ''
          }
        })
        return record
      })

      // Валидация
      const validationErrors: ValidationError[] = []
      records.forEach((record, idx) => {
        const rowNum = idx + 2 // +2 потому что 1 = заголовок, 0-based индекс

        for (const col of columns) {
          const key = col.key as string
          const value = record[key] || ''
          const colLabel = col.label

          // Пропускаем служебные поля (date_in/who_in — заполнятся автоматически)
          if (key === 'date_in' || key === 'who_in') continue

          // Пропускаем пустые необязательные поля
          if (!value) continue

          // Валидация IP
          if (col.type === 'ip' && value) {
            if (!isValidIP(value)) {
              validationErrors.push({
                row: rowNum,
                column: colLabel,
                message: `неверный формат IP: xxx.xxx.xxx.xxx (0-255)`,
              })
            }
          }

          // Валидация CIDR
          if (col.type === 'cidr' && value) {
            if (!isValidCIDR(value)) {
              validationErrors.push({
                row: rowNum,
                column: colLabel,
                message: `неверный формат. Используйте xxx.xxx.xxx.xxx/xx или "-"`,
              })
            }
          }

          // Валидация страны
          if (key === 'country' && value) {
            if (!isValidCountry(value.toUpperCase())) {
              validationErrors.push({
                row: rowNum,
                column: colLabel,
                message: `страна "${value}" не входит в список допустимых стран. Используйте "XX" если страна неизвестна`,
              })
            }
          }

          // Валидация даты
          if ((col.type === 'date' || key === 'date' || key === 'date_in') && value) {
            if (!isValidDate(value)) {
              validationErrors.push({
                row: rowNum,
                column: colLabel,
                message: `неверный формат даты. Используйте ДД.ММ.ГГГГ или ДД.ММ.ГГГГ ЧЧ:ММ`,
              })
            }
          }

          // Валидация длины
          if (key === 'from_source' && value.length > 64) {
            validationErrors.push({ row: rowNum, column: colLabel, message: `максимум 64 символа (введено ${value.length})` })
          }
          if (key === 'letter' && value.length > 24) {
            validationErrors.push({ row: rowNum, column: colLabel, message: `максимум 24 символа (введено ${value.length})` })
          }
          if (key === 'domain' && value.length > 64) {
            validationErrors.push({ row: rowNum, column: colLabel, message: `максимум 64 символа (введено ${value.length})` })
          }
          if (key === 'owner' && value.length > 64) {
            validationErrors.push({ row: rowNum, column: colLabel, message: `максимум 64 символа (введено ${value.length})` })
          }
          if (key === 'note_in' && value.length > 128) {
            validationErrors.push({ row: rowNum, column: colLabel, message: `максимум 128 символов (введено ${value.length})` })
          }

          // Валидация IOC (hex)
          if (key === 'indicator' && value) {
            if (!isValidHex(value)) {
              const badChar = value.split('').find(c => !/[0-9a-fA-F]/.test(c))
              const pos = value.indexOf(badChar || '') + 1
              validationErrors.push({
                row: rowNum,
                column: colLabel,
                message: `неверный формат: недопустимый символ "${badChar}" на позиции ${pos}. Допустимы только hex-символы (0-9, a-f)`,
              })
            }
          }
        }
      })

      setTotalRecords(records.length)

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        setShowErrorModal(true)
      } else {
        // Авто-заполнение date_in и who_in перед импортом
        const now = getCurrentDateTime()
        const enrichedRecords = records.map((record) => {
          if (!record.date_in) record.date_in = now
          if (!record.who_in) record.who_in = currentUser
          return record
        })
        onImport(enrichedRecords)
      }
    }
    reader.readAsText(file)

    // Сброс input для повторного выбора того же файла
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <>
      <label
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors hover:opacity-80"
        style={{
          color: 'var(--color-primary)',
          border: '1px solid var(--color-primary)',
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Импорт CSV
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Модальное окно с ошибками валидации */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Ошибки импорта CSV"
        width="600px"
      >
        <div className="space-y-4">
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: '#ef444410',
              color: '#dc2626',
              border: '1px solid #ef444430',
            }}
          >
            Общее количество записей {totalRecords} из них {errors.length} с ошибками:
          </div>
          <div
            className="max-h-64 overflow-y-auto space-y-1 text-sm font-mono"
            style={{ color: 'var(--color-text)' }}
          >
            {errors.map((err, i) => (
              <div
                key={i}
                className="px-3 py-1.5 rounded"
                style={{ backgroundColor: 'var(--color-card-bg)' }}
              >
                строка {err.row}: колонка "{err.column}" {err.message}.
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
              style={{
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}