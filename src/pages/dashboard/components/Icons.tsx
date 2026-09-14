type IconName = 'home' | 'events' | 'calendar' | 'ticket' | 'user' | 'bell' | 'arrow' | 'pin' | 'clock' | 'check' | 'training' | 'map'

const paths: Record<IconName, string> = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  events: 'M5 4h14a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 1 2-2z',
  calendar: 'M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2zm3-2v4m8-4v4M3 9h18',
  ticket: 'M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4zM13 8v2m0 4v2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7 9a7 7 0 0 0-14 0',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9zm-8 12h4',
  arrow: 'm9 18 6-6-6-6',
  pin: 'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0zm-8-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-15v5l3 2',
  check: 'm5 12 4 4L19 6',
  training: 'M6 7v10m12-10v10M3 9v6m18-6v6M6 12h12',
  map: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zm6-3v15m6-12v15',
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  )
}
