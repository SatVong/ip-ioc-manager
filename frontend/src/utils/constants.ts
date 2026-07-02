// Константы для таблиц и МСЭ

export const MSE_NAMES: Record<number, string> = {
  1: '1-PT AF',
  2: '2-NGENIX',
  3: '3-PT AF (DN)',
  4: '4-PT AF (GR)',
  5: '5-Mitigator (DN)',
  6: '6-Mitigator (GR)',
  7: '7-Континент',
  8: '8-UG',
  9: '9-Mitigator (IL)',
  10: '10-SIEM',
  11: '11-KATA',
  12: '12-SIEM',
  13: '13-KATA',
  14: '14-UG',
  15: '15-Mitigator',
}

export const IOC_SOURCE_NAMES: Record<number, string> = {
  1: '1-SIEM',
  2: '2-KATA',
  3: '3-PT Sandbox',
  4: '4-LOKI',
  5: '5-SIEM',
  6: '6-KATA',
}

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// Тип колонки для определения типа редактора/фильтра
export type ColumnType = 'text' | 'date' | 'ip' | 'country' | 'mse' | 'readonly' | 'hash' | 'encoding' | 'status'

export interface ColumnDef<T> {
  /** Отображаемое имя в заголовке */
  label: string
  /** Ключ в данных (может быть вложенным через точку) */
  key: keyof T | string
  /** Тип колонки для редактора */
  type?: ColumnType
  /** Можно ли сортировать */
  sortable?: boolean
  /** Можно ли фильтровать */
  filterable?: boolean
  /** Ширина колонки (CSS) */
  width?: string
  /** Кастомный рендерер */
  render?: (value: unknown, record: T) => React.ReactNode
  /** Можно ли редактировать */
  editable?: boolean
}

// ===== IP Records columns =====
export const IP_RECORD_COLUMNS: ColumnDef<any>[] = [
  { label: 'Где внесено', key: 'mses', type: 'mse', sortable: true, width: '120px' },
  { label: 'Дата получения', key: 'date', type: 'date', sortable: true, width: '130px' },
  { label: 'Откуда получено', key: 'from_source', sortable: true, width: '200px' },
  { label: 'Раздел письма', key: 'letter', sortable: true, width: '100px' },
  { label: 'Домен', key: 'domain', sortable: true, width: '180px' },
  { label: 'IP-адресс', key: 'ip', type: 'ip', sortable: true, width: '150px' },
  { label: 'Страна', key: 'country', type: 'country', sortable: true, width: '80px' },
  { label: 'Владелец', key: 'owner', sortable: true, width: '180px' },
  { label: 'Как внесено на МСЭ', key: 'mse_method', type: 'mse', sortable: true, width: '160px' },
  { label: 'Примечание к внесению', key: 'note_in', sortable: true, width: '200px' },
  { label: 'Заявки', key: 'soib_infr', sortable: true, width: '150px' },
  { label: 'Дата внесения', key: 'date_in', type: 'readonly', sortable: true, width: '150px' },
  { label: 'Кто вносил', key: 'who_in', type: 'readonly', sortable: true, width: '150px' },
  { label: 'Примечание к исключению', key: 'note_out', sortable: true, width: '200px' },
  { label: 'Дата исключения', key: 'date_out', type: 'readonly', sortable: true, width: '150px' },
  { label: 'Кто исключил', key: 'who_out', type: 'readonly', sortable: true, width: '150px' },
]

// ===== IOC Records columns =====
export const IOC_RECORD_COLUMNS: ColumnDef<any>[] = [
  { label: 'Где внесено', key: 'mses', type: 'mse', sortable: true, width: '120px' },
  { label: 'Дата получения', key: 'date', type: 'date', sortable: true, width: '130px' },
  { label: 'Откуда получено', key: 'from_source', sortable: true, width: '200px' },
  { label: 'Раздел письма', key: 'letter', sortable: true, width: '100px' },
  { label: 'Индикатор компрометации', key: 'indicator', type: 'hash', sortable: true, width: '250px' },
  { label: 'Кодировка', key: 'encoding', type: 'encoding', sortable: true, width: '90px' },
  { label: 'Статус OpenTip', key: 'status_opentip', type: 'status', sortable: true, width: '140px' },
  { label: 'Статус VirusTotal', key: 'status_virustotal', type: 'status', sortable: true, width: '140px' },
  { label: 'Примечание к внесению', key: 'note_in', sortable: true, width: '200px' },
  { label: 'Дата внесения', key: 'date_in', type: 'readonly', sortable: true, width: '150px' },
  { label: 'Кто вносил', key: 'who_in', type: 'readonly', sortable: true, width: '150px' },
  { label: 'Примечание к исключению', key: 'note_out', sortable: true, width: '200px' },
  { label: 'Дата исключения', key: 'date_out', type: 'readonly', sortable: true, width: '150px' },
  { label: 'Кто исключил', key: 'who_out', type: 'readonly', sortable: true, width: '150px' },
]

