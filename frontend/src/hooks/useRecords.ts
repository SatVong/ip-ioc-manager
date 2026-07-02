import { useState, useEffect, useCallback } from 'react'
import type { PaginatedResponse, PaginationState } from '../types'
import { useNotification } from './useNotification'

interface UseRecordsOptions<T> {
  fetchFn: (params: Record<string, unknown>) => Promise<PaginatedResponse<T>>
  pagination: PaginationState & {
    setPage: (page: number) => void
    setLimit: (limit: number) => void
    setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
    toggleSort: (column: string) => void
    setFilter: (key: string, value: string) => void
    clearFilters: () => void
    setGlobalSearch: (search: string) => void
  }
  errorMessage?: string
}

export function useRecords<T>({ fetchFn, pagination, errorMessage = 'Ошибка загрузки данных' }: UseRecordsOptions<T>) {
  const { addNotification } = useNotification()
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
      }

      if (Object.keys(pagination.filters).length > 0) {
        params.filters = JSON.stringify(pagination.filters)
      }
      if (pagination.globalSearch) {
        params.globalSearch = pagination.globalSearch
      }

      const result = await fetchFn(params)
      setData(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch {
      addNotification('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [
    fetchFn,
    pagination.page,
    pagination.limit,
    pagination.sortBy,
    pagination.sortOrder,
    pagination.filters,
    pagination.globalSearch,
    addNotification,
    errorMessage,
  ])

  useEffect(() => {
    load()
  }, [load])

  const refresh = useCallback(() => {
    load()
  }, [load])

  return {
    data,
    total,
    totalPages,
    loading,
    refresh,
  }
}