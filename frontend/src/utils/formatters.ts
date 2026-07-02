// Форматирование дат и значений

export function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === '-' || dateStr === '') return '-'
  // Если дата в формате DD.MM.YYYY — возвращаем как есть
  if (/^\d{2}\.\d{2}\.\d{4}/.test(dateStr)) return dateStr
  // Если ISO — конвертируем
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr || dateStr === '-' || dateStr === '') return '-'
  if (/^\d{2}\.\d{2}\.\d{4}/.test(dateStr)) return dateStr
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function getMseName(num: number, names: Record<number, string>): string {
  return names[num] || `МСЭ ${num}`
}

export function msesToString(mses: number[] | undefined | null, names: Record<number, string>): string {
  if (!mses || mses.length === 0) return '-'
  return mses.map((m) => getMseName(m, names)).join(', ')
}

export function truncate(str: string, maxLen: number = 50): string {
  if (!str || str.length <= maxLen) return str || '-'
  return str.slice(0, maxLen) + '…'
}