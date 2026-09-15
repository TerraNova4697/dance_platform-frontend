import { useQuery } from '@tanstack/react-query'
import {
  getDashboardProfile,
  getImportantNotifications,
  getNextActivity,
  getUpcomingSchedule,
} from '../../services/dashboard'
import { getMyEvents } from '../../services/myEvents'
import { getMyTrainings } from '../../services/myTrainings'
import { getUpcomingEvents } from '../../services/upcomingEvents'

export function useDashboardQueries(userId: string) {
  return {
    profile: useQuery({ queryKey: ['dashboard', 'profile', userId], queryFn: () => getDashboardProfile(userId) }),
    nextActivity: useQuery({ queryKey: ['dashboard', 'next-activity', userId], queryFn: () => getNextActivity(userId) }),
    schedule: useQuery({ queryKey: ['dashboard', 'schedule', userId], queryFn: () => getUpcomingSchedule(userId) }),
    myEvents: useQuery({ queryKey: ['dashboard', 'my-events', userId], queryFn: () => getMyEvents(userId) }),
    trainings: useQuery({ queryKey: ['dashboard', 'trainings', userId], queryFn: () => getMyTrainings(userId) }),
    upcomingEvents: useQuery({ queryKey: ['dashboard', 'upcoming-events', userId], queryFn: () => getUpcomingEvents(userId) }),
    notifications: useQuery({ queryKey: ['dashboard', 'notifications'], queryFn: getImportantNotifications }),
  }
}
