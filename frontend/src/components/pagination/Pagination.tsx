import { PAGE_SIZE_OPTIONS } from '../../utils/constants'

interface PaginationProps {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export default function Pagination({ page, limit, total, totalPages, onPageChange, onLimitChange }: PaginationProps) {
  if (totalPages <= 1 && total <= limit) return null

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = []
    const delta = 2
    const left = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)

    pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('...')
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Показать по:
        </span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="px-2 py-1.5 rounded border text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {total} записей
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-30"
          style={{
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
          title="Предыдущая"
        >
          ‹
        </button>

        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="px-3 py-1.5 rounded text-sm transition-colors"
              style={{
                backgroundColor: p === page ? 'var(--color-primary)' : 'transparent',
                color: p === page ? '#ffffff' : 'var(--color-text)',
                border: p === page ? 'none' : '1px solid var(--color-border)',
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-30"
          style={{
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
          title="Следующая"
        >
          ›
        </button>
      </div>
    </div>
  )
}