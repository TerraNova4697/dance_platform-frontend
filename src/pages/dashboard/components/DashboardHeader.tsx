import { NavLink } from 'react-router-dom'
import { routes } from '../../../routes'
import { Icon } from './Icons'

const desktopLinks = [
  ['Главная', routes.home], ['Ивенты', routes.events], ['Тренеры', routes.trainers],
  ['Мои Ивенты', routes.myEvents], ['Календарь', routes.calendar],
] as const

const mobileLinks = [
  ['Главная', routes.home, 'home'], ['Ивенты', routes.events, 'events'],
  ['Календарь', routes.calendar, 'calendar'], ['Билеты', routes.tickets, 'ticket'],
  ['Профиль', routes.profile, 'user'],
] as const

type DashboardHeaderProps = { firstName: string; avatarUrl?: string; onLogout: () => void; isLoggingOut: boolean; actionLabel?: string }

export function DashboardHeader({ firstName, avatarUrl, onLogout, isLoggingOut, actionLabel }: DashboardHeaderProps) {
  const initial = firstName.charAt(0).toUpperCase() || 'D'
  return (
    <>
      <header className="dashboard-header">
        <div className="header-inner">
          <NavLink className="dashboard-logo" to={routes.home} aria-label="Dance Platform — главная">
            <span className="logo-symbol">D</span><span>Dance Platform</span>
          </NavLink>
          <nav className="desktop-nav" aria-label="Основная навигация">
            {desktopLinks.map(([label, path]) => <NavLink key={path} to={path} end={path === routes.home}>{label}</NavLink>)}
          </nav>
          <div className="header-actions">
            <a className="icon-button" href="#notifications" aria-label="Уведомления"><Icon name="bell" /></a>
            <button className="profile-button" type="button" onClick={onLogout} disabled={isLoggingOut} aria-label={actionLabel ?? 'Выйти из аккаунта'}>
              {avatarUrl ? <img className="avatar" src={avatarUrl} alt="" /> : <span className="avatar">{initial}</span>}<span>{isLoggingOut ? 'Выходим…' : actionLabel ?? firstName}</span>
            </button>
          </div>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {mobileLinks.map(([label, path, icon]) => (
          <NavLink key={path} to={path} end={path === routes.home}>
            <Icon name={icon} size={21} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
