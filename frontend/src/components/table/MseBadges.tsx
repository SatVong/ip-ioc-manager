import { MSE_NAMES, IOC_SOURCE_NAMES } from '../../utils/constants'

interface MseBadgesProps {
  mses: number[] | undefined | null
  variant?: 'ip' | 'ioc'
  /** Какие mse сейчас активны для фильтрации (подсвечиваются) */
  activeMses?: number[]
  /** Коллбэк при клике на квадратик */
  onToggleMse?: (mse: number) => void
  /** Режим отображения: 'badge' (только чтение) или 'toggle' (кликабельные квадратики) */
  mode?: 'badge' | 'toggle'
}

const colors = [
  '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#14b8a6', '#f97316',
  '#6366f1', '#d946ef', '#10b981', '#eab308', '#0ea5e9',
]

export default function MseBadges({ mses, variant = 'ip', activeMses, onToggleMse, mode = 'badge' }: MseBadgesProps) {
  const names = variant === 'ioc' ? IOC_SOURCE_NAMES : MSE_NAMES

  // Режим кликабельных квадратиков (для колонки "Где внесено")
  if (mode === 'toggle') {
    const allMses = variant === 'ioc' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    return (
      <div className="flex flex-wrap gap-0.5">
        {allMses.map((m) => {
          const isActive = mses?.includes(m) ?? false
          const isHighlighted = activeMses?.includes(m) ?? false
          return (
            <button
              key={m}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleMse?.(m)
              }}
              className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold transition-all cursor-pointer"
              style={{
                backgroundColor: isActive
                  ? `${colors[(m - 1) % colors.length]}cc`
                  : isHighlighted
                    ? `${colors[(m - 1) % colors.length]}40`
                    : 'var(--color-bg)',
                color: isActive ? '#fff' : 'var(--color-text-secondary)',
                border: `1px solid ${isActive || isHighlighted ? colors[(m - 1) % colors.length] : 'var(--color-border)'}`,
                opacity: isActive ? 1 : 0.6,
              }}
              title={names[m] || `МСЭ ${m}`}
            >
              {m}
            </button>
          )
        })}
      </div>
    )
  }

  // Режим обычных бейджей (для остальных колонок типа mse)
  if (!mses || mses.length === 0) return <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>—</span>

  return (
    <div className="flex flex-wrap gap-1">
      {mses.map((m) => (
        <span
          key={m}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: `${colors[(m - 1) % colors.length]}20`,
            color: colors[(m - 1) % colors.length],
          }}
          title={names[m] || `МСЭ ${m}`}
        >
          {m}
        </span>
      ))}
    </div>
  )
}