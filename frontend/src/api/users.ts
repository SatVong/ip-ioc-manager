import api from './client'
import type { User } from '../types'

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users')
  return response.data
}

export async function getUserById(id: number): Promise<User> {
  const response = await api.get<User>(`/users/${id}`)
  return response.data
}

export async function createUser(data: {
  username: string
  password: string
  full_name?: string
  position?: string
  department?: string
  email?: string
  is_active?: boolean
  role?: string
}): Promise<User> {
  const response = await api.post<User>('/users', data)
  return response.data
}

export async function updateUser(id: number, data: Partial<User>): Promise<User> {
  const response = await api.put<User>(`/users/${id}`, data)
  return response.data
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}

export async function toggleUser(id: number, data: { is_active: boolean }): Promise<User> {
  const response = await api.patch<User>(`/users/${id}/toggle`, data)
  return response.data
}

export async function changePassword(id: number, data: { password: string }): Promise<void> {
  await api.put(`/users/${id}/password`, data)
}