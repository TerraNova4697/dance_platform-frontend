import { useState, useEffect, useCallback, useMemo, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FrappeApiError } from '../../api/frappe'
import {
  getHostDashboardData,
  updateHostOrganizationProfile,
  createHostEvent,
  type HostDashboardData,
} from '../../api/hostCabinet'
import { uploadProfilePhoto } from '../../api/onboarding'
import { searchVenues } from '../../api/trainerCabinet'
import { CitySelectInput } from '../../components/CitySelectInput'
import { CountryPhoneInput } from '../../components/CountryPhoneInput'
import { DebouncedSearchSelect } from '../../components/DebouncedSearchSelect'
import { LoadingScreen } from '../../components/LoadingScreen'
import { DashboardHeader } from '../dashboard/components/DashboardHeader'
import { routes } from '../../routes'
import { useAuthStore } from '../../stores/authStore'
import { formatDateTime } from '../../utils/date'
import './host.css'

type HostTab = 'events' | 'registrations' | 'participants' | 'settings'

type HostDashboardViewProps = {
  embedded?: boolean
}

export function HostDashboardView({ embedded = false }: HostDashboardViewProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<HostDashboardData | null>(null)
  const [activeTab, setActiveTab] = useState<HostTab>('events')
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Registrations tab filters
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')
  const [regSearch, setRegSearch] = useState<string>('')

  // Participants tab search
  const [partSearch, setPartSearch] = useState<string>('')

  // Settings form state
  const [displayName, setDisplayName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [logo, setLogo] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  // Create Event Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [evType, setEvType] = useState<'Master Class' | 'Tournament'>('Master Class')
  const [evTitle, setEvTitle] = useState('')
  const [evDesc, setEvDesc] = useState('')
  const [evCover, setEvCover] = useState('')
  const [evVenue, setEvVenue] = useState('')
  const [evVenueTitle, setEvVenueTitle] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)

  // Master Class slots & packages
  const [mcSlots, setMcSlots] = useState<
    {
      client_key: string
      start_datetime: string
      end_datetime: string
      has_capacity_limit: boolean
      capacity: number
      price: number
    }[]
  >([
    {
      client_key: 'slot_1',
      start_datetime: '',
      end_datetime: '',
      has_capacity_limit: true,
      capacity: 25,
      price: 6000,
    },
  ])
  const [mcPackages, setMcPackages] = useState<
    { title: string; description: string; price: number; slot_keys: string[] }[]
  >([])

  // Tournament fields
  const [tournStart, setTournStart] = useState('')
  const [tournEnd, setTournEnd] = useState('')
  const [tournRules, setTournRules] = useState('Открытая регистрация согласно правилам турнира')
  const [allowSolo, setAllowSolo] = useState(true)
  const [allowCouple, setAllowCouple] = useState(true)
  const [allowTeam, setAllowTeam] = useState(true)

  const loadDashboard = useCallback(async () => {
    try {
      const res = await getHostDashboardData()
      setApiError(null)
      setData(res)
      setDisplayName(res.organization.display_name || '')
      setLegalName(res.organization.legal_name || '')
      setCity(res.organization.city || '')
      setAddress(res.organization.address || '')
      setPhone(res.organization.phone || '')
      setEmail(res.organization.email || '')
      setLogo(res.organization.logo || '')
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) {
        setApiError(err.message)
      } else {
        setApiError('Не удалось загрузить данные кабинета Организатора.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      try {
        const res = await getHostDashboardData()
        if (!isMounted) return
        setApiError(null)
        setData(res)
        setDisplayName(res.organization.display_name || '')
        setLegalName(res.organization.legal_name || '')
        setCity(res.organization.city || '')
        setAddress(res.organization.address || '')
        setPhone(res.organization.phone || '')
        setEmail(res.organization.email || '')
        setLogo(res.organization.logo || '')
      } catch (err: unknown) {
        if (!isMounted) return
        if (err instanceof FrappeApiError) {
          setApiError(err.message)
        } else {
          setApiError('Не удалось загрузить данные кабинета Организатора.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void run()
    return () => {
      isMounted = false
    }
  }, [])

  const handleFetchVenues = useCallback(async (q: string) => {
    const list = await searchVenues(q)
    return list.map((v) => ({ name: v.name, title: `${v.title} (${v.city || 'Город не указан'})` }))
  }, [])

  const filteredRegistrations = useMemo(() => {
    if (!data) return []
    const q = regSearch.trim().toLowerCase()
    return data.registrations.filter((r) => {
      if (selectedEventFilter !== 'all' && r.event_id !== selectedEventFilter) return false
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'paid' && r.status !== 'Paid' && r.status !== 'Confirmed') return false
        if (selectedStatusFilter === 'pending' && r.status !== 'Awaiting Payment') return false
        if (selectedStatusFilter === 'cancelled' && r.status !== 'Cancelled' && r.status !== 'Expired') return false
      }
      if (q) {
        const hay = `${r.participant_name} ${r.participant_phone} ${r.participant_email} ${r.ticket_number || ''} ${r.event_title}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [data, selectedEventFilter, selectedStatusFilter, regSearch])

  const filteredParticipants = useMemo(() => {
    if (!data) return []
    const q = partSearch.trim().toLowerCase()
    if (!q) return data.participants
    return data.participants.filter((p) => {
      const hay = `${p.full_name} ${p.phone} ${p.email} ${p.city} ${p.events.join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [data, partSearch])

  async function handleLogoFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    setApiError(null)
    try {
      const url = await uploadProfilePhoto(file)
      setLogo(url)
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось загрузить логотип.')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleCoverFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    setApiError(null)
    try {
      const url = await uploadProfilePhoto(file)
      setEvCover(url)
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось загрузить обложку.')
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault()
    setSavingSettings(true)
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await updateHostOrganizationProfile({
        display_name: displayName,
        legal_name: legalName,
        city,
        address,
        phone,
        email,
        logo,
      })
      setSuccessMessage(res.message)
      await loadDashboard()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Ошибка при сохранении профиля.')
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleCreateEvent(e: FormEvent) {
    e.preventDefault()
    setSavingEvent(true)
    setApiError(null)
    setSuccessMessage(null)
    try {
      if (evType === 'Master Class') {
        const res = await createHostEvent({
          event_type: 'Master Class',
          title: evTitle,
          description: evDesc,
          cover: evCover || undefined,
          venue: evVenue || undefined,
          currency: 'KZT',
          slots: mcSlots.map((s) => ({
            client_key: s.client_key,
            start_datetime: s.start_datetime,
            end_datetime: s.end_datetime,
            venue: evVenue || undefined,
            has_capacity_limit: s.has_capacity_limit,
            capacity: Number(s.capacity),
            price: Number(s.price),
          })),
          packages: mcPackages.map((p) => ({
            title: p.title,
            description: p.description,
            price: Number(p.price),
            slot_keys: p.slot_keys,
          })),
        })
        setSuccessMessage(res.message)
      } else {
        const res = await createHostEvent({
          event_type: 'Tournament',
          title: evTitle,
          description: evDesc,
          cover: evCover || undefined,
          venue: evVenue || undefined,
          currency: 'KZT',
          start_datetime: tournStart,
          end_datetime: tournEnd,
          registration_rules: tournRules,
          allow_solo: allowSolo,
          allow_couple: allowCouple,
          allow_team: allowTeam,
        })
        setSuccessMessage(res.message)
      }
      setShowCreateModal(false)
      setEvTitle('')
      setEvDesc('')
      setEvCover('')
      await loadDashboard()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось создать Ивент.')
    } finally {
      setSavingEvent(false)
    }
  }

  function renderStatusBadge(status: string) {
    if (status === 'Paid' || status === 'Confirmed' || status === 'Completed') {
      return <span className="reg-status-pill reg-status-paid">Оплачено ✓</span>
    }
    if (status === 'Awaiting Payment' || status === 'Pending') {
      return <span className="reg-status-pill reg-status-pending">Ожидает оплаты ⏳</span>
    }
    return <span className="reg-status-pill reg-status-cancelled">{status}</span>
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!data) {
    return (
      <div className={`host-container ${embedded ? 'embedded' : ''}`}>
        <div className="host-section-card">
          <h3>Доступ к кабинету Организатора</h3>
          <p>{apiError || 'Кабинет Организатора доступен после одобрения заявки физического лица.'}</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="primary-button" onClick={() => navigate(routes.profile)}>
              Перейти к заявке в Профиле
            </button>
            <button type="button" className="secondary-button" onClick={() => void loadDashboard()}>
              Обновить
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { organization, stats, events } = data

  return (
    <div className={`host-container ${embedded ? 'embedded' : ''}`}>
      {/* Hero Banner */}
      <section className="host-hero-card">
        <div className="host-hero-left">
          {organization.logo ? (
            <img src={organization.logo} alt={organization.display_name} className="host-logo-avatar" />
          ) : (
            <div className="host-logo-avatar">
              {(organization.display_name || 'H').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="host-hero-title-row">
              <h1>{organization.display_name}</h1>
              <span className="host-verified-pill">✓ Верифицирован</span>
              <span className="host-type-pill">
                {organization.organization_type === 'Individual' ? 'Физ. лицо' : organization.organization_type}
              </span>
            </div>
            <div className="host-hero-meta">
              {organization.legal_name && <span>👤 {organization.legal_name}</span>}
              {organization.registration_number && <span>• ИИН: {organization.registration_number}</span>}
              {organization.city && <span>• 📍 {organization.city}</span>}
              {organization.phone && <span>• 📞 {organization.phone}</span>}
            </div>
          </div>
        </div>

        <div className="host-hero-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowCreateModal(true)}
          >
            + Создать Ивент
          </button>
          {embedded ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate(routes.host)}
            >
              Открыть полный экран ↗
            </button>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate(routes.profile)}
            >
              ← В Личный кабинет
            </button>
          )}
        </div>
      </section>

      {/* Alerts */}
      {successMessage && (
        <div className="cabinet-success-banner" role="status" style={{ marginBottom: '1.25rem' }}>
          ✓ {successMessage}
          <button type="button" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}
      {apiError && (
        <div className="form-error" role="alert" style={{ marginBottom: '1.25rem' }}>
          ⚠️ {apiError}
          <button type="button" onClick={() => setApiError(null)}>×</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="host-kpi-grid">
        <div className="host-kpi-card">
          <span className="host-kpi-label">Мои Ивенты</span>
          <span className="host-kpi-value">{stats.total_events}</span>
          <span className="host-kpi-sub">Активных в афише: {stats.active_events}</span>
        </div>
        <div className="host-kpi-card">
          <span className="host-kpi-label">Регистрации</span>
          <span className="host-kpi-value">{stats.total_registrations}</span>
          <span className="host-kpi-sub">Подтверждено: {stats.paid_registrations}</span>
        </div>
        <div className="host-kpi-card">
          <span className="host-kpi-label">Участники</span>
          <span className="host-kpi-value">{stats.total_participants}</span>
          <span className="host-kpi-sub">Уникальных танцоров</span>
        </div>
        <div className="host-kpi-card">
          <span className="host-kpi-label">Выручка по билетам</span>
          <span className="host-kpi-value">
            {stats.total_revenue.toLocaleString('ru-RU')} ₸
          </span>
          <span className="host-kpi-sub">Оплаченные заказы</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="host-tabs-bar" role="tablist">
        <button
          type="button"
          className={`host-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          🎭 Мои Ивенты
          <span className="host-tab-count">{events.length}</span>
        </button>
        <button
          type="button"
          className={`host-tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('registrations')}
        >
          🎟️ Регистрации
          <span className="host-tab-count">{data.registrations.length}</span>
        </button>
        <button
          type="button"
          className={`host-tab-btn ${activeTab === 'participants' ? 'active' : ''}`}
          onClick={() => setActiveTab('participants')}
        >
          👥 Участники
          <span className="host-tab-count">{data.participants.length}</span>
        </button>
        <button
          type="button"
          className={`host-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Настройки профиля
        </button>
      </div>

      {/* TAB 1: MY EVENTS */}
      {activeTab === 'events' && (
        <section className="host-section-card">
          <div className="host-section-header">
            <h2>Мои Ивенты ({events.length})</h2>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowCreateModal(true)}
            >
              + Создать Ивент
            </button>
          </div>

          {events.length === 0 ? (
            <div className="empty-state-box">
              <p>У вас пока нет созданных мероприятий.</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowCreateModal(true)}
              >
                Создать первый Ивент
              </button>
            </div>
          ) : (
            <div className="host-events-grid">
              {events.map((ev) => (
                <article key={ev.id} className="host-event-card">
                  <div
                    className="host-event-cover"
                    style={
                      ev.cover
                        ? { backgroundImage: `linear-gradient(to bottom, rgba(11,13,20,0.2), rgba(11,13,20,0.85)), url(${ev.cover})` }
                        : undefined
                    }
                  >
                    <span className="host-event-badge">
                      {ev.event_type === 'Master Class' ? 'Мастер-класс' : 'Турнир'}
                    </span>
                    <span className="host-event-status-badge">
                      {ev.publication_status === 'Published' ? 'Опубликован' : ev.publication_status}
                    </span>
                  </div>

                  <div className="host-event-body">
                    <h3 className="host-event-title">{ev.title}</h3>
                    <div className="host-event-meta">
                      {ev.start_datetime && (
                        <span>📅 {formatDateTime(ev.start_datetime)}</span>
                      )}
                      <span>
                        📍 {ev.venue_title || 'Зал не указан'}
                        {ev.city ? ` (${ev.city})` : ''}
                      </span>
                    </div>

                    <div className="host-event-stats-row">
                      {ev.event_type === 'Master Class' && (
                        <>
                          <span className="host-event-stat-pill">Слотов: {ev.slots_count}</span>
                          <span className="host-event-stat-pill">Пакетов: {ev.packages_count}</span>
                        </>
                      )}
                      <span className="host-event-stat-pill">
                        Регистраций: <strong>{ev.registrations_count}</strong>
                      </span>
                      <span className="host-event-stat-pill">
                        Выручка: <strong>{ev.revenue.toLocaleString('ru-RU')} ₸</strong>
                      </span>
                    </div>

                    <div className="host-event-actions">
                      <Link
                        to={routes.event(ev.id)}
                        className="secondary-button"
                        style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                      >
                        Афиша ↗
                      </Link>
                      <button
                        type="button"
                        className="primary-button"
                        style={{ flex: 1 }}
                        onClick={() => {
                          setSelectedEventFilter(ev.id)
                          setActiveTab('registrations')
                        }}
                      >
                        Регистрации ({ev.registrations_count})
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: REGISTRATIONS */}
      {activeTab === 'registrations' && (
        <section className="host-section-card">
          <div className="host-section-header">
            <h2>Регистрации участников ({filteredRegistrations.length})</h2>
          </div>

          <div className="host-filters-row">
            <select
              className="host-filter-select"
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              aria-label="Фильтр по ивенту"
            >
              <option value="all">Все Ивенты ({data.registrations.length})</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.registrations_count})
                </option>
              ))}
            </select>

            <select
              className="host-filter-select"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Фильтр по статусу"
            >
              <option value="all">Все статусы</option>
              <option value="paid">Оплачено / Подтверждено</option>
              <option value="pending">Ожидает оплаты</option>
              <option value="cancelled">Отменено</option>
            </select>

            <input
              type="search"
              className="host-filter-input"
              placeholder="Поиск по ФИО, телефону или номеру билета DT-2026-..."
              value={regSearch}
              onChange={(e) => setRegSearch(e.target.value)}
            />
          </div>

          {filteredRegistrations.length === 0 ? (
            <div className="empty-state-box">
              <p>По выбранным фильтрам регистраций не найдено.</p>
            </div>
          ) : (
            <div className="host-table-wrap">
              <table className="host-table">
                <thead>
                  <tr>
                    <th>Участник</th>
                    <th>Ивент / Выбор</th>
                    <th>Дата записи</th>
                    <th>Статус</th>
                    <th>Сумма</th>
                    <th>QR-билет / Вход</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{r.participant_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {r.participant_phone || r.participant_email}
                          {r.participant_city ? ` • ${r.participant_city}` : ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{r.event_title}</div>
                        <div style={{ fontSize: '0.82rem', color: '#4f46e5' }}>{r.item_label}</div>
                      </td>
                      <td>{formatDateTime(r.registered_at)}</td>
                      <td>{renderStatusBadge(r.status)}</td>
                      <td style={{ fontWeight: 600 }}>
                        {r.amount.toLocaleString('ru-RU')} {r.currency}
                      </td>
                      <td>
                        {r.ticket_number && r.ticket_id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <Link to={routes.ticket(r.ticket_id)} className="ticket-code-link">
                              🎟️ {r.ticket_number}
                            </Link>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: r.is_checked_in ? '#34d399' : 'rgba(226,232,240,0.55)',
                              }}
                            >
                              {r.is_checked_in ? '✓ Прошёл на входе' : 'Ожидает прохода'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'rgba(226,232,240,0.45)', fontSize: '0.82rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: PARTICIPANTS */}
      {activeTab === 'participants' && (
        <section className="host-section-card">
          <div className="host-section-header">
            <h2>Участники моих мероприятий ({filteredParticipants.length})</h2>
          </div>

          <div className="host-filters-row">
            <input
              type="search"
              className="host-filter-input"
              placeholder="Поиск участника по имени, телефону, email или городу..."
              value={partSearch}
              onChange={(e) => setPartSearch(e.target.value)}
            />
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="empty-state-box">
              <p>Участники не найдены.</p>
            </div>
          ) : (
            <div className="host-participants-grid">
              {filteredParticipants.map((p) => (
                <div key={p.id} className="host-participant-card">
                  <div className="host-participant-top">
                    {p.photo ? (
                      <img src={p.photo} alt={p.full_name} className="host-participant-avatar" />
                    ) : (
                      <div className="host-participant-avatar">
                        {(p.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="host-participant-name">{p.full_name}</h3>
                      <div className="host-participant-contacts">
                        {p.city && <span>📍 {p.city}</span>}
                        {p.phone && <span>📞 {p.phone}</span>}
                        {p.email && <span>✉️ {p.email}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="host-event-stats-row">
                    <span className="host-event-stat-pill">
                      Записей: <strong>{p.registrations_count}</strong>
                    </span>
                    <span className="host-event-stat-pill">
                      Оплачено: <strong>{p.total_spent.toLocaleString('ru-RU')} ₸</strong>
                    </span>
                  </div>

                  <div className="host-participant-events">
                    {p.events.map((evName) => (
                      <span key={evName} className="host-participant-event-chip">
                        🎭 {evName}
                      </span>
                    ))}
                  </div>

                  {p.tickets.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {p.tickets.map((tk) => (
                        <Link
                          key={tk.ticket_id}
                          to={routes.ticket(tk.ticket_id)}
                          className="ticket-code-link"
                        >
                          🎟️ {tk.ticket_number} {tk.is_checked_in ? '✓' : ''}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === 'settings' && (
        <section className="host-section-card">
          <div className="host-section-header">
            <h2>Основные настройки профиля Организатора</h2>
            <span className="host-verified-pill">✓ Статус: {organization.verification_status}</span>
          </div>

          <form onSubmit={(e) => void handleSaveSettings(e)} className="cabinet-form">
            <div className="form-row">
              <label htmlFor="hostDisplayName">
                Публичное название организатора / Бренд *
                <input
                  id="hostDisplayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </label>

              <label htmlFor="hostLegalName">
                ФИО по удостоверению личности *
                <input
                  id="hostLegalName"
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label htmlFor="hostIinReadonly">
                ИИН физического лица (подтверждён модератором)
                <input
                  id="hostIinReadonly"
                  type="text"
                  value={organization.registration_number || '—'}
                  disabled
                  readOnly
                />
              </label>

              <CitySelectInput
                cityLabel="Город *"
                city={city}
                onCityChange={setCity}
                countryCode="KZ"
              />
            </div>

            <div className="form-row">
              <div className="phone-field-wrapper">
                <span className="field-label">Контактный телефон *</span>
                <CountryPhoneInput
                  id="hostProfilePhone"
                  value={phone}
                  onChange={setPhone}
                  defaultCountry="KZ"
                />
              </div>

              <label htmlFor="hostProfileEmail">
                Контактный Email *
                <input
                  id="hostProfileEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            </div>

            <label htmlFor="hostProfileAddress">
              Юридический / фактический адрес
              <input
                id="hostProfileAddress"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Например: г. Астана, пр. Мангилик Ел, 55/2"
              />
            </label>

            <div className="photo-upload-block">
              <span className="field-label">Логотип или аватар Организатора</span>
              <div className="photo-upload-controls">
                {logo && (
                  <img
                    src={logo}
                    alt="Логотип"
                    style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleLogoFileChange(e)}
                  disabled={uploadingLogo}
                />
                {uploadingLogo && <span className="muted-hint">Загрузка…</span>}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={savingSettings}>
                {savingSettings ? 'Сохранение…' : 'Сохранить настройки профиля'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* MODAL: CREATE EVENT */}
      {showCreateModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-wide">
            <div className="modal-header">
              <h3>Создать новый Ивент</h3>
              <button type="button" className="close-btn" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={(e) => void handleCreateEvent(e)} className="cabinet-form">
              <div className="form-row">
                <label htmlFor="createEventType">
                  Тип мероприятия *
                  <select
                    id="createEventType"
                    value={evType}
                    onChange={(e) => setEvType(e.target.value as 'Master Class' | 'Tournament')}
                  >
                    <option value="Master Class">Мастер-класс (со слотами и пакетами)</option>
                    <option value="Tournament">Турнир / Чемпионат</option>
                  </select>
                </label>

                <label htmlFor="createEventTitle">
                  Название Ивента *
                  <input
                    id="createEventTitle"
                    type="text"
                    value={evTitle}
                    onChange={(e) => setEvTitle(e.target.value)}
                    placeholder="Например: Astana Dance Weekend 2026"
                    required
                  />
                </label>
              </div>

              <DebouncedSearchSelect
                id="createEventVenue"
                label="Зал проведения (Venue)"
                placeholder="Начните вводить название зала или город..."
                value={evVenue}
                selectedTitle={evVenueTitle}
                onChange={(val: string, title: string) => {
                  setEvVenue(val)
                  setEvVenueTitle(title)
                }}
                fetchOptions={handleFetchVenues}
              />

              <label htmlFor="createEventDesc">
                Описание мероприятия
                <textarea
                  id="createEventDesc"
                  rows={3}
                  value={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                  placeholder="Программа, педагоги, условия участия..."
                />
              </label>

              <div className="photo-upload-block">
                <span className="field-label">Обложка Ивента</span>
                <div className="photo-upload-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleCoverFileChange(e)}
                    disabled={uploadingCover}
                  />
                  <input
                    type="url"
                    placeholder="Или вставьте прямую ссылку на изображение..."
                    value={evCover}
                    onChange={(e) => setEvCover(e.target.value)}
                  />
                </div>
              </div>

              {evType === 'Master Class' ? (
                <>
                  <div className="mc-builder-section">
                    <div className="section-header-row">
                      <h4>Слоты мастер-класса</h4>
                      <button
                        type="button"
                        className="secondary-button btn-sm"
                        onClick={() =>
                          setMcSlots((prev) => [
                            ...prev,
                            {
                              client_key: `slot_${prev.length + 1}`,
                              start_datetime: '',
                              end_datetime: '',
                              has_capacity_limit: true,
                              capacity: 25,
                              price: 6000,
                            },
                          ])
                        }
                      >
                        + Добавить слот
                      </button>
                    </div>

                    {mcSlots.map((slot, idx) => (
                      <div key={slot.client_key} className="mc-slot-row-card">
                        <div className="mc-slot-row-header">
                          <strong>Слот #{idx + 1}</strong>
                          {mcSlots.length > 1 && (
                            <button
                              type="button"
                              className="ghost-button btn-sm"
                              onClick={() =>
                                setMcSlots((prev) => prev.filter((_, i) => i !== idx))
                              }
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                        <div className="form-row">
                          <label>
                            Начало *
                            <input
                              type="datetime-local"
                              value={slot.start_datetime}
                              onChange={(e) => {
                                const val = e.target.value
                                setMcSlots((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, start_datetime: val } : item
                                  )
                                )
                              }}
                              required
                            />
                          </label>
                          <label>
                            Окончание *
                            <input
                              type="datetime-local"
                              value={slot.end_datetime}
                              onChange={(e) => {
                                const val = e.target.value
                                setMcSlots((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, end_datetime: val } : item
                                  )
                                )
                              }}
                              required
                            />
                          </label>
                        </div>
                        <div className="form-row">
                          <label>
                            Лимит мест
                            <input
                              type="number"
                              min="1"
                              value={slot.capacity}
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                setMcSlots((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, capacity: val } : item
                                  )
                                )
                              }}
                            />
                          </label>
                          <label>
                            Цена слота (₸) *
                            <input
                              type="number"
                              min="0"
                              step="500"
                              value={slot.price}
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                setMcSlots((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, price: val } : item
                                  )
                                )
                              }}
                              required
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mc-builder-section">
                    <div className="section-header-row">
                      <h4>Пакеты (Full Pass / Комбо)</h4>
                      <button
                        type="button"
                        className="secondary-button btn-sm"
                        onClick={() =>
                          setMcPackages((prev) => [
                            ...prev,
                            {
                              title: 'Full Pass',
                              description: 'Полный доступ ко всем слотам',
                              price: 10000,
                              slot_keys: mcSlots.map((s) => s.client_key),
                            },
                          ])
                        }
                      >
                        + Добавить пакет
                      </button>
                    </div>

                    {mcPackages.map((pkg, pIdx) => (
                      <div key={pIdx} className="mc-slot-row-card">
                        <div className="mc-slot-row-header">
                          <strong>Пакет #{pIdx + 1}</strong>
                          <button
                            type="button"
                            className="ghost-button btn-sm"
                            onClick={() =>
                              setMcPackages((prev) => prev.filter((_, i) => i !== pIdx))
                            }
                          >
                            Удалить
                          </button>
                        </div>
                        <div className="form-row">
                          <label>
                            Название пакета *
                            <input
                              type="text"
                              value={pkg.title}
                              onChange={(e) => {
                                const val = e.target.value
                                setMcPackages((prev) =>
                                  prev.map((item, i) =>
                                    i === pIdx ? { ...item, title: val } : item
                                  )
                                )
                              }}
                              required
                            />
                          </label>
                          <label>
                            Цена пакета (₸) *
                            <input
                              type="number"
                              min="0"
                              step="500"
                              value={pkg.price}
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                setMcPackages((prev) =>
                                  prev.map((item, i) =>
                                    i === pIdx ? { ...item, price: val } : item
                                  )
                                )
                              }}
                              required
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="form-row">
                    <label>
                      Начало турнира *
                      <input
                        type="datetime-local"
                        value={tournStart}
                        onChange={(e) => setTournStart(e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Окончание турнира *
                      <input
                        type="datetime-local"
                        value={tournEnd}
                        onChange={(e) => setTournEnd(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <label>
                    Правила регистрации
                    <textarea
                      rows={2}
                      value={tournRules}
                      onChange={(e) => setTournRules(e.target.value)}
                    />
                  </label>
                  <div className="form-row">
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={allowSolo}
                        onChange={(e) => setAllowSolo(e.target.checked)}
                      />
                      <span>Соло</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={allowCouple}
                        onChange={(e) => setAllowCouple(e.target.checked)}
                      />
                      <span>Пары / Дуэты</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={allowTeam}
                        onChange={(e) => setAllowTeam(e.target.checked)}
                      />
                      <span>Команды</span>
                    </label>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="primary-button" disabled={savingEvent}>
                  {savingEvent ? 'Публикация…' : 'Опубликовать Ивент'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export function HostDashboardPage() {
  const navigate = useNavigate()
  const person = useAuthStore((s) => s.person)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    await logout()
    navigate(routes.login)
  }

  return (
    <div className="host-page">
      <DashboardHeader
        firstName={person?.first_name || 'Организатор'}
        onLogout={() => void handleLogout()}
      />
      <HostDashboardView />
    </div>
  )
}
