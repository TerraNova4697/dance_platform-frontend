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
  customNavLinks?: Array<[string, string]>
}

export function DashboardHeader({
  firstName,
  avatarUrl,
  hasHostRole: hasHostRoleProp,
  onLogout,
  isLoggingOut = false,
  actionLabel,
  customNavLinks,
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
    if (customNavLinks) {
      return customNavLinks
    }
    if (!user) {
      return [
        ['Главная', routes.home],
        ['Мероприятия', routes.events],
        ['Тренеры', routes.trainers],
      ]
    }
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
  }, [hasHostRole, user, customNavLinks])

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
            {user ? (
              <>
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
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <NavLink
                  to={routes.login}
                  className="button secondary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '13.5px',
                    borderRadius: '20px',
                    height: 'auto',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Войти
                </NavLink>
                <NavLink
                  to={routes.register}
                  className="button primary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '13.5px',
                    borderRadius: '20px',
                    height: 'auto',
                    background: 'var(--brand-accent-gradient)',
                    color: 'var(--text-on-gold)',
                    fontWeight: 600,
                  }}
                >
                  Регистрация
                </NavLink>
              </div>
            )}
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
