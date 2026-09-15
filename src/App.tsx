import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthProvider'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { AthleteDashboard } from './pages/dashboard/AthleteDashboard'
import { EventsPage } from './pages/events/EventsPage'

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route index element={<AthleteDashboard />} />
            <Route path="dashboard" element={<AthleteDashboard />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/map" element={<Navigate to="/events?view=map" replace />} />
            <Route path="events/:eventId" element={<PlaceholderPage />} />
            <Route path="my-events" element={<PlaceholderPage />} />
            <Route path="calendar" element={<PlaceholderPage />} />
            <Route path="trainers" element={<PlaceholderPage />} />
            <Route path="trainers/:trainerId" element={<PlaceholderPage />} />
            <Route path="trainings/:bookingId" element={<PlaceholderPage />} />
            <Route path="tickets" element={<PlaceholderPage />} />
            <Route path="tickets/:ticketId" element={<PlaceholderPage />} />
            <Route path="profile" element={<PlaceholderPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
