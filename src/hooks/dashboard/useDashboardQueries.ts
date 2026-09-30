import { useQuery } from '@tanstack/react-query'
import {
  getDashboardProfile,
  getImportantNotifications,
  getNextActivity,
  getUpcomingSchedule,
} from '../../services/dashboard'
import { getNearbySummary } from '../../services/nearbySummary'
import { getMyEvents } from '../../services/myEvents'
import { getMyTrainings } from '../../services/myTrainings'
import { getUpcomingEvents } from '../../services/upcomingEvents'

export function useDashboardQueries(userId: string) {
  return {
    profile: useQuery({ 
      queryKey: ['dashboard', 'profile', userId], 
      enabled: Boolean(userId), 
      queryFn: () => getDashboardProfile(userId) 
    }),
    nextActivity: useQuery({ 
      queryKey: ['dashboard', 'next-activity', userId], 
      enabled: Boolean(userId), 
      queryFn: () => getNextActivity(userId) 
    }),
    schedule: useQuery({ 
      queryKey: ['dashboard', 'schedule', userId], 
      enabled: Boolean(userId), 
      queryFn: () => getUpcomingSchedule(userId) 
    }),
    myEvents: useQuery({ 
      queryKey: ['dashboard', 'my-events', userId], 
      enabled: Boolean(userId), 
      queryFn: () => getMyEvents(userId) 
    }),
    trainings: useQuery({
      queryKey: ['dashboard', 'trainings', userId], 
      enabled: Boolean(userId), 
      queryFn: () => getMyTrainings(userId) 
    }),
    upcomingEvents: useQuery({ 
      queryKey: ['dashboard', 'upcoming-events', userId], 
      enabled: Boolean(userId), 
      queryFn: () => getUpcomingEvents(userId) 
    }),
    nearbySummary: useQuery({ 
      queryKey: ['dashboard', 'nearby-summary', userId], 
      enabled: Boolean(userId), 
      queryFn: () => getNearbySummary(userId) 
    }),
    notifications: useQuery({ 
      queryKey: ['dashboard', 'notifications'], 
      enabled: Boolean(userId), 
      queryFn: getImportantNotifications 
    }),
  }
}
