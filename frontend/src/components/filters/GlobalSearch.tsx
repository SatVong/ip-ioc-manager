import { useState, type KeyboardEvent } from 'react'

interface GlobalSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function GlobalSearch({ value, onChange, placeholder = 'Поиск по всем полям...' }: GlobalSearchProps) {
  const [local, setLocal] = useState(value)

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onChange(local)
    }
  }

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
        style={{ color: 'var(--color-text-secondary)' }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onChange(local)}
        placeholder={placeholder}
        className="w-64 pl-9 pr-3 py-2 rounded-lg border text-sm outline-none transition-colors"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      />
    </div>
  )
}