import { useRef, useCallback } from 'react'

/**
 * Сохраняет позицию скролла перед вызовом refresh и восстанавливает после загрузки данных.
 * Используется для предотвращения прыжков страницы вверх при обновлении таблицы.
 */
export function useScrollPreservation() {
  const scrollPosRef = useRef(0)
  const isLoadingRef = useRef(false)

  const saveScroll = useCallback(() => {
    scrollPosRef.current = window.scrollY
  }, [])

  const restoreScroll = useCallback(() => {
    if (scrollPosRef.current > 0) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPosRef.current, behavior: 'instant' as ScrollBehavior })
      })
    }
  }, [])

  const withScrollPreservation = useCallback(
    (action: () => void) => {
      return () => {
        saveScroll()
        isLoadingRef.current = true
        action()
      }
    },
    [saveScroll]
  )

  return {
    saveScroll,
    restoreScroll,
    withScrollPreservation,
    isLoadingRef,
  }
}