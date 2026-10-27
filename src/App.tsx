import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { LoadingScreen } from './components/LoadingScreen'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { RegisterPage } from './pages/RegisterPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { AthleteDashboard } from './pages/dashboard/AthleteDashboard'
import { EventsPage } from './pages/events/EventsPage'
import { CabinetPage } from './pages/CabinetPage'
import { EventRegistrationPage } from './pages/events/registration/EventRegistrationPage'
import { MyEventsPage } from './pages/events/MyEventsPage'
import { CalendarPage } from './pages/calendar/CalendarPage'
import { MyTicketsPage } from './pages/tickets/MyTicketsPage'
import { TicketDetailsPage } from './pages/tickets/TicketDetailsPage'
import { TicketVerifyPage } from './pages/tickets/TicketVerifyPage'
import { TrainersCatalogPage } from './pages/trainers/TrainersCatalogPage'
import { TrainerDetailsPage } from './pages/trainers/TrainerDetailsPage'
import { TrainingBookingDetailsPage } from './pages/trainings/TrainingBookingDetailsPage'
import { HostDashboardPage } from './pages/host/HostDashboardPage'
import { AdminHostApplicationsPage } from './pages/admin/AdminHostApplicationsPage'
import { useAuthStore } from './stores/authStore'

const EventDetailsPage = lazy(() => import('./pages/events/details/EventDetailsPage').then((module) => ({ default: module.EventDetailsPage })))

function App() {
  useEffect(() => {
    void useAuthStore.getState().initialize()
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="events/:eventId" element={<Suspense fallback={<LoadingScreen />}><EventDetailsPage /></Suspense>} />
        <Route path="events/:eventId/tickets" element={<PlaceholderPage />} />
        <Route path="tickets/verify/:tokenHash" element={<TicketVerifyPage />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<AthleteDashboard />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="dashboard" element={<AthleteDashboard />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/map" element={<Navigate to="/events?view=map" replace />} />
          <Route path="events/:eventId/register" element={<EventRegistrationPage />} />
          <Route path="my-events" element={<MyEventsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="trainers" element={<TrainersCatalogPage />} />
          <Route path="trainers/:trainerId" element={<TrainerDetailsPage />} />
          <Route path="trainings/:bookingId" element={<TrainingBookingDetailsPage />} />
          <Route path="tickets" element={<MyTicketsPage />} />
          <Route path="tickets/:ticketId" element={<TicketDetailsPage />} />
          <Route path="profile" element={<CabinetPage />} />
          <Route path="host" element={<HostDashboardPage />} />
          <Route path="admin/host-applications" element={<AdminHostApplicationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
