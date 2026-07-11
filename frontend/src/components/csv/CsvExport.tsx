import type { ColumnDef } from '../../utils/constants'

interface CsvExportProps {
  data: Record<string, unknown>[]
  columns: ColumnDef<any>[]
  filename?: string
}

function getTimestamp(): string {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(2)
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year}_${hours}${minutes}`
}

export default function CsvExport({ data, columns, filename = 'export.csv' }: CsvExportProps) {
  const handleExport = () => {
    if (data.length === 0) return

    // Добавляем дату/время в имя файла: name_dd.mm.yy_hhmm.csv
    const extIndex = filename.lastIndexOf('.')
    const baseName = extIndex !== -1 ? filename.slice(0, extIndex) : filename
    const ext = extIndex !== -1 ? filename.slice(extIndex) : '.csv'
    const datedFilename = `${baseName}_${getTimestamp()}${ext}`

    // Функция экранирования для CSV (оборачиваем в кавычки если есть ; или ")
    const escapeCsv = (val: string): string => {
      if (val.includes(';') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const headers = columns.map((col) => col.label)
    const rows = data.map((record) =>
      columns.map((col) => {
        const value = record[col.key as string]
        if (Array.isArray(value)) return value.join(';')
        return escapeCsv(String(value ?? ''))
      })
    )

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.join(';')),
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = datedFilename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
      style={{
        color: 'var(--color-primary)',
        border: '1px solid var(--color-primary)',
      }}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Экспорт CSV
    </button>
  )
}