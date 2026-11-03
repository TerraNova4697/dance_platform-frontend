import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FrappeApiError } from '../api/frappe'
import {
  getOnboardingContext,
  skipOnboarding,
  submitOnboarding,
  uploadProfilePhoto,
  searchFederations,
  type OnboardingContext,
} from '../api/onboarding'
import { LoadingScreen } from '../components/LoadingScreen'
import { BrandLogo } from '../components/BrandLogo'
import { CountryPhoneInput } from '../components/CountryPhoneInput'
import { CitySelectInput } from '../components/CitySelectInput'
import { AvatarCropModal } from '../components/AvatarCropModal'
import { DancerCardFields, type DancerCardState } from '../components/DancerCardFields'
import { resolveCountryCode } from '../utils/geoRu'
import { type Country as PhoneCountry } from 'react-phone-number-input'

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
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('Female')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('KZ')
  const [city, setCity] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)

  // Step 2A: Athlete Dancer Card state
  const [dancerCard, setDancerCard] = useState<DancerCardState>({
    directions: ['Европейская / Standard'],
    clubs: [],
    federation: '',
    federationTitle: '',
    standardClass: '',
    latinClass: '',
    dancesCount: 2,
    internationalCompetitions: '',
    trainingActivities: [],
    trainingFrequency: '',
    achievements: [],
    galleryPhotos: [],
    videos: [],
    socialLinks: [],
  })

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
        if (data.person.last_name) setLastName(data.person.last_name)
        if (data.person.first_name) setFirstName(data.person.first_name)
        if (data.person.middle_name) setMiddleName(data.person.middle_name)
        if (data.person.date_of_birth) setDateOfBirth(data.person.date_of_birth)
        if (data.person.gender) setGender(data.person.gender)
        if (data.person.phone) setPhone(data.person.phone)
        if (data.person.country) setCountry(resolveCountryCode(data.person.country))
        if (data.person.city) {
          setCity(data.person.city)
          setTrainerCity(data.person.city)
        }
        if (data.person.height_cm) setHeightCm(String(data.person.height_cm))
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

  const handleFetchFederations = useCallback(async (q: string) => {
    return await searchFederations(q)
  }, [])

  if (loadingContext) {
    return <LoadingScreen />
  }

  function handleSelectAvatarFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setCropFile(file)
  }

  async function handleConfirmCroppedAvatar(croppedFile: File) {
    setCropFile(null)
    setUploadingPhoto(true)
    setApiError(null)
    try {
      const uploadedUrl = await uploadProfilePhoto(croppedFile)
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

  function handleNextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApiError(null)

    const errors: Record<string, string> = {}
    if (!lastName.trim()) {
      errors.lastName = 'Укажите фамилию'
    }
    if (!firstName.trim()) {
      errors.firstName = 'Укажите имя'
    }
    if (!dateOfBirth) {
      errors.dateOfBirth = 'Укажите дату рождения'
    } else if (new Date(dateOfBirth) >= new Date()) {
      errors.dateOfBirth = 'Дата рождения должна быть в прошлом'
    }
    if (!phone.trim() || phone.trim().length < 8) {
      errors.phone = 'Укажите номер телефона'
    }
    if (!city.trim()) {
      errors.city = 'Укажите город'
    }

    if (role === 'athlete') {
      const hNum = Number(heightCm)
      if (!heightCm.trim() || Number.isNaN(hNum) || hNum < 50 || hNum > 250) {
        errors.heightCm = 'Укажите рост от 50 до 250 см'
      }
      if (!photoUrl) {
        errors.photo = 'Загрузите и кадрируйте аватар профиля'
      }
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
    if (role === 'athlete') {
      if (dancerCard.clubs.length === 0) {
        errors.clubs = 'Выберите танцевальный клуб из реестра'
      }
      if (dancerCard.directions.length === 0) {
        errors.directions = 'Выберите хотя бы одно танцевальное направление'
      }
      if (!dancerCard.standardClass) {
        errors.standardClass = 'Выберите класс европейской программы (или «Не танцую»)'
      }
      if (!dancerCard.latinClass) {
        errors.latinClass = 'Выберите класс латиноамериканской программы (или «Не танцую»)'
      }
      if (!dancerCard.internationalCompetitions) {
        errors.internationalCompetitions = 'Укажите опыт участия в международных соревнованиях'
      }
      if (dancerCard.trainingActivities.length === 0) {
        errors.trainingActivities = 'Выберите хотя бы один вариант дополнительного обучения'
      }
      if (!dancerCard.trainingFrequency) {
        errors.trainingFrequency = 'Укажите частоту дополнительного обучения'
      }
    } else if (role === 'trainer') {
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
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          middle_name: middleName.trim() || null,
          date_of_birth: dateOfBirth,
          gender: gender || null,
          phone: phone.trim() || null,
          country: country || null,
          city: effectiveCity || null,
          height_cm: heightCm ? Number(heightCm) : null,
          photo: photoUrl || null,
        },
        athlete:
          role === 'athlete'
            ? {
                directions: dancerCard.directions,
                federation: dancerCard.federation || null,
                clubs: dancerCard.clubs,
                standard_class: dancerCard.standardClass,
                latin_class: dancerCard.latinClass,
                dances_count: dancerCard.dancesCount,
                international_competitions: dancerCard.internationalCompetitions,
                training_activities: dancerCard.trainingActivities,
                training_frequency: dancerCard.trainingFrequency,
                achievements: dancerCard.achievements,
                gallery_photos: dancerCard.galleryPhotos,
                videos: dancerCard.videos,
                social_links: dancerCard.socialLinks,
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
          <BrandLogo size={32} showText={true} />
          <span className="step-badge">Шаг {step} из 2</span>
        </div>

        {step === 1 ? (
          <>
            <div className="login-heading">
              <p className="eyebrow">Добро пожаловать в on dance space</p>
              <h1 id="onboarding-title">Карточка танцора — Личные данные</h1>
              <p>Выберите вашу основную роль и заполните персональные данные профиля.</p>
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

              {/* Аватар с обязательным кадрированием */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'var(--bg-surface-subtle)',
                  border: validationErrors.photo
                    ? '1px solid rgba(244, 63, 94, 0.6)'
                    : '1px solid var(--border-default)',
                }}
              >
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 700,
                    fontSize: '24px',
                    color: 'var(--brand-accent)',
                  }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={firstName || 'Аватар'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    (firstName || 'Т').charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    Аватар профиля {role === 'athlete' ? '*' : ''}
                  </span>
                  <span className="helper-note" style={{ margin: 0 }}>
                    Загрузите фотографию и выберите область кадрирования
                  </span>
                  <div style={{ marginTop: '4px' }}>
                    <label
                      htmlFor="photoFile"
                      className="secondary-button"
                      style={{
                        display: 'inline-block',
                        cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        padding: '6px 12px',
                      }}
                    >
                      {uploadingPhoto
                        ? 'Загрузка фото…'
                        : photoUrl
                          ? 'Изменить и кадрировать фото'
                          : 'Загрузить фото'}
                      <input
                        id="photoFile"
                        name="photoFile"
                        type="file"
                        accept="image/*"
                        onChange={handleSelectAvatarFile}
                        disabled={uploadingPhoto}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  {validationErrors.photo && (
                    <span className="field-error">{validationErrors.photo}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="onbLastName">
                  Фамилия *
                  <input
                    id="onbLastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                  {validationErrors.lastName && (
                    <span className="field-error">{validationErrors.lastName}</span>
                  )}
                </label>

                <label htmlFor="onbFirstName">
                  Имя *
                  <input
                    id="onbFirstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  {validationErrors.firstName && (
                    <span className="field-error">{validationErrors.firstName}</span>
                  )}
                </label>

                <label htmlFor="onbMiddleName">
                  Отчество (необязательно)
                  <input
                    id="onbMiddleName"
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                  />
                </label>
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

                <label htmlFor="onbGender">
                  Пол *
                  <select
                    id="onbGender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Мужской</option>
                    <option value="Female">Женский</option>
                    <option value="Other">Другой</option>
                  </select>
                </label>

                {role === 'athlete' && (
                  <label htmlFor="onbHeightCm">
                    Рост, см *
                    <input
                      id="onbHeightCm"
                      type="number"
                      min={50}
                      max={250}
                      placeholder="Например: 172"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      required
                    />
                    {validationErrors.heightCm && (
                      <span className="field-error">{validationErrors.heightCm}</span>
                    )}
                  </label>
                )}
              </div>

              <div className="form-row">
                <label htmlFor="phone">
                  Телефон *
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
                  {validationErrors.phone && (
                    <span className="field-error">{validationErrors.phone}</span>
                  )}
                </label>
              </div>

              <CitySelectInput
                countryCode={country}
                onCountryChange={(c) => setCountry(c)}
                city={city}
                onCityChange={(val) => setCity(val)}
                required={true}
                error={validationErrors.city}
                disabled={submitting}
                showCountry={true}
              />

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
              <p className="eyebrow">Карточка танцора</p>
              <h1 id="onboarding-title">Танцевальные данные и портфолио</h1>
              <p>
                Укажите ваш танцевальный клуб, классы программ и параметры обучения. Достижения, фото, видео и соцсети можно добавить сейчас или позже в личном кабинете.
              </p>
            </div>

            <form className="login-form" onSubmit={handleSubmitFinal} noValidate>
              <DancerCardFields
                value={dancerCard}
                onChange={setDancerCard}
                directionsCatalog={catalogs.directions}
                clubsCatalog={catalogs.clubs}
                fetchFederations={handleFetchFederations}
                showClubsSelector={true}
                errors={validationErrors}
                disabled={submitting}
                onMediaError={(msg) => setApiError(msg)}
              />

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

      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onComplete={(cropped) => void handleConfirmCroppedAvatar(cropped)}
        />
      )}
    </main>
  )
}
