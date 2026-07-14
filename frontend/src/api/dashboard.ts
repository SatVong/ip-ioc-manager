import api from './client'
import type { DashboardStats, TopCountry, TimelineItem, AppearanceData } from '../types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>('/dashboard/stats')
  return response.data
}

export async function getTopCountries(limit: number = 5): Promise<TopCountry[]> {
  const response = await api.get<TopCountry[]>('/dashboard/top-countries', { params: { limit } })
  return response.data
}

export async function getTimeline(): Promise<TimelineItem[]> {
  const response = await api.get<TimelineItem[]>('/dashboard/timeline')
  return response.data
}

export async function getAppearance(period: string, type: string): Promise<AppearanceData[]> {
  const response = await api.get<AppearanceData[]>('/dashboard/appearance', { params: { period, type } })
  return response.data
}