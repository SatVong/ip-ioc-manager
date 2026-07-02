import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsCard from '../components/dashboard/StatsCard'

describe('StatsCard', () => {
  it('should render label and value', () => {
    render(<StatsCard label="IP Источники" value={42} color="#3b82f6" icon="ip" />)
    expect(screen.getByText('IP Источники')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('should format large numbers with locale', () => {
    render(<StatsCard label="Тест" value={1500} color="#22c55e" icon="users" />)
    expect(screen.getByText('1 500')).toBeInTheDocument()
  })

  it('should render with zero value', () => {
    render(<StatsCard label="Пусто" value={0} color="#ef4444" icon="active" />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should render with different icon types', () => {
    const { rerender } = render(<StatsCard label="IP" value={1} color="#3b82f6" icon="ip" />)
    expect(screen.getByText('IP')).toBeInTheDocument()

    rerender(<StatsCard label="IOC" value={2} color="#8b5cf6" icon="ioc" />)
    expect(screen.getByText('IOC')).toBeInTheDocument()

    rerender(<StatsCard label="White" value={3} color="#22c55e" icon="white-ip" />)
    expect(screen.getByText('White')).toBeInTheDocument()
  })
})