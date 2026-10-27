import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FrappeApiError } from '../../api/frappe'
import {
  adminGetHostApplications,
  adminReviewHostApplication,
  type AdminHostApplicationItem,
  type AdminHostApplicationsResponse,
} from '../../api/hostCabinet'
import { LoadingScreen } from '../../components/LoadingScreen'
import { DashboardHeader } from '../dashboard/components/DashboardHeader'
import { routes } from '../../routes'
import { useAuthStore } from '../../stores/authStore'
import { formatDateTime } from '../../utils/date'
import './admin.css'

type StatusFilterTab = 'Pending' | 'Changes Requested' | 'Approved' | 'Rejected' | 'all'

export function AdminHostApplicationsPage() {
  const navigate = useNavigate()
  const person = useAuthStore((s) => s.person)
  const logout = useAuthStore((s) => s.logout)

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AdminHostApplicationsResponse | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilterTab>('Pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [comments, setComments] = useState<Record<string, string>>({})
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadApplications = useCallback(async () => {
    try {
      const res = await adminGetHostApplications(statusFilter, searchQuery)
      setApiError(null)
      setData(res)
      const initialComments: Record<string, string> = {}
      for (const app of res.applications) {
        initialComments[app.id] = app.review_comment || ''
      }
      setComments((prev) => ({ ...initialComments, ...prev }))
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) {
        setApiError(err.message)
      } else {
        setApiError('Не удалось загрузить список заявок.')
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      try {
        const res = await adminGetHostApplications(statusFilter, searchQuery)
        if (!isMounted) return
        setApiError(null)
        setData(res)
        const initialComments: Record<string, string> = {}
        for (const app of res.applications) {
          initialComments[app.id] = app.review_comment || ''
        }
        setComments((prev) => ({ ...initialComments, ...prev }))
      } catch (err: unknown) {
        if (!isMounted) return
        if (err instanceof FrappeApiError) {
          setApiError(err.message)
        } else {
          setApiError('Не удалось загрузить список заявок.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void run()
    return () => {
      isMounted = false
    }
  }, [statusFilter, searchQuery])

  async function handleReview(
    appId: string,
    action: 'approve' | 'request_changes' | 'reject'
  ) {
    const comment = (comments[appId] || '').trim()
    if ((action === 'request_changes' || action === 'reject') && !comment) {
      setApiError(
        action === 'request_changes'
          ? 'Укажите комментарий для заявителя: какие данные или документы нужно исправить.'
          : 'Укажите причину отклонения заявки.'
      )
      return
    }

    setProcessingId(appId)
    setApiError(null)
    setSuccessMessage(null)
    try {
      const res = await adminReviewHostApplication(appId, action, comment)
      setSuccessMessage(res.message)
      await loadApplications()
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) setApiError(err.message)
      else setApiError('Ошибка при выполнении действия.')
    } finally {
      setProcessingId(null)
    }
  }

  function renderStatusBadge(status: AdminHostApplicationItem['status']) {
    if (status === 'Submitted' || status === 'Under Review') {
      return <span className="admin-status-badge admin-status-submitted">На проверке ⏳</span>
    }
    if (status === 'Changes Requested') {
      return <span className="admin-status-badge admin-status-changes">Запрошены изменения ✎</span>
    }
    if (status === 'Approved') {
      return <span className="admin-status-badge admin-status-approved">Одобрена ✓</span>
    }
    if (status === 'Rejected') {
      return <span className="admin-status-badge admin-status-rejected">Отклонена ✕</span>
    }
    return <span className="admin-status-badge">{status}</span>
  }

  const handleLogout = async () => {
    await logout()
    navigate(routes.login)
  }

  if (loading && !data) {
    return <LoadingScreen />
  }

  const counts = data?.counts || {
    all: 0,
    Submitted: 0,
    'Under Review': 0,
    'Changes Requested': 0,
    Approved: 0,
    Rejected: 0,
  }
  const pendingCount = (counts.Submitted || 0) + (counts['Under Review'] || 0)

  return (
    <div className="admin-page">
      <DashboardHeader
        firstName={person?.first_name || 'Администратор'}
        onLogout={() => void handleLogout()}
      />

      <main className="admin-container">
        <header className="admin-header-card">
          <div>
            <h1>Модерация заявок Организаторов (Физ. лица)</h1>
            <p>
              Проверка анкет физических лиц, удостоверений личности и ИИН для открытия доступа к Host Dashboard
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate(routes.profile)}
            >
              ← В Личный кабинет
            </button>
          </div>
        </header>

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

        {/* Filter Tabs */}
        <div className="host-tabs-bar" role="tablist">
          <button
            type="button"
            className={`host-tab-btn ${statusFilter === 'Pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Pending')}
          >
            ⏳ На проверке
            <span className="host-tab-count">{pendingCount}</span>
          </button>
          <button
            type="button"
            className={`host-tab-btn ${statusFilter === 'Changes Requested' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Changes Requested')}
          >
            ✎ Запрошены изменения
            <span className="host-tab-count">{counts['Changes Requested'] || 0}</span>
          </button>
          <button
            type="button"
            className={`host-tab-btn ${statusFilter === 'Approved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Approved')}
          >
            ✓ Одобренные
            <span className="host-tab-count">{counts.Approved || 0}</span>
          </button>
          <button
            type="button"
            className={`host-tab-btn ${statusFilter === 'Rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Rejected')}
          >
            ✕ Отклонённые
            <span className="host-tab-count">{counts.Rejected || 0}</span>
          </button>
          <button
            type="button"
            className={`host-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Все заявки
            <span className="host-tab-count">{counts.all || 0}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="host-filters-row">
          <input
            type="search"
            className="host-filter-input"
            placeholder="Поиск по ФИО, бренду организатора, ИИН (12 цифр), телефону, email или городу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Applications List */}
        {!data || data.applications.length === 0 ? (
          <div className="host-section-card">
            <div className="empty-state-box">
              <p>В данной категории заявок не найдено.</p>
            </div>
          </div>
        ) : (
          <div className="admin-app-list">
            {data.applications.map((app) => (
              <article key={app.id} className="admin-app-card">
                <div className="admin-app-card-header">
                  <div className="admin-app-title-group">
                    <h3>{app.organization.display_name}</h3>
                    {renderStatusBadge(app.status)}
                    <span className="host-type-pill">
                      {app.organization.organization_type === 'Individual'
                        ? 'Физическое лицо'
                        : app.organization.organization_type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'rgba(226,232,240,0.68)' }}>
                    Подана: <strong>{formatDateTime(app.submitted_at)}</strong> • ID: <code>{app.id}</code>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="admin-details-grid">
                  <div className="admin-detail-item">
                    <span className="admin-detail-label">ФИО по документу</span>
                    <span className="admin-detail-value">{app.organization.legal_name || '—'}</span>
                  </div>
                  <div className="admin-detail-item">
                    <span className="admin-detail-label">ИИН (12 цифр)</span>
                    <span className="admin-detail-value" style={{ fontFamily: 'monospace' }}>
                      {app.organization.registration_number || '—'}
                    </span>
                  </div>
                  <div className="admin-detail-item">
                    <span className="admin-detail-label">Город и адрес</span>
                    <span className="admin-detail-value">
                      {app.organization.city || '—'}
                      {app.organization.address ? `, ${app.organization.address}` : ''}
                    </span>
                  </div>
                  <div className="admin-detail-item">
                    <span className="admin-detail-label">Телефон и Email</span>
                    <span className="admin-detail-value">
                      {app.organization.phone || app.applicant.phone} • {app.organization.email || app.applicant.email}
                    </span>
                  </div>
                  <div className="admin-detail-item">
                    <span className="admin-detail-label">Профиль заявителя</span>
                    <span className="admin-detail-value">
                      {app.applicant.full_name} ({app.applicant.id})
                    </span>
                  </div>
                  <div className="admin-detail-item">
                    <span className="admin-detail-label">Статус организации</span>
                    <span className="admin-detail-value">{app.organization.verification_status}</span>
                  </div>
                </div>

                {/* Verification Documents */}
                <div className="admin-docs-box">
                  <span className="admin-detail-label">
                    Прикреплённые документы ({app.verification_documents.length})
                  </span>
                  {app.verification_documents.length === 0 ? (
                    <div style={{ fontSize: '0.86rem', color: 'rgba(226,232,240,0.55)' }}>
                      Документы не прикреплены
                    </div>
                  ) : (
                    app.verification_documents.map((doc, idx) => (
                      <div key={doc.id || idx} className="admin-doc-row">
                        <div>
                          <strong>📄 {doc.document_type}</strong>
                          {doc.document_number && (
                            <span style={{ marginLeft: '0.6rem', color: '#475569' }}>
                              № {doc.document_number}
                            </span>
                          )}
                          {doc.expiry_date && (
                            <span style={{ marginLeft: '0.6rem', fontSize: '0.82rem', color: '#64748b' }}>
                              (действителен до {doc.expiry_date})
                            </span>
                          )}
                        </div>
                        <a
                          href={doc.file}
                          target="_blank"
                          rel="noreferrer"
                          className="ticket-code-link"
                        >
                          Открыть файл ↗
                        </a>
                      </div>
                    ))
                  )}
                </div>

                {/* Review Comment & Action Buttons */}
                <div className="admin-review-box">
                  <label htmlFor={`comment-${app.id}`} className="admin-detail-label">
                    Комментарий модератора (обязателен при запросе изменений или отклонении)
                  </label>
                  <textarea
                    id={`comment-${app.id}`}
                    rows={2}
                    className="admin-review-textarea"
                    placeholder="Например: Документы проверены, одобрено / Пожалуйста, приложите скан удостоверения личности с обеих сторон..."
                    value={comments[app.id] ?? ''}
                    onChange={(e) =>
                      setComments((prev) => ({
                        ...prev,
                        [app.id]: e.target.value,
                      }))
                    }
                  />

                  <div className="admin-action-buttons">
                    <button
                      type="button"
                      className="btn-approve"
                      disabled={processingId === app.id}
                      onClick={() => void handleReview(app.id, 'approve')}
                    >
                      ✓ Одобрить и открыть кабинет
                    </button>
                    <button
                      type="button"
                      className="btn-changes"
                      disabled={processingId === app.id}
                      onClick={() => void handleReview(app.id, 'request_changes')}
                    >
                      ✎ Запросить изменения
                    </button>
                    <button
                      type="button"
                      className="btn-reject"
                      disabled={processingId === app.id}
                      onClick={() => void handleReview(app.id, 'reject')}
                    >
                      ✕ Отклонить заявку
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
