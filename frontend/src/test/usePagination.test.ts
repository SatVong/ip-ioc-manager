import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../hooks/usePagination'

describe('usePagination', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePagination())

    expect(result.current.page).toBe(1)
    expect(result.current.limit).toBe(10)
    expect(result.current.sortBy).toBe('id')
    expect(result.current.sortOrder).toBe('desc')
    expect(result.current.filters).toEqual({})
    expect(result.current.globalSearch).toBe('')
  })

  it('should set page', () => {
    const { result } = renderHook(() => usePagination())

    act(() => result.current.setPage(3))
    expect(result.current.page).toBe(3)
  })

  it('should set limit and reset page to 1', () => {
    const { result } = renderHook(() => usePagination())

    act(() => result.current.setPage(5))
    act(() => result.current.setLimit(50))

    expect(result.current.limit).toBe(50)
    expect(result.current.page).toBe(1)
  })

  it('should toggle sort order', () => {
    const { result } = renderHook(() => usePagination())

    act(() => result.current.toggleSort('ip'))
    expect(result.current.sortBy).toBe('ip')
    expect(result.current.sortOrder).toBe('asc')

    act(() => result.current.toggleSort('ip'))
    expect(result.current.sortOrder).toBe('desc')

    act(() => result.current.toggleSort('country'))
    expect(result.current.sortBy).toBe('country')
    expect(result.current.sortOrder).toBe('asc')
  })

  it('should set filter', () => {
    const { result } = renderHook(() => usePagination())

    act(() => result.current.setFilter('country', 'RU'))
    expect(result.current.filters).toEqual({ country: 'RU' })
    expect(result.current.page).toBe(1)
  })

  it('should clear filters', () => {
    const { result } = renderHook(() => usePagination())

    act(() => result.current.setFilter('country', 'RU'))
    act(() => result.current.setFilter('ip', '192.168'))
    act(() => result.current.clearFilters())

    expect(result.current.filters).toEqual({})
    expect(result.current.globalSearch).toBe('')
    expect(result.current.page).toBe(1)
  })

  it('should set global search', () => {
    const { result } = renderHook(() => usePagination())

    act(() => result.current.setGlobalSearch('test'))
    expect(result.current.globalSearch).toBe('test')
    expect(result.current.page).toBe(1)
  })

  it('should reset all state', () => {
    const { result } = renderHook(() => usePagination())

    act(() => result.current.setPage(5))
    act(() => result.current.setLimit(50))
    act(() => result.current.toggleSort('ip'))
    act(() => result.current.setFilter('country', 'RU'))
    act(() => result.current.setGlobalSearch('test'))
    act(() => result.current.reset())

    expect(result.current.page).toBe(1)
    expect(result.current.limit).toBe(10)
    expect(result.current.sortBy).toBe('id')
    expect(result.current.sortOrder).toBe('desc')
    expect(result.current.filters).toEqual({})
    expect(result.current.globalSearch).toBe('')
  })
})