const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

function atStartOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function formatDay(value: string, now = new Date()): string {
  const date = new Date(value)
  const dayDifference = Math.round((atStartOfDay(date) - atStartOfDay(now)) / 86_400_000)
  if (dayDifference === 0) return 'Сегодня'
  if (dayDifference === 1) return 'Завтра'
  return dateFormatter.format(date)
}

export function formatTime(value: string): string {
  return timeFormatter.format(new Date(value))
}

export function formatTimeRange(startAt: string, endAt?: string): string {
  const start = formatTime(startAt)
  return endAt ? `${start}–${formatTime(endAt)}` : start
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}
