export type ActivityType = 'tournament' | 'master_class' | 'training'

export interface AthleteDashboardProfile {
  id: string
  firstName: string
  avatarUrl?: string
  city?: string
}

export interface DashboardActivity {
  id: string
  type: ActivityType
  title: string
  startAt: string
  endAt?: string
  venueName?: string
  secondaryInfo?: string
  status: string
  ticketId?: string
}

export interface EventPreview {
  id: string
  type: Exclude<ActivityType, 'training'>
  title: string
  coverUrl?: string
  startAt: string
  city: string
  venueName?: string
  direction?: string
  hostName: string
  minimumPrice?: number
  currency: 'KZT' | 'RUB' | 'USD' | 'EUR'
}

export interface RegisteredEventPreview extends EventPreview {
  registrationStatus: 'pending_payment' | 'confirmed' | 'cancelled' | 'transferred'
  entries: { id: string; label: string }[]
  ticketId?: string
}

export interface TrainingBookingPreview {
  id: string
  title: string
  trainerId: string
  trainerName: string
  trainerAvatarUrl?: string
  startAt: string
  endAt: string
  venueName?: string
  status: 'booked' | 'rescheduled' | 'cancelled' | 'completed'
}

export interface ImportantNotificationData {
  id: string
  type: 'event_changed' | 'event_cancelled' | 'training_changed' | 'training_cancelled'
  title: string
  description: string
  targetUrl?: string
  createdAt: string
}
