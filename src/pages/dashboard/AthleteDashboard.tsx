import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardQueries } from '../../hooks/dashboard/useDashboardQueries'
import { useAuth } from '../../hooks/useAuth'
import { getGreeting } from '../../utils/date'
import { DashboardHeader } from './components/DashboardHeader'
import { MyEventsSection, UpcomingEventsSection } from './components/EventWidgets'
import { ImportantNotification, NextActivityCard, SchedulePreview } from './components/PersonalWidgets'
import { DiscoveryCtas } from './components/DiscoveryCtas'
import { MyTrainingsSection } from './components/TrainingWidgets'
import './dashboard.css'

export function AthleteDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const queries = useDashboardQueries(user ?? '')
  const firstName = queries.profile.data?.firstName ?? user?.split('@')[0] ?? 'Танцор'

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="dashboard-page">
      <DashboardHeader firstName={firstName} avatarUrl={queries.profile.data?.avatarUrl} onLogout={() => void handleLogout()} isLoggingOut={isLoggingOut} />
      <main className="dashboard-main">
        <section className="greeting-section">
          <p>{getGreeting()}, {firstName} <span aria-hidden="true">👋</span></p>
          <h1>Вот что у вас запланировано.</h1>
        </section>
        <ImportantNotification query={queries.notifications} />
        <NextActivityCard query={queries.nextActivity} />
        <SchedulePreview query={queries.schedule} />
        <MyEventsSection query={queries.myEvents} />
        <MyTrainingsSection query={queries.trainings} />
        <UpcomingEventsSection query={queries.upcomingEvents} />
        <DiscoveryCtas query={queries.nearbySummary} />
      </main>
    </div>
  )
}
