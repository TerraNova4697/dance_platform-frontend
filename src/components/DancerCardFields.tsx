import { useState, type ChangeEvent } from 'react'
import {
  DANCER_CLASS_OPTIONS,
  TRAINING_ACTIVITY_OPTIONS,
  TRAINING_FREQUENCY_OPTIONS,
  ACHIEVEMENT_RESULT_OPTIONS,
  uploadProfilePhoto,
  type CatalogItem,
  type ClubCatalogItem,
  type AthleteAchievementItem,
  type AthleteVideoItem,
  type AchievementResultOption,
} from '../api/onboarding'
import { DebouncedSearchSelect } from './DebouncedSearchSelect'

export type DancerCardState = {
  directions: string[]
  clubs: string[]
  federation: string
  federationTitle: string
  standardClass: string
  latinClass: string
  dancesCount: number
  internationalCompetitions: string
  trainingActivities: string[]
  trainingFrequency: string
  achievements: AthleteAchievementItem[]
  galleryPhotos: string[]
  videos: AthleteVideoItem[]
  socialLinks: string[]
}

type DancerCardFieldsProps = {
  value: DancerCardState
  onChange: (next: DancerCardState) => void
  directionsCatalog: CatalogItem[]
  clubsCatalog: ClubCatalogItem[]
  fetchFederations: (query: string) => Promise<CatalogItem[]>
  showClubsSelector?: boolean
  errors?: Record<string, string>
  disabled?: boolean
  onMediaError?: (msg: string) => void
}

const DEFAULT_DIRECTIONS: CatalogItem[] = [
  { name: 'Европейская / Standard', title: 'Европейская / Standard' },
  { name: 'Латиноамериканская / Latin', title: 'Латиноамериканская / Latin' },
  { name: 'Десять танцев / Ten Dance', title: 'Десять танцев / Ten Dance' },
]

