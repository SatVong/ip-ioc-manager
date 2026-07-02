import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { TimelineItem } from '../../types'

interface TimelineChartProps {
  data: TimelineItem[]
}

export default function TimelineChart({ data }: TimelineChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        Нет данных
      </p>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            formatter={(value: number) => [value.toLocaleString('ru-RU'), 'Записей']}
          />
          <Bar
            dataKey="count"
            fill="#8b5cf6"
            radius={[4, 4, 0, 0]}
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}