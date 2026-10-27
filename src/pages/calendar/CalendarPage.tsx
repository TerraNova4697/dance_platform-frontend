import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAllUpcomingSchedule, getDashboardProfile } from '../../services/dashboard'
import { DashboardHeader } from '../dashboard/components/DashboardHeader'
import { useAuth } from '../../hooks/useAuth'
import type { DashboardActivity } from '../../types/dashboard'
import './calendar.css'

export function CalendarPage() {
  const { user, logout } = useAuth()
  const [filter, setFilter] = useState<'all' | 'master_class' | 'training'>('all')

  const profileQuery = useQuery({
    queryKey: ['dashboard', 'profile', user],
    queryFn: () => getDashboardProfile(user ?? ''),
    enabled: Boolean(user),
  })

  const scheduleQuery = useQuery({
    queryKey: ['my-all-schedule', user],
    queryFn: () => getAllUpcomingSchedule(user ?? ''),
    enabled: Boolean(user),
  })

  const allActivities = scheduleQuery.data || []
  const filteredActivities = allActivities.filter((act: DashboardActivity) => {
    if (filter === 'master_class') return act.type === 'master_class'
    if (filter === 'training') return act.type === 'training'
    return true
  })

  // Group by date string
  const groupedByDate: Record<string, DashboardActivity[]> = {}
  for (const act of filteredActivities) {
    const dateKey = new Date(act.startAt).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      year: 'numeric',
    })
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = []
    }
    groupedByDate[dateKey].push(act)
  }

  const firstName = profileQuery.data?.firstName ?? user?.split('@')[0] ?? 'Танцор'

  return (
    <div className="dashboard-page calendar-page">
      <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
      <main className="calendar-main">
        <div className="calendar-header">
          <div>
            <h1>Моё расписание</h1>
            <p className="calendar-subtitle">
              Хронологический список ваших предстоящих мастер-классов и тренировок
            </p>
          </div>

          <div className="calendar-filter-tabs">
            <button
              type="button"
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Все ({allActivities.length})
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'master_class' ? 'active' : ''}`}
              onClick={() => setFilter('master_class')}
            >
              Мастер-классы
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'training' ? 'active' : ''}`}
              onClick={() => setFilter('training')}
            >
              Тренировки
            </button>
          </div>
        </div>

        {scheduleQuery.isPending ? (
          <div className="calendar-loading">Загрузка расписания…</div>
        ) : filteredActivities.length === 0 ? (
          <div className="calendar-empty-state">
            <span className="empty-icon">📅</span>
            <h3>Расписание пусто</h3>
            <p>У вас пока нет запланированных тренировок или мастер-классов.</p>
            <div className="empty-buttons">
              <Link to="/events" className="button primary">
                Выбрать мастер-класс
              </Link>
              <Link to="/trainers" className="button secondary">
                Найти тренировку
              </Link>
            </div>
          </div>
        ) : (
          <div className="calendar-timeline">
            {Object.entries(groupedByDate).map(([dateLabel, activities]) => (
              <div key={dateLabel} className="timeline-day-group">
                <div className="timeline-day-header">
                  <span className="day-bullet">●</span>
                  <h3 className="day-title">{dateLabel}</h3>
                </div>

                <div className="day-activities-list">
                  {activities.map((act) => {
                    const timeStart = new Date(act.startAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    const timeEnd = act.endAt
                      ? new Date(act.endAt).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : null

                    return (
                      <div key={act.id} className="timeline-item-card">
                        <div className="timeline-time-col">
                          <span className="time-start">{timeStart}</span>
                          {timeEnd && <span className="time-end">{timeEnd}</span>}
                        </div>

                        <div className="timeline-content-col">
                          <div className="timeline-type-pill">
                            {act.type === 'master_class'
                              ? 'Мастер-класс'
                              : act.type === 'training'
                              ? 'Тренировка'
                              : 'Турнир'}
                          </div>

                          <h4 className="timeline-activity-title">{act.title}</h4>

                          <div className="timeline-meta-row">
                            {act.venueName && (
                              <span className="meta-item">📍 {act.venueName}</span>
                            )}
                            {act.secondaryInfo && (
                              <span className="meta-item">👤 {act.secondaryInfo}</span>
                            )}
                          </div>
                        </div>

                        <div className="timeline-action-col">
                          {act.ticketId ? (
                            <Link to={`/tickets/${encodeURIComponent(act.ticketId)}`} className="button primary small">
                              QR-билет
                            </Link>
                          ) : act.type === 'training' ? (
                            <Link to={`/trainings/${encodeURIComponent(act.id)}`} className="button secondary small">
                              Детали записи
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

