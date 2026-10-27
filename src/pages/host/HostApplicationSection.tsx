import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FrappeApiError } from '../../api/frappe'
import {
  submitHostApplication,
  type HostVerificationDocument,
  type MyHostStatusResponse,
} from '../../api/hostCabinet'
import { uploadProfilePhoto } from '../../api/onboarding'
import type { CabinetPerson } from '../../api/trainerCabinet'
import { CitySelectInput } from '../../components/CitySelectInput'
import { CountryPhoneInput } from '../../components/CountryPhoneInput'
import { routes } from '../../routes'
import { formatDateTime } from '../../utils/date'
import { HostDashboardView } from './HostDashboardPage'
import './host.css'

type HostApplicationSectionProps = {
  person: CabinetPerson
  hostStatus: MyHostStatusResponse | undefined
  onReloadContext: () => Promise<void>
}

export function HostApplicationSection({
  person,
  hostStatus,
  onReloadContext,
}: HostApplicationSectionProps) {
  const navigate = useNavigate()
  const org = hostStatus?.organization
  const app = hostStatus?.application
  const hasHostRole = Boolean(hostStatus?.has_host_role)

  const defaultFullName = `${person.last_name || ''} ${person.first_name || ''} ${person.middle_name || ''}`.trim()

  const [displayName, setDisplayName] = useState(
    org?.display_name || `${person.first_name || ''} ${person.last_name || ''}`.trim()
  )
  const [legalName, setLegalName] = useState(org?.legal_name || defaultFullName)
  const [iin, setIin] = useState(org?.registration_number || '')
  const [city, setCity] = useState(org?.city || person.city || 'Астана')
  const [address, setAddress] = useState(org?.address || '')
  const [phone, setPhone] = useState(org?.phone || person.phone || '')
  const [email, setEmail] = useState(org?.email || person.email || '')
  const [logo, setLogo] = useState(org?.logo || '')

  const [docs, setDocs] = useState<HostVerificationDocument[]>(
    app?.verification_documents && app.verification_documents.length > 0
      ? app.verification_documents
      : [
          {
            document_type: 'Удостоверение личности РК',
            document_number: '',
            file: '',
            expiry_date: '',
          },
        ]
  )

  const [editingSubmitted, setEditingSubmitted] = useState(false)
  const [uploadingDocIdx, setUploadingDocIdx] = useState<number | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // If approved, show full Host Dashboard right here (plus link to /host)
  if (hasHostRole) {
    return <HostDashboardView embedded />
  }

  async function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    setError(null)
    try {
      const url = await uploadProfilePhoto(file)
      setLogo(url)
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setError(err.message)
      else setError('Не удалось загрузить логотип.')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleDocFileUpload(idx: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDocIdx(idx)
    setError(null)
    try {
      const url = await uploadProfilePhoto(file)
      setDocs((prev) => prev.map((d, i) => (i === idx ? { ...d, file: url } : d)))
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setError(err.message)
      else setError('Не удалось загрузить файл документа.')
    } finally {
      setUploadingDocIdx(null)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const cleanDigits = iin.replace(/\D/g, '')
    if (cleanDigits.length !== 12) {
      setError('ИИН физического лица должен состоять ровно из 12 цифр.')
      return
    }

    setSubmitting(true)
    try {
      const res = await submitHostApplication({
        display_name: displayName,
        legal_name: legalName,
        registration_number: cleanDigits,
        country: 'KZ',
        city,
        address,
        phone,
        email,
        logo: logo || undefined,
        verification_documents: docs.filter((d) => Boolean(d.file)),
      })
      setSuccess(res.message)
      setEditingSubmitted(false)
      await onReloadContext()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setError(err.message)
      else setError('Не удалось отправить заявку.')
    } finally {
      setSubmitting(false)
    }
  }

  const isPendingReview =
    app && (app.status === 'Submitted' || app.status === 'Under Review') && !editingSubmitted

  return (
    <section className="cabinet-card tab-content-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Статус Организатора мероприятий (Физическое лицо)</h3>
          <p className="muted-hint" style={{ margin: '0.3rem 0 0 0' }}>
            Подайте заявку как физическое лицо, чтобы публиковать собственные мастер-классы и турниры и управлять регистрациями в Host Dashboard
          </p>
        </div>
        {hostStatus?.is_admin && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(routes.adminHostApplications)}
          >
            🛡️ Панель модерации заявок
          </button>
        )}
      </div>

      {success && (
        <div className="cabinet-success-banner" role="status" style={{ marginBottom: '1rem' }}>
          ✓ {success}
          <button type="button" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}
      {error && (
        <div className="form-error" role="alert" style={{ marginBottom: '1rem' }}>
          ⚠️ {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Status Banners */}
      {app && (app.status === 'Submitted' || app.status === 'Under Review') && (
        <div className="host-app-status-banner submitted">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.35rem 0', color: '#1d4ed8' }}>
                ⏳ Заявка отправлена и находится на проверке
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e3a8a' }}>
                Дата подачи: <strong>{app.submitted_at ? formatDateTime(app.submitted_at) : 'Сегодня'}</strong> • Организация: <strong>{org?.display_name}</strong> (ИИН: {org?.registration_number})
              </p>
            </div>
            {!editingSubmitted && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditingSubmitted(true)}
              >
                Дополнить / изменить данные
              </button>
            )}
          </div>
        </div>
      )}

      {app && app.status === 'Changes Requested' && (
        <div className="host-app-status-banner changes">
          <h4 style={{ margin: '0 0 0.4rem 0', color: '#b45309' }}>
            ✎ Модератор запросил изменения по вашей заявке
          </h4>
          <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.94rem', color: '#78350f' }}>
            <strong>Комментарий администратора:</strong> {app.review_comment || 'Пожалуйста, проверьте корректность данных и документов.'}
          </p>
          <span style={{ fontSize: '0.84rem', color: '#92400e' }}>
            Внесите исправления в форму ниже и нажмите «Отправить повторно на проверку».
          </span>
        </div>
      )}

      {app && app.status === 'Rejected' && (
        <div className="host-app-status-banner rejected">
          <h4 style={{ margin: '0 0 0.4rem 0', color: '#b91c1c' }}>
            ✕ Заявка была отклонена
          </h4>
          <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.94rem', color: '#7f1d1d' }}>
            <strong>Причина:</strong> {app.review_comment || 'Данные не прошли верификацию.'}
          </p>
          <span style={{ fontSize: '0.84rem', color: '#991b1b' }}>
            Вы можете исправить анкету ниже и подать заявку повторно.
          </span>
        </div>
      )}

      {isPendingReview ? (
        <div className="admin-details-grid">
          <div className="admin-detail-item">
            <span className="admin-detail-label">Публичное название</span>
            <span className="admin-detail-value">{org?.display_name}</span>
          </div>
          <div className="admin-detail-item">
            <span className="admin-detail-label">ФИО физического лица</span>
            <span className="admin-detail-value">{org?.legal_name}</span>
          </div>
          <div className="admin-detail-item">
            <span className="admin-detail-label">ИИН</span>
            <span className="admin-detail-value">{org?.registration_number}</span>
          </div>
          <div className="admin-detail-item">
            <span className="admin-detail-label">Город и адрес</span>
            <span className="admin-detail-value">
              {org?.city}
              {org?.address ? `, ${org.address}` : ''}
            </span>
          </div>
          <div className="admin-detail-item">
            <span className="admin-detail-label">Контакты</span>
            <span className="admin-detail-value">
              {org?.phone} • {org?.email}
            </span>
          </div>
          <div className="admin-detail-item">
            <span className="admin-detail-label">Документы</span>
            <span className="admin-detail-value">
              Прикреплено файлов: {app.verification_documents.length}
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="cabinet-form">
          <div className="form-row">
            <label htmlFor="appDisplayName">
              Публичное название Организатора / Бренд *
              <input
                id="appDisplayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Например: Astana Dance Workshop / ФИО"
                required
              />
            </label>

            <label htmlFor="appLegalName">
              Полное ФИО по удостоверению личности *
              <input
                id="appLegalName"
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Фамилия Имя Отчество"
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label htmlFor="appIin">
              ИИН физического лица (12 цифр) *
              <input
                id="appIin"
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={iin}
                onChange={(e) => setIin(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Например: 940815300777"
                required
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
                id="appHostPhone"
                value={phone}
                onChange={setPhone}
                defaultCountry="KZ"
              />
            </div>

            <label htmlFor="appHostEmail">
              Контактный Email *
              <input
                id="appHostEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          </div>

          <label htmlFor="appHostAddress">
            Адрес регистрации / проведения мероприятий
            <input
              id="appHostAddress"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="г. Астана, пр. Мангилик Ел, 55/2"
            />
          </label>

          <div className="photo-upload-block">
            <span className="field-label">Логотип или фото Организатора (опционально)</span>
            <div className="photo-upload-controls">
              {logo && (
                <img
                  src={logo}
                  alt="Логотип"
                  style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void handleLogoUpload(e)}
                disabled={uploadingLogo}
              />
            </div>
          </div>

          {/* Verification Documents Table */}
          <div className="mc-builder-section">
            <div className="section-header-row">
              <h4>Документы, удостоверяющие личность</h4>
              <button
                type="button"
                className="secondary-button btn-sm"
                onClick={() =>
                  setDocs((prev) => [
                    ...prev,
                    {
                      document_type: 'Удостоверение личности РК',
                      document_number: '',
                      file: '',
                      expiry_date: '',
                    },
                  ])
                }
              >
                + Добавить документ
              </button>
            </div>

            {docs.map((doc, idx) => (
              <div key={idx} className="host-doc-item">
                <div className="form-row" style={{ width: '100%' }}>
                  <label>
                    Тип документа
                    <input
                      type="text"
                      value={doc.document_type}
                      onChange={(e) => {
                        const val = e.target.value
                        setDocs((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, document_type: val } : item))
                        )
                      }}
                    />
                  </label>
                  <label>
                    Номер документа
                    <input
                      type="text"
                      value={doc.document_number || ''}
                      placeholder="Например: 045123987"
                      onChange={(e) => {
                        const val = e.target.value
                        setDocs((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, document_number: val } : item
                          )
                        )
                      }}
                    />
                  </label>
                  <label>
                    Срок действия
                    <input
                      type="date"
                      value={doc.expiry_date || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setDocs((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, expiry_date: val } : item))
                        )
                      }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', width: '100%' }}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => void handleDocFileUpload(idx, e)}
                    disabled={uploadingDocIdx === idx}
                  />
                  {uploadingDocIdx === idx && <span className="muted-hint">Загрузка файла…</span>}
                  {doc.file && (
                    <a
                      href={doc.file}
                      target="_blank"
                      rel="noreferrer"
                      className="ticket-code-link"
                    >
                      ✓ Файл загружен (просмотреть ↗)
                    </a>
                  )}
                  {docs.length > 1 && (
                    <button
                      type="button"
                      className="ghost-button btn-sm"
                      onClick={() => setDocs((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            {editingSubmitted && (
              <button
                type="button"
                className="ghost-button"
                onClick={() => setEditingSubmitted(false)}
              >
                Отмена
              </button>
            )}
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting
                ? 'Отправка заявки…'
                : app && (app.status === 'Changes Requested' || app.status === 'Rejected')
                  ? 'Отправить повторно на проверку'
                  : 'Подать заявку на статус Организатора'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

