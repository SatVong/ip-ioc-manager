import { useNotification } from '../../hooks/useNotification'

const typeStyles: Record<string, { bg: string; border: string; icon: string }> = {
  success: { bg: '#22c55e', border: '#16a34a', icon: '✓' },
  error: { bg: '#ef4444', border: '#dc2626', icon: '✕' },
  warning: { bg: '#f59e0b', border: '#d97706', icon: '⚠' },
  info: { bg: '#3b82f6', border: '#2563eb', icon: 'ℹ' },
}

export default function Toast() {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((n) => {
        const style = typeStyles[n.type] || typeStyles.info
        return (
          <div
            key={n.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm min-w-[300px] max-w-[400px] animate-slide-up"
            style={{
              backgroundColor: style.bg,
              borderLeft: `4px solid ${style.border}`,
            }}
          >
            <span className="font-bold text-lg">{style.icon}</span>
            <span className="flex-1">{n.message}</span>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-white/80 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}