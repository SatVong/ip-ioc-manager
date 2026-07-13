import { useState, useRef, type ChangeEvent } from 'react'
import Modal from '../modal/Modal'
import type { ColumnDef } from '../../utils/constants'
import { VALID_COUNTRIES } from './csvValidation'

interface CsvImportProps {
  /** Асинхронная функция импорта. Должна вызывать onProgress(i, total) по мере отправки записей */
  onImport: (data: Record<string, string>[], onProgress: (current: number, total: number) => void) => Promise<void>
  columns: ColumnDef<any>[]
  /** Текущий пользователь для автозаполнения who_in */
  currentUser?: string
  /** Вариант: ip / ioc / white-ip */
  variant?: 'ip' | 'ioc' | 'white-ip'
}

interface ValidationError {
  row: number
  column: string
  message: string
}

// ==================== ОБЯЗАТЕЛЬНЫЕ ПОЛЯ (золотой минимум) ====================
const REQUIRED_FIELDS: Record<string, string[]> = {
  ip: ['date', 'from_source', 'ip', 'note_in'],
  'white-ip': ['date', 'from_source', 'ip', 'note_in'],
  ioc: ['date', 'from_source', 'indicator', 'note_in'],
}

// ==================== ПАРСИНГ CSV (из оригинального Vanilla JS) ====================
// Разделитель — точка с запятой, поддержка кавычек
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ';' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result.map(field => field.trim())
}

// Нечёткое сопоставление заголовков: если точное совпадение не найдено,
// пробуем альтернативные варианты (например, "IP-адресс" → "IP-адрес")
function fuzzyMatchHeader(header: string, columns: ColumnDef<any>[]): string | null {
  // 1. Точное совпадение
  const exact = columns.find((c) => c.label === header)
  if (exact) return exact.key as string

  // 2. Убираем лишние пробелы и сравниваем без учёта регистра
  const normalized = header.trim().toLowerCase()
  for (const col of columns) {
    if (col.label.trim().toLowerCase() === normalized) {
      console.log(`📄 CSV Import - fuzzy match: "${header}" → "${col.label}" (case-insensitive)`)
      return col.key as string
    }
  }

  // 3. Специфичные замены для известных опечаток
  const typoMap: Record<string, string> = {
    'IP-адресс': 'IP-адрес',
    'ip-адресс': 'IP-адрес',
    'IP-адресc': 'IP-адрес',
  }
  const corrected = typoMap[header.trim()]
  if (corrected) {
    const col = columns.find((c) => c.label === corrected)
    if (col) {
      console.log(`📄 CSV Import - typo fix: "${header}" → "${corrected}" → key "${String(col.key)}"`)
      return col.key as string
    }
  }

  // 4. Проверяем, не содержит ли заголовок известное ключевое слово
  const keywordMap: Record<string, string> = {
    'ip': 'ip',
    'адрес': 'ip',
    'address': 'ip',
    'страна': 'country',
    'дата': 'date',
    'домен': 'domain',
    'владелец': 'owner',
    'индикатор': 'indicator',
    'кодировка': 'encoding',
    'примечание': 'note_in',
    'откуда': 'from_source',
    'раздел': 'letter',
    'заявки': 'soib_infr',
  }
  const lower = header.trim().toLowerCase()
  for (const [keyword, key] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) {
      const col = columns.find((c) => c.key === key)
      if (col) {
        console.log(`📄 CSV Import - keyword match: "${header}" contains "${keyword}" → key "${key}"`)
        return col.key as string
      }
    }
  }

  return null
}

