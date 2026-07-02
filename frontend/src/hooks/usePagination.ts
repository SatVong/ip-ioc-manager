import { useState, useCallback } from 'react'
import type { PaginationState } from '../types'
import { DEFAULT_PAGE_SIZE } from '../utils/constants'

export function usePagination() {
  const [state, setState] = useState<PaginationState>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: 'id',
    sortOrder: 'desc',
    filters: {},
    globalSearch: '',
  })

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setState((prev) => ({ ...prev, limit, page: 1 }))
  }, [])

  const setSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setState((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }))
  }, [])

  const toggleSort = useCallback((column: string) => {
    setState((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }, [])

  const setFilter = useCallback((key: string, value: string) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      page: 1,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setState((prev) => ({ ...prev, filters: {}, globalSearch: '', page: 1 }))
  }, [])

  const setGlobalSearch = useCallback((globalSearch: string) => {
    setState((prev) => ({ ...prev, globalSearch, page: 1 }))
  }, [])

  const reset = useCallback(() => {
    setState({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      sortBy: 'id',
      sortOrder: 'desc',
      filters: {},
      globalSearch: '',
    })
  }, [])

  return {
    ...state,
    setPage,
    setLimit,
    setSort,
    toggleSort,
    setFilter,
    clearFilters,
    setGlobalSearch,
    reset,
  }
}