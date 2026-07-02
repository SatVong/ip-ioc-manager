// ===== User types =====
export interface User {
  id: number
  username: string
  full_name: string
  position: string
  department: string
  email: string
  role: 'admin' | 'user'
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  can_import: boolean
  can_export: boolean
  can_manage_users: boolean
  is_active: boolean
  created_at: string
  last_login: string | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface JwtPayload {
  id: number
  username: string
  role: 'admin' | 'user'
  iat?: number
  exp?: number
}

// ===== Record types =====
export interface IpRecord {
  id: number
  mses: number[]
  date: string
  from_source: string
  letter: string
  domain: string
  ip: string
  country: string
  owner: string
  mse_method: string
  note_in: string
  soib_infr: string
  date_in: string
  who_in: string
  note_out: string
  date_out: string
  who_out: string
  created_at: string
  updated_at: string
}

export interface IocRecord {
  id: number
  mses: number[]
  date: string
  from_source: string
  letter: string
  indicator: string
  encoding: 'md5' | 'sha1' | 'sha256' | 'sha512'
  status_opentip: string
  status_virustotal: string
  note_in: string
  date_in: string
  who_in: string
  note_out: string
  date_out: string
  who_out: string
  created_at: string
  updated_at: string
}

export interface WhiteIpRecord {
  id: number
  mses: number[]
  date: string
  from_source: string
  letter: string
  ip: string
  mse_method: string
  note_in: string
  soib_infr: string
  date_in: string
  who_in: string
  note_out: string
  date_out: string
  who_out: string
  created_at: string
  updated_at: string
}

// ===== Pagination types =====
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginationState {
  page: number
  limit: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
  filters: Record<string, string>
  globalSearch: string
}

// ===== Dashboard types =====
export interface DashboardStats {
  totalIpRecords: number
  totalIocRecords: number
  totalWhiteIpRecords: number
  totalUsers: number
  activeUsers: number
}

export interface TopCountry {
  country: string
  count: number
}

export interface TimelineItem {
  month: string
  count: number
}

// ===== Notification types =====
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}