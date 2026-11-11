import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { routes } from '../../routes'
import { getEventsCatalog } from '../../services/eventsCatalog'
import type { EventPreview } from '../../types/dashboard'
import { LandingHeader } from './components/LandingHeader'
import { PublicOfferModal } from './components/PublicOfferModal'
import { OrganizerContactModal } from './components/OrganizerContactModal'
import './landing.css'

const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`

// Fallback visual cards matching the reference design in case fewer DB events are published
const fallbackEvents = [
  {
    id: 'fallback-vienna',
    title: 'Vienna Dancesport Open',
    dateLabel: '15 – 17 марта 2027',
    location: 'Вена, Австрия',
    image: `${baseUrl}vienna-city.webp`,
    route: routes.events,
  },
  {
    id: 'fallback-paris',
    title: 'Paris Dance Cup',
    dateLabel: '29 – 31 марта 2027',
    location: 'Париж, Франция',
    image: `${baseUrl}paris-city.webp`,
    route: routes.events,
  },
  {
    id: 'fallback-astana',
    title: 'Astana Dancesport Festival',
    dateLabel: '10 – 12 апреля 2027',
    location: 'Астана, Казахстан',
    image: `${baseUrl}astana-city.webp`,
    route: routes.events,
  },
  {
    id: 'fallback-dubai',
    title: 'Dubai Grand Slam',
    dateLabel: '24 – 26 апреля 2027',
    location: 'Дубай, ОАЭ',
    image: `${baseUrl}dubai-city.webp`,
    route: routes.events,
  },
]

const problemCards = [
  {
    num: '01',
    title: 'Информация разделена между клубами, федерациями и странами',
    desc: 'Танцевальное сообщество широко географически, но информация внутри него остаётся разрозненной. Новости о турнирах и сборах распространяются через отдельные сайты, страницы в социальных сетях, чаты и личные контакты. Каждое мероприятие продвигается самостоятельно, а события за пределами привычного круга легко пропустить.',
  },
  {
    num: '02',
    title: 'Сложно ориентироваться родителям и тренерам',
    desc: 'Особенно трудно родителям, которые только знакомятся с танцевальным спортом: какие соревнования подходят ребёнку, где пройти сборы, к каким преподавателям записаться? При этом тренеры тоже не всегда видят полную картину без общего проверенного источника информации, и даже значимые события могут пройти мимо.',
  },
  {
    num: '03',
    title: 'Участие по частям, а организация держится на ручном труде',
    desc: 'Даты, уроки, чеки и билеты фиксируются вручную в разных местах. Для организаторов приём заявок, согласование времени педагогов, отмены и переносы превращаются в бесконечные таблицы и ручной труд, в котором легко допустить накладку или овербукинг.',
  },
]

const comparisonItems = [
  {
    num: '01',
    process: 'Поиск мероприятий',
    before: 'Информация разбросана по сайтам, социальным сетям и чатам. События за пределами привычного круга легко пропустить.',
    after: 'Общий календарь и карта событий помогают находить турниры, сборы и мастер-классы в своём городе, стране и за рубежом.',
  },
  {
    num: '02',
    process: 'Выбор события',
    before: 'Даты, условия участия, состав преподавателей и расписание приходится искать в разных источниках или уточнять лично.',
    after: 'Основная информация собрана на странице мероприятия, чтобы участник мог изучить условия и спланировать поездку или обучение.',
  },
  {
    num: '03',
    process: 'Регистрация и запись',
    before: 'Отдельные формы, сайты и переписки с организаторами. Не всегда понятно, подтверждена ли запись.',
    after: 'Регистрация на мероприятие и запись на занятия доступны через платформу, а их статусы — в едином личном кабинете.',
  },
  {
    num: '04',
    process: 'Оплата участия',
    before: 'Реквизиты и подтверждения передаются в сообщениях. Историю оплат приходится собирать самостоятельно по выпискам.',
    after: 'Участник может безопасно оплачивать события и занятия онлайн, сохранять чеки и видеть прозрачные статусы платежей.',
  },
  {
    num: '05',
    process: 'Планирование сезона',
    before: 'Даты турниров, уроки и оплаты фиксируются вручную в разных блокнотах и заметках.',
    after: 'Личный интерактивный танцевальный календарь объединяет предстоящие мероприятия, уроки и информацию об оплатах.',
  },
  {
    num: '06',
    process: 'Расписание сборов',
    before: 'Организаторы вручную распределяют индивидуальные уроки и лекции, согласовывая время с каждым участником в личке.',
    after: 'Инструменты составления расписания автоматически формируют сетку занятий и учитывают загрузку педагогов.',
  },
  {
    num: '07',
    process: 'Отмены и переносы',
    before: 'Запросы на отмену или перенос решаются в долгих переписках. Освободившееся время нужно вручную перепродавать.',
    after: 'Отмены и переносы мгновенно отражаются в системе, а слоты снова становятся доступны для записи по правилам события.',
  },
  {
    num: '08',
    process: 'Пересечения и количество мест',
    before: 'Участник может оказаться записан на два урока одновременно, а число заявок — превысить доступные места.',
    after: 'Автоматическая проверка пересечений и строгий контроль доступных мест исключают накладки при записи.',
  },
  {
    num: '09',
    process: 'Работа тренера',
    before: 'Расписания, категории и списки нескольких учеников тренеру приходится сверять по десяткам чатов.',
    after: 'Тренер видит расписание учеников, координирует их участие и контролирует тренировочный процесс в общей системе.',
  },
  {
    num: '10',
    process: 'Контроль и отчётность',
    before: 'Данные об участниках, загрузке судей и преподавателей, билетах и платежах разрознены по таблицам.',
    after: 'Организатор видит прозрачную аналитику регистраций, занятости залов, оплат и получает готовую отчётность в один клик.',
  },
]

const servicesBreakdown = [
  {
    num: '(01)',
    title: 'Регистрация на турниры',
    badge: 'Спортсменам & Парам',
    desc: 'Выбор танцевального соревнования и подходящей возрастной и классификационной категории. Все официальные регламенты, правила и условия размещаются на странице события.',
    link: routes.events,
    cta: 'Выбрать турнир',
  },
  {
    num: '(02)',
    title: 'Запись на мастер-классы и сборы',
    badge: 'Обучение & Развитие',
    desc: 'Индивидуальные уроки с ведущими мировыми тренерами, групповые лекции, танцевальные лагеря и интенсивы с наглядным расписанием свободных слотов.',
    link: routes.events,
    cta: 'Записаться на сборы',
  },
  {
    num: '(03)',
    title: 'Зрительские билеты',
    badge: 'Зрителям & Гостям',
    desc: 'Быстрая покупка электронных входных билетов в зрительный зал и бронирование комфортных VIP-столов у самого паркета с мгновенной отправкой в личный кабинет.',
    link: routes.events,
    cta: 'Купить билеты',
  },
  {
    num: '(04)',
    title: 'Для организаторов',
    badge: 'Клубам & Федерациям',
    desc: 'Комплексная панель управления: автоматический приём заявок, контроль лимитов участников, финансовая аналитика, гибкие тарифы и инструменты отчётности.',
    link: routes.host,
    cta: 'Панель организатора',
  },
]

const howItWorksSteps = [
  {
    num: '01',
    title: 'Выберите мероприятие',
    desc: 'Найдите подходящий турнир, сборы или мастер-класс в общем интерактивном каталоге и календаре платформы.',
  },
  {
    num: '02',
    title: 'Ознакомьтесь с условиями',
    desc: 'Изучите полную программу, судейскую коллегию, расписание, правила участия и стоимость.',
  },
  {
    num: '03',
    title: 'Выберите услугу и данные',
    desc: 'Укажите данные танцоров, категорию участия, уроки с педагогами или количество зрительских мест.',
  },
  {
    num: '04',
    title: 'Оплатите онлайн',
    desc: 'Быстрая и безопасная оплата через защищённый платёжный шлюз с моментальным сохранением чека и билета в ЛК.',
  },
]

type DisplayEvent = {
  id: string
  title: string
  dateLabel: string
  location: string
  image: string
  route: string
}

export function LandingPage() {
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [ofertaModalOpen, setOfertaModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)

  const { data: catalogEvents = [] } = useQuery<EventPreview[]>({
    queryKey: ['landing-catalog-events'],
    queryFn: () => getEventsCatalog(),
    staleTime: 5 * 60 * 1000,
  })

  const handleAnchorClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault()
    if (targetId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const displayEvents: DisplayEvent[] = useMemo(() => {
    const formatLocation = (ev: EventPreview) => {
      if (ev.city && ev.country) return `${ev.city}, ${ev.country}`
      return ev.city || ev.country || 'Место уточняется'
    }

    const formatDate = (ev: EventPreview) => {
      if (!ev.startAt) return 'Даты уточняются'
      try {
        const d = new Date(ev.startAt)
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
      } catch {
        return 'Даты уточняются'
      }
    }

    if (catalogEvents.length >= 4) {
      return catalogEvents.slice(0, 4).map((event) => ({
        id: event.id,
        title: event.title,
        dateLabel: formatDate(event),
        location: formatLocation(event),
        image: event.coverUrl || `${baseUrl}hero-dancesport-couple.webp`,
        route: `/events/${event.id}`,
      }))
    }
    const combined: DisplayEvent[] = catalogEvents.map((event) => ({
      id: event.id,
      title: event.title,
      dateLabel: formatDate(event),
      location: formatLocation(event),
      image: event.coverUrl || `${baseUrl}hero-dancesport-couple.webp`,
      route: `/events/${event.id}`,
    }))
    for (const fb of fallbackEvents) {
      if (combined.length >= 4) break
      if (!combined.some((item) => item.title.toLowerCase() === fb.title.toLowerCase())) {
        combined.push(fb)
      }
    }
    return combined.slice(0, 4)
  }, [catalogEvents])

  return (
    <div className="landing-root" id="top">
      {/* 1. Transparent Floating Header with Submenus & Dropdowns */}
      <LandingHeader
        onOpenContact={() => setContactModalOpen(true)}
        onOpenVideo={() => setVideoModalOpen(true)}
      />

      <main className="landing-main-content">
        {/* 2. Hero Section */}
        <section className="landing-hero" aria-label="Главный экран">
          <div className="hero-bg" aria-hidden="true">
            <img
              src={`${baseUrl}hero-dancesport-couple.webp`}
              alt=""
              className="hero-bg-img"
              loading="eager"
            />
            <div className="hero-bg-gradient" />
          </div>

          <div className="hero-container">
            <div className="hero-content">
              <span className="hero-eyebrow">ГЛОБАЛЬНАЯ ПЛАТФОРМА DANCESPORT</span>
              <h1 className="hero-title">Всё для танцевальных событий в одном месте</h1>
              <p className="hero-subtitle">
                <span>Соревнования</span>
                <span className="hero-subtitle-dot">·</span>
                <span>Регистрация</span>
                <span className="hero-subtitle-dot">·</span>
                <span>Билеты</span>
                <span className="hero-subtitle-dot">·</span>
                <span>Рейтинги</span>
                <span className="hero-subtitle-dot">·</span>
                <span>Трансляции</span>
                <span className="hero-subtitle-dot">·</span>
                <span>Сообщество</span>
              </p>
              <div className="hero-actions">
                <Link to={routes.events} className="hero-cta-primary">
                  <span>Найти события</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  className="hero-cta-secondary"
                  onClick={() => setVideoModalOpen(true)}
                  aria-label="Смотреть презентационное видео"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Смотреть видео</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Services Strip (8 Quick Links from Reference Design) */}
        <div className="services-strip-wrapper">
          <section className="services-strip" aria-label="Сервисы экосистемы">
            <Link to={routes.events} className="service-cell">
              <div className="service-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span className="service-title">События</span>
              <span className="service-desc">по всему миру</span>
            </Link>

            <a
              href="#services"
              className="service-cell"
              onClick={(e) => handleAnchorClick(e, 'services')}
            >
              <div className="service-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="service-title">Регистрация</span>
              <span className="service-desc">участников</span>
            </a>

            <a
              href="#services"
              className="service-cell"
              onClick={(e) => handleAnchorClick(e, 'services')}
            >
              <div className="service-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
              </div>
              <span className="service-title">Билеты</span>
              <span className="service-desc">для зрителей</span>
            </a>

            <Link to={routes.events} className="service-cell">
              <div className="service-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <span className="service-title">Рейтинги</span>
              <span className="service-desc">и результаты</span>
            </Link>

            <button type="button" className="service-cell" onClick={() => setVideoModalOpen(true)}>
              <div className="service-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
              </div>
              <span className="service-title">Онлайн-трансляции</span>
              <span className="service-desc">и архив видео</span>
            </button>

            <a
              href="#services"
              className="service-cell"
              onClick={(e) => handleAnchorClick(e, 'services')}
            >
              <div className="service-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <span className="service-title">Магазин</span>
              <span className="service-desc">для танцоров</span>
            </a>

            <Link to={routes.trainers} className="service-cell">
              <div className="service-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <span className="service-title">Обучение</span>
              <span className="service-desc">и развитие</span>
            </Link>

            <a
              href="#community"
              className="service-cell"
              onClick={(e) => handleAnchorClick(e, 'community')}
            >
              <div className="service-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21a8.5 8.5 0 0 1 13 0" />
                  <circle cx="19" cy="11" r="3" />
                  <circle cx="5" cy="11" r="3" />
                </svg>
              </div>
              <span className="service-title">Сообщество</span>
              <span className="service-desc">Dancesport</span>
            </a>
          </section>
        </div>

        {/* 4. SECTION: About Us & Mission */}
        <section className="landing-section" id="mission" aria-label="О нас и миссия">
          <div className="section-container">
            <div className="section-header-centered">
              <span className="section-eyebrow">О НАС · МИССИЯ ПЛАТФОРМЫ</span>
              <h2 className="section-title">Весь мир спортивно-бальных танцев в одном месте</h2>
              <p className="section-lead">
                <strong>On Dance Space</strong> — единая цифровая платформа, которая объединяет танцоров, родителей, тренеров, клубы и организаторов.
                Пространство, где можно находить события и партнёров, записываться на занятия, оплачивать участие и планировать свой танцевальный сезон.
              </p>
              <div className="mission-badge">
                <span className="mission-badge-icon">✦</span>
                <span>Создано танцорами для танцоров · Мы глубоко понимаем потребности и возможности индустрии</span>
              </div>
            </div>

            <div className="mission-cards-grid">
              <div className="mission-card mission-card-highlight">
                <span className="mission-card-tag">НАША МИССИЯ</span>
                <h3 className="mission-card-heading">
                  Сделать возможности танцевального мира доступнее, а путь от поиска события до участия в нём понятнее и проще.
                </h3>
                <p className="mission-card-p">
                  Спортивно-бальные танцы объединяют спортсменов разных возрастов и уровней подготовки по всему миру.
                  В разных городах и странах проходят турниры, тренировочные сборы, мастер-классы и занятия с приглашёнными преподавателями.
                  Каждое из этих событий может стать важным шагом в развитии танцора.
                </p>
                <p className="mission-card-p">
                  Наша цель — чтобы доступ к этим возможностям не зависел от того, на какие страницы подписан человек, в каком клубе он занимается и в каких чатах состоит.
                  Чтобы танцоры и их семьи могли видеть больше направлений для развития, тренеры — находить возможности для учеников, а организаторы — делать свои события доступными более широкому сообществу.
                </p>
              </div>

              <div className="mission-card">
                <span className="mission-card-tag">ЕДИНАЯ ЭКОСИСТЕМА</span>
                <h3 className="mission-card-heading">
                  Одна индустрия. Тысячи событий. Единая платформа.
                </h3>
                <p className="mission-card-p">
                  Для танцоров, организаторов, тренеров и зрителей — единый цифровой центр управления спортивной карьерой.
                </p>
                <div className="mission-stats-list">
                  <div className="mission-stat-item">
                    <span className="mission-stat-val">10+</span>
                    <span className="mission-stat-lbl">танцевальных дисциплин Latin & Standard</span>
                  </div>
                  <div className="mission-stat-item">
                    <span className="mission-stat-val">100%</span>
                    <span className="mission-stat-lbl">прозрачность статусов оплат и регистраций</span>
                  </div>
                  <div className="mission-stat-item">
                    <span className="mission-stat-val">24/7</span>
                    <span className="mission-stat-lbl">доступ к единому календарю сезона и турниров</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SECTION: The Problem («Как было устроено до этого») */}
        <section className="landing-section section-problem" id="problem" aria-label="Как было устроено до этого">
          <div className="section-container">
            <div className="section-header-centered">
              <span className="section-eyebrow">ПРОБЛЕМА ИНДУСТРИИ</span>
              <h2 className="section-title">Как было устроено до этого</h2>
              <p className="section-lead">
                Танцевальное сообщество широко географически, но информация внутри него годами оставалась разрозненной и фрагментированной.
              </p>
            </div>

            <div className="problem-cards-grid">
              {problemCards.map((p) => (
                <div key={p.num} className="problem-card">
                  <div className="problem-num-badge">{p.num}</div>
                  <h3 className="problem-card-title">{p.title}</h3>
                  <p className="problem-card-desc">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. SECTION: Solution & 10 Comparisons («Что меняется с On Dance Space») */}
        <section className="landing-section" id="comparison" aria-label="Что меняется с On Dance Space">
          <div className="section-container">
            <div className="section-header-centered">
              <span className="section-eyebrow">РЕШЕНИЕ И СРАВНЕНИЕ</span>
              <h2 className="section-title">Что меняется с On Dance Space</h2>
              <p className="section-lead">
                On Dance Space объединяет эти процессы в одной системе: от поиска возможностей до управления расписанием и оплатами.
                Информация о событии, действия участника и работа организатора связаны между собой.
              </p>
            </div>

            {/* Comparison Table / Rows */}
            <div className="comparison-table-wrapper">
              <div className="comparison-table-head">
                <div className="col-proc">Процесс</div>
                <div className="col-before">Без единой системы</div>
                <div className="col-after">С On Dance Space</div>
              </div>

              <div className="comparison-table-body">
                {comparisonItems.map((item) => (
                  <div key={item.num} className="comparison-row">
                    <div className="col-proc">
                      <span className="comparison-idx">{item.num}</span>
                      <strong className="comparison-proc-title">{item.process}</strong>
                    </div>
                    <div className="col-before">
                      <span className="comparison-mobile-label">Без системы:</span>
                      <p>{item.before}</p>
                    </div>
                    <div className="col-after">
                      <span className="comparison-mobile-label">С On Dance Space:</span>
                      <p>{item.after}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="comparison-summary-banner">
              <div className="summary-banner-pill">ИТОГ ТРАНСФОРМАЦИИ</div>
              <p className="summary-banner-text">
                <strong>Для танцоров и родителей</strong> — возможность видеть свой сезон целиком и меньше времени тратить на поиск и согласования.{' '}
                <strong>Для тренеров</strong> — удобно координировать развитие учеников.{' '}
                <strong>Для организаторов</strong> — сократить объём ручной работы и управлять мероприятием на основе актуальных данных.
              </p>
            </div>
          </div>
        </section>

        {/* 7. SECTION: Community & Career («Больше, чем организация событий») */}
        <section className="landing-section section-community" id="community" aria-label="Сообщество Dancesport">
          <div className="section-container">
            <div className="section-header-centered">
              <span className="section-eyebrow">БОЛЬШЕ, ЧЕМ ОРГАНИЗАЦИЯ СОБЫТИЙ</span>
              <h2 className="section-title">Сообщество, партнёры и развитие</h2>
              <p className="section-lead">
                On Dance Space — пространство, которое сопровождает танцора на разных этапах его пути: от первых занятий и соревнований до поиска партнёра и участия в международных событиях.
              </p>
            </div>

            <div className="community-grid">
              <div className="community-card">
                <div className="community-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="community-card-title">Поиск партнёра и развитие карьеры</h3>
                <p className="community-card-desc">
                  Удобная база анкет танцоров: возраст, рост, спортивный разряд, танцевальный класс и предпочтительная программа (латина или стандарт). Быстрый поиск единомышленников для успешного выхода на паркет.
                </p>
              </div>

              <div className="community-card">
                <div className="community-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <h3 className="community-card-title">Новости и жизнь танцевального мира</h3>
                <p className="community-card-desc">
                  Результаты соревнований, аналитические обзоры, рейтинги спортсменов и актуальные инфоповоды танцевального спорта. Следите за достижениями и открывайте новые возможности для роста.
                </p>
              </div>

              <div className="community-card">
                <div className="community-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <h3 className="community-card-title">Сопровождение танцора на всех этапах</h3>
                <p className="community-card-desc">
                  От первых пробных шагов в детских группах и любительских номинациях до участия в международных чемпионатах WDSF/WDC и профессиональной тренерской практики.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. SECTION: Full Spectrum of Services */}
        <section className="landing-section" id="services" aria-label="Полный спектр услуг">
          <div className="section-container">
            <div className="section-header-centered">
              <span className="section-eyebrow">СЕРВИСЫ ПЛАТФОРМЫ</span>
              <h2 className="section-title">Полный спектр услуг</h2>
              <p className="section-lead">
                Платформа создается для удобного поиска танцевальных мероприятий, регистрации участников и оформления билетов онлайн.
              </p>
            </div>

            <div className="services-breakdown-grid">
              {servicesBreakdown.map((s) => (
                <div key={s.num} className="breakdown-card">
                  <div className="breakdown-card-top">
                    <span className="breakdown-num">{s.num}</span>
                    <span className="breakdown-badge">{s.badge}</span>
                  </div>
                  <h3 className="breakdown-title">{s.title}</h3>
                  <p className="breakdown-desc">{s.desc}</p>
                  <Link to={s.link} className="breakdown-cta">
                    <span>{s.cta}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. SECTION: How It Works (4 Steps) */}
        <section className="landing-section section-steps" id="how-it-works" aria-label="Как это работает">
          <div className="section-container">
            <div className="section-header-centered">
              <span className="section-eyebrow">ПРОСТОТА И ПРОЗРАЧНОСТЬ</span>
              <h2 className="section-title">Как это работает</h2>
              <p className="section-lead">
                Четыре последовательных шага от выбора события до подтверждённого участия.
              </p>
            </div>

            <div className="workflow-steps-grid">
              {howItWorksSteps.map((st) => (
                <div key={st.num} className="workflow-step-card">
                  <div className="workflow-step-num">{st.num}</div>
                  <h3 className="workflow-step-title">{st.title}</h3>
                  <p className="workflow-step-desc">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. SECTION: Upcoming Events (Existing Real/Mock Tournament Cards) */}
        <section className="landing-section upcoming-section" id="events" aria-label="Ближайшие события">
          <div className="section-container">
            <div className="upcoming-header">
              <div>
                <span className="section-eyebrow">КАЛЕНДАРЬ СЕЗОНА</span>
                <h2 className="upcoming-title">Ближайшие события</h2>
              </div>
              <Link to={routes.events} className="upcoming-all-link">
                <span>Все события в каталоге</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="events-cards-grid">
              {displayEvents.map((event) => (
                <Link key={event.id} to={event.route} className="landing-event-card">
                  <div className="card-media">
                    <img src={event.image} alt={event.title} className="card-media-img" loading="lazy" />
                  </div>
                  <div className="card-body">
                    <div>
                      <h3 className="card-title">{event.title}</h3>
                      <div className="card-meta-list">
                        <div className="card-meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>{event.dateLabel}</span>
                        </div>
                        <div className="card-meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-arrow-circle" aria-hidden="true">
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 11. SECTION: For Organizers CTA */}
        <section className="landing-section section-organizers" id="organizers" aria-label="Организаторам событий">
          <div className="section-container">
            <div className="organizer-cta-card">
              <div className="organizer-cta-content">
                <span className="section-eyebrow">ОРГАНИЗАТОРАМ ТУРНИРОВ И СБОРОВ</span>
                <h2 className="organizer-cta-title">Проводите танцевальные турниры или мастер-классы?</h2>
                <p className="organizer-cta-desc">
                  On Dance Space поможет представить ваше событие многотысячному танцевальному сообществу.
                  Автоматизируйте регистрацию пар, приём оплат, управление квотами и расписанием в одной системе.
                </p>
                <div className="organizer-cta-actions">
                  <button
                    type="button"
                    className="hero-cta-primary"
                    onClick={() => setContactModalOpen(true)}
                  >
                    <span>Связаться с командой</span>
                    <span aria-hidden="true">→</span>
                  </button>
                  <Link to={routes.host} className="hero-cta-secondary">
                    <span>Панель организатора</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 12. UNIFIED COHESIVE FOOTER (Includes Ecosystem Banner + Multi-Column Directory) */}
        <footer className="landing-footer" id="ecosystem" aria-label="Подвал сайта">
          <div className="footer-container">
            {/* Part A: The ON Ecosystem Strip Banner */}
            <div className="footer-ecosystem-banner">
              <div className="ecosystem-heading">
                <strong>ON</strong> — экосистема<br />
                для мира Dancesport
              </div>
              <div className="ecosystem-pillars">
                <div className="ecosystem-pillar">
                  <span className="pillar-icon">∞</span>
                  <span className="pillar-text">Десять танцев. Один мир.</span>
                </div>
                <div className="ecosystem-pillar">
                  <span className="pillar-icon">🌐</span>
                  <span className="pillar-text">Международные события</span>
                </div>
                <div className="ecosystem-pillar">
                  <span className="pillar-icon">👥</span>
                  <span className="pillar-text">Единое сообщество танцоров, тренеров и организаторов</span>
                </div>
                <div className="ecosystem-pillar">
                  <span className="pillar-icon">❖</span>
                  <span className="pillar-text">Полный цикл сервисов от регистрации до трансляции</span>
                </div>
                <div className="ecosystem-pillar">
                  <span className="pillar-icon">☆</span>
                  <span className="pillar-text">Развитие танцевального спорта по всему миру</span>
                </div>
              </div>
            </div>

            {/* Part B: Directory Columns */}
            <div className="footer-directory-grid">
              <div className="footer-brand-col">
                <span className="footer-brand-title">ON DANCE SPACE</span>
                <p className="footer-brand-tagline">
                  Единая экосистема спортивно-бальных танцев. События, регистрация, билеты и развитие карьеры.
                </p>
                <div className="footer-contacts-list">
                  <a href="mailto:di@tocloud.kz" className="footer-contact-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>di@tocloud.kz</span>
                  </a>
                  <span className="footer-contact-item text-muted">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>г. Астана, Республика Казахстан</span>
                  </span>
                </div>
              </div>

              <div className="footer-nav-col">
                <span className="footer-nav-heading">О платформе</span>
                <a href="#mission" onClick={(e) => handleAnchorClick(e, 'mission')}>О нас и миссия</a>
                <a href="#problem" onClick={(e) => handleAnchorClick(e, 'problem')}>Проблемы индустрии</a>
                <a href="#comparison" onClick={(e) => handleAnchorClick(e, 'comparison')}>10 процессов (Сравнение)</a>
                <a href="#community" onClick={(e) => handleAnchorClick(e, 'community')}>Сообщество Dancesport</a>
                <a href="#how-it-works" onClick={(e) => handleAnchorClick(e, 'how-it-works')}>Как это работает</a>
              </div>

              <div className="footer-nav-col">
                <span className="footer-nav-heading">События & Сервисы</span>
                <Link to={routes.events}>Каталог соревнований</Link>
                <a href="#events" onClick={(e) => handleAnchorClick(e, 'events')}>Ближайшие события</a>
                <a href="#services" onClick={(e) => handleAnchorClick(e, 'services')}>Мастер-классы и сборы</a>
                <a href="#services" onClick={(e) => handleAnchorClick(e, 'services')}>Зрительские билеты</a>
                <Link to={routes.trainers}>Каталог тренеров</Link>
              </div>

              <div className="footer-nav-col">
                <span className="footer-nav-heading">Организаторам & Документы</span>
                <a href="#organizers" onClick={(e) => handleAnchorClick(e, 'organizers')}>Подключение турниров</a>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => setContactModalOpen(true)}
                >
                  Связаться с куратором
                </button>
                <Link to={routes.host}>Панель организатора</Link>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => setOfertaModalOpen(true)}
                >
                  Публичная оферта (toCloud)
                </button>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => setOfertaModalOpen(true)}
                >
                  Пользовательское соглашение
                </button>
              </div>
            </div>

            {/* Part C: Bottom Bar */}
            <div className="footer-bottom-bar">
              <span className="footer-copyright">
                © 2026 On dance space. Все права защищены. ТОО «toCloud», БИН 240640005239.
              </span>
              <div className="footer-social-links">
                <a href="https://t.me" target="_blank" rel="noopener noreferrer">Telegram</a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
                <a
                  href="#top"
                  onClick={(e) => handleAnchorClick(e, 'top')}
                  className="footer-back-to-top"
                >
                  Наверх ↑
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Video Player Modal */}
      {videoModalOpen && (
        <div
          className="video-modal-overlay"
          onClick={() => setVideoModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Промо-видео Dancesport"
        >
          <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="video-modal-close"
              onClick={() => setVideoModalOpen(false)}
              aria-label="Закрыть видео"
            >
              ✕
            </button>
            <div className="video-modal-iframe-wrap">
              <iframe
                src="https://player.vimeo.com/video/1035763218?autoplay=1&title=0&byline=0&portrait=0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Dancesport Festival Promo"
              />
            </div>
          </div>
        </div>
      )}

      {/* Public Offer Legal Modal */}
      <PublicOfferModal
        isOpen={ofertaModalOpen}
        onClose={() => setOfertaModalOpen(false)}
      />

      {/* Organizer Partnership / Contact Modal */}
      <OrganizerContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </div>
  )
}
