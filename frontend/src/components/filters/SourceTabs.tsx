import { MSE_NAMES, IOC_SOURCE_NAMES } from '../../utils/constants'

interface SourceTabsProps {
  variant: 'ip' | 'ioc'
  activeMse: number | null
  onChange: (mse: number | null) => void
  /** Количество записей для каждого mse */
  counts?: Record<number, number>
}

const ORG1_IP = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] // 1-PT AF ... 11-KATA
const ORG2_IP = [12, 13, 14, 15] // 12-SIEM ... 15-Mitigator
const ORG1_IOC = [1, 2, 3] // 1-SIEM ... 3-PT Sandbox
const ORG2_IOC = [4, 5, 6] // 4-LOKI ... 6-KATA

const colors = [
  '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#14b8a6', '#f97316',
  '#6366f1', '#d946ef', '#10b981', '#eab308', '#0ea5e9',
]

export default function SourceTabs({ variant, activeMse, onChange, counts }: SourceTabsProps) {
  const names = variant === 'ioc' ? IOC_SOURCE_NAMES : MSE_NAMES
  const org1 = variant === 'ioc' ? ORG1_IOC : ORG1_IP
  const org2 = variant === 'ioc' ? ORG2_IOC : ORG2_IP

  const renderTab = (mse: number) => {
    const isActive = activeMse === mse
    const color = colors[(mse - 1) % colors.length]
    return (
      <button
        key={mse}
        onClick={() => onChange(isActive ? null : mse)}
        className="px-2.5 py-1.5 text-xs rounded-md transition-all whitespace-nowrap"
        style={{
          backgroundColor: isActive ? `${color}20` : 'transparent',
          color: isActive ? color : 'var(--color-text-secondary)',
          border: `1px solid ${isActive ? color : 'var(--color-border)'}`,
          fontWeight: isActive ? 600 : 400,
        }}
        title={names[mse] || `МСЭ ${mse}`}
      >
        {names[mse] || mse}
        {counts?.[mse] !== undefined && (
          <span className="ml-1 opacity-60">({counts[mse]})</span>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Сводный (все) */}
        <button
          onClick={() => onChange(null)}
          className="px-3 py-1.5 text-xs rounded-md transition-all font-medium"
          style={{
            backgroundColor: activeMse === null ? 'var(--color-primary)' : 'transparent',
            color: activeMse === null ? '#fff' : 'var(--color-text-secondary)',
            border: `1px solid ${activeMse === null ? 'var(--color-primary)' : 'var(--color-border)'}`,
          }}
        >
          Сводный
        </button>

        {/* Организация №1 */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] font-medium uppercase tracking-wider mr-1" style={{ color: 'var(--color-text-secondary)' }}>
            Орг.№1:
          </span>
          {org1.map(renderTab)}
        </div>

        {/* Организация №2 */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] font-medium uppercase tracking-wider mr-1" style={{ color: 'var(--color-text-secondary)' }}>
            Орг.№2:
          </span>
          {org2.map(renderTab)}
        </div>
      </div>
    </div>
  )
}