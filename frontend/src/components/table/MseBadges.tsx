import { MSE_NAMES, IOC_SOURCE_NAMES } from '../../utils/constants'

interface MseBadgesProps {
  mses: number[] | undefined | null
  variant?: 'ip' | 'ioc'
}

const colors = [
  '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#14b8a6', '#f97316',
  '#6366f1', '#d946ef', '#10b981', '#eab308', '#0ea5e9',
]

export default function MseBadges({ mses, variant = 'ip' }: MseBadgesProps) {
  if (!mses || mses.length === 0) return <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>—</span>

  const names = variant === 'ioc' ? IOC_SOURCE_NAMES : MSE_NAMES

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