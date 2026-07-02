import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  const fields = [
    { label: 'Имя пользователя', value: user.username },
    { label: 'Полное имя', value: user.full_name },
    { label: 'Должность', value: user.position },
    { label: 'Отдел', value: user.department },
    { label: 'Email', value: user.email },
    { label: 'Роль', value: user.role === 'admin' ? 'Администратор' : 'Пользователь' },
    { label: 'Статус', value: user.is_active ? 'Активен' : 'Заблокирован' },
    { label: 'Дата регистрации', value: new Date(user.created_at).toLocaleDateString('ru-RU') },
    { label: 'Последний вход', value: user.last_login ? new Date(user.last_login).toLocaleString('ru-RU') : 'Нет' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Профиль
      </h2>

      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {user.full_name?.charAt(0) || user.username?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                {user.full_name || user.username}
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {user.position || 'Должность не указана'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.label}>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {field.label}
                </span>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text)' }}>
                  {field.value || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}