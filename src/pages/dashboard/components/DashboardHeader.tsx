import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { routes } from '../../../routes'
import { Icon } from './Icons'
import { BrandLogo } from '../../../components/BrandLogo'
import { useAuth } from '../../../hooks/useAuth'
import { getDashboardProfile } from '../../../services/dashboard'

const mobileLinks = [
  ['Главная', routes.home, 'home'],
  ['Мероприятия', routes.events, 'events'],
  ['Календарь', routes.calendar, 'calendar'],
  ['Билеты', routes.tickets, 'ticket'],
  ['Профиль', routes.profile, 'user'],
] as const

type DashboardHeaderProps = {
  firstName: string
  avatarUrl?: string
  hasHostRole?: boolean
  onLogout: () => void
  isLoggingOut?: boolean
  actionLabel?: string
}

export function DashboardHeader({
  firstName,
  avatarUrl,
  hasHostRole: hasHostRoleProp,
  onLogout,
  isLoggingOut = false,
  actionLabel,
}: DashboardHeaderProps) {
  const { user } = useAuth()
  const profileQuery = useQuery({
    queryKey: ['dashboard', 'profile', user],
    queryFn: () => getDashboardProfile(user ?? ''),
    enabled: Boolean(user) && hasHostRoleProp === undefined,
    staleTime: 60_000,
  })

  const hasHostRole = hasHostRoleProp ?? Boolean(profileQuery.data?.hasHostRole)

  const desktopLinks = useMemo(() => {
    const links: [string, string][] = [
      ['Главная', routes.home],
      ['Мероприятия', routes.events],
      ['Билеты', routes.tickets],
      ['Кабинет', routes.profile],
      ['Организатор', routes.host],
      ['Тренеры', routes.trainers],
    ]
    if (hasHostRole) {
      links.push(['Мои мероприятия', routes.myEvents])
    }
    links.push(['Календарь', routes.calendar])
    return links
  }, [hasHostRole])

  const initial = firstName.charAt(0).toUpperCase() || 'D'

  return (
    <>
      <header className="dashboard-header">
        <div className="header-inner">
          <NavLink className="dashboard-logo" to={routes.home} aria-label="on dance space — главная">
            <BrandLogo size={28} showText={true} />
          </NavLink>
          <nav className="desktop-nav" aria-label="Основная навигация">
            {desktopLinks.map(([label, path]) => (
              <NavLink key={path} to={path} end={path === routes.home}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <a className="icon-button" href="#notifications" aria-label="Уведомления">
              <Icon name="bell" />
            </a>
            <button
              className="profile-button"
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              aria-label={actionLabel ?? 'Выйти из аккаунта'}
            >
              {avatarUrl ? (
                <img className="avatar" src={avatarUrl} alt="" />
              ) : (
                <span className="avatar">{initial}</span>
              )}
              <span>{isLoggingOut ? 'Выходим…' : actionLabel ?? firstName}</span>
            </button>
          </div>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {mobileLinks.map(([label, path, icon]) => (
          <NavLink key={path} to={path} end={path === routes.home}>
            <Icon name={icon} size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
