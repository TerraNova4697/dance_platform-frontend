import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FrappeApiError } from '../api/frappe'
import {
  getOnboardingContext,
  skipOnboarding,
  submitOnboarding,
  uploadProfilePhoto,
  searchLeagues,
  searchFederations,
  searchTrainerByPhone,
  type OnboardingContext,
  type TrainerSearchResult,
} from '../api/onboarding'
import { LoadingScreen } from '../components/LoadingScreen'
import { CountryPhoneInput } from '../components/CountryPhoneInput'
import { CitySelectInput } from '../components/CitySelectInput'
import { DebouncedSearchSelect } from '../components/DebouncedSearchSelect'
import {
  isValidPhoneNumber,
  getCountries,
  getCountryCallingCode,
  type Country as PhoneCountry,
} from 'react-phone-number-input'

const CALLING_CODES = new Set(getCountries().map((c) => `+${getCountryCallingCode(c)}`))

function isPhoneInputEmptyOrPrefixOnly(val: string): boolean {
  const trimmed = (val || '').trim()
  return !trimmed || trimmed === '+' || CALLING_CODES.has(trimmed)
}

type RoleChoice = 'athlete' | 'trainer'

function toggleItem(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export function OnboardingPage() {
  const navigate = useNavigate()

  const [context, setContext] = useState<OnboardingContext | null>(null)
  const [loadingContext, setLoadingContext] = useState(true)
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1: Common Dance Person + Role choice
  const [role, setRole] = useState<RoleChoice>('athlete')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('KZ')
  const [city, setCity] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Step 2A: Athlete fields
  const [athleteDirections, setAthleteDirections] = useState<string[]>([])
  const [level, setLevel] = useState('')
  const [league, setLeague] = useState('')
  const [leagueTitle, setLeagueTitle] = useState('')
  const [federation, setFederation] = useState('')
  const [federationTitle, setFederationTitle] = useState('')
  const [athleteClubs, setAthleteClubs] = useState<string[]>([])
  const [athleteTrainers, setAthleteTrainers] = useState<string[]>([])
  const [attachedTrainers, setAttachedTrainers] = useState<TrainerSearchResult[]>([])
  const [trainerSearchPhone, setTrainerSearchPhone] = useState('')
  const [searchingTrainer, setSearchingTrainer] = useState(false)
  const [trainerPhoneWarning, setTrainerPhoneWarning] = useState<string | null>(null)
  const [trainerNotFound, setTrainerNotFound] = useState(false)
  const [foundTrainer, setFoundTrainer] = useState<TrainerSearchResult | null>(null)

  // Step 2B: Trainer fields
  const [publicName, setPublicName] = useState('')
  const [trainerCity, setTrainerCity] = useState('')
  const [trainerDirections, setTrainerDirections] = useState<string[]>([])
  const [trainerClubs, setTrainerClubs] = useState<string[]>([])
  const [experience, setExperience] = useState('')
  const [qualification, setQualification] = useState('')
  const [bio, setBio] = useState('')
  const [defaultDuration, setDefaultDuration] = useState('60')

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [skipping, setSkipping] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await getOnboardingContext()
        if (!active) return
        setContext(data)
        if (data.person.date_of_birth) setDateOfBirth(data.person.date_of_birth)
        if (data.person.phone) setPhone(data.person.phone)
        if (data.person.country) setCountry(data.person.country)
        if (data.person.city) {
          setCity(data.person.city)
          setTrainerCity(data.person.city)
        }
        if (data.person.photo) setPhotoUrl(data.person.photo)
        const fullName = `${data.person.first_name} ${data.person.last_name}`.trim()
        setPublicName(fullName)
      } catch (err: unknown) {
        if (!active) return
        if (err instanceof FrappeApiError) {
          setApiError(err.message)
        } else {
          setApiError('Не удалось загрузить данные анкеты')
        }
      } finally {
        if (active) setLoadingContext(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const handleFetchLeagues = useCallback(async (q: string) => {
    return await searchLeagues(q)
  }, [])

  const handleFetchFederations = useCallback(async (q: string) => {
    return await searchFederations(q)
  }, [])

  const handleTrainerPhoneChange = useCallback(async (val: string) => {
    setTrainerSearchPhone(val)
    setTrainerPhoneWarning(null)
    setTrainerNotFound(false)
    setFoundTrainer(null)

    if (isPhoneInputEmptyOrPrefixOnly(val)) {
      return
    }

    if (!isValidPhoneNumber(val)) {
      setTrainerPhoneWarning('Номер телефона не валиден')
      return
    }

    setSearchingTrainer(true)
    try {
      const res = await searchTrainerByPhone(val)
      if (res) {
        setFoundTrainer(res)
        setTrainerNotFound(false)
      } else {
        setFoundTrainer(null)
        setTrainerNotFound(true)
      }
    } catch {
      setTrainerNotFound(true)
    } finally {
      setSearchingTrainer(false)
    }
  }, [])

  if (loadingContext) {
    return <LoadingScreen />
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setApiError(null)
    try {
      const uploadedUrl = await uploadProfilePhoto(file)
      setPhotoUrl(uploadedUrl)
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) {
        setApiError(err.message)
      } else {
        setApiError('Не удалось загрузить фото. Попробуйте другой файл.')
      }
    } finally {
      setUploadingPhoto(false)
    }
  }

  function handleAddTrainer(trainer: TrainerSearchResult) {
    if (!trainer) return
    if (!attachedTrainers.some((t) => t.name === trainer.name)) {
      setAttachedTrainers((prev) => [...prev, trainer])
      setAthleteTrainers((prev) => [...prev, trainer.name])
    }
    setFoundTrainer(null)
    setTrainerNotFound(false)
    setTrainerPhoneWarning(null)
    setTrainerSearchPhone('')
  }

  function handleRemoveTrainer(name: string) {
    setAttachedTrainers((prev) => prev.filter((t) => t.name !== name))
    setAthleteTrainers((prev) => prev.filter((n) => n !== name))
  }

  function handleNextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApiError(null)

    const errors: Record<string, string> = {}
    if (!dateOfBirth) {
      errors.dateOfBirth = 'Укажите дату рождения'
    } else if (new Date(dateOfBirth) >= new Date()) {
      errors.dateOfBirth = 'Дата рождения должна быть в прошлом'
    }

    setValidationErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (city.trim() && !trainerCity.trim()) {
      setTrainerCity(city.trim())
    }
    setStep(2)
  }

  async function handleSkip() {
    if (skipping || submitting) return
    setSkipping(true)
    setApiError(null)
    try {
      await skipOnboarding()
      navigate('/', { replace: true })
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) {
        setApiError(err.message)
      } else {
        setApiError('Не удалось пропустить шаг. Попробуйте еще раз.')
      }
    } finally {
      setSkipping(false)
    }
  }

  async function handleSubmitFinal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApiError(null)

    const errors: Record<string, string> = {}
    if (role === 'trainer') {
      if (!publicName.trim()) {
        errors.publicName = 'Укажите публичное имя тренера'
      }
      if (!trainerCity.trim()) {
        errors.trainerCity = 'Укажите город преподавания'
      }
    }

    setValidationErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      const effectiveCity = role === 'trainer' ? trainerCity.trim() : city.trim()
      await submitOnboarding({
        role,
        person: {
          date_of_birth: dateOfBirth,
          phone: phone.trim() || null,
          country: country || null,
          city: effectiveCity || null,
          photo: photoUrl || null,
        },
        athlete:
          role === 'athlete'
            ? {
                directions: athleteDirections,
                level: level || null,
                league: league || null,
                federation: federation || null,
                clubs: athleteClubs,
                trainers: athleteTrainers,
              }
            : undefined,
        trainer:
          role === 'trainer'
            ? {
                public_name: publicName.trim(),
                city: trainerCity.trim(),
                directions: trainerDirections,
                clubs: trainerClubs,
                experience: experience.trim() || null,
                qualification: qualification.trim() || null,
                bio: bio.trim() || null,
                default_training_duration: Number(defaultDuration) || 60,
                booking_enabled: 1,
              }
            : undefined,
      })
      navigate('/', { replace: true })
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) {
        setApiError(err.message)
      } else {
        setApiError('Не удалось сохранить анкету. Проверьте введенные данные.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const catalogs = context?.catalogs ?? {
    directions: [],
    levels: [],
    leagues: [],
    federations: [],
    clubs: [],
    trainers: [],
  }

  return (
    <main className="login-page">
      <section className="login-card onboarding-card" aria-labelledby="onboarding-title">
        <div className="onboarding-header">
          <div className="brand-mark" aria-hidden="true">D</div>
          <span className="step-badge">Шаг {step} из 2</span>
        </div>

        {step === 1 ? (
          <>
            <div className="login-heading">
              <p className="eyebrow">Добро пожаловать в Dance Platform</p>
              <h1 id="onboarding-title">Расскажите о себе</h1>
              <p>Выберите вашу основную роль. Вторую роль вы сможете подключить позже в профиле.</p>
            </div>

            <form className="login-form" onSubmit={handleNextStep} noValidate>
              <div className="role-selector" role="radiogroup" aria-label="Выберите вашу роль">
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'athlete'}
                  className={`role-card ${role === 'athlete' ? 'role-card-active' : ''}`}
                  onClick={() => setRole('athlete')}
                >
                  <span className="role-card-title">Я Танцор</span>
                  <span className="role-card-desc">
                    Участвую в турнирах, мастер-классах и записываюсь на тренировки
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'trainer'}
                  className={`role-card ${role === 'trainer' ? 'role-card-active' : ''}`}
                  onClick={() => setRole('trainer')}
                >
                  <span className="role-card-title">Я Тренер</span>
                  <span className="role-card-desc">
                    Веду собственные тренировки, управляю спортсменами и заявляю учеников
                  </span>
                </button>
              </div>

              <div className="form-row">
                <label htmlFor="dateOfBirth">
                  Дата рождения *
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    aria-invalid={Boolean(validationErrors.dateOfBirth)}
                    required
                  />
                  {validationErrors.dateOfBirth && (
                    <span className="field-error">{validationErrors.dateOfBirth}</span>
                  )}
                </label>

                <label htmlFor="phone">
                  Телефон
                  <CountryPhoneInput
                    id="phone"
                    value={phone}
                    onChange={setPhone}
                    defaultCountry={(country as PhoneCountry) || 'KZ'}
                    onCountryChange={(c) => {
                      if (c) setCountry(c)
                    }}
                    disabled={submitting}
                  />
                </label>
              </div>

              <CitySelectInput
                countryCode={country}
                onCountryChange={(c) => setCountry(c)}
                city={city}
                onCityChange={(val) => setCity(val)}
                disabled={submitting}
                showCountry={true}
              >
                <div className="geo-field">
                  <label htmlFor="photoFile">
                    Фото профиля
                    <input
                      id="photoFile"
                      name="photoFile"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                    {uploadingPhoto && <span className="helper-note">Загрузка фото…</span>}
                    {photoUrl && !uploadingPhoto && <span className="helper-note">Фото загружено ✓</span>}
                  </label>
                </div>
              </CitySelectInput>

              {apiError && (
                <div className="form-error" role="alert">
                  {apiError}
                </div>
              )}

              <div className="onboarding-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSkip}
                  disabled={skipping}
                >
                  {skipping ? 'Пропускаем…' : 'Пропустить сейчас'}
                </button>

                <button type="submit" className="primary-button" disabled={uploadingPhoto}>
                  Продолжить →
                </button>
              </div>
              <p className="helper-note" style={{ textAlign: 'center' }}>
                При пропуске анкеты часть функций (запись на турниры и управление тренировками) будет ограничена до заполнения профиля.
              </p>
            </form>
          </>
        ) : role === 'athlete' ? (
          <>
            <div className="login-heading">
              <p className="eyebrow">Профиль танцора</p>
              <h1 id="onboarding-title">Танцевальная деятельность</h1>
              <p>Все поля на этом шаге необязательны — вы можете указать их сейчас или позже.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmitFinal} noValidate>
              <div>
                <span className="field-label">Танцевальные направления</span>
                {catalogs.directions.length > 0 ? (
                  <div className="chips-grid">
                    {catalogs.directions.map((dir) => {
                      const active = athleteDirections.includes(dir.name)
                      return (
                        <button
                          key={dir.name}
                          type="button"
                          className={`chip-button ${active ? 'chip-button-active' : ''}`}
                          onClick={() => setAthleteDirections((prev) => toggleItem(prev, dir.name))}
                        >
                          {dir.title}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="helper-note">Список направлений пока пуст</p>
                )}
              </div>

              <div className="form-row">
                <label htmlFor="level">
                  Уровень
                  <select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
                    <option value="">Не выбран</option>
                    {catalogs.levels.map((lvl) => (
                      <option key={lvl.name} value={lvl.name}>
                        {lvl.title}
                      </option>
                    ))}
                  </select>
                </label>

                <DebouncedSearchSelect
                  id="league"
                  label="Лига"
                  value={league}
                  selectedTitle={leagueTitle}
                  onChange={(name, title) => {
                    setLeague(name)
                    setLeagueTitle(title)
                  }}
                  fetchOptions={handleFetchLeagues}
                  placeholder="Поиск лиги по названию…"
                  debounceMs={1000}
                  disabled={submitting}
                />
              </div>

              <DebouncedSearchSelect
                id="federation"
                label="Федерация"
                value={federation}
                selectedTitle={federationTitle}
                onChange={(name, title) => {
                  setFederation(name)
                  setFederationTitle(title)
                }}
                fetchOptions={handleFetchFederations}
                placeholder="Поиск федерации по названию…"
                debounceMs={1000}
                disabled={submitting}
              />

              <div>
                <span className="field-label">Клубы (будет отправлена заявка на подтверждение)</span>
                {catalogs.clubs.length > 0 ? (
                  <div className="chips-grid">
                    {catalogs.clubs.map((cl) => {
                      const active = athleteClubs.includes(cl.name)
                      return (
                        <button
                          key={cl.name}
                          type="button"
                          className={`chip-button ${active ? 'chip-button-active' : ''}`}
                          onClick={() => setAthleteClubs((prev) => toggleItem(prev, cl.name))}
                        >
                          {cl.club_name} {cl.city ? `(${cl.city})` : ''}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="helper-note">Клубы пока не добавлены</p>
                )}
              </div>

              <div className="trainer-search-group">
                <span className="field-label">Поиск тренера по номеру телефона</span>
                <p className="helper-note" style={{ margin: 0 }}>
                  Введите номер телефона тренера для отправки заявки на прикрепление
                </p>

                <CountryPhoneInput
                  id="trainerSearchPhone"
                  value={trainerSearchPhone}
                  onChange={handleTrainerPhoneChange}
                  defaultCountry={(country as PhoneCountry) || 'KZ'}
                  placeholder="+7 700 000 00 00"
                  disabled={submitting || searchingTrainer}
                />

                {trainerPhoneWarning && (
                  <div className="trainer-warning-banner" role="status">
                    <span className="warning-icon" aria-hidden="true">⚠️</span>
                    <span>{trainerPhoneWarning}</span>
                  </div>
                )}

                {searchingTrainer && (
                  <p className="helper-note">Выполняется поиск тренера…</p>
                )}

                {trainerNotFound && !searchingTrainer && !trainerPhoneWarning && (
                  <div className="trainer-not-found-banner" role="alert">
                    По данному номеру телефона тренер не найден
                  </div>
                )}

                {foundTrainer && (
                  <div className="trainer-found-card">
                    <div className="trainer-found-main">
                      {foundTrainer.photo ? (
                        <img
                          src={foundTrainer.photo}
                          alt={foundTrainer.public_name}
                          className="trainer-avatar-small"
                        />
                      ) : (
                        <div className="trainer-avatar-placeholder" aria-hidden="true">
                          {foundTrainer.public_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="trainer-found-info">
                        <div className="trainer-name-row">
                          <strong className="trainer-public-name">{foundTrainer.public_name}</strong>
                          {foundTrainer.verification_status === 'Verified' && (
                            <span className="badge-verified" title="Подтвержден">✓</span>
                          )}
                        </div>
                        {foundTrainer.city && (
                          <span className="trainer-city-sub">{foundTrainer.city}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="secondary-button add-trainer-btn"
                      onClick={() => handleAddTrainer(foundTrainer)}
                    >
                      + Прикрепить тренера
                    </button>
                  </div>
                )}

                {attachedTrainers.length > 0 && (
                  <div className="attached-trainers-list">
                    <span className="field-label" style={{ fontSize: '13px' }}>
                      Выбранные тренеры (заявка на прикрепление):
                    </span>
                    <div className="chips-grid">
                      {attachedTrainers.map((tr) => (
                        <span key={tr.name} className="trainer-chip">
                          {tr.photo && (
                            <img
                              src={tr.photo}
                              alt=""
                              className="trainer-chip-avatar"
                            />
                          )}
                          {tr.public_name}
                          {tr.verification_status === 'Verified' && ' ✓'}
                          <button
                            type="button"
                            onClick={() => handleRemoveTrainer(tr.name)}
                            aria-label={`Удалить ${tr.public_name}`}
                            title="Удалить"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {apiError && (
                <div className="form-error" role="alert">
                  {apiError}
                </div>
              )}

              <div className="onboarding-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                >
                  ← Назад
                </button>

                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting && <span className="button-spinner" aria-hidden="true" />}
                  {submitting ? 'Сохраняем…' : 'Завершить анкету'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="login-heading">
              <p className="eyebrow">Профиль тренера</p>
              <h1 id="onboarding-title">Анкета тренера</h1>
              <p>Укажите публичные данные для вашего тренерского профиля.</p>
            </div>

            <div className="moderation-banner" role="note">
              <strong>Статус верификации:</strong> После создания профиль тренера получит статус{' '}
              <em>«Не подтвержден»</em>. После проверки модератором вашему профилю будет присвоен бейдж{' '}
              <strong>«Подтвержден ✓»</strong>.
            </div>

            <form className="login-form" onSubmit={handleSubmitFinal} noValidate>
              <label htmlFor="publicName">
                Публичное имя *
                <input
                  id="publicName"
                  type="text"
                  value={publicName}
                  onChange={(e) => setPublicName(e.target.value)}
                  aria-invalid={Boolean(validationErrors.publicName)}
                  required
                />
                {validationErrors.publicName && (
                  <span className="field-error">{validationErrors.publicName}</span>
                )}
              </label>

              <CitySelectInput
                countryCode={country}
                onCountryChange={(c) => setCountry(c)}
                city={trainerCity}
                onCityChange={(val) => setTrainerCity(val)}
                cityLabel="Город преподавания"
                required={true}
                error={validationErrors.trainerCity}
                disabled={submitting}
                showCountry={true}
              />

              <div>
                <span className="field-label">Преподаваемые направления</span>
                {catalogs.directions.length > 0 ? (
                  <div className="chips-grid">
                    {catalogs.directions.map((dir) => {
                      const active = trainerDirections.includes(dir.name)
                      return (
                        <button
                          key={dir.name}
                          type="button"
                          className={`chip-button ${active ? 'chip-button-active' : ''}`}
                          onClick={() => setTrainerDirections((prev) => toggleItem(prev, dir.name))}
                        >
                          {dir.title}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="helper-note">Список направлений пока пуст</p>
                )}
              </div>

              <div>
                <span className="field-label">Клубы (будет отправлена заявка в клуб)</span>
                {catalogs.clubs.length > 0 ? (
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
                          {cl.club_name} {cl.city ? `(${cl.city})` : ''}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="helper-note">Клубы пока не добавлены</p>
                )}
              </div>

              <div className="form-row">
                <label htmlFor="experience">
                  Опыт преподавания
                  <input
                    id="experience"
                    type="text"
                    placeholder="Например: 7 лет"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </label>

                <label htmlFor="defaultDuration">
                  Длительность занятия (мин)
                  <input
                    id="defaultDuration"
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={defaultDuration}
                    onChange={(e) => setDefaultDuration(e.target.value)}
                  />
                </label>
              </div>

              <label htmlFor="qualification">
                Квалификация и регалии
                <input
                  id="qualification"
                  type="text"
                  placeholder="Судейская категория, титулы, сертификаты"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                />
              </label>

              <label htmlFor="bio">
                О себе
                <textarea
                  id="bio"
                  rows={3}
                  placeholder="Краткая информация о вашем подходе и специализации"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </label>

              {apiError && (
                <div className="form-error" role="alert">
                  {apiError}
                </div>
              )}

              <div className="onboarding-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                >
                  ← Назад
                </button>

                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting && <span className="button-spinner" aria-hidden="true" />}
                  {submitting ? 'Создаем профиль…' : 'Создать профиль тренера'}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

