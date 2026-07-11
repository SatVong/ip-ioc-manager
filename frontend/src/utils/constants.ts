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
export type ColumnType = 'text' | 'date' | 'ip' | 'country' | 'mse' | 'readonly' | 'hash' | 'encoding' | 'status' | 'cidr'

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
  { label: 'Где внесено', key: 'mses', type: 'mse', sortable: true, filterable: true, width: '120px' },
  { label: 'Дата получения *', key: 'date', type: 'date', sortable: true, filterable: true, width: '130px' },
  { label: 'Откуда получено *', key: 'from_source', sortable: true, filterable: true, width: '200px' },
  { label: 'Раздел письма', key: 'letter', sortable: true, filterable: true, width: '100px' },
  { label: 'Домен', key: 'domain', sortable: true, filterable: true, width: '180px' },
  { label: 'IP-адрес *', key: 'ip', type: 'ip', sortable: true, filterable: true, width: '150px' },
  { label: 'Страна (2 буквы)*', key: 'country', type: 'country', sortable: true, filterable: true, width: '80px' },
  { label: 'Владелец', key: 'owner', sortable: true, filterable: true, width: '180px' },
  { label: 'Как внесено на МСЭ', key: 'mse_method', type: 'cidr', sortable: true, filterable: true, width: '160px' },
  { label: 'Примечание к внесению *', key: 'note_in', sortable: true, filterable: true, width: '200px' },
  { label: 'Заявки', key: 'soib_infr', sortable: true, filterable: true, width: '150px' },
  { label: 'Дата внесения *', key: 'date_in', type: 'readonly', sortable: true, filterable: true, width: '150px' },
  { label: 'Кто вносит', key: 'who_in', type: 'readonly', sortable: true, filterable: true, width: '150px' },
  { label: 'Примечание к исключению', key: 'note_out', type: 'readonly', sortable: true, filterable: true, width: '200px' },
  { label: 'Дата исключения', key: 'date_out', type: 'readonly', sortable: true, filterable: true, width: '150px' },
  { label: 'Кто исключил', key: 'who_out', type: 'readonly', sortable: true, filterable: true, width: '150px' },
]

// ===== IOC Records columns =====
export const IOC_RECORD_COLUMNS: ColumnDef<any>[] = [
  { label: 'Где внесено', key: 'mses', type: 'mse', sortable: true, filterable: true, width: '120px' },
  { label: 'Дата получения', key: 'date', type: 'date', sortable: true, filterable: true, width: '130px' },
  { label: 'Откуда получено', key: 'from_source', sortable: true, filterable: true, width: '200px' },
  { label: 'Раздел письма', key: 'letter', sortable: true, filterable: true, width: '100px' },
  { label: 'Индикатор компрометации', key: 'indicator', type: 'hash', sortable: true, filterable: true, width: '250px' },
  { label: 'Кодировка', key: 'encoding', type: 'encoding', sortable: true, filterable: true, width: '90px' },
  { label: 'Статус OpenTip', key: 'status_opentip', type: 'status', sortable: true, filterable: true, width: '140px' },
  { label: 'Статус VirusTotal', key: 'status_virustotal', type: 'status', sortable: true, filterable: true, width: '140px' },
  { label: 'Примечание к внесению', key: 'note_in', sortable: true, filterable: true, width: '200px' },
  { label: 'Дата внесения', key: 'date_in', type: 'readonly', sortable: true, filterable: true, width: '150px' },
  { label: 'Кто вносил', key: 'who_in', type: 'readonly', sortable: true, filterable: true, width: '150px' },
  { label: 'Примечание к исключению', key: 'note_out', type: 'readonly', sortable: true, filterable: true, width: '200px' },
  { label: 'Дата исключения', key: 'date_out', type: 'readonly', sortable: true, filterable: true, width: '150px' },
  { label: 'Кто исключил', key: 'who_out', type: 'readonly', sortable: true, filterable: true, width: '150px' },
]

