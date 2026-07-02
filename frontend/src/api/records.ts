import api from './client'
import type { IpRecord, PaginatedResponse } from '../types'

export async function getRecords(): Promise<IpRecord[]> {
  const response = await api.get<IpRecord[]>('/records')
  return response.data
}

export async function getRecordsPaginated(params: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
  filters?: string
  globalSearch?: string
}): Promise<PaginatedResponse<IpRecord>> {
  const response = await api.get<PaginatedResponse<IpRecord>>('/records/paginated', { params })
  return response.data
}

export async function getRecordById(id: number): Promise<IpRecord> {
  const response = await api.get<IpRecord>(`/records/${id}`)
  return response.data
}

export async function createRecord(data: Partial<IpRecord>): Promise<IpRecord> {
  const response = await api.post<IpRecord>('/records', data)
  return response.data
}

export async function updateRecord(id: number, data: Partial<IpRecord>): Promise<IpRecord> {
  const response = await api.put<IpRecord>(`/records/${id}`, data)
  return response.data
}

export async function deleteRecord(id: number): Promise<void> {
  await api.delete(`/records/${id}`)
}