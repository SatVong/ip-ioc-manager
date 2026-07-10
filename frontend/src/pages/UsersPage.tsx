import { useState, useEffect, useCallback } from 'react'
import Modal from '../components/modal/Modal'
import { usePermissions } from '../hooks/usePermissions'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../hooks/useAuth'
import * as usersApi from '../api/users'
import type { User } from '../types'

interface UserFormData {
  username: string
  password: string
  full_name: string
  position: string
  department: string
  email: string
  is_active: boolean
  role: 'admin' | 'user'
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  can_import: boolean
  can_export: boolean
  can_manage_users: boolean
}

const emptyFormData: UserFormData = {
  username: '',
  password: '',
  full_name: '',
  position: '',
  department: '',
  email: '',
  is_active: true,
  role: 'user',
  can_create: false,
  can_edit: false,
  can_delete: false,
  can_import: false,
  can_export: false,
  can_manage_users: false,
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const { canManageUsers, isAdmin } = usePermissions()
  const { addNotification } = useNotification()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null)
  const [formData, setFormData] = useState<UserFormData>(emptyFormData)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await usersApi.getUsers()
      setUsers(data)
    } catch {
      addNotification('error', 'Ошибка загрузки пользователей')
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleCreate = useCallback(async () => {
    if (!formData.username || !formData.password) {
      addNotification('warning', 'Логин и пароль обязательны')
      return
    }
    try {
      setSaving(true)
      await usersApi.createUser({
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        position: formData.position,
        department: formData.department,
        email: formData.email,
        is_active: formData.is_active,
        role: formData.role,
      })
      // Update permissions after creation
      const newUsers = await usersApi.getUsers()
      const created = newUsers.find(u => u.username === formData.username)
      if (created) {
        await usersApi.updateUser(created.id, {
          can_create: formData.can_create,
          can_edit: formData.can_edit,
          can_delete: formData.can_delete,
          can_import: formData.can_import,
          can_export: formData.can_export,
          can_manage_users: formData.can_manage_users,
        } as Partial<User>)
      }
      addNotification('success', 'Пользователь создан')
      setShowCreateModal(false)
      setFormData(emptyFormData)
      await loadUsers()
    } catch {
      addNotification('error', 'Ошибка при создании пользователя')
    } finally {
      setSaving(false)
    }
  }, [formData, addNotification, loadUsers])

  const handleEdit = useCallback(async () => {
    if (!editingUser) return
    try {
      setSaving(true)
      await usersApi.updateUser(editingUser.id, {
        full_name: formData.full_name,
        role: formData.role,
        can_create: formData.can_create,
        can_edit: formData.can_edit,
        can_delete: formData.can_delete,
        can_import: formData.can_import,
        can_export: formData.can_export,
        can_manage_users: formData.can_manage_users,
      } as Partial<User>)
      addNotification('success', 'Пользователь обновлён')
      setShowEditModal(false)
      setEditingUser(null)
      await loadUsers()
    } catch {
      addNotification('error', 'Ошибка при обновлении пользователя')
    } finally {
      setSaving(false)
    }
  }, [editingUser, formData, addNotification, loadUsers])

  const handleToggleActive = useCallback(async (targetUser: User) => {
    try {
      await usersApi.toggleUser(targetUser.id, { is_active: !targetUser.is_active })
      addNotification('success', `Пользователь ${targetUser.is_active ? 'деактивирован' : 'активирован'}`)
      await loadUsers()
    } catch {
      addNotification('error', 'Ошибка при изменении статуса')
    }
  }, [addNotification, loadUsers])

  const handleChangePassword = useCallback(async () => {
    if (!passwordUserId || !newPassword) {
      addNotification('warning', 'Введите новый пароль')
      return
    }
    try {
      setSaving(true)
      await usersApi.changePassword(passwordUserId, { password: newPassword })
      addNotification('success', 'Пароль изменён')
      setShowPasswordModal(false)
      setPasswordUserId(null)
      setNewPassword('')
    } catch {
      addNotification('error', 'Ошибка при смене пароля')
    } finally {
      setSaving(false)
    }
  }, [passwordUserId, newPassword, addNotification])

  const handleDelete = useCallback(async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      addNotification('warning', 'Нельзя удалить самого себя')
      return
    }
    if (!window.confirm(`Удалить пользователя "${targetUser.username}"?`)) return
    try {
      await usersApi.deleteUser(targetUser.id)
      addNotification('success', 'Пользователь удалён')
      await loadUsers()
    } catch {
      addNotification('error', 'Ошибка при удалении пользователя')
    }
  }, [currentUser, addNotification, loadUsers])

  const openEditModal = useCallback((targetUser: User) => {
    setEditingUser(targetUser)
    setFormData({
      username: targetUser.username,
      password: '',
      full_name: targetUser.full_name,
      position: targetUser.position || '',
      department: targetUser.department || '',
      email: targetUser.email || '',
      is_active: targetUser.is_active,
      role: targetUser.role,
      can_create: targetUser.can_create,
      can_edit: targetUser.can_edit,
      can_delete: targetUser.can_delete,
      can_import: targetUser.can_import,
      can_export: targetUser.can_export,
      can_manage_users: targetUser.can_manage_users,
    })
    setShowEditModal(true)
  }, [])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('ru-RU')
  }

  if (!canManageUsers && !isAdmin) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Пользователи
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          У вас нет прав для управления пользователями
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Пользователи
        </h2>
        <button
          onClick={() => {
            setFormData(emptyFormData)
            setShowCreateModal(true)
          }}
          className="px-4 py-2 rounded-lg text-sm text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          + Создать пользователя
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
        </div>
      ) : users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Пользователи не найдены
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)' }}>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Логин</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>ФИО</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Роль</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Статус</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Последний вход</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Права</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="transition-colors hover:opacity-90"
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    opacity: u.is_active ? 1 : 0.5,
                  }}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {u.id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {u.username}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--color-text)' }}>
                    {u.full_name || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: u.role === 'admin' ? '#3b82f620' : '#22c55e20',
                        color: u.role === 'admin' ? '#3b82f6' : '#22c55e',
                      }}
                    >
                      {u.role === 'admin' ? 'Админ' : 'Пользователь'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: u.is_active ? '#22c55e20' : '#ef444420',
                        color: u.is_active ? '#22c55e' : '#ef4444',
                      }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      {u.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {formatDate(u.last_login)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {u.can_create && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#8b5cf620', color: '#8b5cf6' }}>C</span>}
                      {u.can_edit && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>E</span>}
                      {u.can_delete && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>D</span>}
                      {u.can_import && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>I</span>}
                      {u.can_export && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>X</span>}
                      {u.can_manage_users && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#ec489920', color: '#ec4899' }}>M</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 rounded transition-colors hover:opacity-80"
                        style={{ color: 'var(--color-primary)' }}
                        title="Редактировать"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setPasswordUserId(u.id)
                          setNewPassword('')
                          setShowPasswordModal(true)
                        }}
                        className="p-1.5 rounded transition-colors hover:opacity-80"
                        style={{ color: '#f59e0b' }}
                        title="Сменить пароль"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(u)}
                        className="p-1.5 rounded transition-colors hover:opacity-80"
                        style={{ color: u.is_active ? '#f59e0b' : '#22c55e' }}
                        title={u.is_active ? 'Деактивировать' : 'Активировать'}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {u.is_active ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded transition-colors hover:opacity-80"
                        style={{ color: 'var(--color-danger)' }}
                        title="Удалить"
                        disabled={u.id === currentUser?.id}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создание пользователя"
        width="550px"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Логин <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="Введите логин"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Пароль <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="Введите пароль"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              ФИО
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="Введите ФИО"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Должность
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="Введите должность"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Отдел
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="Введите отдел"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="Введите email"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border cursor-pointer"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: formData.is_active ? '#22c55e10' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text)' }}>Активен</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Должность
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="Введите должность"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Отдел
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="Введите отдел"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="Введите email"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border cursor-pointer"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: formData.is_active ? '#22c55e10' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text)' }}>Активен</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Роль
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
            >
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Разрешения
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['can_create', 'Создание'],
                ['can_edit', 'Редактирование'],
                ['can_delete', 'Удаление'],
                ['can_import', 'Импорт'],
                ['can_export', 'Экспорт'],
                ['can_manage_users', 'Управление пользователями'],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border cursor-pointer"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: formData[key as keyof UserFormData] ? '#3b82f610' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData[key as keyof UserFormData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="rounded"
                  />
                  <span style={{ color: 'var(--color-text)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
              style={{
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {saving ? 'Сохранение...' : 'Создать'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Редактирование: ${editingUser?.username || ''}`}
        width="550px"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Логин
            </label>
            <input
              type="text"
              value={formData.username}
              disabled
              className="w-full px-3 py-2 rounded-lg text-sm border opacity-60"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              ФИО
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Роль
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
            >
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Разрешения
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['can_create', 'Создание'],
                ['can_edit', 'Редактирование'],
                ['can_delete', 'Удаление'],
                ['can_import', 'Импорт'],
                ['can_export', 'Экспорт'],
                ['can_manage_users', 'Управление пользователями'],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border cursor-pointer"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: formData[key as keyof UserFormData] ? '#3b82f610' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData[key as keyof UserFormData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="rounded"
                  />
                  <span style={{ color: 'var(--color-text)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
              style={{
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleEdit}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Смена пароля"
        width="400px"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Новый пароль <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
              placeholder="Введите новый пароль"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
              style={{
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleChangePassword}
              disabled={saving || !newPassword}
              className="px-4 py-2 rounded-lg text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#f59e0b' }}
            >
              {saving ? 'Сохранение...' : 'Сменить пароль'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}