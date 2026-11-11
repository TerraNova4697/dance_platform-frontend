import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { routes } from '../../../routes'
import { BrandLogo } from '../../../components/BrandLogo'
import { useAuth } from '../../../hooks/useAuth'

type LandingHeaderProps = {
  onOpenContact: () => void
  onOpenVideo: () => void
}

type MenuItem = {
  label: string
  href?: string
  to?: string
  action?: 'contact' | 'video'
  badge?: string
}

type MenuGroup = {
  id: string
  label: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    id: 'events',
    label: 'События',
    items: [
      { label: 'Каталог турниров', to: routes.events },
      { label: 'Ближайшие события', href: '#events' },
      { label: 'Мастер-классы и сборы', href: '#services' },
      { label: 'Календарь сезона', to: routes.events },
    ],
  },
  {
    id: 'participants',
    label: 'Участникам',
    items: [
      { label: 'Регистрация на турниры', href: '#services' },
      { label: 'Запись на сборы и уроки', href: '#services' },
      { label: 'Поиск партнёра', href: '#community' },
      { label: 'Как это работает (4 шага)', href: '#how-it-works' },
      { label: 'Личный кабинет', to: routes.login },
    ],
  },
  {
    id: 'organizers',
    label: 'Организаторам',
    items: [
      { label: 'Возможности для организаторов', href: '#organizers' },
      { label: 'Сравнение: 10 процессов', href: '#comparison' },
      { label: 'Связаться с куратором', action: 'contact', badge: 'Online' },
      { label: 'Панель организатора', to: routes.host },
    ],
  },
  {
    id: 'services',
    label: 'Сервисы',
    items: [
      { label: 'Зрительские билеты и VIP-столы', href: '#services' },
      { label: 'Каталог тренеров', to: routes.trainers },
      { label: 'Презентационное видео', action: 'video' },
      { label: 'Полный спектр услуг', href: '#services' },
    ],
  },
  {
    id: 'about',
    label: 'О платформе',
    items: [
      { label: 'Весь мир Dancesport', href: '#mission' },
      { label: 'Наша миссия', href: '#mission' },
      { label: 'Проблема индустрии', href: '#problem' },
      { label: 'Что меняется с On Dance Space', href: '#comparison' },
      { label: 'Сообщество и карьера', href: '#community' },
    ],
  },
]

export function LandingHeader({ onOpenContact, onOpenVideo }: LandingHeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current)
          closeTimeoutRef.current = null
        }
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = (id: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setActiveDropdown(id)
  }

  const handleKeepOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    const related = e.relatedTarget as Node | null
    if (related && e.currentTarget.contains(related)) {
      return
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
      closeTimeoutRef.current = null
    }, 300)
  }

  const handleTriggerClick = (groupId: string) => {
    handleKeepOpen()
    setActiveDropdown((prev) => (prev === groupId ? null : groupId))
  }

  const handleAnchorClick = (e: React.MouseEvent, href?: string) => {
    if (!href || !href.startsWith('#')) return
    e.preventDefault()
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setActiveDropdown(null)
    setMobileMenuOpen(false)
    const targetId = href.replace('#', '')
    if (targetId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleItemClick = (item: MenuItem, e: React.MouseEvent) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (item.action === 'contact') {
      e.preventDefault()
      setActiveDropdown(null)
      setMobileMenuOpen(false)
      onOpenContact()
      return
    }
    if (item.action === 'video') {
      e.preventDefault()
      setActiveDropdown(null)
      setMobileMenuOpen(false)
      onOpenVideo()
      return
    }
    if (item.href) {
      handleAnchorClick(e, item.href)
      return
    }
    if (item.to) {
      setActiveDropdown(null)
      setMobileMenuOpen(false)
      navigate(item.to)
    }
  }

  return (
    <header className={`landing-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="landing-header-inner" ref={navRef}>
        {/* Brand Logo */}
        <Link
          to="/"
          className="landing-brand-wrap"
          onClick={(e) => handleAnchorClick(e, '#top')}
          aria-label="ON — The World of Dancesport"
        >
          <BrandLogo size={28} showText={true} />
        </Link>

        {/* Desktop Navigation with Dropdowns */}
        <nav className="landing-desktop-nav" aria-label="Основное меню">
          {menuGroups.map((group) => {
            const isOpen = activeDropdown === group.id
            return (
              <div
                key={group.id}
                className={`nav-dropdown-item ${isOpen ? 'is-open' : ''}`}
                onMouseEnter={() => handleMouseEnter(group.id)}
                onMouseMove={handleKeepOpen}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className="nav-dropdown-trigger"
                  onClick={() => handleTriggerClick(group.id)}
                  aria-expanded={isOpen}
                >
                  <span>{group.label}</span>
                  <svg
                    className={`dropdown-chevron ${isOpen ? 'chevron-up' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isOpen && (
                  <div
                    className="dropdown-menu-pane"
                    role="menu"
                    onMouseEnter={handleKeepOpen}
                    onMouseMove={handleKeepOpen}
                  >
                    <div className="dropdown-menu-list">
                      {group.items.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="dropdown-menu-link"
                          onClick={(e) => handleItemClick(item, e)}
                          role="menuitem"
                        >
                          <span className="dropdown-link-text">{item.label}</span>
                          {item.badge && <span className="dropdown-link-badge">{item.badge}</span>}
                          <svg
                            className="dropdown-link-arrow"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="landing-header-actions">
          {/* Search Button */}
          <Link
            to={routes.events}
            className="header-icon-action"
            title="Поиск событий"
            aria-label="Поиск событий"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>

          {/* Language Selector */}
          <div className="header-lang-badge" title="Язык интерфейса">
            <span>RU</span>
          </div>

          {/* Auth State CTAs */}
          {user ? (
            <div className="header-user-actions">
              <Link to={routes.profile} className="header-btn-secondary">
                <span>Кабинет</span>
              </Link>
              <button
                type="button"
                className="header-btn-text"
                onClick={() => void logout().then(() => navigate(routes.login))}
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="header-guest-actions">
              <Link to={routes.login} className="header-btn-login">
                <span>Войти</span>
              </Link>
              <Link to={routes.register} className="header-btn-register">
                <span>Регистрация</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-burger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-pane" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <BrandLogo size={24} showText={true} />
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Закрыть меню"
              >
                ✕
              </button>
            </div>

            <div className="mobile-drawer-groups">
              {menuGroups.map((group) => {
                const isExpanded = mobileOpenGroup === group.id
                return (
                  <div key={group.id} className="mobile-group-item">
                    <button
                      type="button"
                      className="mobile-group-trigger"
                      onClick={() => setMobileOpenGroup(isExpanded ? null : group.id)}
                    >
                      <span>{group.label}</span>
                      <svg
                        className={`mobile-chevron ${isExpanded ? 'is-expanded' : ''}`}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="mobile-group-subitems">
                        {group.items.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="mobile-subitem-link"
                            onClick={(e) => handleItemClick(item, e)}
                          >
                            <span>{item.label}</span>
                            {item.badge && <span className="dropdown-link-badge">{item.badge}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mobile-drawer-footer">
              {user ? (
                <Link
                  to={routes.profile}
                  className="hero-cta-primary full-width"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Перейти в кабинет</span>
                </Link>
              ) : (
                <div className="mobile-auth-grid">
                  <Link
                    to={routes.login}
                    className="header-btn-login full-width text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Войти</span>
                  </Link>
                  <Link
                    to={routes.register}
                    className="header-btn-register full-width text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Регистрация</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
