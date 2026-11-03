const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const MONTH_NAMES_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

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

export function formatDateRange(startAt: string, endAt?: string): string {
  const d1 = new Date(startAt)
  if (Number.isNaN(d1.getTime())) return startAt

  const m1 = MONTH_NAMES_GENITIVE[d1.getMonth()]
  const y1 = d1.getFullYear()

  if (!endAt) {
    return `${d1.getDate()} ${m1} ${y1}`
  }

  const d2 = new Date(endAt)
  if (Number.isNaN(d2.getTime()) || d1.toDateString() === d2.toDateString()) {
    return `${d1.getDate()} ${m1} ${y1}`
  }

  const m2 = MONTH_NAMES_GENITIVE[d2.getMonth()]
  const y2 = d2.getFullYear()

  if (y1 === y2) {
    if (d1.getMonth() === d2.getMonth()) {
      return `${d1.getDate()}–${d2.getDate()} ${m1} ${y1}`
    }
    return `${d1.getDate()} ${m1} – ${d2.getDate()} ${m2} ${y1}`
  }

  return `${d1.getDate()} ${m1} ${y1} – ${d2.getDate()} ${m2} ${y2}`
}

export function formatTime(value: string): string {
  return timeFormatter.format(new Date(value))
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value))
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
