import { createDashboardMock } from '../mocks/dashboard'

async function mockRequest<T>(value: T): Promise<T> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 350))
  return value
}

export async function getDashboardProfile(userId: string) {
  return mockRequest(createDashboardMock(userId).profile)
}

export async function getNextActivity(userId: string) {
  const { schedule } = createDashboardMock(userId)
  return mockRequest(schedule.find((activity) => Date.parse(activity.startAt) > Date.now()) ?? null)
}

export async function getUpcomingSchedule(userId: string) {
  return mockRequest(createDashboardMock(userId).schedule.slice(0, 5))
}

export async function getMyEvents(userId: string) {
  return mockRequest(createDashboardMock(userId).myEvents.slice(0, 3))
}

export async function getMyTrainings(userId: string) {
  return mockRequest(createDashboardMock(userId).trainings.slice(0, 3))
}

export async function getUpcomingEvents(userId: string) {
  return mockRequest(createDashboardMock(userId).upcomingEvents.slice(0, 6))
}

export async function getImportantNotifications(userId: string) {
  return mockRequest(createDashboardMock(userId).notifications)
}
