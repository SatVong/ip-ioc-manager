import { useState, useEffect } from 'react'
import { useNotification } from '../hooks/useNotification'
import * as dashboardApi from '../api/dashboard'
import type { DashboardStats, TopCountry, TimelineItem } from '../types'
import StatsCard from '../components/dashboard/StatsCard'
import TopCountriesChart from '../components/dashboard/TopCountriesChart'
import TimelineChart from '../components/dashboard/TimelineChart'

export default function DashboardPage() {
  const { addNotification } = useNotification()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topCountries, setTopCountries] = useState<TopCountry[]>([])
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, countriesData, timelineData] = await Promise.all([
          dashboardApi.getDashboardStats(),
          dashboardApi.getTopCountries(5),
          dashboardApi.getTimeline(),
        ])
        setStats(statsData)
        setTopCountries(countriesData)
        setTimeline(timelineData)
      } catch {
        addNotification('error', 'Ошибка загрузки данных дашборда')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addNotification])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
      </div>
    )
  }

  const statCards = stats
    ? [
        { label: 'IP Источники', value: stats.totalIpRecords, color: '#3b82f6', icon: 'ip' as const },
        { label: 'IOC Хеши', value: stats.totalIocRecords, color: '#8b5cf6', icon: 'ioc' as const },
        { label: 'Белые IP', value: stats.totalWhiteIpRecords, color: '#22c55e', icon: 'white-ip' as const },
        { label: 'Пользователи', value: stats.totalUsers, color: '#f59e0b', icon: 'users' as const },
        { label: 'Активные', value: stats.activeUsers, color: '#ef4444', icon: 'active' as const },
      ]
    : []

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Дашборд
      </h2>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <StatsCard
            key={card.label}
            label={card.label}
            value={card.value}
            color={card.color}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <div
          className="rounded-xl p-5 border"
          style={{
            backgroundColor: 'var(--color-card-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Топ-5 стран
          </h3>
          <TopCountriesChart data={topCountries} />
        </div>

        {/* Timeline */}
        <div
          className="rounded-xl p-5 border"
          style={{
            backgroundColor: 'var(--color-card-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Поступления по месяцам
          </h3>
          <TimelineChart data={timeline} />
        </div>
      </div>
    </div>
  )
}