// ===== White IP Records columns =====
export const WHITE_IP_RECORD_COLUMNS: ColumnDef<any>[] = [
  { label: 'Где внесено', key: 'mses', type: 'mse', sortable: true, filterable: true, width: '120px' },
  { label: 'Дата получения', key: 'date', type: 'date', sortable: true, filterable: true, width: '130px' },
  { label: 'Откуда получено', key: 'from_source', sortable: true, filterable: true, width: '200px' },
  { label: 'Раздел письма', key: 'letter', sortable: true, filterable: true, width: '100px' },
  { label: 'IP-адрес', key: 'ip', type: 'ip', sortable: true, filterable: true, width: '150px' },
  { label: 'Как внесено на МСЭ', key: 'mse_method', type: 'cidr', sortable: true, filterable: true, width: '160px' },
  { label: 'Примечание к внесению', key: 'note_in', sortable: true, filterable: true, width: '200px' },
  { label: 'Заявки', key: 'soib_infr', sortable: true, filterable: true, width: '150px' },
  { label: 'Дата внесения', key: 'date_in', type: 'readonly', sortable: true, filterable: true, width: '150px' },
  { label: 'Кто вносил', key: 'who_in', type: 'readonly', sortable: true, filterable: true, width: '150px' },
  { label: 'Примечание к исключению', key: 'note_out', type: 'readonly', sortable: true, filterable: true, width: '200px' },
  { label: 'Дата исключения', key: 'date_out', type: 'readonly', sortable: true, filterable: true, width: '150px' },
  { label: 'Кто исключил', key: 'who_out', type: 'readonly', sortable: true, filterable: true, width: '150px' },
]

// Маппинг ключей колонок (английский → русский) для фильтрации на бэкенде
// Бэкенд ожидает русские названия колонок в filters, а col.key — английские
export const IP_FILTER_KEY_MAP: Record<string, string> = {
  mses: 'Где внесено',
  date: 'Дата получения',
  from_source: 'Откуда получено',
  letter: 'Раздел письма',
  domain: 'Домен',
  ip: 'IP-адрес',
  country: 'Страна',
  owner: 'Владелец',
  mse_method: 'Как внесено на МСЭ',
  note_in: 'Примечание к внесению',
  soib_infr: 'Заявки',
  date_in: 'Дата внесения',
  who_in: 'Кто вносил',
  note_out: 'Примечание к исключению',
  date_out: 'Дата исключения',
  who_out: 'Кто исключил',
}

export const IOC_FILTER_KEY_MAP: Record<string, string> = {
  mses: 'Где внесено',
  date: 'Дата получения',
  from_source: 'Откуда получено',
  letter: 'Раздел письма',
  indicator: 'Индикатор компрометации',
  encoding: 'Кодировка',
  status_opentip: 'Статус OpenTip',
  status_virustotal: 'Статус VirusTotal',
  note_in: 'Примечание к внесению',
  date_in: 'Дата внесения',
  who_in: 'Кто вносил',
  note_out: 'Примечание к исключению',
  date_out: 'Дата исключения',
  who_out: 'Кто исключил',
}

export const WHITE_IP_FILTER_KEY_MAP: Record<string, string> = {
  mses: 'Где внесено',
  date: 'Дата получения',
  from_source: 'Откуда получено',
  letter: 'Раздел письма',
  ip: 'IP-адрес',
  mse_method: 'Как внесено на МСЭ',
  note_in: 'Примечание к внесению',
  soib_infr: 'Заявки',
  date_in: 'Дата внесения',
  who_in: 'Кто вносил',
  note_out: 'Примечание к исключению',
  date_out: 'Дата исключения',
  who_out: 'Кто исключил',
}

// Маппинг русских названий колонок → поля БД (для сортировки)
export const IP_SORT_MAP: Record<string, string> = {
  'Где внесено': 'id',
  'Дата получения': 'date',
  'Откуда получено': 'from_source',
  'Раздел письма': 'letter',
  'Домен': 'domain',
  'IP-адрес': 'ip',
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
  'IP-адрес': 'ip',
  'Как внесено на МСЭ': 'mse_method',
  'Примечание к внесению': 'note_in',
  'Заявки': 'soib_infr',
  'Дата внесения': 'date_in',
  'Кто вносил': 'who_in',
  'Примечание к исключению': 'note_out',
  'Дата исключения': 'date_out',
  'Кто исключил': 'who_out',
}