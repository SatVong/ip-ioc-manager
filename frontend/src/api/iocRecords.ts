import api from './client'
import type { IocRecord, PaginatedResponse } from '../types'

export async function getIocRecords(): Promise<IocRecord[]> {
  const response = await api.get<IocRecord[]>('/ioc-records')
  return response.data
}

export async function getIocRecordsPaginated(params: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
  filters?: string
  globalSearch?: string
}): Promise<PaginatedResponse<IocRecord>> {
  const response = await api.get<PaginatedResponse<IocRecord>>('/ioc-records/paginated', { params })
  return response.data
}

export async function getIocRecordById(id: number): Promise<IocRecord> {
  const response = await api.get<IocRecord>(`/ioc-records/${id}`)
  return response.data
}

export async function createIocRecord(data: Partial<IocRecord>): Promise<IocRecord> {
  const response = await api.post<IocRecord>('/ioc-records', data)
  return response.data
}

export async function updateIocRecord(id: number, data: Partial<IocRecord>): Promise<IocRecord> {
  const response = await api.put<IocRecord>(`/ioc-records/${id}`, data)
  return response.data
}

export async function deleteIocRecord(id: number): Promise<void> {
  await api.delete(`/ioc-records/${id}`)
}

export async function getIocRecordsMseCounts(): Promise<Record<number, number>> {
  const response = await api.get<Record<number, number>>('/ioc-records/mse-counts')
  return response.data
}