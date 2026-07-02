import { useState, useEffect } from 'react'
import { useNotification } from '../hooks/useNotification'
import * as dashboardApi from '../api/dashboard'
import type { DashboardStats, TopCountry, TimelineItem } from '../types'

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
        { label: 'IP Источники', value: stats.totalIpRecords, color: '#3b82f6' },
        { label: 'IOC Хеши', value: stats.totalIocRecords, color: '#8b5cf6' },
        { label: 'Белые IP', value: stats.totalWhiteIpRecords, color: '#22c55e' },
        { label: 'Пользователи', value: stats.totalUsers, color: '#f59e0b' },
        { label: 'Активные', value: stats.activeUsers, color: '#ef4444' },
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
          <div
            key={card.label}
            className="rounded-xl p-5 border"
            style={{
              backgroundColor: 'var(--color-card-bg)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${card.color}20` }}
              >
                <span className="text-lg font-bold" style={{ color: card.color }}>
                  {card.value}
                </span>
              </div>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {card.label}
              </span>
            </div>
          </div>
        ))}
      </div>

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
          {topCountries.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Нет данных
            </p>
          ) : (
            <div className="space-y-3">
              {topCountries.map((item) => {
                const maxCount = topCountries[0]?.count || 1
                const width = (item.count / maxCount) * 100
                return (
                  <div key={item.country}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--color-text)' }}>{item.country}</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${width}%`,
                          backgroundColor: 'var(--color-primary)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
          {timeline.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Нет данных
            </p>
          ) : (
            <div className="space-y-2">
              {timeline.map((item) => {
                const maxCount = Math.max(...timeline.map((t) => t.count), 1)
                const width = (item.count / maxCount) * 100
                return (
                  <div key={item.month}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--color-text)' }}>{item.month}</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{item.count}</span>
                    </div>
                    <div className="h-3 rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${width}%`,
                          backgroundColor: '#8b5cf6',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}