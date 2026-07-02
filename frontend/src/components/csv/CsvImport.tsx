import { useRef, type ChangeEvent } from 'react'

interface CsvImportProps {
  onImport: (data: Record<string, string>[]) => void
}

export default function CsvImport({ onImport }: CsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter((line) => line.trim())
      if (lines.length < 2) return

      const headers = lines[0].split(',').map((h) => h.trim())
      const records = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim())
        const record: Record<string, string> = {}
        headers.forEach((header, i) => {
          record[header] = values[i] || ''
        })
        return record
      })

      onImport(records)
    }
    reader.readAsText(file)

    // Сброс input для повторного выбора того же файла
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
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
  )
}