import api from './client'
import type { LoginRequest, LoginResponse, User } from '../types'

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', data)
  return response.data
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me')
  return response.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}