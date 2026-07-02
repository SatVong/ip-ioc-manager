import { useAuth } from './useAuth'

export function usePermissions() {
  const { user } = useAuth()

  return {
    canCreate: user?.role === 'admin' || user?.can_create === true,
    canEdit: user?.role === 'admin' || user?.can_edit === true,
    canDelete: user?.role === 'admin' || user?.can_delete === true,
    canImport: user?.role === 'admin' || user?.can_import === true,
    canExport: user?.role === 'admin' || user?.can_export === true,
    canManageUsers: user?.role === 'admin' || user?.can_manage_users === true,
    isAdmin: user?.role === 'admin',
  }
}