import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

export default function Header() {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useTheme()

  return (
    <header
      className="h-16 border-b flex items-center justify-between px-6 shrink-0"
      style={{
        backgroundColor: 'var(--color-header-bg)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
        IP/IOC Manager
      </h1>

      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg transition-colors hover:opacity-80"
          style={{ color: 'var(--color-text-secondary)' }}
          title={isDark ? 'Светлая тема' : 'Тёмная тема'}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
            }}
          >
            {user?.full_name?.charAt(0) || user?.username?.charAt(0) || '?'}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text)' }}>
            <div className="font-medium">{user?.full_name || user?.username}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {user?.role === 'admin' ? 'Администратор' : 'Пользователь'}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm rounded-lg transition-colors hover:opacity-80"
          style={{
            color: 'var(--color-danger)',
            border: '1px solid var(--color-danger)',
          }}
        >
          Выйти
        </button>
      </div>
    </header>
  )
}