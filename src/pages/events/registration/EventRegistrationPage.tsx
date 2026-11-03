import { useMemo, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEventDetails, getMasterClassSlots, getTournamentCategories, formatAgeRange } from '../../../services/eventDetails'
import {
  initiateMasterClassBooking,
  getTournamentRegistrationContext,
  searchPartnerAthletes,
  initiateTournamentBooking,
  type InitiateBookingResult,
  type ConfirmPaymentResult,
  type PartnerAthleteItem,
  type TournamentPartnerInput,
  type BookingConflictItem,
} from '../../../api/booking'
import type { TournamentCategory } from '../../../types/eventDetails'
import { BookingHoldModal } from '../../../components/BookingHoldModal'
import { TimeConflictWarningModal } from '../../../components/TimeConflictWarningModal'
import { DashboardHeader } from '../../dashboard/components/DashboardHeader'
import { useAuth } from '../../../hooks/useAuth'
import { getDashboardProfile } from '../../../services/dashboard'
import './EventRegistrationPage.css'

const DANCE_CLASSES = [
  { value: 'N', label: 'Н (N) — Начинающие' },
  { value: 'E', label: 'E класс' },
  { value: 'D', label: 'D класс' },
  { value: 'C', label: 'C класс' },
  { value: 'B', label: 'B класс' },
  { value: 'A', label: 'A класс' },
  { value: 'S', label: 'S класс' },
  { value: 'M', label: 'M — Мастера' },
] as const

const CLASS_ORDER = ['N', 'E', 'D', 'C', 'B', 'A', 'S', 'M']

const CYRILLIC_TO_LATIN_CLASS: Record<string, string> = {
  Н: 'N',
  Е: 'E',
  С: 'C',
  В: 'B',
  А: 'A',
  М: 'M',
}

function normalizeDanceClass(raw?: string | null): string {
  if (!raw) return ''
  const trimmed = raw.trim().toUpperCase()
  if (!trimmed) return ''
  const first = trimmed[0]
  const mapped = CYRILLIC_TO_LATIN_CLASS[first] || first
  return CLASS_ORDER.includes(mapped) ? mapped : ''
}

function getMaxDanceClass(classes: string[]): string {
  let bestIdx = -1
  for (const c of classes) {
    const norm = normalizeDanceClass(c)
    const idx = CLASS_ORDER.indexOf(norm)
    if (idx > bestIdx) bestIdx = idx
  }
  return bestIdx >= 0 ? CLASS_ORDER[bestIdx] : ''
}

function isClassAllowedForCategory(effectiveClass: string, categoryClassRaw?: string): boolean {
  if (!categoryClassRaw) return true
  const upper = categoryClassRaw.trim().toUpperCase()
  if (!upper || upper.includes('OPEN') || upper.includes('ОТКР') || upper.includes('ALL')) {
    return true
  }
  const tokens = upper.split(/[,/;|\s]+/)
  const allowed = new Set<string>()
  for (const tok of tokens) {
    const norm = normalizeDanceClass(tok)
    if (norm) allowed.add(norm)
  }
  if (allowed.size === 0) return true
  if (!effectiveClass) return false
  return allowed.has(normalizeDanceClass(effectiveClass))
}

function calculateAgeOnDate(dobStr?: string, refDateStr?: string | null): number | null {
  if (!dobStr) return null
  const dob = new Date(dobStr)
  if (isNaN(dob.getTime())) return null
  const ref = refDateStr ? new Date(refDateStr) : new Date()
  const validRef = isNaN(ref.getTime()) ? new Date() : ref
  let age = validRef.getFullYear() - dob.getFullYear()
  const mDiff = validRef.getMonth() - dob.getMonth()
  if (mDiff < 0 || (mDiff === 0 && validRef.getDate() < dob.getDate())) {
    age -= 1
  }
  return Math.max(0, age)
}

type PartnerDraft = {
  key: string
  mode: 'existing' | 'manual'
  searchQuery: string
  personId: string
  selectedAthlete?: PartnerAthleteItem | null
  firstName: string
  lastName: string
  dateOfBirth: string
  danceClass: string
}

function createEmptyPartnerDraft(index: number): PartnerDraft {
  return {
    key: `partner_${Date.now()}_${index}`,
    mode: 'existing',
    searchQuery: '',
    personId: '',
    selectedAthlete: null,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    danceClass: 'D',
  }
}

