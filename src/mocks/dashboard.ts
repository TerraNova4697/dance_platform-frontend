import type {
  AthleteDashboardProfile,
  DashboardActivity,
  EventPreview,
  ImportantNotificationData,
  RegisteredEventPreview,
  TrainingBookingPreview,
} from '../types/dashboard'

function futureDate(days: number, hours: number, minutes = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

export function createDashboardMock(userId: string) {
  const rawName = userId.split('@')[0]?.split(/[._-]/)[0] || 'Никита'
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  const profile: AthleteDashboardProfile = { id: userId, firstName, city: 'Астана' }
  const trainings: TrainingBookingPreview[] = [
    {
      id: 'training-1', title: 'Hip-Hop Individual', trainerId: 'ivan-petrov',
      trainerName: 'Иван Петров', startAt: futureDate(0, 18), endAt: futureDate(0, 19),
      venueName: 'Dance Studio One', status: 'booked',
    },
    {
      id: 'training-2', title: 'Group Hip-Hop', trainerId: 'elena-kim',
      trainerName: 'Елена Ким', startAt: futureDate(8, 19, 30), endAt: futureDate(8, 21),
      venueName: 'Motion Space', status: 'booked',
    },
  ]
  const myEvents: RegisteredEventPreview[] = [
    {
      id: 'astana-dance-cup', type: 'tournament', title: 'Astana Dance Cup',
      startAt: futureDate(6, 10), city: 'Астана', venueName: 'Astana Arena',
      direction: 'Hip-Hop', hostName: 'Dance Federation KZ', currency: 'KZT',
      registrationStatus: 'confirmed', ticketId: 'ADC-2048',
      entries: [{ id: 'entry-1', label: 'Solo / Beginner' }, { id: 'entry-2', label: 'Solo / Open' }],
    },
    {
      id: 'urban-moves', type: 'master_class', title: 'Urban Moves Workshop',
      startAt: futureDate(13, 12), city: 'Астана', venueName: 'Pulse Studio',
      direction: 'Choreography', hostName: 'Urban Moves', currency: 'KZT',
      registrationStatus: 'confirmed', entries: [{ id: 'entry-3', label: 'Основная группа' }],
    },
  ]
  const schedule: DashboardActivity[] = [
    {
      id: trainings[0].id, type: 'training', title: trainings[0].title,
      startAt: trainings[0].startAt, endAt: trainings[0].endAt,
      venueName: trainings[0].venueName, secondaryInfo: trainings[0].trainerName, status: 'booked',
    },
    {
      id: myEvents[0].id, type: 'tournament', title: myEvents[0].title,
      startAt: myEvents[0].startAt, venueName: myEvents[0].venueName,
      secondaryInfo: myEvents[0].entries[0]?.label, status: 'confirmed', ticketId: myEvents[0].ticketId,
    },
    {
      id: trainings[1].id, type: 'training', title: trainings[1].title,
      startAt: trainings[1].startAt, endAt: trainings[1].endAt,
      venueName: trainings[1].venueName, secondaryInfo: trainings[1].trainerName, status: 'booked',
    },
  ]
  schedule.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
  const upcomingEvents: EventPreview[] = [
    { id: 'kazakhstan-open', type: 'tournament', title: 'Kazakhstan Dance Open', startAt: futureDate(11, 10), city: 'Алматы', venueName: 'Baluan Sholak Arena', direction: 'Hip-Hop', hostName: 'Dance Federation KZ', minimumPrice: 10000, currency: 'KZT' },
    { id: 'autumn-battle', type: 'tournament', title: 'Autumn Dance Battle', startAt: futureDate(19, 14), city: 'Астана', venueName: 'Congress Centre', direction: 'Breaking', hostName: 'Step Up Community', minimumPrice: 8000, currency: 'KZT' },
    { id: 'contemporary-lab', type: 'master_class', title: 'Contemporary Lab', startAt: futureDate(23, 17), city: 'Алматы', direction: 'Contemporary', hostName: 'Forma Dance', minimumPrice: 12000, currency: 'KZT' },
    { id: 'street-weekend', type: 'master_class', title: 'Street Dance Weekend', startAt: futureDate(29, 11), city: 'Караганда', direction: 'Street Dance', hostName: 'Move Nation', minimumPrice: 7500, currency: 'KZT' },
    { id: 'steppe-cup', type: 'tournament', title: 'Steppe Dance Cup', startAt: futureDate(36, 9), city: 'Астана', direction: 'Ballroom', hostName: 'Steppe Dance Union', minimumPrice: 15000, currency: 'KZT' },
    { id: 'heels-intensive', type: 'master_class', title: 'Heels Intensive', startAt: futureDate(42, 18), city: 'Алматы', direction: 'High Heels', hostName: 'Light Studio', minimumPrice: 9000, currency: 'KZT' },
  ]
  const notifications: ImportantNotificationData[] = [
    { id: 'notice-1', type: 'event_changed', title: 'Astana Dance Cup изменил расписание', description: 'Ваше выступление: 15:30 → 16:10', targetUrl: '/events/astana-dance-cup', createdAt: new Date().toISOString() },
  ]

  return { profile, trainings, myEvents, schedule, upcomingEvents, notifications }
}
