export const routes = {
  home: '/',
  events: '/events',
  eventsMap: '/events/map',
  myEvents: '/my-events',
  calendar: '/calendar',
  trainers: '/trainers',
  tickets: '/tickets',
  profile: '/profile',
  event: (id: string) => `/events/${encodeURIComponent(id)}`,
  training: (id: string) => `/trainings/${encodeURIComponent(id)}`,
  ticket: (id: string) => `/tickets/${encodeURIComponent(id)}`,
} as const
