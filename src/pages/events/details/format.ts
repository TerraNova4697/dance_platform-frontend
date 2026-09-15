import { formatTime, formatTimeRange } from '../../../utils/date'

const dateWithYear = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
const dateWithoutYear = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

export function formatEventDate(startAt: string, endAt?: string): string {
  const start = new Date(startAt)
  if (!endAt) return dateWithYear.format(start)
  const end = new Date(endAt)
  if (start.toDateString() === end.toDateString()) return dateWithYear.format(start)
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${dateWithYear.format(end)}`
  }
  return `${dateWithoutYear.format(start)} — ${dateWithYear.format(end)}`
}

export function formatEventTime(startAt: string, endAt?: string): string {
  if (!endAt || new Date(startAt).toDateString() === new Date(endAt).toDateString()) return formatTimeRange(startAt, endAt)
  return formatTime(startAt)
}

export function formatScheduleDay(value: string): string {
  return dateWithYear.format(new Date(value))
}
