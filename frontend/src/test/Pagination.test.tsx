import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Pagination from '../components/pagination/Pagination'

describe('Pagination', () => {
  const defaultProps = {
    page: 1,
    limit: 25,
    total: 100,
    totalPages: 4,
    onPageChange: () => {},
    onLimitChange: () => {},
  }

  it('should render page info', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('should render total count', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('should render limit selector', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('should disable prev button on first page', () => {
    render(<Pagination {...defaultProps} page={1} />)
    const prevButton = screen.getByTitle('Предыдущая')
    expect(prevButton).toBeDisabled()
  })

  it('should disable next button on last page', () => {
    render(<Pagination {...defaultProps} page={4} totalPages={4} />)
    const nextButton = screen.getByTitle('Следующая')
    expect(nextButton).toBeDisabled()
  })

  it('should show ellipsis for many pages', () => {
    render(<Pagination {...defaultProps} page={5} total={250} totalPages={10} />)
    const ellipsis = screen.getAllByText('...')
    expect(ellipsis.length).toBeGreaterThanOrEqual(1)
  })

  it('should not render when single page and all items fit', () => {
    const { container } = render(<Pagination {...defaultProps} total={5} totalPages={1} />)
    expect(container.innerHTML).toBe('')
  })
})