import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FrappeApiError } from '../api/frappe'
import {
  uploadProfilePhoto,
  searchTrainerByPhone,
  searchLeagues,
  searchFederations,
  type TrainerSearchResult,
} from '../api/onboarding'
import {
  getAthleteCabinetData,
  updateAthleteProfile,
  searchClubs,
  sendTrainerRequest,
  respondTrainerRelation,
  sendClubRequest,
  respondClubMembership,
  sendLeagueRequest,
  respondLeagueMembership,
  sendFederationRequest,
  respondFederationMembership,
  type AthleteCabinetData,
} from '../api/athleteCabinet'
import {
  getCabinetContext,
  updateTrainerProfile,
  activateSecondaryRole,
  searchAthleteByPhone,
  getTrainerStudents,
  sendStudentRequest,
  respondStudentRequest,
  searchVenues,
  getTrainerTrainings,
  saveTrainingOffering,
  createTrainingSlots,
  getTrainerMasterClasses,
  createMasterClass,
  type CabinetContext,
  type AthleteSearchResult,
  type StudentRelationItem,
  type TrainerTrainingsResponse,
  type TrainerMasterClassEvent,
} from '../api/trainerCabinet'
import {
  getAvailableTrainingSlots,
  initiateTrainingBooking,
  type AvailableTrainingSlot,
  type InitiateBookingResult,
} from '../api/booking'
import { CountryPhoneInput } from '../components/CountryPhoneInput'
import { CitySelectInput } from '../components/CitySelectInput'
import { DebouncedSearchSelect } from '../components/DebouncedSearchSelect'
import { LoadingScreen } from '../components/LoadingScreen'
import { BookingHoldModal } from '../components/BookingHoldModal'
import {
  isValidPhoneNumber,
  getCountries,
  getCountryCallingCode,
  type Country,
} from 'react-phone-number-input'
import { formatDateTime } from '../utils/date'
import './CabinetPage.css'

const CALLING_CODES = new Set(getCountries().map((c) => `+${getCountryCallingCode(c)}`))

function isPhoneInputEmptyOrPrefixOnly(val: string): boolean {
  const trimmed = (val || '').trim()
  return !trimmed || trimmed === '+' || CALLING_CODES.has(trimmed)
}

