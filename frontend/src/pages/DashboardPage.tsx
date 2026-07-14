import { useState, useEffect, useCallback } from 'react'
import { useNotification } from '../hooks/useNotification'
import * as dashboardApi from '../api/dashboard'
import type { DashboardStats, TopCountry, TimelineItem, AppearanceData } from '../types'
import StatsCard from '../components/dashboard/StatsCard'
import TopCountriesChart from '../components/dashboard/TopCountriesChart'
import TimelineChart from '../components/dashboard/TimelineChart'
import AppearanceChart from '../components/dashboard/AppearanceChart'

type Period = 'week' | 'month' | 'quarter' | 'year'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
]

export default function DashboardPage() {
  const { addNotification } = useNotification()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topCountries, setTopCountries] = useState<TopCountry[]>([])
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)

  // Периоды для графиков появления
  const [ipPeriod, setIpPeriod] = useState<Period>('month')
  const [iocPeriod, setIocPeriod] = useState<Period>('month')
  const [whiteIpPeriod, setWhiteIpPeriod] = useState<Period>('month')

  // Данные графиков появления
  const [ipAppearance, setIpAppearance] = useState<AppearanceData[]>([])
  const [iocAppearance, setIocAppearance] = useState<AppearanceData[]>([])
  const [whiteIpAppearance, setWhiteIpAppearance] = useState<AppearanceData[]>([])

  const loadAppearance = useCallback(async (period: Period, type: 'ip' | 'ioc' | 'white-ip') => {
    try {
      return await dashboardApi.getAppearance(period, type)
    } catch {
      addNotification('error', `Ошибка загрузки графика появления ${type === 'ip' ? 'IP' : type === 'ioc' ? 'IOC' : 'White IP'}`)
      return []
    }
  }, [addNotification])

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

  // Загрузка графиков появления при смене периода
  useEffect(() => {
    loadAppearance(ipPeriod, 'ip').then(setIpAppearance)
  }, [ipPeriod, loadAppearance])

  useEffect(() => {
    loadAppearance(iocPeriod, 'ioc').then(setIocAppearance)
  }, [iocPeriod, loadAppearance])

  useEffect(() => {
    loadAppearance(whiteIpPeriod, 'white-ip').then(setWhiteIpAppearance)
  }, [whiteIpPeriod, loadAppearance])

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
      ]
    : []

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Дашборд
      </h2>

      {/* Stats cards — только 3 карточки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Графики появления — 3 виджета в ряд */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* IP Appearance */}
        <div
          className="rounded-xl p-5 border"
          style={{
            backgroundColor: 'var(--color-card-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              График появления IP
            </h3>
            <select
              value={ipPeriod}
              onChange={(e) => setIpPeriod(e.target.value as Period)}
              className="px-2 py-1 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <AppearanceChart data={ipAppearance} color="#3b82f6" />
        </div>

        {/* IOC Appearance */}
        <div
          className="rounded-xl p-5 border"
          style={{
            backgroundColor: 'var(--color-card-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              График появления IOC
            </h3>
            <select
              value={iocPeriod}
              onChange={(e) => setIocPeriod(e.target.value as Period)}
              className="px-2 py-1 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <AppearanceChart data={iocAppearance} color="#8b5cf6" />
        </div>

        {/* White IP Appearance */}
        <div
          className="rounded-xl p-5 border"
          style={{
            backgroundColor: 'var(--color-card-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              График появления White IP
            </h3>
            <select
              value={whiteIpPeriod}
              onChange={(e) => setWhiteIpPeriod(e.target.value as Period)}
              className="px-2 py-1 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <AppearanceChart data={whiteIpAppearance} color="#22c55e" />
        </div>
      </div>
    </div>
  )
}