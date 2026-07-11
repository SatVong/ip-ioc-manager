import { useState, useEffect, useCallback, useRef } from 'react'
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
  /** Маппинг ключей колонок (английский → русский) для фильтрации на бэкенде */
  filterKeyMap?: Record<string, string>
}

export function useRecords<T>({ fetchFn, pagination, errorMessage = 'Ошибка загрузки данных', filterKeyMap }: UseRecordsOptions<T>) {
  const { addNotification } = useNotification()
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const scrollPosRef = useRef(0)
  const shouldRestoreRef = useRef(false)

  // Все изменяемые значения через refs, чтобы стабильная load() всегда читала актуальные данные
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn
  const addNotificationRef = useRef(addNotification)
  addNotificationRef.current = addNotification
  const errorMessageRef = useRef(errorMessage)
  errorMessageRef.current = errorMessage
  const filterKeyMapRef = useRef(filterKeyMap)
  filterKeyMapRef.current = filterKeyMap

  // Ref для всех полей пагинации — обновляется каждый рендер
  const paginationRef = useRef(pagination)
  paginationRef.current = pagination

  // Стабильная функция загрузки — использует refs для всех изменяемых значений
  const load = useCallback(async () => {
    // Сохраняем позицию скролла перед загрузкой
    scrollPosRef.current = window.scrollY
    shouldRestoreRef.current = true
    setLoading(true)
    try {
      const p = paginationRef.current
      const params: Record<string, unknown> = {
        page: p.page,
        limit: p.limit,
        sortBy: p.sortBy,
        sortOrder: p.sortOrder,
      }

      // Маппим ключи фильтров из английских в русские для бэкенда
      if (Object.keys(p.filters).length > 0) {
        const mappedFilters: Record<string, string> = {}
        const map = filterKeyMapRef.current
        for (const [key, value] of Object.entries(p.filters)) {
          const mappedKey = map?.[key] || key
          mappedFilters[mappedKey] = value
        }
        params.filters = JSON.stringify(mappedFilters)
      }
      if (p.globalSearch) {
        params.globalSearch = p.globalSearch
      }

      const result = await fetchFnRef.current(params)
      setData(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch {
      addNotificationRef.current('error', errorMessageRef.current)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Следим за изменением параметров пагинации
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.page,
    pagination.limit,
    pagination.sortBy,
    pagination.sortOrder,
    JSON.stringify(pagination.filters),
    pagination.globalSearch,
    fetchFn,
  ])

  // Восстанавливаем позицию скролла после загрузки данных
  useEffect(() => {
    if (!loading && shouldRestoreRef.current) {
      shouldRestoreRef.current = false
      const savedPos = scrollPosRef.current
      if (savedPos > 0) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedPos, behavior: 'instant' as ScrollBehavior })
        })
      }
    }
  }, [loading])

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