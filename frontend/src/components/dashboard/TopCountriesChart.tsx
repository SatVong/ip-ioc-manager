import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { TopCountry } from '../../types'

interface TopCountriesChartProps {
  data: TopCountry[]
}

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444']

export default function TopCountriesChart({ data }: TopCountriesChartProps) {
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
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
          <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
          <YAxis
            type="category"
            dataKey="country"
            tick={{ fontSize: 12, fill: 'var(--color-text)' }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            formatter={(value: number) => [value.toLocaleString('ru-RU'), 'Количество']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}