export function DancerCardFields({
  value,
  onChange,
  directionsCatalog,
  clubsCatalog,
  fetchFederations,
  showClubsSelector = true,
  errors = {},
  disabled = false,
  onMediaError,
}: DancerCardFieldsProps) {
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoLinkInput, setVideoLinkInput] = useState('')
  const [videoTitleInput, setVideoTitleInput] = useState('')
  const [socialLinkInput, setSocialLinkInput] = useState('')

  const effectiveDirections =
    directionsCatalog.length > 0 ? directionsCatalog : DEFAULT_DIRECTIONS

  function updateField<K extends keyof DancerCardState>(key: K, val: DancerCardState[K]) {
    onChange({ ...value, [key]: val })
  }

  function handleToggleDirection(dirName: string) {
    const exists = value.directions.includes(dirName)
    const next = exists
      ? value.directions.filter((d) => d !== dirName)
      : [...value.directions, dirName]
    updateField('directions', next)
  }

  function handleToggleClub(clubName: string) {
    const exists = value.clubs.includes(clubName)
    const next = exists
      ? value.clubs.filter((c) => c !== clubName)
      : [...value.clubs, clubName]
    updateField('clubs', next)
  }

  function handleToggleTrainingActivity(option: string) {
    if (option === 'Пока не участвую') {
      const alreadySelected = value.trainingActivities.includes('Пока не участвую')
      const nextActs = alreadySelected ? [] : ['Пока не участвую']
      onChange({
        ...value,
        trainingActivities: nextActs,
        trainingFrequency: !alreadySelected ? 'Пока не участвую' : value.trainingFrequency,
      })
      return
    }

    const withoutNone = value.trainingActivities.filter((a) => a !== 'Пока не участвую')
    const exists = withoutNone.includes(option)
    const nextActs = exists
      ? withoutNone.filter((a) => a !== option)
      : [...withoutNone, option]
    updateField('trainingActivities', nextActs)
  }

  function handleAddAchievement() {
    const next: AthleteAchievementItem = {
      id: `ach_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tournament_name: '',
      category: '',
      result: 'финал',
    }
    updateField('achievements', [...value.achievements, next])
  }

  function handleUpdateAchievement(
    id: string,
    patch: Partial<AthleteAchievementItem>
  ) {
    updateField(
      'achievements',
      value.achievements.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }

  function handleRemoveAchievement(id: string) {
    updateField(
      'achievements',
      value.achievements.filter((item) => item.id !== id)
    )
  }

  async function handleGalleryUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return

    if (value.galleryPhotos.length + files.length > 10) {
      onMediaError?.('Можно загрузить не более 10 танцевальных фотографий.')
      return
    }

    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        onMediaError?.(`Файл «${f.name}» превышает лимит 10 МБ.`)
        return
      }
    }

    setUploadingGallery(true)
    try {
      const uploadedUrls: string[] = []
      for (const f of files) {
        const url = await uploadProfilePhoto(f)
        uploadedUrls.push(url)
      }
      updateField('galleryPhotos', [...value.galleryPhotos, ...uploadedUrls])
    } catch {
      onMediaError?.('Не удалось загрузить одну или несколько фотографий.')
    } finally {
      setUploadingGallery(false)
    }
  }

  function handleRemoveGalleryPhoto(urlToRemove: string) {
    updateField(
      'galleryPhotos',
      value.galleryPhotos.filter((u) => u !== urlToRemove)
    )
  }

  async function handleVideoFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const uploadedFilesCount = value.videos.filter((v) => v.type === 'file').length
    if (uploadedFilesCount >= 5) {
      onMediaError?.('Можно загрузить не более 5 видеофайлов.')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      onMediaError?.(`Видеофайл «${file.name}» превышает лимит 50 МБ.`)
      return
    }

    setUploadingVideo(true)
    try {
      const url = await uploadProfilePhoto(file)
      const newVideo: AthleteVideoItem = {
        id: `vid_${Date.now()}`,
        type: 'file',
        url,
        title: file.name,
      }
      updateField('videos', [...value.videos, newVideo])
    } catch {
      onMediaError?.('Не удалось загрузить видеофайл.')
    } finally {
      setUploadingVideo(false)
    }
  }

  function handleAddVideoLink() {
    const trimmed = videoLinkInput.trim()
    if (!trimmed) return
    const normalizedUrl =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`
    const newVideo: AthleteVideoItem = {
      id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'link',
      url: normalizedUrl,
      title: videoTitleInput.trim() || normalizedUrl,
    }
    updateField('videos', [...value.videos, newVideo])
    setVideoLinkInput('')
    setVideoTitleInput('')
  }

  function handleRemoveVideo(id: string) {
    updateField(
      'videos',
      value.videos.filter((v) => v.id !== id)
    )
  }

  function handleAddSocialLink() {
    const trimmed = socialLinkInput.trim()
    if (!trimmed) return
    const normalizedUrl =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`
    if (!value.socialLinks.includes(normalizedUrl)) {
      updateField('socialLinks', [...value.socialLinks, normalizedUrl])
    }
    setSocialLinkInput('')
  }

  function handleRemoveSocialLink(urlToRemove: string) {
    updateField(
      'socialLinks',
      value.socialLinks.filter((u) => u !== urlToRemove)
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Блок: Танцевальные данные */}
      <div
        style={{
          padding: '18px',
          borderRadius: '14px',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-surface-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            Танцевальные данные
          </h4>
          <p className="helper-note" style={{ margin: 0 }}>
            Клуб, федерация, классы программ и спортивный опыт
          </p>
        </div>

        {/* Танцевальный клуб (из реестра) */}
        {showClubsSelector && (
          <div>
            <span className="field-label">Танцевальный клуб (выбор из реестра) *</span>
            {clubsCatalog.length > 0 ? (
              <div className="chips-grid" style={{ marginTop: '6px' }}>
                {clubsCatalog.map((cl) => {
                  const active = value.clubs.includes(cl.name)
                  return (
                    <button
                      key={cl.name}
                      type="button"
                      disabled={disabled}
                      className={`chip-button ${active ? 'chip-button-active' : ''}`}
                      onClick={() => handleToggleClub(cl.name)}
                    >
                      {cl.club_name} {cl.city ? `(${cl.city})` : ''} {active && '✓'}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="helper-note">Список клубов пуст</p>
            )}
            {errors.clubs && <span className="field-error">{errors.clubs}</span>}
          </div>
        )}

        {/* Федерация (необязательное поле) */}
        <div>
          <DebouncedSearchSelect
            id="dancerFederation"
            label="Федерация (необязательно, можно пропустить)"
            value={value.federation}
            selectedTitle={value.federationTitle}
            onChange={(name, title) => {
              onChange({
                ...value,
                federation: name,
                federationTitle: title,
              })
            }}
            fetchOptions={fetchFederations}
            placeholder="Поиск федерации по названию…"
            debounceMs={600}
            disabled={disabled}
          />
          {value.federation && (
            <button
              type="button"
              onClick={() =>
                onChange({ ...value, federation: '', federationTitle: '' })
              }
              style={{
                marginTop: '4px',
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Очистить выбор федерации
            </button>
          )}
        </div>

        {/* Танцевальные направления */}
        <div>
          <span className="field-label">Танцевальные направления *</span>
          <div className="chips-grid" style={{ marginTop: '6px' }}>
            {effectiveDirections.map((dir) => {
              const active = value.directions.includes(dir.name)
              return (
                <button
                  key={dir.name}
                  type="button"
                  disabled={disabled}
                  className={`chip-button ${active ? 'chip-button-active' : ''}`}
                  onClick={() => handleToggleDirection(dir.name)}
                >
                  {dir.title} {active && '✓'}
                </button>
              )
            })}
          </div>
          {errors.directions && <span className="field-error">{errors.directions}</span>}
        </div>

        {/* Класс танцевания: Европейская и Латиноамериканская программы */}
        <div className="form-row">
          <label htmlFor="standardClassSelect">
            Класс — Европейская программа (Standard) *
            <select
              id="standardClassSelect"
              value={value.standardClass}
              onChange={(e) => updateField('standardClass', e.target.value)}
              disabled={disabled}
              required
            >
              <option value="">Выберите класс…</option>
              {DANCER_CLASS_OPTIONS.map((cls) => (
                <option key={cls} value={cls}>
                  {cls === 'Не танцую' ? 'Не танцую' : `${cls} класс`}
                </option>
              ))}
            </select>
            {errors.standardClass && (
              <span className="field-error">{errors.standardClass}</span>
            )}
          </label>

          <label htmlFor="latinClassSelect">
            Класс — Латиноамериканская программа (Latin) *
            <select
              id="latinClassSelect"
              value={value.latinClass}
              onChange={(e) => updateField('latinClass', e.target.value)}
              disabled={disabled}
              required
            >
              <option value="">Выберите класс…</option>
              {DANCER_CLASS_OPTIONS.map((cls) => (
                <option key={cls} value={cls}>
                  {cls === 'Не танцую' ? 'Не танцую' : `${cls} класс`}
                </option>
              ))}
            </select>
            {errors.latinClass && (
              <span className="field-error">{errors.latinClass}</span>
            )}
          </label>
        </div>

        {/* Количество танцев: бегунок от 2 до 10 */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <span className="field-label" style={{ margin: 0 }}>
              Количество танцев *
            </span>
            <span
              style={{
                background: 'var(--brand-accent-gradient)',
                color: 'var(--text-on-gold)',
                fontWeight: 700,
                fontSize: '15px',
                padding: '3px 12px',
                borderRadius: '999px',
              }}
            >
              {value.dancesCount}
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={10}
            step={1}
            value={value.dancesCount}
            disabled={disabled}
            onChange={(e) => updateField('dancesCount', Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--brand-accent)', cursor: 'pointer' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '2px',
            }}
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <span
                key={num}
                style={{
                  fontWeight: value.dancesCount === num ? 700 : 400,
                  color: value.dancesCount === num ? 'var(--brand-accent)' : 'var(--text-muted)',
                }}
              >
                {num}
              </span>
            ))}
          </div>
        </div>

        {/* Участие в международных соревнованиях */}
        <div>
          <span className="field-label">Участие в международных соревнованиях *</span>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            {(['Да', 'Нет'] as const).map((opt) => {
              const active = value.internationalCompetitions === opt
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={disabled}
                  className={`chip-button ${active ? 'chip-button-active' : ''}`}
                  style={{ minWidth: '100px', justifyContent: 'center' }}
                  onClick={() => updateField('internationalCompetitions', opt)}
                >
                  {opt} {active && '✓'}
                </button>
              )
            })}
          </div>
          {errors.internationalCompetitions && (
            <span className="field-error">{errors.internationalCompetitions}</span>
          )}
        </div>
      </div>

      {/* Блок: Обучение и повышение уровня */}
      <div
        style={{
          padding: '18px',
          borderRadius: '14px',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-surface-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            Обучение и повышение уровня
          </h4>
          <p className="helper-note" style={{ margin: 0 }}>
            Отметьте подходящие форматы и частоту дополнительного обучения
          </p>
        </div>

        <div>
          <span className="field-label">Форматы обучения (можно отметить несколько) *</span>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            {TRAINING_ACTIVITY_OPTIONS.map((opt) => {
              const checked = value.trainingActivities.includes(opt)
              return (
                <label
                  key={opt}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: checked ? '1px solid var(--brand-accent)' : '1px solid var(--border-default)',
                    background: checked ? 'rgba(212, 175, 140, 0.14)' : 'var(--bg-surface)',
                    cursor: disabled ? 'default' : 'pointer',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    fontWeight: checked ? 600 : 400,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => handleToggleTrainingActivity(opt)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--brand-accent)' }}
                  />
                  <span>{opt}</span>
                </label>
              )
            })}
          </div>
          {errors.trainingActivities && (
            <span className="field-error">{errors.trainingActivities}</span>
          )}
        </div>

        <div>
          <span className="field-label">Частота дополнительного обучения *</span>
          <div className="chips-grid" style={{ marginTop: '6px' }}>
            {TRAINING_FREQUENCY_OPTIONS.map((freq) => {
              const active = value.trainingFrequency === freq
              return (
                <button
                  key={freq}
                  type="button"
                  disabled={disabled}
                  className={`chip-button ${active ? 'chip-button-active' : ''}`}
                  onClick={() => updateField('trainingFrequency', freq)}
                >
                  {freq} {active && '✓'}
                </button>
              )
            })}
          </div>
          {errors.trainingFrequency && (
            <span className="field-error">{errors.trainingFrequency}</span>
          )}
        </div>
      </div>

      {/* Блок: Самые значимые достижения в спортивной карьере */}
      <div
        style={{
          padding: '18px',
          borderRadius: '14px',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-surface-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '18px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
              Самые значимые достижения в спортивной карьере
            </h4>
            <p className="helper-note" style={{ margin: 0 }}>
              Необязательный блок — можно заполнить сейчас или позже в кабинете
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            onClick={handleAddAchievement}
          >
            + Добавить достижение
          </button>
        </div>

        {value.achievements.length === 0 ? (
          <p className="helper-note" style={{ margin: 0 }}>
            Достижения пока не добавлены. Нажмите «+ Добавить достижение», чтобы указать результаты турниров.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {value.achievements.map((ach, idx) => (
              <div
                key={ach.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <strong style={{ fontSize: '13px', color: 'var(--brand-accent)' }}>
                    Достижение #{idx + 1}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleRemoveAchievement(ach.id)}
                    disabled={disabled}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fda4af',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Удалить ×
                  </button>
                </div>
                <div className="form-row">
                  <label>
                    Название турнира
                    <input
                      type="text"
                      placeholder="Например: Astana Open Cup"
                      value={ach.tournament_name}
                      disabled={disabled}
                      onChange={(e) =>
                        handleUpdateAchievement(ach.id, {
                          tournament_name: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Категория
                    <input
                      type="text"
                      placeholder="Например: Юниоры-2, Латина"
                      value={ach.category}
                      disabled={disabled}
                      onChange={(e) =>
                        handleUpdateAchievement(ach.id, {
                          category: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Результат
                    <select
                      value={ach.result}
                      disabled={disabled}
                      onChange={(e) =>
                        handleUpdateAchievement(ach.id, {
                          result: e.target.value as AchievementResultOption,
                        })
                      }
                    >
                      {ACHIEVEMENT_RESULT_OPTIONS.map((resOpt) => (
                        <option key={resOpt} value={resOpt}>
                          {resOpt}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Блок: Танцевальные фотографии, Видеоматериалы и Социальные сети */}
      <div
        style={{
          padding: '18px',
          borderRadius: '14px',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-surface-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 2px 0', fontSize: '18px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            Танцевальные фотографии, видео и социальные сети
          </h4>
          <p className="helper-note" style={{ margin: 0 }}>
            Портфолио спортсмена (до 10 фото и до 5 видеофайлов + ссылки)
          </p>
        </div>

        {/* Танцевальные фотографии */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span className="field-label" style={{ margin: 0 }}>
              Танцевальные фотографии ({value.galleryPhotos.length}/10)
            </span>
            <label
              className="secondary-button"
              style={{
                cursor:
                  disabled || uploadingGallery || value.galleryPhotos.length >= 10
                    ? 'not-allowed'
                    : 'pointer',
                fontSize: '13px',
                padding: '6px 12px',
              }}
            >
              {uploadingGallery ? 'Загрузка…' : '+ Добавить фото'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={
                  disabled || uploadingGallery || value.galleryPhotos.length >= 10
                }
                onChange={(e) => void handleGalleryUpload(e)}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {value.galleryPhotos.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                gap: '10px',
              }}
            >
              {value.galleryPhotos.map((photoUrl, idx) => (
                <div
                  key={`${photoUrl}_${idx}`}
                  style={{
                    position: 'relative',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    aspectRatio: '1 / 1',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <img
                    src={photoUrl}
                    alt={`Танцевальное фото ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryPhoto(photoUrl)}
                    disabled={disabled}
                    title="Удалить фото"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(10, 9, 8, 0.78)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="helper-note" style={{ margin: 0 }}>
              Фотографии с паркета или тренировок пока не загружены.
            </p>
          )}
        </div>

        {/* Видеоматериалы */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span className="field-label" style={{ margin: 0 }}>
              Видеоматериалы ({value.videos.length})
            </span>
            <label
              className="secondary-button"
              style={{
                cursor: disabled || uploadingVideo ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                padding: '6px 12px',
              }}
            >
              {uploadingVideo ? 'Загрузка видео…' : 'Загрузить видеофайл (до 50 МБ)'}
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                disabled={disabled || uploadingVideo}
                onChange={(e) => void handleVideoFileUpload(e)}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '10px',
            }}
          >
            <input
              type="url"
              placeholder="Ссылка на видео (YouTube, Instagram, TikTok, VK…)"
              value={videoLinkInput}
              disabled={disabled}
              onChange={(e) => setVideoLinkInput(e.target.value)}
              style={{ flex: '2 1 220px' }}
            />
            <input
              type="text"
              placeholder="Подпись (необязательно)"
              value={videoTitleInput}
              disabled={disabled}
              onChange={(e) => setVideoTitleInput(e.target.value)}
              style={{ flex: '1 1 140px' }}
            />
            <button
              type="button"
              className="secondary-button"
              disabled={disabled || !videoLinkInput.trim()}
              onClick={handleAddVideoLink}
            >
              + Прикрепить ссылку
            </button>
          </div>

          {value.videos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {value.videos.map((vid) => (
                <div
                  key={vid.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--bg-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span>{vid.type === 'file' ? '🎬 Файл:' : '🔗 Ссылка:'}</span>
                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--brand-accent)',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {vid.title || vid.url}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(vid.id)}
                    disabled={disabled}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fda4af',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Социальные сети */}
        <div>
          <span className="field-label">Социальные сети</span>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '6px',
              marginBottom: '8px',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="url"
              placeholder="https://instagram.com/username или https://t.me/username"
              value={socialLinkInput}
              disabled={disabled}
              onChange={(e) => setSocialLinkInput(e.target.value)}
              style={{ flex: '1 1 240px' }}
            />
            <button
              type="button"
              className="secondary-button"
              disabled={disabled || !socialLinkInput.trim()}
              onClick={handleAddSocialLink}
            >
              + Добавить ссылку
            </button>
          </div>

          {value.socialLinks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {value.socialLinks.map((link) => (
                <div
                  key={link}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--bg-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                  }}
                >
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: 'var(--brand-accent)',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🌐 {link}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveSocialLink(link)}
                    disabled={disabled}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fda4af',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

