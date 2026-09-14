import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { routes } from '../../../routes'
import type { DashboardActivity, ImportantNotificationData } from '../../../types/dashboard'
import { formatDay, formatTimeRange } from '../../../utils/date'
import { Icon } from './Icons'
import { EmptyState, Meta, SectionHeading, Skeleton, WidgetError } from './Shared'

const activityLabels = { tournament: 'Турнир', master_class: 'Мастер-класс', training: 'Тренировка' } as const

export function ImportantNotification({ query }: { query: UseQueryResult<ImportantNotificationData[], Error> }) {
  if (query.isPending || query.isError || !query.data?.length) return null
  const notice = query.data[0]
  return <aside id="notifications" className="important-notification"><span className="notification-mark">!</span><div><strong>{notice.title}</strong><p>{notice.description}</p></div>{notice.targetUrl && <Link to={notice.targetUrl}>Посмотреть <span aria-hidden="true">→</span></Link>}</aside>
}

export function NextActivityCard({ query }: { query: UseQueryResult<DashboardActivity | null, Error> }) {
  if (query.isPending) return <section><Skeleton variant="feature" /></section>
  if (query.isError) return <section className="feature-card"><WidgetError message="Не удалось загрузить ближайшую активность." onRetry={() => void query.refetch()} /></section>
  const activity = query.data
  if (!activity) return <section className="feature-card"><EmptyState title="У вас пока нет предстоящих мероприятий" description="Найдите турнир, мастер-класс или запишитесь на тренировку." action={<div className="button-row"><Link className="button primary" to={routes.events}>Найти Ивент</Link><Link className="button secondary" to={routes.trainers}>Найти тренера</Link></div>} /></section>
  const detailUrl = activity.type === 'training' ? routes.training(activity.id) : routes.event(activity.id)
  return (
    <section className="feature-card">
      <div className="feature-copy"><span className="overline">Следующая активность</span><span className={`type-badge type-${activity.type}`}>{activityLabels[activity.type]}</span><h2>{activity.title}</h2><div className="feature-meta"><Meta icon="clock">{formatDay(activity.startAt)} · {formatTimeRange(activity.startAt, activity.endAt)}</Meta>{activity.venueName && <Meta icon="pin">{activity.venueName}</Meta>}</div>{activity.secondaryInfo && <p className="secondary-info">{activity.secondaryInfo}</p>}<div className="button-row"><Link className="button primary" to={detailUrl}>Подробнее</Link>{activity.ticketId && <Link className="button secondary" to={routes.ticket(activity.ticketId)}>Открыть билет</Link>}</div></div>
      <div className="feature-date"><span>{new Date(activity.startAt).getDate()}</span><small>{new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(new Date(activity.startAt))}</small></div>
    </section>
  )
}

export function SchedulePreview({ query }: { query: UseQueryResult<DashboardActivity[], Error> }) {
  return <section className="dashboard-section"><SectionHeading title="Моё расписание" to={routes.calendar} />{query.isPending ? <Skeleton variant="row" count={3} /> : query.isError ? <WidgetError message="Не удалось загрузить расписание." onRetry={() => void query.refetch()} /> : !query.data.length ? <EmptyState title="Расписание пока пустое" /> : <div className="schedule-card">{query.data.map((activity) => <Link className="schedule-row" to={activity.type === 'training' ? routes.training(activity.id) : routes.event(activity.id)} key={`${activity.type}-${activity.id}`}><div className="schedule-when"><strong>{formatDay(activity.startAt)}</strong><span>{formatTimeRange(activity.startAt, activity.endAt)}</span></div><span className={`schedule-dot type-${activity.type}`} /><div className="schedule-title"><span className={`type-badge type-${activity.type}`}>{activityLabels[activity.type]}</span><strong>{activity.title}</strong><span>{activity.secondaryInfo ?? activity.venueName}</span></div><Icon name="arrow" size={18} /></Link>)}</div>}</section>
}
