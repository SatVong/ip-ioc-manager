import api from './client'

export async function seedDemoData(): Promise<{ message: string; counts: Record<string, number> }> {
  const response = await api.post('/admin/seed-demo-data')
  return response.data
}

export async function clearIpRecords(): Promise<{ success: boolean; message: string }> {
  const response = await api.delete('/admin/clear-ip-records')
  return response.data
}

export async function clearIocRecords(): Promise<{ success: boolean; message: string }> {
  const response = await api.delete('/admin/clear-ioc-records')
  return response.data
}

export async function clearWhiteIpRecords(): Promise<{ success: boolean; message: string }> {
  const response = await api.delete('/admin/clear-white-ip-records')
  return response.data
}

export async function clearUsers(): Promise<{ success: boolean; message: string }> {
  const response = await api.delete('/admin/clear-users')
  return response.data
}