// Проверка, что запись не пустая (хотя бы одно поле заполнено)
function isRecordEmpty(record: Record<string, string>): boolean {
  return Object.values(record).every((v) => !v || v.trim() === '')
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

// Автоопределение кодировки по длине хеша
function detectEncoding(hash: string): string | null {
  const len = hash.trim().length
  if (len === 32) return 'md5'
  if (len === 40) return 'sha1'
  if (len === 64) return 'sha256'
  if (len === 128) return 'sha512'
  return null
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

export default function CsvImport({ onImport, columns, currentUser = '', variant = 'ip' }: CsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [showProgressModal, setShowProgressModal] = useState(false)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setImportProgress({ current: 0, total: 0 })
    setErrors([])
    setShowErrorModal(false)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        console.log('📄 CSV Import - raw text length:', text.length)

        // Убираем BOM (Byte Order Mark) если есть
        const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text

        // Разбиваем на строки
        const rawLines = cleanText.split('\n')
        console.log('📄 CSV Import - raw lines count:', rawLines.length)

        // Находим первую непустую строку — это заголовок
        let headerLineIndex = -1
        for (let i = 0; i < rawLines.length; i++) {
          if (rawLines[i].trim() !== '') {
            headerLineIndex = i
            break
          }
        }

        if (headerLineIndex === -1) {
          console.warn('⚠️ CSV Import - no non-empty lines found')
          setLoading(false)
          return
        }

        // Парсим заголовки
        const headers = parseCSVLine(rawLines[headerLineIndex])
        console.log('📄 CSV Import - parsed headers:', headers)

        // Строим маппинг: русский заголовок из CSV → английский ключ колонки
        const headerToKeyMap: Record<string, string> = {}
        for (const header of headers) {
          const key = fuzzyMatchHeader(header, columns)
          if (key) {
            headerToKeyMap[header] = key
          } else {
            console.warn(`⚠️ CSV Import - header "${header}" not found in columns!`)
          }
        }

        // Парсим записи
        const rawRecords = rawLines.slice(headerLineIndex + 1).map((line) => {
          const values = parseCSVLine(line)
          const record: Record<string, string> = {}
          headers.forEach((header, i) => {
            const mappedKey = headerToKeyMap[header]
            if (mappedKey) {
              record[mappedKey] = values[i] || ''
            }
          })
          return record
        })

        // Фильтруем пустые записи
        const records = rawRecords.filter(r => !isRecordEmpty(r))
        console.log(`📄 CSV Import - records after filtering: ${records.length}`)

        if (records.length === 0) {
          console.warn('⚠️ CSV Import - no valid records found')
          setLoading(false)
          return
        }

        // Валидация
        const validationErrors: ValidationError[] = []
        const requiredKeys = REQUIRED_FIELDS[variant] || []

        records.forEach((record, idx) => {
          const rowNum = idx + 2 // +2: 1 = заголовок, 0-based индекс

          // 1. Проверка обязательных полей (золотой минимум)
          for (const reqKey of requiredKeys) {
            const value = (record[reqKey] || '').trim()
            if (!value) {
              // Находим русскую метку колонки
              const col = columns.find((c) => c.key === reqKey)
              const colLabel = col ? col.label : reqKey
              validationErrors.push({
                row: rowNum,
                column: colLabel,
                message: `обязательное поле не заполнено`,
              })
            }
          }

          // 2. Проверка остальных полей
          for (const col of columns) {
            const key = col.key as string
            const value = record[key] || ''
            const colLabel = col.label

            // Пропускаем служебные поля
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

            // Валидация IOC (hex + длина)
            if (key === 'indicator' && value) {
              // Проверка hex
              if (!isValidHex(value)) {
                const badChar = value.split('').find(c => !/[0-9a-fA-F]/.test(c))
                const pos = value.indexOf(badChar || '') + 1
                validationErrors.push({
                  row: rowNum,
                  column: colLabel,
                  message: `неверный формат: недопустимый символ "${badChar}" на позиции ${pos}. Допустимы только hex-символы (0-9, a-f)`,
                })
              }
              // Проверка длины хеша
              const validLengths = [32, 40, 64, 128]
              if (!validLengths.includes(value.length)) {
                const detected = detectEncoding(value)
                const hint = detected
                  ? `По длине ${value.length} определена кодировка "${detected}", но ожидается ${detected === 'md5' ? 32 : detected === 'sha1' ? 40 : detected === 'sha256' ? 64 : 128} символов.`
                  : `Длина ${value.length} символов не соответствует ни одной известной кодировке (md5=32, sha1=40, sha256=64, sha512=128).`
                validationErrors.push({
                  row: rowNum,
                  column: colLabel,
                  message: `неверная длина хеша: ${value.length} символов. ${hint}`,
                })
              }
            }
          }
        })

        setTotalRecords(records.length)

        if (validationErrors.length > 0) {
          console.warn(`⚠️ CSV Import - ${validationErrors.length} validation errors`)
          setErrors(validationErrors)
          setShowErrorModal(true)
          setLoading(false)
          setImportProgress({ current: 0, total: 0 })
        } else {
          // Авто-заполнение и подготовка перед импортом
          const now = getCurrentDateTime()
          const enrichedRecords = records.map((record) => {
            // Авто-заполнение date_in / who_in
            if (!record.date_in) record.date_in = now
            if (!record.who_in) record.who_in = currentUser

            // Парсинг mses: строка "3,5,7" → массив [3,5,7]
            if (record.mses && record.mses.trim() !== '') {
              const parts = record.mses.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 1 && n <= 15)
              if (parts.length > 0) {
                // Присваиваем массив чисел напрямую (не строку!)
                ;(record as unknown as Record<string, unknown>).mses = parts
              } else {
                delete record.mses
              }
            } else {
              delete record.mses
            }

            // Автоопределение кодировки для IOC
            if (variant === 'ioc' && record.indicator && !record.encoding) {
              const detected = detectEncoding(record.indicator)
              if (detected) {
                record.encoding = detected
              }
            }

            return record
          })

          setImportProgress({ current: 0, total: enrichedRecords.length })
          setShowProgressModal(true)
          console.log(`📄 CSV Import - importing ${enrichedRecords.length} records`)

          onImport(enrichedRecords, (current, total) => {
            setImportProgress({ current, total })
          })
            .then(() => {
              setImportProgress({ current: totalRecords, total: totalRecords })
              // Сброс через 1.5 сек
              setTimeout(() => {
                setLoading(false)
                setImportProgress({ current: 0, total: 0 })
                setShowProgressModal(false)
              }, 1500)
            })
            .catch(() => {
              setLoading(false)
              setImportProgress({ current: 0, total: 0 })
              setShowProgressModal(false)
            })
        }
      } catch (err) {
        console.error('❌ CSV Import - error:', err)
        setLoading(false)
        setImportProgress({ current: 0, total: 0 })
      }
    }
    reader.readAsText(file, 'UTF-8')

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
          opacity: loading ? 0.6 : 1,
          pointerEvents: loading ? 'none' : 'auto',
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {loading ? 'Импорт...' : 'Импорт CSV'}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Модальное окно прогресса импорта (по центру экрана) */}
      <Modal
        isOpen={showProgressModal}
        onClose={() => {}}
        title="Импорт CSV"
        width="400px"
      >
        <div className="space-y-4 text-center">
          <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Импорт записей...
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Загружено {importProgress.current} из {importProgress.total}
          </div>
          <div className="w-full rounded-full h-3" style={{ backgroundColor: 'var(--color-border)' }}>
            <div
              className="h-3 rounded-full transition-all duration-200"
              style={{
                width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                backgroundColor: importProgress.current === importProgress.total ? '#22c55e' : 'var(--color-primary)',
              }}
            />
          </div>
          {importProgress.current === importProgress.total && importProgress.total > 0 && (
            <div className="text-sm font-medium" style={{ color: '#22c55e' }}>
              ✓ Импорт завершён
            </div>
          )}
        </div>
      </Modal>

      {/* Модальное окно с ошибками валидации */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false)
          setLoading(false)
          setImportProgress({ current: 0, total: 0 })
        }}
        title="Ошибки импорта CSV"
        width="700px"
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
            Всего записей: {totalRecords}. Найдено {errors.length} ошибок. Исправьте их и повторите импорт.
          </div>
          <div
            className="max-h-80 overflow-y-auto space-y-1 text-sm font-mono"
            style={{ color: 'var(--color-text)' }}
          >
            {errors.map((err, i) => (
              <div
                key={i}
                className="px-3 py-1.5 rounded"
                style={{ backgroundColor: 'var(--color-card-bg)' }}
              >
                строка {err.row}: колонка "{err.column}" — {err.message}.
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowErrorModal(false)
                setLoading(false)
                setImportProgress({ current: 0, total: 0 })
              }}
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