function toggleItem(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

type TabType =
  | 'trainer_profile'
  | 'trainer_students'
  | 'trainer_trainings'
  | 'trainer_master_classes'
  | 'athlete_profile'
  | 'athlete_booking'

export function CabinetPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [context, setContext] = useState<CabinetContext | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('trainer_profile')
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Trainer profile form state
  const [publicName, setPublicName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [experience, setExperience] = useState('')
  const [qualification, setQualification] = useState('')
  const [defaultDuration, setDefaultDuration] = useState('60')
  const [bookingEnabled, setBookingEnabled] = useState(true)
  const [trainerPhoto, setTrainerPhoto] = useState('')
  const [trainerDirections, setTrainerDirections] = useState<string[]>([])
  const [trainerClubs, setTrainerClubs] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Students tab state
  const [studentSearchPhone, setStudentSearchPhone] = useState('')
  const [searchingStudent, setSearchingStudent] = useState(false)
  const [studentPhoneWarning, setStudentPhoneWarning] = useState<string | null>(null)
  const [studentNotFound, setStudentNotFound] = useState(false)
  const [foundStudent, setFoundStudent] = useState<AthleteSearchResult | null>(null)
  const [activeStudents, setActiveStudents] = useState<StudentRelationItem[]>([])
  const [incomingRequests, setIncomingRequests] = useState<StudentRelationItem[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<StudentRelationItem[]>([])

  // Trainings tab state
  const [trainingsData, setTrainingsData] = useState<TrainerTrainingsResponse | null>(null)
  const [showOfferingModal, setShowOfferingModal] = useState(false)
  const [offeringTitle, setOfferingTitle] = useState('')
  const [offeringType, setOfferingType] = useState<'Individual' | 'Group'>('Individual')
  const [offeringDirection, setOfferingDirection] = useState('')
  const [offeringDuration, setOfferingDuration] = useState('60')
  const [offeringHasCapacityLimit, setOfferingHasCapacityLimit] = useState(true)
  const [offeringCapacity, setOfferingCapacity] = useState('1')
  const [offeringPrice, setOfferingPrice] = useState('5000')
  const [offeringVenue, setOfferingVenue] = useState('')
  const [offeringVenueTitle, setOfferingVenueTitle] = useState('')
  const [savingOffering, setSavingOffering] = useState(false)

  // Slots modal state
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [slotOfferingId, setSlotOfferingId] = useState('')
  const [slotMode, setSlotMode] = useState<'single' | 'recurring'>('single')
  const [slotStartDatetime, setSlotStartDatetime] = useState('')
  const [slotDuration, setSlotDuration] = useState('60')
  const [slotVenue, setSlotVenue] = useState('')
  const [slotVenueTitle, setSlotVenueTitle] = useState('')
  const [slotHasCapLimit, setSlotHasCapLimit] = useState(true)
  const [slotCap, setSlotCap] = useState('1')
  const [slotPrice, setSlotPrice] = useState('5000')
  const [slotWeekdays, setSlotWeekdays] = useState<string[]>(['Monday', 'Wednesday'])
  const [slotStartTime, setSlotStartTime] = useState('18:00')
  const [slotValidFrom, setSlotValidFrom] = useState('')
  const [slotValidTo, setSlotValidTo] = useState('')
  const [savingSlot, setSavingSlot] = useState(false)

  // Master classes tab state
  const [masterClasses, setMasterClasses] = useState<TrainerMasterClassEvent[]>([])
  const [showMcModal, setShowMcModal] = useState(false)
  const [mcTitle, setMcTitle] = useState('')
  const [mcDescription, setMcDescription] = useState('')
  const [mcCover, setMcCover] = useState('')
  const [mcVenue, setMcVenue] = useState('')
  const [mcVenueTitle, setMcVenueTitle] = useState('')
  const [mcSlots, setMcSlots] = useState<
    { client_key: string; start_datetime: string; end_datetime: string; venue?: string; has_capacity_limit: boolean; capacity: number; price: number }[]
  >([
    { client_key: 'slot_1', start_datetime: '', end_datetime: '', has_capacity_limit: true, capacity: 25, price: 5000 },
  ])
  const [mcPackages, setMcPackages] = useState<{ title: string; price: number; slot_keys: string[] }[]>([])
  const [savingMc, setSavingMc] = useState(false)

  // Athlete booking catalog tab state
  const [availableSlots, setAvailableSlots] = useState<AvailableTrainingSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [activeBookingSession, setActiveBookingSession] = useState<{
    session: InitiateBookingResult
    title: string
    subtitle?: string
  } | null>(null)

  // Athlete profile form state
  const [athleteFirstName, setAthleteFirstName] = useState('')
  const [athleteLastName, setAthleteLastName] = useState('')
  const [athleteMiddleName, setAthleteMiddleName] = useState('')
  const [athleteDob, setAthleteDob] = useState('')
  const [athleteGender, setAthleteGender] = useState('Male')
  const [athletePhone, setAthletePhone] = useState('')
  const [athleteCity, setAthleteCity] = useState('')
  const [athleteCountry, setAthleteCountry] = useState('KZ')
  const [athletePhoto, setAthletePhoto] = useState('')
  const [athleteLevel, setAthleteLevel] = useState('')
  const [athleteDirections, setAthleteDirections] = useState<string[]>([])
  const [uploadingAthletePhoto, setUploadingAthletePhoto] = useState(false)
  const [savingAthleteProfile, setSavingAthleteProfile] = useState(false)

  // Athlete attachments data state
  const [athleteData, setAthleteData] = useState<AthleteCabinetData | null>(null)

  // Athlete Trainer Search state
  const [athTrainerSearchPhone, setAthTrainerSearchPhone] = useState('')
  const [searchingTrainer, setSearchingTrainer] = useState(false)
  const [athTrainerPhoneWarning, setAthTrainerPhoneWarning] = useState<string | null>(null)
  const [athTrainerNotFound, setAthTrainerNotFound] = useState(false)
  const [foundTrainer, setFoundTrainer] = useState<TrainerSearchResult | null>(null)
  const [sendingTrainerReq, setSendingTrainerReq] = useState(false)

  // Athlete Club Search state
  const [selectedClub, setSelectedClub] = useState('')
  const [selectedClubTitle, setSelectedClubTitle] = useState('')
  const [sendingClubReq, setSendingClubReq] = useState(false)

  // Athlete League Search state
  const [selectedLeague, setSelectedLeague] = useState('')
  const [selectedLeagueTitle, setSelectedLeagueTitle] = useState('')
  const [sendingLeagueReq, setSendingLeagueReq] = useState(false)

  // Athlete Federation Search state
  const [selectedFederation, setSelectedFederation] = useState('')
  const [selectedFederationTitle, setSelectedFederationTitle] = useState('')
  const [sendingFederationReq, setSendingFederationReq] = useState(false)

  const loadAthleteData = useCallback(async () => {
    try {
      const data = await getAthleteCabinetData()
      setAthleteData(data)
      setAthleteFirstName(data.person.first_name || '')
      setAthleteLastName(data.person.last_name || '')
      setAthleteMiddleName(data.person.middle_name || '')
      setAthleteDob(data.person.date_of_birth || '')
      setAthleteGender(data.person.gender || 'Male')
      setAthletePhone(data.person.phone || '')
      setAthleteCity(data.person.city || '')
      setAthleteCountry(data.person.country || 'KZ')
      setAthletePhoto(data.person.photo || '')
      setAthleteLevel(data.athlete.level || '')
      setAthleteDirections(data.athlete.directions || [])
    } catch {
      // ignore
    }
  }, [])

  const loadContext = useCallback(async () => {
    try {
      const data = await getCabinetContext()
      setContext(data)

      if (data.trainer) {
        setPublicName(data.trainer.public_name || '')
        setCity(data.trainer.city || data.person.city || '')
        setPhone(data.person.phone || '')
        setBio(data.trainer.bio || '')
        setExperience(data.trainer.experience || '')
        setQualification(data.trainer.qualification || '')
        setDefaultDuration(String(data.trainer.default_training_duration || 60))
        setBookingEnabled(data.trainer.booking_enabled)
        setTrainerPhoto(data.trainer.photo || data.person.photo || '')
        setTrainerDirections(data.trainer.directions || [])
        setTrainerClubs((data.trainer.clubs || []).map((c) => c.club))
        setActiveTab('trainer_profile')
      } else if (data.athlete) {
        setActiveTab('athlete_profile')
      }

      if (data.roles.is_athlete) {
        await loadAthleteData()
      }
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) {
        setApiError(err.message)
      } else {
        setApiError('Не удалось загрузить данные личного кабинета.')
      }
    } finally {
      setLoading(false)
    }
  }, [loadAthleteData])

  const loadStudents = useCallback(async () => {
    try {
      const data = await getTrainerStudents()
      setActiveStudents(data.active_students)
      setIncomingRequests(data.incoming_requests)
      setOutgoingRequests(data.outgoing_requests)
    } catch {
      // ignore
    }
  }, [])

  const loadTrainings = useCallback(async () => {
    try {
      const data = await getTrainerTrainings()
      setTrainingsData(data)
    } catch {
      // ignore
    }
  }, [])

  const loadMasterClasses = useCallback(async () => {
    try {
      const data = await getTrainerMasterClasses()
      setMasterClasses(data)
    } catch {
      // ignore
    }
  }, [])

  const loadAvailableSlots = useCallback(async () => {
    setLoadingSlots(true)
    try {
      const data = await getAvailableTrainingSlots()
      setAvailableSlots(data)
    } catch {
      // ignore
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        const data = await getCabinetContext()
        if (!isMounted) return
        setContext(data)
        if (data.trainer) {
          setPublicName(data.trainer.public_name || '')
          setCity(data.trainer.city || data.person.city || '')
          setPhone(data.person.phone || '')
          setBio(data.trainer.bio || '')
          setExperience(data.trainer.experience || '')
          setQualification(data.trainer.qualification || '')
          setDefaultDuration(String(data.trainer.default_training_duration || 60))
          setBookingEnabled(data.trainer.booking_enabled)
          setTrainerPhoto(data.trainer.photo || data.person.photo || '')
          setTrainerDirections(data.trainer.directions || [])
          setTrainerClubs((data.trainer.clubs || []).map((c) => c.club))
        } else if (data.athlete) {
          setActiveTab('athlete_profile')
        }
        if (data.roles.is_athlete) {
          await loadAthleteData()
        }
      } catch (err: unknown) {
        if (!isMounted) return
        if (err instanceof FrappeApiError) {
          setApiError(err.message)
        } else {
          setApiError('Не удалось загрузить данные личного кабинета.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void init()
    return () => {
      isMounted = false
    }
  }, [loadAthleteData])

  useEffect(() => {
    let isMounted = true
    const syncTab = async () => {
      try {
        if (activeTab === 'trainer_students') {
          const data = await getTrainerStudents()
          if (!isMounted) return
          setActiveStudents(data.active_students)
          setIncomingRequests(data.incoming_requests)
          setOutgoingRequests(data.outgoing_requests)
        } else if (activeTab === 'athlete_profile') {
          await loadAthleteData()
        } else if (activeTab === 'trainer_trainings') {
          const data = await getTrainerTrainings()
          if (!isMounted) return
          setTrainingsData(data)
        } else if (activeTab === 'trainer_master_classes') {
          const data = await getTrainerMasterClasses()
          if (!isMounted) return
          setMasterClasses(data)
        } else if (activeTab === 'athlete_booking') {
          setLoadingSlots(true)
          const data = await getAvailableTrainingSlots()
          if (!isMounted) return
          setAvailableSlots(data)
          setLoadingSlots(false)
        }
      } catch {
        // ignore
      }
    }
    void syncTab()
    return () => {
      isMounted = false
    }
  }, [activeTab, loadAthleteData])

  // --- Handlers: Profile & Roles ---
  async function handleActivateRole(role: 'trainer' | 'athlete') {
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await activateSecondaryRole(role)
      setSuccessMessage(res.message)
      await loadContext()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Ошибка подключения роли.')
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await updateTrainerProfile({
        person_data: { city, phone, photo: trainerPhoto },
        trainer_data: {
          public_name: publicName,
          city,
          bio,
          experience,
          qualification,
          default_training_duration: Number(defaultDuration),
          booking_enabled: bookingEnabled,
          photo: trainerPhoto,
          directions: trainerDirections,
          clubs: trainerClubs,
        },
      })
      setSuccessMessage(res.message)
      await loadContext()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось сохранить профиль.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setApiError(null)
    try {
      const url = await uploadProfilePhoto(file)
      setTrainerPhoto(url)
    } catch {
      setApiError('Не удалось загрузить фотографию.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // --- Handlers: Athlete Profile & Attachments ---
  async function handleSaveAthleteProfile(e: FormEvent) {
    e.preventDefault()
    if (!athleteFirstName.trim()) {
      setApiError('Имя обязательно для заполнения.')
      return
    }
    if (!athleteLastName.trim()) {
      setApiError('Фамилия обязательна для заполнения.')
      return
    }
    if (!athleteDob) {
      setApiError('Дата рождения обязательна для заполнения.')
      return
    }

    setSavingAthleteProfile(true)
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await updateAthleteProfile(
        {
          first_name: athleteFirstName,
          last_name: athleteLastName,
          middle_name: athleteMiddleName || undefined,
          date_of_birth: athleteDob,
          gender: athleteGender,
          phone: athletePhone || undefined,
          city: athleteCity || undefined,
          country: athleteCountry || undefined,
          photo: athletePhoto || undefined,
        },
        {
          level: athleteLevel || undefined,
          directions: athleteDirections,
        }
      )
      setSuccessMessage(res.message)
      await loadAthleteData()
      await loadContext()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось сохранить профиль танцора.')
    } finally {
      setSavingAthleteProfile(false)
    }
  }

  async function handleAthletePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAthletePhoto(true)
    setApiError(null)
    try {
      const url = await uploadProfilePhoto(file)
      setAthletePhoto(url)
    } catch {
      setApiError('Не удалось загрузить фотографию.')
    } finally {
      setUploadingAthletePhoto(false)
    }
  }

  const handleAthTrainerPhoneChange = useCallback(async (val: string) => {
    setAthTrainerSearchPhone(val)
    setAthTrainerPhoneWarning(null)
    setAthTrainerNotFound(false)
    setFoundTrainer(null)

    if (isPhoneInputEmptyOrPrefixOnly(val)) {
      return
    }

    if (!isValidPhoneNumber(val)) {
      setAthTrainerPhoneWarning('Номер телефона не валиден')
      return
    }

    setSearchingTrainer(true)
    try {
      const res = await searchTrainerByPhone(val)
      if (res) {
        setFoundTrainer(res)
        setAthTrainerNotFound(false)
      } else {
        setFoundTrainer(null)
        setAthTrainerNotFound(true)
      }
    } catch {
      setAthTrainerNotFound(true)
    } finally {
      setSearchingTrainer(false)
    }
  }, [])

  async function handleSendTrainerRequestAction(trainerProfile: string) {
    setSendingTrainerReq(true)
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await sendTrainerRequest(trainerProfile)
      setSuccessMessage(res.message)
      setFoundTrainer(null)
      setAthTrainerSearchPhone('')
      await loadAthleteData()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось отправить заявку тренеру.')
    } finally {
      setSendingTrainerReq(false)
    }
  }

  async function handleRespondTrainerAction(relationId: string, action: 'accept' | 'reject' | 'cancel' | 'leave') {
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await respondTrainerRelation(relationId, action)
      setSuccessMessage(res.message)
      await loadAthleteData()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось выполнить действие.')
    }
  }

  const handleFetchClubs = useCallback(async (q: string) => {
    const list = await searchClubs(q)
    return list.map((c) => ({
      name: c.name,
      title: c.city ? `${c.title} (${c.city})` : c.title,
    }))
  }, [])

  async function handleSendClubRequestAction() {
    if (!selectedClub) return
    setSendingClubReq(true)
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await sendClubRequest(selectedClub)
      setSuccessMessage(res.message)
      setSelectedClub('')
      setSelectedClubTitle('')
      await loadAthleteData()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось отправить заявку в студию.')
    } finally {
      setSendingClubReq(false)
    }
  }

  async function handleRespondClubAction(membershipId: string, action: 'accept' | 'reject' | 'cancel' | 'leave') {
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await respondClubMembership(membershipId, action)
      setSuccessMessage(res.message)
      await loadAthleteData()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось выполнить действие.')
    }
  }

  const handleFetchLeagues = useCallback(async (q: string) => {
    const list = await searchLeagues(q)
    return list.map((l) => ({ name: l.name, title: l.title }))
  }, [])

  async function handleSendLeagueRequestAction() {
    if (!selectedLeague) return
    setSendingLeagueReq(true)
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await sendLeagueRequest(selectedLeague)
      setSuccessMessage(res.message)
      setSelectedLeague('')
      setSelectedLeagueTitle('')
      await loadAthleteData()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось отправить заявку в лигу.')
    } finally {
      setSendingLeagueReq(false)
    }
  }

  async function handleRespondLeagueAction(membershipId: string, action: 'cancel' | 'leave') {
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await respondLeagueMembership(membershipId, action)
      setSuccessMessage(res.message)
      await loadAthleteData()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось выполнить действие.')
    }
  }

  const handleFetchFederations = useCallback(async (q: string) => {
    const list = await searchFederations(q)
    return list.map((f) => ({ name: f.name, title: f.title }))
  }, [])

  async function handleSendFederationRequestAction() {
    if (!selectedFederation) return
    setSendingFederationReq(true)
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await sendFederationRequest(selectedFederation)
      setSuccessMessage(res.message)
      setSelectedFederation('')
      setSelectedFederationTitle('')
      await loadAthleteData()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось отправить заявку в федерацию.')
    } finally {
      setSendingFederationReq(false)
    }
  }

  async function handleRespondFederationAction(membershipId: string, action: 'cancel' | 'leave') {
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await respondFederationMembership(membershipId, action)
      setSuccessMessage(res.message)
      await loadAthleteData()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось выполнить действие.')
    }
  }

  // --- Handlers: Students & Requests ---
  const handleStudentPhoneChange = useCallback(async (val: string) => {
    setStudentSearchPhone(val)
    setStudentPhoneWarning(null)
    setStudentNotFound(false)
    setFoundStudent(null)

    if (isPhoneInputEmptyOrPrefixOnly(val)) {
      return
    }

    if (!isValidPhoneNumber(val)) {
      setStudentPhoneWarning('Номер телефона не валиден')
      return
    }

    setSearchingStudent(true)
    try {
      const res = await searchAthleteByPhone(val)
      if (res) {
        setFoundStudent(res)
        setStudentNotFound(false)
      } else {
        setFoundStudent(null)
        setStudentNotFound(true)
      }
    } catch {
      setStudentNotFound(true)
    } finally {
      setSearchingStudent(false)
    }
  }, [])

  async function handleSendStudentRequest(athleteProfile: string) {
    try {
      const res = await sendStudentRequest(athleteProfile)
      setSuccessMessage(res.message)
      setFoundStudent(null)
      setStudentSearchPhone('')
      await loadStudents()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
    }
  }

  async function handleRespondRequest(relationId: string, action: 'accept' | 'reject' | 'remove' | 'cancel') {
    try {
      const res = await respondStudentRequest(relationId, action)
      setSuccessMessage(res.message)
      await loadStudents()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
    }
  }

  // --- Handlers: Trainings & Slots ---
  const handleFetchVenues = useCallback(async (q: string) => {
    const list = await searchVenues(q)
    return list.map((v) => ({ name: v.name, title: `${v.title} (${v.city || 'Город не указан'})` }))
  }, [])

  async function handleSaveOffering(e: FormEvent) {
    e.preventDefault()
    setSavingOffering(true)
    setApiError(null)
    try {
      await saveTrainingOffering({
        title: offeringTitle,
        training_type: offeringType,
        direction: offeringDirection,
        duration_minutes: Number(offeringDuration),
        has_capacity_limit: offeringHasCapacityLimit,
        capacity: Number(offeringCapacity),
        price: Number(offeringPrice),
        default_venue: offeringVenue || null,
        active: 1,
      })
      setShowOfferingModal(false)
      setOfferingTitle('')
      await loadTrainings()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
    } finally {
      setSavingOffering(false)
    }
  }

  async function handleCreateSlots(e: FormEvent) {
    e.preventDefault()
    setSavingSlot(true)
    setApiError(null)
    try {
      await createTrainingSlots({
        training_offering: slotOfferingId,
        mode: slotMode,
        start_datetime: slotStartDatetime || undefined,
        duration_minutes: Number(slotDuration),
        has_capacity_limit: slotHasCapLimit,
        capacity: Number(slotCap),
        venue: slotVenue || undefined,
        price: Number(slotPrice),
        weekdays: slotWeekdays,
        start_time: slotStartTime,
        valid_from: slotValidFrom || undefined,
        valid_to: slotValidTo || undefined,
      })
      setShowSlotModal(false)
      await loadTrainings()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
    } finally {
      setSavingSlot(false)
    }
  }

  // --- Handlers: Master Classes ---
  async function handleCreateMc(e: FormEvent) {
    e.preventDefault()
    setSavingMc(true)
    setApiError(null)
    try {
      await createMasterClass({
        title: mcTitle,
        description: mcDescription,
        cover: mcCover || undefined,
        venue: mcVenue || undefined,
        slots: mcSlots.map((s) => ({
          client_key: s.client_key,
          start_datetime: s.start_datetime,
          end_datetime: s.end_datetime,
          venue: s.venue || mcVenue || undefined,
          has_capacity_limit: s.has_capacity_limit,
          capacity: Number(s.capacity),
          price: Number(s.price),
        })),
        packages: mcPackages.map((p) => ({
          title: p.title,
          price: Number(p.price),
          slot_keys: p.slot_keys,
        })),
      })
      setShowMcModal(false)
      await loadMasterClasses()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
    } finally {
      setSavingMc(false)
    }
  }

  // --- Handlers: Athlete Booking ---
  async function handleStartBooking(slot: AvailableTrainingSlot) {
    setApiError(null)
    try {
      const res = await initiateTrainingBooking(slot.id)
      setActiveBookingSession({
        session: res,
        title: slot.offering_title,
        subtitle: `${slot.trainer_name} • ${formatDateTime(slot.start_datetime)}`,
      })
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Не удалось начать бронирование.')
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!context) {
    return (
      <div className="cabinet-page">
        <div className="cabinet-card error-card">
          <p>Не удалось загрузить данные личного кабинета.</p>
          <button type="button" className="primary-button" onClick={() => void loadContext()}>
            Повторить
          </button>
        </div>
      </div>
    )
  }

  const { person, roles, catalogs } = context
  const isTrainer = roles.is_trainer
  const isAthlete = roles.is_athlete

  return (
    <div className="cabinet-page">
      {/* Top Header Card */}
      <header className="cabinet-card cabinet-header-card">
        <div className="cabinet-user-info">
          <div className="cabinet-avatar-wrap">
            {person.photo || trainerPhoto ? (
              <img src={person.photo || trainerPhoto} alt={person.first_name} className="cabinet-avatar" />
            ) : (
              <div className="cabinet-avatar-placeholder">
                {(person.first_name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="cabinet-user-details">
            <div className="cabinet-name-row">
              <h2>{publicName || `${person.first_name} ${person.last_name}`}</h2>
              {isTrainer && (
                <span
                  className={
                    roles.trainer_verification_status === 'Verified' ? 'badge-verified' : 'badge-pending-verify'
                  }
                >
                  {roles.trainer_verification_status === 'Verified' ? 'Подтвержден ✓' : 'На проверке ⏳'}
                </span>
              )}
            </div>
            <div className="cabinet-sub-row">
              <span>{person.city || 'Город не указан'}</span>
              {person.phone && <span> • {person.phone}</span>}
            </div>
            <div className="cabinet-roles-row">
              <span className="role-chip">Роли:</span>
              {isTrainer && <span className="role-badge role-badge-trainer">Тренер</span>}
              {isAthlete && <span className="role-badge role-badge-athlete">Танцор</span>}
            </div>
          </div>
        </div>

        {/* Action: Connect second role */}
        <div className="cabinet-header-actions">
          {!isTrainer && (
            <button
              type="button"
              className="secondary-button add-role-btn"
              onClick={() => void handleActivateRole('trainer')}
            >
              + Подключить роль Тренера
            </button>
          )}
          {!isAthlete && (
            <button
              type="button"
              className="secondary-button add-role-btn"
              onClick={() => void handleActivateRole('athlete')}
            >
              + Подключить роль Танцора
            </button>
          )}
          <button type="button" className="ghost-button" onClick={() => navigate('/dashboard')}>
            ← В Дашборд
          </button>
        </div>
      </header>

      {/* Global Alerts */}
      {successMessage && (
        <div className="cabinet-success-banner" role="status">
          ✓ {successMessage}
          <button type="button" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}
      {apiError && (
        <div className="form-error" role="alert">
          ⚠️ {apiError}
          <button type="button" onClick={() => setApiError(null)}>×</button>
        </div>
      )}

      {/* Tabs Menu */}
      <nav className="cabinet-tabs" aria-label="Меню кабинета">
        {isTrainer && (
          <>
            <button
              type="button"
              className={`cabinet-tab ${activeTab === 'trainer_profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('trainer_profile')}
            >
              👤 Профиль тренера
            </button>
            <button
              type="button"
              className={`cabinet-tab ${activeTab === 'trainer_students' ? 'active' : ''}`}
              onClick={() => setActiveTab('trainer_students')}
            >
              👥 Мои ученики
              {incomingRequests.length > 0 && <span className="tab-badge">{incomingRequests.length}</span>}
            </button>
            <button
              type="button"
              className={`cabinet-tab ${activeTab === 'trainer_trainings' ? 'active' : ''}`}
              onClick={() => setActiveTab('trainer_trainings')}
            >
              🏋️ Мои тренировки
            </button>
            <button
              type="button"
              className={`cabinet-tab ${activeTab === 'trainer_master_classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('trainer_master_classes')}
            >
              🌟 Мои мастер-классы
            </button>
          </>
        )}
        {isAthlete && (
          <>
            <button
              type="button"
              className={`cabinet-tab ${activeTab === 'athlete_profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('athlete_profile')}
            >
              🩰 Профиль и прикрепления
              {((athleteData?.trainers.incoming.length || 0) + (athleteData?.clubs.invited.length || 0)) > 0 && (
                <span className="tab-badge">
                  {(athleteData?.trainers.incoming.length || 0) + (athleteData?.clubs.invited.length || 0)}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`cabinet-tab ${activeTab === 'athlete_booking' ? 'active' : ''}`}
              onClick={() => setActiveTab('athlete_booking')}
            >
              📅 Запись на тренировки
            </button>
          </>
        )}
      </nav>

      {/* Tab 1: Trainer Profile */}
      {isTrainer && activeTab === 'trainer_profile' && (
        <section className="cabinet-card tab-content-card">
          <h3>Редактирование профиля тренера</h3>
          <form onSubmit={(e) => void handleSaveProfile(e)} className="cabinet-form">
            <div className="form-row">
              <label htmlFor="publicName">
                Публичное имя тренера *
                <input
                  id="publicName"
                  type="text"
                  value={publicName}
                  onChange={(e) => setPublicName(e.target.value)}
                  required
                />
              </label>
              <CitySelectInput
                cityLabel="Город преподавания"
                city={city}
                onCityChange={setCity}
                countryCode="KZ"
              />
            </div>

            <div className="form-row">
              <div className="phone-field-wrapper">
                <span className="field-label">Номер телефона</span>
                <CountryPhoneInput
                  id="trainerPhone"
                  value={phone}
                  onChange={setPhone}
                  defaultCountry="KZ"
                />
              </div>
              <label htmlFor="defaultDuration">
                Стандартная длительность тренировки (мин)
                <input
                  id="defaultDuration"
                  type="number"
                  min="15"
                  step="15"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(e.target.value)}
                />
              </label>
            </div>

            <label htmlFor="bio">
              О себе / Биография
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите о своем танцевальном пути и подходе к обучению…"
              />
            </label>

            <div className="form-row">
              <label htmlFor="experience">
                Опыт преподавания
                <input
                  id="experience"
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Например: 8 лет"
                />
              </label>
              <label htmlFor="qualification">
                Квалификация / Категория
                <input
                  id="qualification"
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="Например: Мастер спорта, судья 1 категории"
                />
              </label>
            </div>

            <div className="form-row">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={bookingEnabled}
                  onChange={(e) => setBookingEnabled(e.target.checked)}
                />
                <span>Разрешить запись на индивидуальные тренировки</span>
              </label>
            </div>

            <div>
              <span className="field-label">Фото профиля</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void handlePhotoUpload(e)}
                disabled={uploadingPhoto}
              />
              {uploadingPhoto && <p className="helper-note">Загрузка фото…</p>}
            </div>

            <div>
              <span className="field-label">Танцевальные направления преподавания</span>
              <div className="chips-grid">
                {catalogs.directions.map((d) => {
                  const active = trainerDirections.includes(d.name)
                  return (
                    <button
                      key={d.name}
                      type="button"
                      className={`chip-button ${active ? 'chip-button-active' : ''}`}
                      onClick={() => setTrainerDirections((prev) => toggleItem(prev, d.name))}
                    >
                      {d.title}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <span className="field-label">Клубы преподавания</span>
              <div className="chips-grid">
                {catalogs.clubs.map((cl) => {
                  const active = trainerClubs.includes(cl.name)
                  return (
                    <button
                      key={cl.name}
                      type="button"
                      className={`chip-button ${active ? 'chip-button-active' : ''}`}
                      onClick={() => setTrainerClubs((prev) => toggleItem(prev, cl.name))}
                    >
                      {cl.club_name}
                    </button>
                  )
                })}
              </div>
            </div>

            <button type="submit" className="primary-button" disabled={savingProfile}>
              {savingProfile ? 'Сохранение…' : 'Сохранить профиль тренера'}
            </button>
          </form>
        </section>
      )}

      {/* Tab 2: Trainer Students */}
      {isTrainer && activeTab === 'trainer_students' && (
        <section className="cabinet-card tab-content-card">
          <div className="section-head">
            <h3>Управление учениками</h3>
            <p className="helper-note">Поиск танцора по номеру телефона для отправки заявки на прикрепление</p>
          </div>

          <div className="student-search-box">
            <span className="field-label">Поиск танцора по номеру телефона</span>
            <CountryPhoneInput
              id="studentSearchPhone"
              value={studentSearchPhone}
              onChange={handleStudentPhoneChange}
              defaultCountry="KZ"
              placeholder="+7 701 000 00 00"
              disabled={searchingStudent}
            />

            {studentPhoneWarning && (
              <div className="trainer-warning-banner" role="status">
                ⚠️ {studentPhoneWarning}
              </div>
            )}

            {searchingStudent && <p className="helper-note">Поиск танцора…</p>}

            {studentNotFound && !searchingStudent && !studentPhoneWarning && (
              <div className="trainer-not-found-banner" role="alert">
                По данному номеру телефона танцор не найден
              </div>
            )}

            {foundStudent && (
              <div className="trainer-found-card">
                <div className="trainer-found-main">
                  {foundStudent.photo ? (
                    <img src={foundStudent.photo} alt={foundStudent.full_name} className="trainer-avatar-small" />
                  ) : (
                    <div className="trainer-avatar-placeholder">
                      {foundStudent.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="trainer-found-info">
                    <strong className="trainer-public-name">{foundStudent.full_name}</strong>
                    {foundStudent.city && <span className="trainer-city-sub">{foundStudent.city}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void handleSendStudentRequest(foundStudent.athlete_profile)}
                >
                  + Отправить заявку на прикрепление
                </button>
              </div>
            )}
          </div>

          {/* Incoming requests from dancers */}
          {incomingRequests.length > 0 && (
            <div className="requests-subgroup">
              <h4>Входящие заявки от танцоров ({incomingRequests.length})</h4>
              <div className="cards-grid">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="student-card">
                    <div className="student-card-info">
                      <strong>{req.full_name}</strong>
                      <span>{req.city || 'Город не указан'}</span>
                      {req.phone && <span>тел: {req.phone}</span>}
                    </div>
                    <div className="card-btn-group">
                      <button
                        type="button"
                        className="primary-button small-btn"
                        onClick={() => void handleRespondRequest(req.id, 'accept')}
                      >
                        Принять
                      </button>
                      <button
                        type="button"
                        className="secondary-button small-btn"
                        onClick={() => void handleRespondRequest(req.id, 'reject')}
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing requests to dancers */}
          {outgoingRequests.length > 0 && (
            <div className="requests-subgroup">
              <h4>Исходящие заявки танцорам ({outgoingRequests.length})</h4>
              <div className="cards-grid">
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="student-card">
                    <div className="student-card-info">
                      <strong>{req.full_name}</strong>
                      <span className="badge-pending">Ожидает подтверждения танцором</span>
                    </div>
                    <button
                      type="button"
                      className="ghost-button small-btn"
                      onClick={() => void handleRespondRequest(req.id, 'cancel')}
                    >
                      Отозвать
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active students list */}
          <div className="requests-subgroup">
            <h4>Активные ученики ({activeStudents.length})</h4>
            {activeStudents.length === 0 ? (
              <p className="helper-note">У вас пока нет прикрепленных учеников.</p>
            ) : (
              <div className="cards-grid">
                {activeStudents.map((st) => (
                  <div key={st.id} className="student-card">
                    <div className="student-card-info">
                      <strong>{st.full_name}</strong>
                      {st.city && <span>{st.city}</span>}
                      {st.phone && <span>тел: {st.phone}</span>}
                      {st.from_date && <span className="helper-note">С нами с: {st.from_date}</span>}
                    </div>
                    <button
                      type="button"
                      className="ghost-button small-btn danger-link"
                      onClick={() => void handleRespondRequest(st.id, 'remove')}
                    >
                      Открепить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab 3: Trainer Trainings (Offerings + Slots) */}
      {isTrainer && activeTab === 'trainer_trainings' && (
        <section className="cabinet-card tab-content-card">
          <div className="section-head-row">
            <div>
              <h3>Тренировки: Программы и Расписание</h3>
              <p className="helper-note">Создавайте шаблоны тренировок и добавляйте слоты в расписание</p>
            </div>
            <div className="head-btn-row">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowOfferingModal(true)}
              >
                + Создать программу
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (trainingsData?.offerings.length) {
                    setSlotOfferingId(trainingsData.offerings[0].id)
                  }
                  setShowSlotModal(true)
                }}
                disabled={!trainingsData?.offerings.length}
              >
                + Добавить в расписание
              </button>
            </div>
          </div>

          {/* Offerings list */}
          <div className="sub-section">
            <h4>Программы и шаблоны тренировок</h4>
            {!trainingsData?.offerings.length ? (
              <p className="helper-note">Программы тренировок пока не созданы. Нажмите «+ Создать программу».</p>
            ) : (
              <div className="cards-grid">
                {trainingsData.offerings.map((off) => (
                  <div key={off.id} className="offering-card">
                    <div className="offering-head">
                      <strong>{off.title}</strong>
                      <span className="badge-pill">
                        {off.training_type === 'Individual' ? 'Индивидуальная' : 'Групповая'}
                      </span>
                    </div>
                    <div className="offering-details">
                      <span>Направление: {off.direction_title || off.direction}</span>
                      <span>Длительность: {off.duration_minutes} мин</span>
                      <span>
                        Места: {off.has_capacity_limit ? `до ${off.capacity} чел.` : 'Без ограничений'}
                      </span>
                      <span>Цена: {off.price.toLocaleString()} {off.currency}</span>
                      {off.default_venue_title && <span>Зал: {off.default_venue_title}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Slots in schedule */}
          <div className="sub-section">
            <h4>Слоты в расписании</h4>
            {!trainingsData?.slots.length ? (
              <p className="helper-note">Слоты расписания пока не добавлены.</p>
            ) : (
              <div className="cards-grid">
                {trainingsData.slots.map((sl) => (
                  <div key={sl.id} className="slot-card">
                    <div className="slot-head">
                      <strong>{sl.offering_title}</strong>
                      <span className={`status-pill ${sl.status.toLowerCase()}`}>
                        {sl.status === 'Available' ? 'Доступен' : sl.status === 'Full' ? 'Заполнен' : sl.status}
                      </span>
                    </div>
                    <div className="slot-time">
                      <span>📅 {formatDateTime(sl.start_datetime)}</span>
                    </div>
                    <div className="slot-meta">
                      {sl.venue_title && <span>📍 {sl.venue_title}</span>}
                      <span>
                        👥 Занято: {sl.booked_count}{' '}
                        {sl.has_capacity_limit ? `/ ${sl.capacity}` : '(без лимита)'}
                      </span>
                      <span>💰 {sl.price.toLocaleString()} {sl.currency}</span>
                    </div>
                    {sl.participants && sl.participants.length > 0 && (
                      <div className="slot-participants">
                        <span className="field-label" style={{ fontSize: '11px' }}>Записавшиеся:</span>
                        <div className="participants-list">
                          {sl.participants.map((p) => (
                            <span key={p.booking_id} className="participant-chip">
                              {p.participant_name} ({p.status === 'Booked' ? 'Оплачено' : p.status})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal: Create Offering */}
          {showOfferingModal && (
            <div className="modal-backdrop" role="dialog" aria-modal="true">
              <div className="modal-card">
                <div className="modal-header">
                  <h3>Новая программа тренировки</h3>
                  <button type="button" className="modal-close-btn" onClick={() => setShowOfferingModal(false)}>×</button>
                </div>
                <form onSubmit={(e) => void handleSaveOffering(e)} className="modal-form">
                  <label htmlFor="offTitle">
                    Название программы *
                    <input
                      id="offTitle"
                      type="text"
                      value={offeringTitle}
                      onChange={(e) => setOfferingTitle(e.target.value)}
                      placeholder="Например: Индивидуальная подготовка к турниру"
                      required
                    />
                  </label>
                  <div className="form-row">
                    <label htmlFor="offType">
                      Тип
                      <select id="offType" value={offeringType} onChange={(e) => setOfferingType(e.target.value as 'Individual' | 'Group')}>
                        <option value="Individual">Индивидуальная</option>
                        <option value="Group">Групповая</option>
                      </select>
                    </label>
                    <label htmlFor="offDir">
                      Направление *
                      <select
                        id="offDir"
                        value={offeringDirection}
                        onChange={(e) => setOfferingDirection(e.target.value)}
                        required
                      >
                        <option value="">Выберите направление</option>
                        {catalogs.directions.map((d) => (
                          <option key={d.name} value={d.name}>{d.title}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="form-row">
                    <label htmlFor="offDuration">
                      Длительность (мин)
                      <input
                        id="offDuration"
                        type="number"
                        min="15"
                        step="15"
                        value={offeringDuration}
                        onChange={(e) => setOfferingDuration(e.target.value)}
                      />
                    </label>
                    <label htmlFor="offPrice">
                      Цена (KZT)
                      <input
                        id="offPrice"
                        type="number"
                        min="0"
                        step="500"
                        value={offeringPrice}
                        onChange={(e) => setOfferingPrice(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="form-row">
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={offeringHasCapacityLimit}
                        onChange={(e) => setOfferingHasCapacityLimit(e.target.checked)}
                      />
                      <span>Ограничить количество мест</span>
                    </label>
                    {offeringHasCapacityLimit && (
                      <label htmlFor="offCap">
                        Макс. участников
                        <input
                          id="offCap"
                          type="number"
                          min="1"
                          value={offeringCapacity}
                          onChange={(e) => setOfferingCapacity(e.target.value)}
                        />
                      </label>
                    )}
                  </div>
                  <DebouncedSearchSelect
                    id="offVenue"
                    label="Зал по умолчанию"
                    value={offeringVenue}
                    selectedTitle={offeringVenueTitle}
                    onChange={(name, title) => {
                      setOfferingVenue(name)
                      setOfferingVenueTitle(title)
                    }}
                    fetchOptions={handleFetchVenues}
                    placeholder="Поиск зала по названию или городу…"
                  />
                  <div className="modal-actions">
                    <button type="submit" className="primary-button" disabled={savingOffering}>
                      {savingOffering ? 'Сохранение…' : 'Сохранить шаблон'}
                    </button>
                    <button type="button" className="secondary-button" onClick={() => setShowOfferingModal(false)}>
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Create Slots */}
          {showSlotModal && (
            <div className="modal-backdrop" role="dialog" aria-modal="true">
              <div className="modal-card">
                <div className="modal-header">
                  <h3>Добавление в расписание</h3>
                  <button type="button" className="modal-close-btn" onClick={() => setShowSlotModal(false)}>×</button>
                </div>
                <form onSubmit={(e) => void handleCreateSlots(e)} className="modal-form">
                  <label htmlFor="slotOff">
                    Программа тренировки *
                    <select
                      id="slotOff"
                      value={slotOfferingId}
                      onChange={(e) => setSlotOfferingId(e.target.value)}
                      required
                    >
                      {trainingsData?.offerings.map((o) => (
                        <option key={o.id} value={o.id}>{o.title} ({o.training_type})</option>
                      ))}
                    </select>
                  </label>

                  <div className="form-row">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="slotMode"
                        checked={slotMode === 'single'}
                        onChange={() => setSlotMode('single')}
                      />
                      Разовый слот
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="slotMode"
                        checked={slotMode === 'recurring'}
                        onChange={() => setSlotMode('recurring')}
                      />
                      Серия по расписанию
                    </label>
                  </div>

                  {slotMode === 'single' ? (
                    <div className="form-row">
                      <label htmlFor="slotStart">
                        Дата и время начала *
                        <input
                          id="slotStart"
                          type="datetime-local"
                          value={slotStartDatetime}
                          onChange={(e) => setSlotStartDatetime(e.target.value)}
                          required
                        />
                      </label>
                      <label htmlFor="slotDur">
                        Длительность (мин)
                        <input
                          id="slotDur"
                          type="number"
                          min="15"
                          step="15"
                          value={slotDuration}
                          onChange={(e) => setSlotDuration(e.target.value)}
                        />
                      </label>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="field-label">Дни недели серии:</span>
                        <div className="chips-grid">
                          {[
                            { id: 'Monday', label: 'Пн' },
                            { id: 'Tuesday', label: 'Вт' },
                            { id: 'Wednesday', label: 'Ср' },
                            { id: 'Thursday', label: 'Чт' },
                            { id: 'Friday', label: 'Пт' },
                            { id: 'Saturday', label: 'Сб' },
                            { id: 'Sunday', label: 'Вс' },
                          ].map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              className={`chip-button ${slotWeekdays.includes(d.id) ? 'chip-button-active' : ''}`}
                              onClick={() => setSlotWeekdays((prev) => toggleItem(prev, d.id))}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="form-row">
                        <label htmlFor="slotTime">
                          Время начала (ЧЧ:ММ)
                          <input
                            id="slotTime"
                            type="time"
                            value={slotStartTime}
                            onChange={(e) => setSlotStartTime(e.target.value)}
                            required
                          />
                        </label>
                        <label htmlFor="slotDurRec">
                          Длительность (мин)
                          <input
                            id="slotDurRec"
                            type="number"
                            min="15"
                            step="15"
                            value={slotDuration}
                            onChange={(e) => setSlotDuration(e.target.value)}
                          />
                        </label>
                      </div>
                      <div className="form-row">
                        <label htmlFor="slotFrom">
                          С даты
                          <input
                            id="slotFrom"
                            type="date"
                            value={slotValidFrom}
                            onChange={(e) => setSlotValidFrom(e.target.value)}
                          />
                        </label>
                        <label htmlFor="slotTo">
                          По дату
                          <input
                            id="slotTo"
                            type="date"
                            value={slotValidTo}
                            onChange={(e) => setSlotValidTo(e.target.value)}
                          />
                        </label>
                      </div>
                    </>
                  )}

                  <div className="form-row">
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={slotHasCapLimit}
                        onChange={(e) => setSlotHasCapLimit(e.target.checked)}
                      />
                      <span>Ограничить количество мест</span>
                    </label>
                    {slotHasCapLimit && (
                      <label htmlFor="slotCapInput">
                        Мест
                        <input
                          id="slotCapInput"
                          type="number"
                          min="1"
                          value={slotCap}
                          onChange={(e) => setSlotCap(e.target.value)}
                        />
                      </label>
                    )}
                  </div>

                  <div className="form-row">
                    <label htmlFor="slotPriceInput">
                      Цена (KZT)
                      <input
                        id="slotPriceInput"
                        type="number"
                        min="0"
                        step="500"
                        value={slotPrice}
                        onChange={(e) => setSlotPrice(e.target.value)}
                      />
                    </label>
                  </div>

                  <DebouncedSearchSelect
                    id="slotVenueSearch"
                    label="Зал проведения"
                    value={slotVenue}
                    selectedTitle={slotVenueTitle}
                    onChange={(name, title) => {
                      setSlotVenue(name)
                      setSlotVenueTitle(title)
                    }}
                    fetchOptions={handleFetchVenues}
                    placeholder="Поиск зала по названию или городу…"
                  />

                  <div className="modal-actions">
                    <button type="submit" className="primary-button" disabled={savingSlot}>
                      {savingSlot ? 'Создание…' : 'Добавить в расписание'}
                    </button>
                    <button type="button" className="secondary-button" onClick={() => setShowSlotModal(false)}>
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 4: Trainer Master Classes */}
      {isTrainer && activeTab === 'trainer_master_classes' && (
        <section className="cabinet-card tab-content-card">
          <div className="section-head-row">
            <div>
              <h3>Мои мастер-классы</h3>
              <p className="helper-note">Публикуйте мастер-классы с конструктором слотов и пакетов прямо в общую афишу</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowMcModal(true)}
            >
              + Создать мастер-класс
            </button>
          </div>

          {!masterClasses.length ? (
            <p className="helper-note">Вы пока не создали ни одного мастер-класса.</p>
          ) : (
            <div className="cards-grid">
              {masterClasses.map((mc) => (
                <div key={mc.id} className="mc-card">
                  <div className="mc-head">
                    <strong>{mc.title}</strong>
                    <span className="badge-verified">Опубликован ✓</span>
                  </div>
                  <div className="mc-meta">
                    <span>📅 {formatDateTime(mc.start_datetime)} — {formatDateTime(mc.end_datetime)}</span>
                    {mc.venue_title && <span>📍 {mc.venue_title}</span>}
                    <span>Слотов: {mc.slots.length} | Пакетов: {mc.packages.length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal: Create Master Class */}
          {showMcModal && (
            <div className="modal-backdrop" role="dialog" aria-modal="true">
              <div className="modal-card modal-large">
                <div className="modal-header">
                  <h3>Конструктор мастер-класса</h3>
                  <button type="button" className="modal-close-btn" onClick={() => setShowMcModal(false)}>×</button>
                </div>
                <form onSubmit={(e) => void handleCreateMc(e)} className="modal-form">
                  <label htmlFor="mcTitleInput">
                    Название мастер-класса *
                    <input
                      id="mcTitleInput"
                      type="text"
                      value={mcTitle}
                      onChange={(e) => setMcTitle(e.target.value)}
                      placeholder="Например: Интенсив по Bachata Sensual"
                      required
                    />
                  </label>
                  <label htmlFor="mcDescInput">
                    Описание программы
                    <textarea
                      id="mcDescInput"
                      rows={2}
                      value={mcDescription}
                      onChange={(e) => setMcDescription(e.target.value)}
                    />
                  </label>
                  <label htmlFor="mcCoverInput">
                    Обложка мастер-класса (URL)
                    <input
                      id="mcCoverInput"
                      type="text"
                      value={mcCover}
                      onChange={(e) => setMcCover(e.target.value)}
                      placeholder="https://… или путь к фото"
                    />
                  </label>
                  <DebouncedSearchSelect
                    id="mcVenueSearch"
                    label="Основной зал проведения"
                    value={mcVenue}
                    selectedTitle={mcVenueTitle}
                    onChange={(name, title) => {
                      setMcVenue(name)
                      setMcVenueTitle(title)
                    }}
                    fetchOptions={handleFetchVenues}
                    placeholder="Поиск зала…"
                  />

                  {/* Slots Section */}
                  <div className="sub-constructor">
                    <div className="sub-constructor-head">
                      <strong>Слоты мастер-класса ({mcSlots.length})</strong>
                      <button
                        type="button"
                        className="secondary-button small-btn"
                        onClick={() => {
                          const newKey = `slot_${mcSlots.length + 1}`
                          setMcSlots((prev) => [
                            ...prev,
                            { client_key: newKey, start_datetime: '', end_datetime: '', has_capacity_limit: true, capacity: 25, price: 5000 },
                          ])
                        }}
                      >
                        + Добавить слот
                      </button>
                    </div>

                    {mcSlots.map((s, idx) => (
                      <div key={s.client_key} className="constructor-item-row">
                        <span>#{idx + 1}</span>
                        <input
                          type="datetime-local"
                          value={s.start_datetime}
                          onChange={(e) => {
                            const val = e.target.value
                            setMcSlots((prev) => prev.map((item) => (item.client_key === s.client_key ? { ...item, start_datetime: val } : item)))
                          }}
                          required
                        />
                        <input
                          type="datetime-local"
                          value={s.end_datetime}
                          onChange={(e) => {
                            const val = e.target.value
                            setMcSlots((prev) => prev.map((item) => (item.client_key === s.client_key ? { ...item, end_datetime: val } : item)))
                          }}
                          required
                        />
                        <input
                          type="number"
                          placeholder="Цена"
                          value={s.price}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setMcSlots((prev) => prev.map((item) => (item.client_key === s.client_key ? { ...item, price: val } : item)))
                          }}
                          style={{ width: '90px' }}
                        />
                        <input
                          type="number"
                          placeholder="Мест"
                          value={s.capacity}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setMcSlots((prev) => prev.map((item) => (item.client_key === s.client_key ? { ...item, capacity: val } : item)))
                          }}
                          style={{ width: '70px' }}
                        />
                        {mcSlots.length > 1 && (
                          <button
                            type="button"
                            className="ghost-button small-btn"
                            onClick={() => setMcSlots((prev) => prev.filter((item) => item.client_key !== s.client_key))}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Packages Section */}
                  <div className="sub-constructor">
                    <div className="sub-constructor-head">
                      <strong>Пакеты мастер-класса ({mcPackages.length})</strong>
                      <button
                        type="button"
                        className="secondary-button small-btn"
                        onClick={() => {
                          setMcPackages((prev) => [
                            ...prev,
                            { title: 'Full Pass', price: 8000, slot_keys: mcSlots.map((s) => s.client_key) },
                          ])
                        }}
                      >
                        + Добавить пакет
                      </button>
                    </div>

                    {mcPackages.map((pkg, pIdx) => (
                      <div key={pIdx} className="package-item-box">
                        <div className="form-row">
                          <input
                            type="text"
                            placeholder="Название пакета"
                            value={pkg.title}
                            onChange={(e) => {
                              const val = e.target.value
                              setMcPackages((prev) => prev.map((p, i) => (i === pIdx ? { ...p, title: val } : p)))
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Спец. цена"
                            value={pkg.price}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              setMcPackages((prev) => prev.map((p, i) => (i === pIdx ? { ...p, price: val } : p)))
                            }}
                          />
                          <button
                            type="button"
                            className="ghost-button small-btn"
                            onClick={() => setMcPackages((prev) => prev.filter((_, i) => i !== pIdx))}
                          >
                            Удалить пакет
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="modal-actions">
                    <button type="submit" className="primary-button" disabled={savingMc}>
                      {savingMc ? 'Публикация…' : 'Опубликовать мастер-класс'}
                    </button>
                    <button type="button" className="secondary-button" onClick={() => setShowMcModal(false)}>
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 5: Athlete Profile & Attachments */}
      {isAthlete && activeTab === 'athlete_profile' && (
        <div className="tab-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section 1: Личные данные и танцевальная анкета */}
          <section className="cabinet-card tab-content-card">
            <div className="section-head">
              <h3>Профиль танцора</h3>
              <p className="helper-note">Персональная информация и танцевальные предпочтения</p>
            </div>

            <form onSubmit={(e) => void handleSaveAthleteProfile(e)} className="cabinet-form">
              {/* Photo Upload */}
              <div className="avatar-upload-row">
                <div className="cabinet-avatar-wrap">
                  {athletePhoto ? (
                    <img src={athletePhoto} alt={athleteFirstName} className="cabinet-avatar" />
                  ) : (
                    <div className="cabinet-avatar-placeholder">
                      {(athleteFirstName || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="avatar-upload-info">
                  <label htmlFor="athPhotoInput" className="secondary-button upload-btn">
                    {uploadingAthletePhoto ? 'Загрузка…' : 'Загрузить фото профиля'}
                    <input
                      id="athPhotoInput"
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleAthletePhotoUpload(e)}
                      disabled={uploadingAthletePhoto}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span className="helper-note">PNG, JPG до 5 МБ</span>
                </div>
              </div>

              {/* Personal Info */}
              <div className="form-row">
                <label htmlFor="athLastName">
                  Фамилия *
                  <input
                    id="athLastName"
                    type="text"
                    value={athleteLastName}
                    onChange={(e) => setAthleteLastName(e.target.value)}
                    required
                  />
                </label>
                <label htmlFor="athFirstName">
                  Имя *
                  <input
                    id="athFirstName"
                    type="text"
                    value={athleteFirstName}
                    onChange={(e) => setAthleteFirstName(e.target.value)}
                    required
                  />
                </label>
                <label htmlFor="athMiddleName">
                  Отчество
                  <input
                    id="athMiddleName"
                    type="text"
                    value={athleteMiddleName}
                    onChange={(e) => setAthleteMiddleName(e.target.value)}
                  />
                </label>
              </div>

              <div className="form-row">
                <label htmlFor="athDob">
                  Дата рождения *
                  <input
                    id="athDob"
                    type="date"
                    value={athleteDob}
                    onChange={(e) => setAthleteDob(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </label>
                <label htmlFor="athGender">
                  Пол
                  <select
                    id="athGender"
                    value={athleteGender}
                    onChange={(e) => setAthleteGender(e.target.value)}
                  >
                    <option value="Male">Мужской</option>
                    <option value="Female">Женский</option>
                    <option value="Other">Другой</option>
                  </select>
                </label>
              </div>

              <div className="form-row">
                <div className="phone-field-wrapper">
                  <span className="field-label">Номер телефона</span>
                  <CountryPhoneInput
                    id="athletePhone"
                    value={athletePhone}
                    onChange={setAthletePhone}
                    defaultCountry={(athleteCountry as Country) || 'KZ'}
                  />
                </div>
                <CitySelectInput
                  cityLabel="Город"
                  city={athleteCity}
                  onCityChange={setAthleteCity}
                  countryCode={athleteCountry || 'KZ'}
                />
              </div>

              {/* Dance Details */}
              <div className="form-row">
                <label htmlFor="athLevel">
                  Уровень танцора
                  <select
                    id="athLevel"
                    value={athleteLevel}
                    onChange={(e) => setAthleteLevel(e.target.value)}
                  >
                    <option value="">Без уровня / Не указан</option>
                    {(catalogs?.levels || []).map((lvl) => (
                      <option key={lvl.name} value={lvl.name}>
                        {lvl.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="directions-selection">
                <span className="field-label">Танцевальные направления</span>
                <div className="chips-cloud">
                  {(catalogs?.directions || []).map((d) => {
                    const active = athleteDirections.includes(d.name)
                    return (
                      <button
                        key={d.name}
                        type="button"
                        className={`direction-chip ${active ? 'active' : ''}`}
                        onClick={() => setAthleteDirections((prev) => toggleItem(prev, d.name))}
                      >
                        {d.title} {active && '✓'}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={savingAthleteProfile}>
                  {savingAthleteProfile ? 'Сохранение…' : 'Сохранить профиль танцора'}
                </button>
              </div>
            </form>
          </section>

          {/* Section 2: Мои тренеры и заявки */}
          <section className="cabinet-card tab-content-card">
            <div className="section-head">
              <h3>Мои тренеры и заявки</h3>
              <p className="helper-note">Прикрепляйтесь к персональным тренерам по номеру телефона</p>
            </div>

            {/* Trainer Search by Phone */}
            <div className="student-search-box">
              <span className="field-label">Поиск тренера по номеру телефона</span>
              <div className="search-phone-row">
                <CountryPhoneInput
                  id="athTrainerPhone"
                  value={athTrainerSearchPhone}
                  onChange={handleAthTrainerPhoneChange}
                  defaultCountry="KZ"
                />
              </div>

              {athTrainerPhoneWarning && (
                <div className="phone-warning-banner" role="status">
                  ⚠️ {athTrainerPhoneWarning}
                </div>
              )}

              {searchingTrainer && <p className="helper-note">Поиск тренера в базе…</p>}

              {athTrainerNotFound && !searchingTrainer && (
                <div className="phone-not-found-banner" role="status">
                  По данному номеру телефона не был найден тренер.
                </div>
              )}

              {foundTrainer && !searchingTrainer && (
                <div className="found-student-card">
                  <div className="found-student-avatar">
                    {foundTrainer.photo ? (
                      <img src={foundTrainer.photo} alt={foundTrainer.public_name} />
                    ) : (
                      <div className="cabinet-avatar-placeholder">
                        {foundTrainer.public_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="found-student-info">
                    <div className="trainer-name-row">
                      <strong>{foundTrainer.public_name}</strong>
                      {foundTrainer.verification_status === 'Verified' && (
                        <span className="badge-verified">Подтвержден ✓</span>
                      )}
                    </div>
                    {foundTrainer.city && <span>г. {foundTrainer.city}</span>}
                    {foundTrainer.phone && <span>{foundTrainer.phone}</span>}
                  </div>
                  <button
                    type="button"
                    className="primary-button small-btn"
                    onClick={() => void handleSendTrainerRequestAction(foundTrainer.name)}
                    disabled={sendingTrainerReq}
                  >
                    {sendingTrainerReq ? 'Отправка…' : 'Отправить заявку тренеру'}
                  </button>
                </div>
              )}
            </div>

            {/* Incoming requests from trainers */}
            {(athleteData?.trainers.incoming || []).length > 0 && (
              <div className="requests-subgroup">
                <h4>Входящие заявки от тренеров ({athleteData?.trainers.incoming.length})</h4>
                <div className="cards-grid">
                  {athleteData?.trainers.incoming.map((req) => (
                    <div key={req.id} className="student-card">
                      <div className="student-card-info">
                        <div className="trainer-name-row">
                          <strong>{req.public_name}</strong>
                          {req.verification_status === 'Verified' && (
                            <span className="badge-verified">Подтвержден ✓</span>
                          )}
                        </div>
                        {req.city && <span>г. {req.city}</span>}
                        {req.phone && <span>тел: {req.phone}</span>}
                      </div>
                      <div className="card-btn-group">
                        <button
                          type="button"
                          className="primary-button small-btn"
                          onClick={() => void handleRespondTrainerAction(req.id, 'accept')}
                        >
                          Принять
                        </button>
                        <button
                          type="button"
                          className="secondary-button small-btn"
                          onClick={() => void handleRespondTrainerAction(req.id, 'reject')}
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing requests to trainers */}
            {(athleteData?.trainers.outgoing || []).length > 0 && (
              <div className="requests-subgroup">
                <h4>Исходящие заявки тренерам ({athleteData?.trainers.outgoing.length})</h4>
                <div className="cards-grid">
                  {athleteData?.trainers.outgoing.map((req) => (
                    <div key={req.id} className="student-card">
                      <div className="student-card-info">
                        <strong>{req.public_name}</strong>
                        {req.city && <span>г. {req.city}</span>}
                        <span className="badge-pending">На рассмотрении ⏳</span>
                      </div>
                      <button
                        type="button"
                        className="ghost-button small-btn danger-link"
                        onClick={() => void handleRespondTrainerAction(req.id, 'cancel')}
                      >
                        Отозвать заявку
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active trainers */}
            <div className="requests-subgroup">
              <h4>Мои тренеры ({(athleteData?.trainers.active || []).length})</h4>
              {(athleteData?.trainers.active || []).length === 0 ? (
                <p className="helper-note">Вы пока не прикреплены ни к одному тренеру.</p>
              ) : (
                <div className="cards-grid">
                  {athleteData?.trainers.active.map((tr) => (
                    <div key={tr.id} className="student-card">
                      <div className="student-card-info">
                        <strong>{tr.public_name}</strong>
                        {tr.city && <span>г. {tr.city}</span>}
                        {tr.phone && <span>тел: {tr.phone}</span>}
                        <span className="badge-active">Активен ✓</span>
                      </div>
                      <button
                        type="button"
                        className="ghost-button small-btn danger-link"
                        onClick={() => void handleRespondTrainerAction(tr.id, 'leave')}
                      >
                        Открепиться
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Студии и клубы */}
          <section className="cabinet-card tab-content-card">
            <div className="section-head">
              <h3>Студии и клубы</h3>
              <p className="helper-note">Поиск студии с задержкой 1 секунда и отправка заявок на вступление</p>
            </div>

            {/* Club Search with 1000ms debounce */}
            <div className="student-search-box">
              <div className="search-action-row">
                <DebouncedSearchSelect
                  id="clubSearch"
                  label="Поиск студии / клуба по названию"
                  value={selectedClub}
                  selectedTitle={selectedClubTitle}
                  onChange={(val, title) => {
                    setSelectedClub(val)
                    setSelectedClubTitle(title)
                  }}
                  fetchOptions={handleFetchClubs}
                  placeholder="Введите название студии…"
                  debounceMs={1000}
                />
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void handleSendClubRequestAction()}
                  disabled={!selectedClub || sendingClubReq}
                >
                  {sendingClubReq ? 'Отправка…' : 'Отправить заявку в студию'}
                </button>
              </div>
            </div>

            {/* Incoming invitations from clubs */}
            {(athleteData?.clubs.invited || []).length > 0 && (
              <div className="requests-subgroup">
                <h4>Приглашения от студий ({athleteData?.clubs.invited.length})</h4>
                <div className="cards-grid">
                  {athleteData?.clubs.invited.map((inv) => (
                    <div key={inv.id} className="membership-card">
                      <div className="membership-card-info">
                        <strong>{inv.club_title}</strong>
                        {inv.club_city && <span>г. {inv.club_city}</span>}
                        <span className="badge-invited">Приглашение ✉️</span>
                      </div>
                      <div className="card-btn-group">
                        <button
                          type="button"
                          className="primary-button small-btn"
                          onClick={() => void handleRespondClubAction(inv.id, 'accept')}
                        >
                          Принять
                        </button>
                        <button
                          type="button"
                          className="secondary-button small-btn"
                          onClick={() => void handleRespondClubAction(inv.id, 'reject')}
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing pending club requests */}
            {(athleteData?.clubs.outgoing || []).length > 0 && (
              <div className="requests-subgroup">
                <h4>Исходящие заявки в студии ({athleteData?.clubs.outgoing.length})</h4>
                <div className="cards-grid">
                  {athleteData?.clubs.outgoing.map((req) => (
                    <div key={req.id} className="membership-card">
                      <div className="membership-card-info">
                        <strong>{req.club_title}</strong>
                        {req.club_city && <span>г. {req.club_city}</span>}
                        <span className="badge-pending">На рассмотрении ⏳</span>
                      </div>
                      <button
                        type="button"
                        className="ghost-button small-btn danger-link"
                        onClick={() => void handleRespondClubAction(req.id, 'cancel')}
                      >
                        Отозвать заявку
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active clubs */}
            <div className="requests-subgroup">
              <h4>Мои студии ({(athleteData?.clubs.active || []).length})</h4>
              {(athleteData?.clubs.active || []).length === 0 ? (
                <p className="helper-note">Вы пока не состоите ни в одной студии.</p>
              ) : (
                <div className="cards-grid">
                  {athleteData?.clubs.active.map((c) => (
                    <div key={c.id} className="membership-card">
                      <div className="membership-card-info">
                        <strong>{c.club_title}</strong>
                        {c.club_city && <span>г. {c.club_city}</span>}
                        <span className="badge-active">Активен ✓</span>
                      </div>
                      <button
                        type="button"
                        className="ghost-button small-btn danger-link"
                        onClick={() => void handleRespondClubAction(c.id, 'leave')}
                      >
                        Покинуть студию
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 4: Лиги */}
          <section className="cabinet-card tab-content-card">
            <div className="section-head">
              <h3>Лиги</h3>
              <p className="helper-note">Поиск лиги с задержкой 1 секунда и отправка заявок на прикрепление</p>
            </div>

            {/* League Search with 1000ms debounce */}
            <div className="student-search-box">
              <div className="search-action-row">
                <DebouncedSearchSelect
                  id="leagueSearch"
                  label="Поиск лиги по названию"
                  value={selectedLeague}
                  selectedTitle={selectedLeagueTitle}
                  onChange={(val, title) => {
                    setSelectedLeague(val)
                    setSelectedLeagueTitle(title)
                  }}
                  fetchOptions={handleFetchLeagues}
                  placeholder="Введите название лиги…"
                  debounceMs={1000}
                />
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void handleSendLeagueRequestAction()}
                  disabled={!selectedLeague || sendingLeagueReq}
                >
                  {sendingLeagueReq ? 'Отправка…' : 'Отправить заявку в лигу'}
                </button>
              </div>
            </div>

            {/* Outgoing pending league requests */}
            {(athleteData?.leagues.outgoing || []).length > 0 && (
              <div className="requests-subgroup">
                <h4>Исходящие заявки в лиги ({athleteData?.leagues.outgoing.length})</h4>
                <div className="cards-grid">
                  {athleteData?.leagues.outgoing.map((req) => (
                    <div key={req.id} className="membership-card">
                      <div className="membership-card-info">
                        <strong>{req.league_title}</strong>
                        <span className="badge-pending">На рассмотрении ⏳</span>
                      </div>
                      <button
                        type="button"
                        className="ghost-button small-btn danger-link"
                        onClick={() => void handleRespondLeagueAction(req.id, 'cancel')}
                      >
                        Отозвать заявку
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active leagues */}
            <div className="requests-subgroup">
              <h4>Мои лиги ({(athleteData?.leagues.active || []).length})</h4>
              {(athleteData?.leagues.active || []).length === 0 ? (
                <p className="helper-note">Вы пока не состоите ни в одной лиге.</p>
              ) : (
                <div className="cards-grid">
                  {athleteData?.leagues.active.map((l) => (
                    <div key={l.id} className="membership-card">
                      <div className="membership-card-info">
                        <strong>{l.league_title}</strong>
                        <span className="badge-active">Активен ✓</span>
                      </div>
                      <button
                        type="button"
                        className="ghost-button small-btn danger-link"
                        onClick={() => void handleRespondLeagueAction(l.id, 'leave')}
                      >
                        Открепиться
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 5: Федерации */}
          <section className="cabinet-card tab-content-card">
            <div className="section-head">
              <h3>Федерации</h3>
              <p className="helper-note">Поиск федерации с задержкой 1 секунда и отправка заявок на прикрепление</p>
            </div>

            {/* Federation Search with 1000ms debounce */}
            <div className="student-search-box">
              <div className="search-action-row">
                <DebouncedSearchSelect
                  id="federationSearch"
                  label="Поиск федерации по названию"
                  value={selectedFederation}
                  selectedTitle={selectedFederationTitle}
                  onChange={(val, title) => {
                    setSelectedFederation(val)
                    setSelectedFederationTitle(title)
                  }}
                  fetchOptions={handleFetchFederations}
                  placeholder="Введите название федерации…"
                  debounceMs={1000}
                />
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void handleSendFederationRequestAction()}
                  disabled={!selectedFederation || sendingFederationReq}
                >
                  {sendingFederationReq ? 'Отправка…' : 'Отправить заявку в федерацию'}
                </button>
              </div>
            </div>

            {/* Outgoing pending federation requests */}
            {(athleteData?.federations.outgoing || []).length > 0 && (
              <div className="requests-subgroup">
                <h4>Исходящие заявки в федерации ({athleteData?.federations.outgoing.length})</h4>
                <div className="cards-grid">
                  {athleteData?.federations.outgoing.map((req) => (
                    <div key={req.id} className="membership-card">
                      <div className="membership-card-info">
                        <strong>{req.federation_title}</strong>
                        <span className="badge-pending">На рассмотрении ⏳</span>
                      </div>
                      <button
                        type="button"
                        className="ghost-button small-btn danger-link"
                        onClick={() => void handleRespondFederationAction(req.id, 'cancel')}
                      >
                        Отозвать заявку
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active federations */}
            <div className="requests-subgroup">
              <h4>Мои федерации ({(athleteData?.federations.active || []).length})</h4>
              {(athleteData?.federations.active || []).length === 0 ? (
                <p className="helper-note">Вы пока не состоите ни в одной федерации.</p>
              ) : (
                <div className="cards-grid">
                  {athleteData?.federations.active.map((f) => (
                    <div key={f.id} className="membership-card">
                      <div className="membership-card-info">
                        <strong>{f.federation_title}</strong>
                        <span className="badge-active">Активен ✓</span>
                      </div>
                      <button
                        type="button"
                        className="ghost-button small-btn danger-link"
                        onClick={() => void handleRespondFederationAction(f.id, 'leave')}
                      >
                        Открепиться
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Tab 6: Athlete Training Booking Catalog */}
      {isAthlete && activeTab === 'athlete_booking' && (
        <section className="cabinet-card tab-content-card">
          <div className="section-head">
            <h3>Запись на тренировки</h3>
            <p className="helper-note">Выберите тренировку для записи. Место резервируется за вами на 15 минут для оплаты.</p>
          </div>

          {loadingSlots ? (
            <p className="helper-note">Загрузка доступных тренировок…</p>
          ) : availableSlots.length === 0 ? (
            <p className="helper-note">На данный момент нет доступных слотов для записи.</p>
          ) : (
            <div className="cards-grid">
              {availableSlots.map((sl) => (
                <div key={sl.id} className="catalog-slot-card">
                  <div className="slot-card-trainer">
                    {sl.trainer_photo ? (
                      <img src={sl.trainer_photo} alt={sl.trainer_name} className="trainer-avatar-small" />
                    ) : (
                      <div className="trainer-avatar-placeholder">
                        {sl.trainer_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <strong>{sl.trainer_name}</strong>
                      {sl.trainer_verification_status === 'Verified' && (
                        <span className="badge-verified">✓</span>
                      )}
                    </div>
                  </div>
                  <div className="catalog-slot-title">{sl.offering_title}</div>
                  <div className="catalog-slot-meta">
                    <span>📅 {formatDateTime(sl.start_datetime)}</span>
                    {sl.venue_title && <span>📍 {sl.venue_title} ({sl.venue_city})</span>}
                    <span>
                      {sl.has_capacity_limit ? (
                        sl.is_full ? (
                          <strong className="danger-text">Мест нет</strong>
                        ) : (
                          `Осталось мест: ${sl.available_places}`
                        )
                      ) : (
                        'Без ограничений'
                      )}
                    </span>
                  </div>
                  <div className="catalog-slot-footer">
                    <span className="catalog-slot-price">
                      {sl.price > 0 ? `${sl.price.toLocaleString()} ${sl.currency}` : 'Бесплатно'}
                    </span>
                    <button
                      type="button"
                      className="primary-button small-btn"
                      onClick={() => void handleStartBooking(sl)}
                      disabled={sl.is_full}
                    >
                      {sl.is_full ? 'Заполнено' : 'Записаться'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 15-Minute Booking Hold Modal */}
      {activeBookingSession && (
        <BookingHoldModal
          session={activeBookingSession.session}
          title={activeBookingSession.title}
          subtitle={activeBookingSession.subtitle}
          onSuccess={() => {
            setActiveBookingSession(null)
            setSuccessMessage('Запись успешно оплачена и подтверждена!')
            if (activeTab === 'athlete_booking') {
              void loadAvailableSlots()
            }
          }}
          onClose={() => {
            setActiveBookingSession(null)
            if (activeTab === 'athlete_booking') {
              void loadAvailableSlots()
            }
          }}
        />
      )}
    </div>
  )
}
