import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../hooks/useNotification'
import Modal from '../components/modal/Modal'
import * as adminApi from '../api/admin'

export default function ProfilePage() {
  const { user } = useAuth()
  const { addNotification } = useNotification()
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearAction, setClearAction] = useState<string>('')
  const [confirmText, setConfirmText] = useState('')
  const [clearing, setClearing] = useState(false)

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

  const clearActions = [
    { key: 'ip', label: 'Очистка IP источники', description: 'Удалить все IP записи', phrase: 'ОЧИСТИТЬ IP' },
    { key: 'ioc', label: 'Очистка IOC Хеши', description: 'Удалить все IOC записи', phrase: 'ОЧИСТИТЬ IOC' },
    { key: 'white-ip', label: 'Очистка Белые IP', description: 'Удалить все White IP записи', phrase: 'ОЧИСТИТЬ WHITE' },
    { key: 'users', label: 'Очистка всех пользователей (кроме админа)', description: 'Удалить ВСЕХ пользователей, кроме текущего администратора. ID новых пользователей начнутся с 2.', phrase: 'ОЧИСТИТЬ USERS' },
  ]

  const handleClearClick = (action: string) => {
    setClearAction(action)
    setConfirmText('')
    setShowClearModal(true)
  }

  const handleClearConfirm = async () => {
    const action = clearActions.find(a => a.key === clearAction)
    if (!action || confirmText !== action.phrase) {
      addNotification('warning', 'Введите точную фразу для подтверждения')
      return
    }
    try {
      setClearing(true)
      switch (clearAction) {
        case 'ip':
          await adminApi.clearIpRecords()
          addNotification('success', 'IP записи очищены')
          break
        case 'ioc':
          await adminApi.clearIocRecords()
          addNotification('success', 'IOC записи очищены')
          break
        case 'white-ip':
          await adminApi.clearWhiteIpRecords()
          addNotification('success', 'White IP записи очищены')
          break
        case 'users':
          await adminApi.clearUsers()
          addNotification('success', 'Пользователи (кроме админа) удалены')
          break
      }
      setShowClearModal(false)
      setConfirmText('')
    } catch {
      addNotification('error', 'Ошибка при очистке')
    } finally {
      setClearing(false)
    }
  }

  const permissions = [
    { key: 'can_create', label: 'Создание записей', value: user.can_create },
    { key: 'can_edit', label: 'Редактирование записей', value: user.can_edit },
    { key: 'can_delete', label: 'Удаление записей', value: user.can_delete },
    { key: 'can_import', label: 'Импорт CSV', value: user.can_import },
    { key: 'can_export', label: 'Экспорт CSV', value: user.can_export },
    { key: 'can_manage_users', label: 'Управление пользователями', value: user.can_manage_users },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Профиль
      </h2>

      {/* Информация о пользователе */}
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

      {/* Права доступа */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Права доступа
          </h3>
          {user.role === 'admin' ? (
            <div
              className="px-4 py-3 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: '#3b82f610',
                color: '#3b82f6',
                border: '1px solid #3b82f630',
              }}
            >
              Полные права администратора — Всё разрешено
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {permissions.map((perm) => (
                <div
                  key={perm.key}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: perm.value ? '#22c55e10' : '#ef444410',
                    border: `1px solid ${perm.value ? '#22c55e30' : '#ef444430'}`,
                    color: perm.value ? '#22c55e' : '#ef4444',
                  }}
                >
                  <span>{perm.value ? '✓' : '✗'}</span>
                  <span>{perm.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Админ-панель (только для администратора) */}
      {user.role === 'admin' && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--color-card-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Администрирование
            </h3>
            <div className="space-y-3">
              {clearActions.map((action) => (
                <div
                  key={action.key}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    backgroundColor: '#ef444408',
                    border: '1px solid #ef444420',
                  }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {action.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {action.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleClearClick(action.key)}
                    className="px-3 py-1.5 rounded-lg text-xs text-white font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    Очистить
                  </button>
                </div>
              ))}
            </div>
            <div
              className="mt-4 px-4 py-3 rounded-lg text-xs"
              style={{
                backgroundColor: '#f59e0b10',
                color: '#92400e',
                border: '1px solid #f59e0b30',
              }}
            >
              Внимание! Эти действия полностью удаляют данные. Восстановить будет невозможно.
              Очистка пользователей удалит ВСЕХ пользователей, кроме текущего администратора. ID новых пользователей начнутся с 2.
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения очистки */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Подтверждение очистки"
        width="450px"
      >
        <div className="space-y-4">
          <div
            className="px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: '#ef444410',
              color: '#dc2626',
              border: '1px solid #ef444430',
            }}
          >
            {clearActions.find(a => a.key === clearAction)?.description}
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            Введите <strong>{clearActions.find(a => a.key === clearAction)?.phrase}</strong> для подтверждения:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              borderColor: confirmText === clearActions.find(a => a.key === clearAction)?.phrase ? '#22c55e' : 'var(--color-border)',
            }}
            placeholder="Введите фразу подтверждения"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowClearModal(false)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleClearConfirm}
              disabled={clearing || confirmText !== clearActions.find(a => a.key === clearAction)?.phrase}
              className="px-4 py-2 rounded-lg text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#ef4444' }}
            >
              {clearing ? 'Очистка...' : 'Подтвердить очистку'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}