// ===== White IP Records columns =====
export const WHITE_IP_RECORD_COLUMNS: ColumnDef<any>[] = [
  { label: 'Где внесено', key: 'mses', type: 'mse', sortable: true, width: '120px' },
  { label: 'Дата получения', key: 'date', type: 'date', sortable: true, width: '130px' },
  { label: 'Откуда получено', key: 'from_source', sortable: true, width: '200px' },
  { label: 'Раздел письма', key: 'letter', sortable: true, width: '100px' },
  { label: 'IP-адресс', key: 'ip', type: 'ip', sortable: true, width: '150px' },
  { label: 'Как внесено на МСЭ', key: 'mse_method', type: 'mse', sortable: true, width: '160px' },
  { label: 'Примечание к внесению', key: 'note_in', sortable: true, width: '200px' },
  { label: 'Заявки', key: 'soib_infr', sortable: true, width: '150px' },
  { label: 'Дата внесения', key: 'date_in', type: 'readonly', sortable: true, width: '150px' },
  { label: 'Кто вносил', key: 'who_in', type: 'readonly', sortable: true, width: '150px' },
  { label: 'Примечание к исключению', key: 'note_out', sortable: true, width: '200px' },
  { label: 'Дата исключения', key: 'date_out', type: 'readonly', sortable: true, width: '150px' },
  { label: 'Кто исключил', key: 'who_out', type: 'readonly', sortable: true, width: '150px' },
]

// Маппинг русских названий колонок → поля БД (для сортировки)
export const IP_SORT_MAP: Record<string, string> = {
  'Где внесено': 'id',
  'Дата получения': 'date',
  'Откуда получено': 'from_source',
  'Раздел письма': 'letter',
  'Домен': 'domain',
  'IP-адресс': 'ip',
  'Страна': 'country',
  'Владелец': 'owner',
  'Как внесено на МСЭ': 'mse_method',
  'Примечание к внесению': 'note_in',
  'Заявки': 'soib_infr',
  'Дата внесения': 'date_in',
  'Кто вносил': 'who_in',
  'Примечание к исключению': 'note_out',
  'Дата исключения': 'date_out',
  'Кто исключил': 'who_out',
}

export const IOC_SORT_MAP: Record<string, string> = {
  'Где внесено': 'id',
  'Дата получения': 'date',
  'Откуда получено': 'from_source',
  'Раздел письма': 'letter',
  'Индикатор компрометации': 'indicator',
  'Кодировка': 'encoding',
  'Статус OpenTip': 'status_opentip',
  'Статус VirusTotal': 'status_virustotal',
  'Примечание к внесению': 'note_in',
  'Дата внесения': 'date_in',
  'Кто вносил': 'who_in',
  'Примечание к исключению': 'note_out',
  'Дата исключения': 'date_out',
  'Кто исключил': 'who_out',
}

export const WHITE_IP_SORT_MAP: Record<string, string> = {
  'Где внесено': 'id',
  'Дата получения': 'date',
  'Откуда получено': 'from_source',
  'Раздел письма': 'letter',
  'IP-адресс': 'ip',
  'Как внесено на МСЭ': 'mse_method',
  'Примечание к внесению': 'note_in',
  'Заявки': 'soib_infr',
  'Дата внесения': 'date_in',
  'Кто вносил': 'who_in',
  'Примечание к исключению': 'note_out',
  'Дата исключения': 'date_out',
  'Кто исключил': 'who_out',
}