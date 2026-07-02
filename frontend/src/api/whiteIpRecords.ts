import api from './client'
import type { WhiteIpRecord, PaginatedResponse } from '../types'

export async function getWhiteIpRecordsPaginated(params: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
  filters?: string
  globalSearch?: string
}): Promise<PaginatedResponse<WhiteIpRecord>> {
  const response = await api.get<PaginatedResponse<WhiteIpRecord>>('/white-ip-records/paginated', { params })
  return response.data
}

export async function createWhiteIpRecord(data: Partial<WhiteIpRecord>): Promise<WhiteIpRecord> {
  const response = await api.post<WhiteIpRecord>('/white-ip-records', data)
  return response.data
}

export async function updateWhiteIpRecord(id: number, data: Partial<WhiteIpRecord>): Promise<WhiteIpRecord> {
  const response = await api.put<WhiteIpRecord>(`/white-ip-records/${id}`, data)
  return response.data
}

export async function deleteWhiteIpRecord(id: number): Promise<void> {
  await api.delete(`/white-ip-records/${id}`)
}