export function EventRegistrationPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const preselectedSlotId = searchParams.get('slot') || ''
  const preselectedPackageId = searchParams.get('package') || ''
  const preselectedCategoryId = searchParams.get('category') || ''

  // Master class state
  const [userSelectedType, setUserSelectedType] = useState<'slot' | 'package' | null>(null)
  const [userSelectedSlot, setUserSelectedSlot] = useState<string>('')
  const [userSelectedPackage, setUserSelectedPackage] = useState<string>('')

  const selectedType = userSelectedType ?? (preselectedPackageId ? 'package' : 'slot')
  const selectedSlot = userSelectedSlot || preselectedSlotId
  const selectedPackage = userSelectedPackage || preselectedPackageId

  // Shared booking hold modal state
  const [holdSession, setHoldSession] = useState<InitiateBookingResult | null>(null)
  const [holdTitle, setHoldTitle] = useState('')
  const [holdSubtitle, setHoldSubtitle] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [conflictWarning, setConflictWarning] = useState<{
    conflicts: BookingConflictItem[]
    message?: string
    onConfirm: () => void
  } | null>(null)

  // Tournament wizard state
  const [userParticipationType, setParticipationType] = useState<'solo' | 'couple' | 'team' | null>(null)
  const [teamName, setTeamName] = useState('')
  const [userAthleteDob, setAthleteDob] = useState<string | null>(null)
  const [userAthleteClass, setAthleteClass] = useState<string | null>(null)
  const [userEditingAthleteInfo, setEditingAthleteInfo] = useState<boolean | null>(null)
  const [userSelectedClubId, setSelectedClubId] = useState<string | null>(null)
  const [userSelectedTrainerId, setSelectedTrainerId] = useState<string | null>(null)
  const [editingRepresentation, setEditingRepresentation] = useState(false)

  const [partners, setPartners] = useState<PartnerDraft[]>(() => [createEmptyPartnerDraft(1)])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    preselectedCategoryId ? [preselectedCategoryId] : []
  )
  const [categoryFilterTab, setCategoryFilterTab] = useState<'eligible' | 'all'>('eligible')

  const profileQuery = useQuery({
    queryKey: ['dashboard', 'profile', user],
    queryFn: () => getDashboardProfile(user ?? ''),
    enabled: Boolean(user),
  })

  const eventQuery = useQuery({
    queryKey: ['event-details', eventId],
    queryFn: () => getEventDetails(eventId),
    enabled: Boolean(eventId),
  })

  const event = eventQuery.data
  const isTournament = event?.type === 'tournament'

  const slotsQuery = useQuery({
    queryKey: ['master-class-slots', eventId],
    queryFn: () => getMasterClassSlots(eventId),
    enabled: Boolean(eventId && event?.type === 'master_class'),
  })

  const tournContextQuery = useQuery({
    queryKey: ['tournament-reg-context', eventId],
    queryFn: () => getTournamentRegistrationContext(eventId),
    enabled: Boolean(eventId && isTournament),
  })

  const tournCategoriesQuery = useQuery({
    queryKey: ['tournament-categories', eventId],
    queryFn: () => getTournamentCategories(eventId),
    enabled: Boolean(eventId && isTournament),
  })

  const partnerAthletesQuery = useQuery({
    queryKey: ['partner-athletes-directory', eventId],
    queryFn: () => searchPartnerAthletes('', eventId),
    enabled: Boolean(eventId && isTournament),
  })

  const slots = slotsQuery.data || []
  const packages = event?.packages || []
  const tournCategories = useMemo(
    () => tournCategoriesQuery.data || [],
    [tournCategoriesQuery.data]
  )
  const tournContext = tournContextQuery.data
  const availablePartners = partnerAthletesQuery.data || []

  const defaultParticipationType = useMemo<'solo' | 'couple' | 'team'>(() => {
    if (!preselectedCategoryId || !tournCategories.length) return 'solo'
    const targetCat = tournCategories.find((c) => c.id === preselectedCategoryId)
    if (!targetCat) return 'solo'
    if (targetCat.participationType === 'couple') return 'couple'
    if (targetCat.participationType === 'team' || targetCat.participationType === 'formation') {
      return 'team'
    }
    return 'solo'
  }, [preselectedCategoryId, tournCategories])

  const participationType = userParticipationType ?? defaultParticipationType
  const athleteDob = userAthleteDob ?? (tournContext?.athlete.date_of_birth || '2008-05-15')
  const athleteClass = userAthleteClass ?? (tournContext?.athlete.dance_class || 'D')
  const selectedClubId =
    userSelectedClubId ?? (tournContext?.athlete.club_id || (tournContext?.clubs[0]?.id ?? ''))
  const selectedTrainerId =
    userSelectedTrainerId ??
    (tournContext?.athlete.trainer_id || (tournContext?.trainers[0]?.id ?? ''))
  const editingAthleteInfo =
    userEditingAthleteInfo ??
    Boolean(tournContext && (!tournContext.athlete.date_of_birth || !tournContext.athlete.dance_class))

  // Compute effective age & effective class for Step 1 -> Step 2 filtering
  const eventStartDateStr = tournContext?.tournament.event_start_date || event?.startAt || null
  const primaryAge = useMemo(
    () => calculateAgeOnDate(athleteDob, eventStartDateStr),
    [athleteDob, eventStartDateStr]
  )

  const { effectiveAge, effectiveClass } = useMemo(() => {
    const ages: number[] = []
    const classes: string[] = []
    if (primaryAge !== null) ages.push(primaryAge)
    if (athleteClass) classes.push(athleteClass)

    if (participationType === 'couple' || participationType === 'team') {
      const activePartners = participationType === 'couple' ? partners.slice(0, 1) : partners
      for (const p of activePartners) {
        const dob =
          p.mode === 'existing'
            ? p.selectedAthlete?.date_of_birth || p.dateOfBirth
            : p.dateOfBirth
        const pAge = calculateAgeOnDate(dob, eventStartDateStr)
        if (pAge !== null) ages.push(pAge)

        const cls =
          p.mode === 'existing'
            ? p.selectedAthlete?.dance_class || p.danceClass
            : p.danceClass
        if (cls) classes.push(cls)
      }
    }

    return {
      effectiveAge: ages.length > 0 ? Math.max(...ages) : null,
      effectiveClass: getMaxDanceClass(classes) || athleteClass || 'D',
    }
  }, [primaryAge, athleteClass, participationType, partners, eventStartDateStr])

  // Evaluate eligibility of each Tournament Category
  const evaluatedCategories = useMemo(() => {
    const alreadyIds = new Set(tournContext?.already_registered_category_ids || [])
    return tournCategories.map((cat: TournamentCategory) => {
      const reasons: string[] = []
      const alreadyRegistered = alreadyIds.has(cat.id)
      if (alreadyRegistered) {
        reasons.push('Вы уже зарегистрированы')
      }

      // 1. Format check
      if (participationType === 'solo' && cat.participationType !== 'solo') {
        reasons.push(cat.participationType === 'couple' ? 'Только для пар' : 'Только для команд / синхрона')
      } else if (participationType === 'couple' && cat.participationType !== 'couple') {
        reasons.push(cat.participationType === 'solo' ? 'Только для Соло' : 'Только для команд / синхрона')
      } else if (
        participationType === 'team' &&
        cat.participationType !== 'team' &&
        cat.participationType !== 'formation'
      ) {
        reasons.push(cat.participationType === 'solo' ? 'Только для Соло' : 'Только для пар')
      }

      // 2. Age check
      if (effectiveAge !== null) {
        if (cat.ageFrom !== undefined && cat.ageFrom > 0 && effectiveAge < cat.ageFrom) {
          reasons.push(`Возраст от ${cat.ageFrom} лет (у вас: ${effectiveAge})`)
        }
        if (cat.ageTo !== undefined && cat.ageTo > 0 && effectiveAge > cat.ageTo) {
          reasons.push(`Возраст до ${cat.ageTo} лет (у вас: ${effectiveAge})`)
        }
      }

      // 3. Class check
      if (cat.className && !isClassAllowedForCategory(effectiveClass, cat.className)) {
        reasons.push(`Допустимые классы: ${cat.className} (у вас: ${effectiveClass})`)
      }

      // 4. Capacity check
      if (cat.availabilityStatus === 'full') {
        reasons.push('Мест нет')
      }

      return {
        category: cat,
        eligible: reasons.length === 0,
        reasons,
        alreadyRegistered,
      }
    })
  }, [tournCategories, participationType, effectiveAge, effectiveClass, tournContext])

  const eligibleCategories = useMemo(
    () => evaluatedCategories.filter((item) => item.eligible),
    [evaluatedCategories]
  )

  const displayedCategories =
    categoryFilterTab === 'eligible' ? eligibleCategories : evaluatedCategories

  // Keep selectedCategoryIds restricted to currently eligible categories
  const validSelectedCategories = useMemo(() => {
    const eligibleSet = new Set(eligibleCategories.map((e) => e.category.id))
    return eligibleCategories
      .filter((e) => selectedCategoryIds.includes(e.category.id) && eligibleSet.has(e.category.id))
      .map((e) => e.category)
  }, [eligibleCategories, selectedCategoryIds])

  const totalTournamentPrice = useMemo(
    () => validSelectedCategories.reduce((acc, cat) => acc + (cat.price ?? 0), 0),
    [validSelectedCategories]
  )

  function toggleCategorySelection(catId: string, isEligible: boolean) {
    if (!isEligible) return
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
  }

  function updatePartnerDraft(index: number, patch: Partial<PartnerDraft>) {
    setPartners((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    )
  }

  function addTeamMemberDraft() {
    setPartners((prev) => [...prev, createEmptyPartnerDraft(prev.length + 1)])
  }

  function removeTeamMemberDraft(index: number) {
    setPartners((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev))
  }

  async function handleStartMasterClassBooking(ignoreConflict = false) {
    if (!event || event.type !== 'master_class') return
    setBookingLoading(true)
    setBookingError(null)

    try {
      const isPkg = selectedType === 'package' && selectedPackage
      const slotId = !isPkg && selectedSlot ? selectedSlot : undefined
      const packageId = isPkg ? selectedPackage : undefined

      if (!slotId && !packageId) {
        setBookingError('Пожалуйста, выберите слот или пакет мастер-класса.')
        setBookingLoading(false)
        return
      }

      let title = event.title
      let subtitle = ''
      if (packageId) {
        const pkg = packages.find((p) => p.id === packageId)
        if (pkg?.alreadyBooked) {
          setBookingError('Вы уже записаны на этот пакет мастер-класса.')
          setBookingLoading(false)
          return
        }
        title = `${event.title} — ${pkg?.title || 'Пакет'}`
        subtitle = pkg?.description || 'Пакет мастер-класса'
      } else if (slotId) {
        const slot = slots.find((s) => s.id === slotId)
        if (slot?.alreadyBooked) {
          setBookingError('Вы уже записаны на этот слот мастер-класса.')
          setBookingLoading(false)
          return
        }
        title = `${event.title} — Слот`
        subtitle = slot
          ? `${new Date(slot.startAt).toLocaleString('ru-RU')} - ${new Date(slot.endAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
          : ''
      }

      const res = await initiateMasterClassBooking({
        masterClassId: event.id,
        slotId,
        packageId,
        ignoreTimeConflict: ignoreConflict,
      })

      if (res.warning_required && res.conflicts?.length) {
        setConflictWarning({
          conflicts: res.conflicts,
          message: res.message,
          onConfirm: () => {
            setConflictWarning(null)
            void handleStartMasterClassBooking(true)
          },
        })
        return
      }

      setHoldTitle(title)
      setHoldSubtitle(subtitle)
      setHoldSession(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось начать бронирование'
      setBookingError(msg)
    } finally {
      setBookingLoading(false)
    }
  }

  async function handleStartTournamentBooking(ignoreConflict = false) {
    if (!event || !isTournament) return
    setBookingError(null)

    if (!athleteDob) {
      setBookingError('Укажите вашу дату рождения в Шаге 1.')
      setEditingAthleteInfo(true)
      return
    }

    if (validSelectedCategories.length === 0) {
      setBookingError('Отметьте галочкой хотя бы одну подходящую категорию в Шаге 2.')
      return
    }

    const partnersPayload: TournamentPartnerInput[] = []
    if (participationType === 'couple' || participationType === 'team') {
      const activePartners = participationType === 'couple' ? partners.slice(0, 1) : partners
      for (let i = 0; i < activePartners.length; i++) {
        const p = activePartners[i]
        if (p.mode === 'existing') {
          if (!p.personId) {
            setBookingError(
              participationType === 'couple'
                ? 'Выберите партнера из списка или переключитесь на ручной ввод.'
                : `Выберите участника команды #${i + 2} или укажите его данные вручную.`
            )
            return
          }
          partnersPayload.push({
            mode: 'existing',
            person_id: p.personId,
            date_of_birth: p.selectedAthlete?.date_of_birth || p.dateOfBirth || undefined,
            dance_class: p.selectedAthlete?.dance_class || p.danceClass || 'D',
          })
        } else {
          if (!p.firstName.trim() || !p.lastName.trim() || !p.dateOfBirth) {
            setBookingError(
              `Заполните Имя, Фамилию и Дату рождения для участника #${i + 2}.`
            )
            return
          }
          partnersPayload.push({
            mode: 'manual',
            first_name: p.firstName.trim(),
            last_name: p.lastName.trim(),
            date_of_birth: p.dateOfBirth,
            dance_class: p.danceClass || 'D',
          })
        }
      }
    }

    setBookingLoading(true)
    try {
      const res = await initiateTournamentBooking({
        event_id: event.id,
        participation_type: participationType,
        team_name: participationType === 'team' ? teamName.trim() || undefined : undefined,
        category_ids: validSelectedCategories.map((c) => c.id),
        athlete_data: {
          date_of_birth: athleteDob,
          dance_class: athleteClass,
          club_id: selectedClubId || undefined,
          trainer_id: selectedTrainerId || undefined,
        },
        partners: partnersPayload.length > 0 ? partnersPayload : undefined,
        ignore_time_conflict: ignoreConflict,
      })

      if (res.warning_required && res.conflicts?.length) {
        setConflictWarning({
          conflicts: res.conflicts,
          message: res.message,
          onConfirm: () => {
            setConflictWarning(null)
            void handleStartTournamentBooking(true)
          },
        })
        return
      }

      const formatLabel =
        participationType === 'solo'
          ? 'Соло'
          : participationType === 'couple'
            ? 'Пара / Дуэт'
            : 'Команда / Синхрон'
      const catNames = validSelectedCategories.map((c) => c.category.name).join(', ')

      setHoldTitle(`${event.title} (${formatLabel})`)
      setHoldSubtitle(`Категории (${validSelectedCategories.length}): ${catNames}`)
      setHoldSession(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось создать заявку на турнир'
      setBookingError(msg)
    } finally {
      setBookingLoading(false)
    }
  }

  function handleBookingSuccess(result?: ConfirmPaymentResult) {
    setHoldSession(null)
    if (result?.ticket_id) {
      navigate(`/tickets/${encodeURIComponent(result.ticket_id)}`)
    } else {
      navigate('/tickets')
    }
  }

  const firstName = profileQuery.data?.firstName ?? user?.split('@')[0] ?? 'Танцор'

  if (eventQuery.isPending || (isTournament && tournContextQuery.isPending)) {
    return (
      <div className="dashboard-page registration-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="registration-main">
          <div className="registration-card loading-card">Загрузка параметров регистрации…</div>
        </main>
      </div>
    )
  }

  if (eventQuery.isError || !event) {
    return (
      <div className="dashboard-page registration-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="registration-main">
          <div className="registration-card error-card">
            <h2>Мероприятие не найдено</h2>
            <p>Не удалось загрузить параметры записи для данного мероприятия.</p>
            <Link to="/events" className="button primary">
              В каталог мероприятий
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (isTournament) {
    const selectedClubTitle =
      tournContext?.clubs.find((c) => c.id === selectedClubId)?.title ||
      tournContext?.athlete.club_title ||
      'Индивидуально (без клуба)'
    const selectedTrainerName =
      tournContext?.trainers.find((t) => t.id === selectedTrainerId)?.name ||
      tournContext?.athlete.trainer_name ||
      'Не указан'

    const activePartners = participationType === 'couple' ? partners.slice(0, 1) : partners

    return (
      <div className="dashboard-page registration-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="registration-main tournament-wizard-main">
          <div className="registration-breadcrumbs">
            <Link to={`/events/${encodeURIComponent(event.id)}`}>← Назад к описанию турнира</Link>
          </div>

          <div className="registration-card tournament-registration-card">
            <div className="registration-header">
              <div className="wizard-badges-row">
                <span className="badge-type">🏆 Турнир</span>
                {tournContext?.athlete.federation_title && (
                  <span className="badge-federation">
                    ✓ Член федерации: {tournContext.athlete.federation_title}
                  </span>
                )}
              </div>
              <h1>Регистрация на {event.title}</h1>
              <p className="event-meta">
                📍 {event.venue?.name || event.venue?.city || 'Место уточняется'} · 📅{' '}
                {new Date(event.startAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* STEPPER PROGRESS */}
            <div className="wizard-steps-indicator" aria-label="Этапы регистрации">
              <div className="wizard-step-pill active">
                <span className="step-num">1</span>
                <span>Состав и Клуб</span>
              </div>
              <div className="wizard-step-line" />
              <div className={`wizard-step-pill ${validSelectedCategories.length > 0 ? 'active' : ''}`}>
                <span className="step-num">2</span>
                <span>Выбор категорий ({validSelectedCategories.length})</span>
              </div>
              <div className="wizard-step-line" />
              <div className={`wizard-step-pill ${holdSession ? 'active' : ''}`}>
                <span className="step-num">3</span>
                <span>Резерв 15 мин и QR-билет</span>
              </div>
            </div>

            {bookingError && (
              <div className="form-error-banner" role="alert">
                {bookingError}
              </div>
            )}

            {/* ==================== ШАГ 1: УЧАСТНИКИ И КЛУБ ==================== */}
            <section className="wizard-section">
              <div className="wizard-section-header">
                <div>
                  <span className="step-kicker">Шаг 1 из 3</span>
                  <h2>Формат участия, состав и клуб</h2>
                </div>
              </div>

              {/* Participation format selector */}
              <div className="registration-type-selector">
                {(!tournContext || tournContext.tournament.allow_solo) && (
                  <button
                    type="button"
                    className={`type-tab ${participationType === 'solo' ? 'active' : ''}`}
                    onClick={() => setParticipationType('solo')}
                  >
                    👤 Соло (1 участник)
                  </button>
                )}
                {(!tournContext || tournContext.tournament.allow_couple) && (
                  <button
                    type="button"
                    className={`type-tab ${participationType === 'couple' ? 'active' : ''}`}
                    onClick={() => setParticipationType('couple')}
                  >
                    👫 Пара / Дуэт (2 участника)
                  </button>
                )}
                {(!tournContext || tournContext.tournament.allow_team) && (
                  <button
                    type="button"
                    className={`type-tab ${participationType === 'team' ? 'active' : ''}`}
                    onClick={() => setParticipationType('team')}
                  >
                    👥 Команда / Синхрон
                  </button>
                )}
              </div>

              {/* Athlete 1 Auto-Profile Card */}
              <div className="athlete-profile-summary-card">
                <div className="athlete-card-top">
                  <div className="athlete-avatar-badge">1</div>
                  <div className="athlete-card-main">
                    <div className="athlete-card-title-row">
                      <strong>
                        {tournContext?.athlete.full_name || firstName}
                      </strong>
                      <span className="athlete-role-pill">Основной участник (Вы)</span>
                    </div>
                    <div className="athlete-card-meta">
                      <span>
                        🎂 Возраст на турнире:{' '}
                        <b>{primaryAge !== null ? `${primaryAge} лет` : 'Не указан'}</b>
                      </span>
                      <span>·</span>
                      <span>
                        🏅 Класс: <b>{athleteClass}</b>
                      </span>
                      {tournContext?.athlete.city && (
                        <>
                          <span>·</span>
                          <span>📍 {tournContext.athlete.city}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-link-btn"
                    onClick={() => setEditingAthleteInfo(!editingAthleteInfo)}
                  >
                    {editingAthleteInfo ? 'Свернуть' : 'Изменить ДР / класс'}
                  </button>
                </div>

                {editingAthleteInfo && (
                  <div className="athlete-inline-form">
                    <label className="wizard-field">
                      <span>Дата рождения *</span>
                      <input
                        type="date"
                        value={athleteDob}
                        onChange={(e) => setAthleteDob(e.target.value)}
                        required
                      />
                    </label>
                    <label className="wizard-field">
                      <span>Спортивный класс *</span>
                      <select
                        value={athleteClass}
                        onChange={(e) => setAthleteClass(e.target.value)}
                      >
                        {DANCE_CLASSES.map((cls) => (
                          <option key={cls.value} value={cls.value}>
                            {cls.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>

              {/* Partner(s) / Team Members Block */}
              {(participationType === 'couple' || participationType === 'team') && (
                <div className="partners-container">
                  {participationType === 'team' && (
                    <div className="team-name-box">
                      <label className="wizard-field">
                        <span>Название команды / синхрон-группы (необязательно)</span>
                        <input
                          type="text"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="Например: Nomad Synchro Stars"
                        />
                      </label>
                    </div>
                  )}

                  {activePartners.map((pDraft, idx) => {
                    const filteredAthletes = availablePartners.filter((item) => {
                      if (!pDraft.searchQuery.trim()) return true
                      const q = pDraft.searchQuery.trim().toLowerCase()
                      return (
                        item.full_name.toLowerCase().includes(q) ||
                        item.city.toLowerCase().includes(q)
                      )
                    })

                    return (
                      <div key={pDraft.key} className="partner-card">
                        <div className="partner-card-header">
                          <div className="partner-header-title">
                            <span className="athlete-avatar-badge secondary">{idx + 2}</span>
                            <strong>
                              {participationType === 'couple'
                                ? 'Партнер / Партнерша по паре'
                                : `Участник команды #${idx + 2}`}
                            </strong>
                          </div>
                          <div className="partner-mode-switch">
                            <button
                              type="button"
                              className={`mini-mode-btn ${pDraft.mode === 'existing' ? 'active' : ''}`}
                              onClick={() => updatePartnerDraft(idx, { mode: 'existing' })}
                            >
                              🔍 Из базы платформы
                            </button>
                            <button
                              type="button"
                              className={`mini-mode-btn ${pDraft.mode === 'manual' ? 'active' : ''}`}
                              onClick={() => updatePartnerDraft(idx, { mode: 'manual' })}
                            >
                              ✍️ Ввести вручную
                            </button>
                            {participationType === 'team' && activePartners.length > 1 && (
                              <button
                                type="button"
                                className="mini-remove-btn"
                                onClick={() => removeTeamMemberDraft(idx)}
                              >
                                × Удалить
                              </button>
                            )}
                          </div>
                        </div>

                        {pDraft.mode === 'existing' ? (
                          <div className="partner-existing-selector">
                            <div className="wizard-form-grid">
                              <label className="wizard-field">
                                <span>Выберите спортсмена из базы *</span>
                                <select
                                  value={pDraft.personId}
                                  onChange={(e) => {
                                    const pid = e.target.value
                                    const found = availablePartners.find((a) => a.person_id === pid)
                                    updatePartnerDraft(idx, {
                                      personId: pid,
                                      selectedAthlete: found || null,
                                      dateOfBirth: found?.date_of_birth || pDraft.dateOfBirth || '2008-01-01',
                                      danceClass: found?.dance_class || pDraft.danceClass || 'D',
                                    })
                                  }}
                                >
                                  <option value="">— Выберите партнера из списка —</option>
                                  {filteredAthletes.map((ath) => (
                                    <option key={ath.person_id} value={ath.person_id}>
                                      {ath.full_name}
                                      {ath.city ? ` (${ath.city})` : ''}
                                      {ath.dance_class ? ` · Класс ${ath.dance_class}` : ''}
                                      {ath.age_on_event !== null && ath.age_on_event !== undefined
                                        ? ` · ${ath.age_on_event} лет`
                                        : ''}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label className="wizard-field">
                                <span>Быстрый фильтр по имени / городу</span>
                                <input
                                  type="text"
                                  value={pDraft.searchQuery}
                                  onChange={(e) =>
                                    updatePartnerDraft(idx, { searchQuery: e.target.value })
                                  }
                                  placeholder="Начните вводить имя или фамилию…"
                                />
                              </label>
                            </div>

                            {pDraft.selectedAthlete && (
                              <div className="selected-partner-chip">
                                <div>
                                  ✓ Выбран: <strong>{pDraft.selectedAthlete.full_name}</strong>
                                  {pDraft.selectedAthlete.club_title && (
                                    <span> · Клуб: {pDraft.selectedAthlete.club_title}</span>
                                  )}
                                </div>
                                <div className="partner-override-fields">
                                  <label className="wizard-field compact">
                                    <span>Дата рождения партнера</span>
                                    <input
                                      type="date"
                                      value={pDraft.selectedAthlete.date_of_birth || pDraft.dateOfBirth}
                                      onChange={(e) =>
                                        updatePartnerDraft(idx, {
                                          dateOfBirth: e.target.value,
                                          selectedAthlete: pDraft.selectedAthlete
                                            ? { ...pDraft.selectedAthlete, date_of_birth: e.target.value }
                                            : null,
                                        })
                                      }
                                    />
                                  </label>
                                  <label className="wizard-field compact">
                                    <span>Класс партнера</span>
                                    <select
                                      value={pDraft.selectedAthlete.dance_class || pDraft.danceClass}
                                      onChange={(e) =>
                                        updatePartnerDraft(idx, {
                                          danceClass: e.target.value,
                                          selectedAthlete: pDraft.selectedAthlete
                                            ? { ...pDraft.selectedAthlete, dance_class: e.target.value }
                                            : null,
                                        })
                                      }
                                    >
                                      {DANCE_CLASSES.map((cls) => (
                                        <option key={cls.value} value={cls.value}>
                                          {cls.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="wizard-form-grid four-cols">
                            <label className="wizard-field">
                              <span>Имя *</span>
                              <input
                                type="text"
                                value={pDraft.firstName}
                                onChange={(e) =>
                                  updatePartnerDraft(idx, { firstName: e.target.value })
                                }
                                placeholder="Имя"
                              />
                            </label>
                            <label className="wizard-field">
                              <span>Фамилия *</span>
                              <input
                                type="text"
                                value={pDraft.lastName}
                                onChange={(e) =>
                                  updatePartnerDraft(idx, { lastName: e.target.value })
                                }
                                placeholder="Фамилия"
                              />
                            </label>
                            <label className="wizard-field">
                              <span>Дата рождения *</span>
                              <input
                                type="date"
                                value={pDraft.dateOfBirth}
                                onChange={(e) =>
                                  updatePartnerDraft(idx, { dateOfBirth: e.target.value })
                                }
                              />
                            </label>
                            <label className="wizard-field">
                              <span>Класс *</span>
                              <select
                                value={pDraft.danceClass}
                                onChange={(e) =>
                                  updatePartnerDraft(idx, { danceClass: e.target.value })
                                }
                              >
                                {DANCE_CLASSES.map((cls) => (
                                  <option key={cls.value} value={cls.value}>
                                    {cls.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {participationType === 'team' && (
                    <button
                      type="button"
                      className="add-team-member-btn"
                      onClick={addTeamMemberDraft}
                    >
                      + Добавить еще участника в синхрон / команду
                    </button>
                  )}
                </div>
              )}

              {/* Club & Trainer Representation Card */}
              <div className="representation-bar">
                <div className="representation-info">
                  <span>🏛 Клуб: <strong>{selectedClubTitle}</strong></span>
                  <span>·</span>
                  <span>🎓 Тренер: <strong>{selectedTrainerName}</strong></span>
                </div>
                <button
                  type="button"
                  className="inline-link-btn"
                  onClick={() => setEditingRepresentation((v) => !v)}
                >
                  {editingRepresentation ? 'Готово' : 'Изменить клуб / тренера'}
                </button>
              </div>

              {editingRepresentation && (
                <div className="wizard-form-grid representation-form">
                  <label className="wizard-field">
                    <span>Танцевальный клуб</span>
                    <select
                      value={selectedClubId}
                      onChange={(e) => setSelectedClubId(e.target.value)}
                    >
                      <option value="">— Индивидуально (без клуба) —</option>
                      {(tournContext?.clubs || []).map((cl) => (
                        <option key={cl.id} value={cl.id}>
                          {cl.title} {cl.city ? `(${cl.city})` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="wizard-field">
                    <span>Тренер</span>
                    <select
                      value={selectedTrainerId}
                      onChange={(e) => setSelectedTrainerId(e.target.value)}
                    >
                      <option value="">— Без тренера —</option>
                      {(tournContext?.trainers || []).map((tr) => (
                        <option key={tr.id} value={tr.id}>
                          {tr.name} {tr.city ? `(${tr.city})` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {/* Effective filtering parameters summary pill */}
              <div className="effective-params-banner">
                <span>🎯 Параметры автоматического подбора категорий:</span>
                <div className="effective-chips">
                  <span className="eff-chip">
                    Формат:{' '}
                    <b>
                      {participationType === 'solo'
                        ? 'Соло'
                        : participationType === 'couple'
                          ? 'Пара'
                          : 'Команда / Синхрон'}
                    </b>
                  </span>
                  <span className="eff-chip">
                    Эффективный возраст (MAX):{' '}
                    <b>{effectiveAge !== null ? `${effectiveAge} лет` : 'Укажите ДР'}</b>
                  </span>
                  <span className="eff-chip">
                    Эффективный класс (MAX): <b>{effectiveClass}</b>
                  </span>
                </div>
              </div>
            </section>

            {/* ==================== ШАГ 2: ВЫБОР КАТЕГОРИЙ ==================== */}
            <section className="wizard-section categories-wizard-section">
              <div className="wizard-section-header">
                <div>
                  <span className="step-kicker">Шаг 2 из 3</span>
                  <h2>Выберите категории участия</h2>
                  <p className="step-sub">
                    Отметьте галочками одну или несколько категорий. Список автоматически отфильтрован по вашему возрасту и классу.
                  </p>
                </div>
                <div className="category-filter-tabs">
                  <button
                    type="button"
                    className={`filter-pill-btn ${categoryFilterTab === 'eligible' ? 'active' : ''}`}
                    onClick={() => setCategoryFilterTab('eligible')}
                  >
                    Подходящие вам ({eligibleCategories.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill-btn ${categoryFilterTab === 'all' ? 'active' : ''}`}
                    onClick={() => setCategoryFilterTab('all')}
                  >
                    Все категории ({evaluatedCategories.length})
                  </button>
                </div>
              </div>

              {tournCategoriesQuery.isPending ? (
                <div className="loading-state">Загрузка сетки категорий турнира…</div>
              ) : displayedCategories.length === 0 ? (
                <div className="empty-state">
                  <p>
                    По текущим параметрам (возраст: {effectiveAge ?? '—'}, класс: {effectiveClass}) подходящих категорий не найдено.
                  </p>
                  {categoryFilterTab === 'eligible' && evaluatedCategories.length > 0 && (
                    <button
                      type="button"
                      className="inline-link-btn"
                      onClick={() => setCategoryFilterTab('all')}
                    >
                      Показать все категории турнира ({evaluatedCategories.length})
                    </button>
                  )}
                </div>
              ) : (
                <div className="tournament-category-checklist">
                  {displayedCategories.map(({ category: cat, eligible, reasons }) => {
                    const isChecked = validSelectedCategories.some((c) => c.id === cat.id)
                    return (
                      <label
                        key={cat.id}
                        className={`option-card category-check-card ${isChecked ? 'selected' : ''} ${!eligible ? 'disabled' : ''}`}
                      >
                        <div className="option-checkbox">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!eligible}
                            onChange={() => toggleCategorySelection(cat.id, eligible)}
                          />
                        </div>
                        <div className="option-info">
                          <div className="category-card-badges">
                            <span className="disc-pill">{cat.discipline.name}</span>
                            <span className="meta-pill">
                              Возраст: {formatAgeRange(cat.ageFrom, cat.ageTo)}
                            </span>
                            <span className="meta-pill">
                              Класс: {cat.className || 'Open (Все классы)'}
                            </span>
                          </div>
                          <div className="option-title">{cat.category.name}</div>
                          <div className="option-places">
                            {!eligible ? (
                              <span className="ineligible-reason-badge">
                                Недоступно: {reasons.join(' · ')}
                              </span>
                            ) : cat.availablePlaces !== undefined && cat.availablePlaces !== null ? (
                              <span className="badge-avail">
                                Свободно мест: {cat.availablePlaces}
                              </span>
                            ) : (
                              <span className="badge-avail">Регистрация открыта</span>
                            )}
                          </div>
                        </div>
                        <div className="option-price">
                          {cat.price
                            ? `${cat.price.toLocaleString('ru-RU')} ${cat.currency || 'KZT'}`
                            : 'Бесплатно'}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </section>

            {/* ==================== ШАГ 3: ИТОГО И ПЕРЕХОД К ХОЛДУ ==================== */}
            <div className="registration-action-box tournament-summary-footer">
              <div className="tournament-summary-row">
                <div>
                  <div className="summary-count-label">
                    Выбрано категорий: <strong>{validSelectedCategories.length}</strong>
                  </div>
                  {validSelectedCategories.length > 0 && (
                    <div className="summary-selected-names">
                      {validSelectedCategories.map((c) => c.category.name).join(' · ')}
                    </div>
                  )}
                </div>
                <div className="summary-total-price">
                  <span>Итоговый взнос:</span>
                  <strong>
                    {totalTournamentPrice.toLocaleString('ru-RU')} {event.currency || 'KZT'}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="button primary large"
                onClick={() => void handleStartTournamentBooking()}
                disabled={bookingLoading || validSelectedCategories.length === 0}
              >
                {bookingLoading
                  ? 'Резервирование мест…'
                  : validSelectedCategories.length > 0
                    ? `Зарезервировать (${validSelectedCategories.length} кат.) и получить QR-билет`
                    : 'Выберите хотя бы одну категорию'}
              </button>
              <div className="action-hint">
                При нажатии места в выбранных категориях резервируются за вами на 15 минут. После подтверждения выпускается единый QR-билет участника.
              </div>
            </div>
          </div>
        </main>

        {conflictWarning && (
          <TimeConflictWarningModal
            conflicts={conflictWarning.conflicts}
            message={conflictWarning.message}
            loading={bookingLoading}
            onCancel={() => setConflictWarning(null)}
            onConfirm={conflictWarning.onConfirm}
          />
        )}

        {holdSession && (
          <BookingHoldModal
            session={holdSession}
            title={holdTitle}
            subtitle={holdSubtitle}
            onSuccess={handleBookingSuccess}
            onClose={() => setHoldSession(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="dashboard-page registration-page">
      <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
      <main className="registration-main">
        <div className="registration-breadcrumbs">
          <Link to={`/events/${encodeURIComponent(event.id)}`}>← Назад к мероприятию</Link>
        </div>

        <div className="registration-card">
          <div className="registration-header">
            <span className="badge-type">Мастер-класс</span>
            <h1>Запись на {event.title}</h1>
            <p className="event-meta">
              📍 {event.venue?.name || event.venue?.city || 'Место уточняется'} · 📅{' '}
              {new Date(event.startAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {packages.length > 0 && (
            <div className="registration-type-selector">
              <button
                type="button"
                className={`type-tab ${selectedType === 'package' ? 'active' : ''}`}
                onClick={() => {
                  setUserSelectedType('package')
                  setSearchParams({ package: selectedPackage || packages[0].id })
                }}
              >
                Пакеты участия ({packages.length})
              </button>
              <button
                type="button"
                className={`type-tab ${selectedType === 'slot' ? 'active' : ''}`}
                onClick={() => {
                  setUserSelectedType('slot')
                  setSearchParams({ slot: selectedSlot || (slots[0]?.id || '') })
                }}
              >
                Отдельные слоты ({slots.length})
              </button>
            </div>
          )}

          {selectedType === 'package' && packages.length > 0 ? (
            <div className="package-options-list">
              {packages.map((pkg) => {
                const isBooked = Boolean(pkg.alreadyBooked)
                const isSelected = !isBooked && selectedPackage === pkg.id
                return (
                  <label
                    key={pkg.id}
                    className={`option-card ${isSelected ? 'selected' : ''} ${isBooked ? 'disabled' : ''}`}
                    onClick={() => {
                      if (isBooked) return
                      setUserSelectedPackage(pkg.id)
                      setSearchParams({ package: pkg.id })
                    }}
                  >
                    <div className="option-radio">
                      <input
                        type="radio"
                        name="package_selection"
                        checked={isSelected}
                        disabled={isBooked}
                        onChange={() => {
                          if (isBooked) return
                          setUserSelectedPackage(pkg.id)
                          setSearchParams({ package: pkg.id })
                        }}
                      />
                    </div>
                    <div className="option-info">
                      <div className="option-title">{pkg.title}</div>
                      {pkg.description && <div className="option-desc">{pkg.description}</div>}
                      {isBooked && (
                        <div className="option-places">
                          <span className="badge-avail">Вы уже записаны ✓</span>
                        </div>
                      )}
                    </div>
                    <div className="option-price">
                      {pkg.price ? `${pkg.price.toLocaleString('ru-RU')} ${pkg.currency || 'KZT'}` : 'Бесплатно'}
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="slot-options-list">
              {slotsQuery.isPending ? (
                <div className="loading-state">Загрузка доступных слотов…</div>
              ) : slots.length === 0 ? (
                <div className="empty-state">Нет доступных слотов для записи.</div>
              ) : (
                slots.map((slot) => {
                  const isBooked = Boolean(slot.alreadyBooked)
                  const isFull =
                    slot.availabilityStatus === 'full' ||
                    (slot.availablePlaces !== undefined &&
                      slot.availablePlaces !== null &&
                      slot.availablePlaces <= 0)
                  const isDisabled = isFull || isBooked
                  const isSelected = !isDisabled && selectedSlot === slot.id
                  return (
                    <label
                      key={slot.id}
                      className={`option-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                      onClick={() => {
                        if (isDisabled) return
                        setUserSelectedSlot(slot.id)
                        setSearchParams({ slot: slot.id })
                      }}
                    >
                      <div className="option-radio">
                        <input
                          type="radio"
                          name="slot_selection"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => {
                            if (isDisabled) return
                            setUserSelectedSlot(slot.id)
                            setSearchParams({ slot: slot.id })
                          }}
                        />
                      </div>
                      <div className="option-info">
                        <div className="option-title">
                          {new Date(slot.startAt).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' — '}
                          {new Date(slot.endAt).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="option-places">
                          {isBooked ? (
                            <span className="badge-avail">Вы уже записаны ✓</span>
                          ) : isFull ? (
                            <span className="badge-full">Мест нет</span>
                          ) : slot.availablePlaces !== null ? (
                            <span className="badge-avail">Осталось мест: {slot.availablePlaces}</span>
                          ) : (
                            <span className="badge-avail">Места есть</span>
                          )}
                        </div>
                      </div>
                      <div className="option-price">
                        {slot.price ? `${slot.price.toLocaleString('ru-RU')} ${slot.currency || 'KZT'}` : 'Бесплатно'}
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          )}

          {bookingError && (
            <div className="form-error-banner" role="alert">
              {bookingError}
            </div>
          )}

          <div className="registration-action-box">
            <button
              type="button"
              className="button primary large"
              onClick={() => void handleStartMasterClassBooking()}
              disabled={bookingLoading || (selectedType === 'slot' && !selectedSlot && slots.length === 0)}
            >
              {bookingLoading ? 'Резервирование…' : 'Зарезервировать место (на 15 минут)'}
            </button>
            <div className="action-hint">
              При нажатии место резервируется за вами на 15 минут. После подтверждения выпускается QR-билет.
            </div>
          </div>
        </div>
      </main>

      {conflictWarning && (
        <TimeConflictWarningModal
          conflicts={conflictWarning.conflicts}
          message={conflictWarning.message}
          loading={bookingLoading}
          onCancel={() => setConflictWarning(null)}
          onConfirm={conflictWarning.onConfirm}
        />
      )}

      {holdSession && (
        <BookingHoldModal
          session={holdSession}
          title={holdTitle}
          subtitle={holdSubtitle}
          onSuccess={handleBookingSuccess}
          onClose={() => setHoldSession(null)}
        />
      )}
    </div>
  )
}
