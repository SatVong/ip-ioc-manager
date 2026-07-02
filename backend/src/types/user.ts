// Типы для пользователей
export interface User {
  id: number;
  username: string;
  password_hash: string;
  full_name: string | null;
  position: string | null;
  department: string | null;
  email: string | null;
  role: 'admin' | 'user';
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_import: boolean;
  can_export: boolean;
  can_manage_users: boolean;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
  is_active: boolean;
}

export interface UserPublic {
  id: number;
  username: string;
  full_name: string | null;
  position: string | null;
  department: string | null;
  email: string | null;
  role: 'admin' | 'user';
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_import: boolean;
  can_export: boolean;
  can_manage_users: boolean;
  created_at: Date;
  last_login: Date | null;
  is_active: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserPublic;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  full_name?: string;
  position?: string;
  department?: string;
  email?: string;
  role?: 'admin' | 'user';
  can_create?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_import?: boolean;
  can_export?: boolean;
  can_manage_users?: boolean;
}

export interface UpdateUserRequest {
  full_name?: string;
  position?: string;
  department?: string;
  email?: string;
  role?: 'admin' | 'user';
  password?: string;
  can_create?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_import?: boolean;
  can_export?: boolean;
  can_manage_users?: boolean;
  is_active?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: 'admin' | 'user';
}