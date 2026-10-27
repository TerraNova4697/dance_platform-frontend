import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { verifyAndCheckinTicket, type VerifyTicketResult } from '../../api/tickets'
import './tickets.css'

export function TicketVerifyPage() {
  const { tokenHash = '' } = useParams<{ tokenHash: string }>()
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [checkinResult, setCheckinResult] = useState<VerifyTicketResult | null>(null)

  const verifyQuery = useQuery({
    queryKey: ['verify-ticket', tokenHash],
    queryFn: () => verifyAndCheckinTicket({ tokenHash, action: 'verify' }),
    enabled: Boolean(tokenHash),
  })

  const currentResult = checkinResult || verifyQuery.data

  async function handleCheckin() {
    if (!tokenHash || checkinLoading) return
    setCheckinLoading(true)
    try {
      const res = await verifyAndCheckinTicket({ tokenHash, action: 'checkin' })
      setCheckinResult(res)
    } finally {
      setCheckinLoading(false)
    }
  }

  return (
    <div className="verify-page-wrapper">
      <div className="verify-card">
        <div className="verify-header">
          <span className="verify-badge">Проверка билета на входе</span>
          <h2>Контроль доступа</h2>
        </div>

        {verifyQuery.isPending ? (
          <div className="verify-loading">Проверка билета…</div>
        ) : !currentResult ? (
          <div className="verify-state error">
            <span className="state-icon">❌</span>
            <h3>Билет не найден</h3>
            <p>Не удалось получить информацию о билете по данному QR-коду.</p>
          </div>
        ) : !currentResult.valid ? (
          <div className="verify-state invalid">
            <span className="state-icon">
              {currentResult.alreadyCheckedIn ? '⚠️' : '⛔'}
            </span>
            <h3 className="error-title">
              {currentResult.alreadyCheckedIn ? 'Билет уже погашен!' : 'Билет недействителен!'}
            </h3>
            <p className="state-reason">{currentResult.reason}</p>

            {currentResult.ticketNumber && (
              <div className="verify-ticket-number">Номер: {currentResult.ticketNumber}</div>
            )}
            {currentResult.personName && (
              <div className="verify-person-name">Владелец: {currentResult.personName}</div>
            )}
          </div>
        ) : (
          <div className="verify-state valid">
            <span className="state-icon">
              {currentResult.checkedIn ? '✅' : '🎟️'}
            </span>
            <h3 className="success-title">
              {currentResult.checkedIn ? 'Вход подтвержден!' : 'Билет действителен'}
            </h3>
            <p className="state-desc">{currentResult.message}</p>

            <div className="verify-info-box">
              <div className="verify-row">
                <span className="verify-label">Мероприятие:</span>
                <span className="verify-value">{currentResult.eventTitle}</span>
              </div>
              <div className="verify-row">
                <span className="verify-label">Номер билета:</span>
                <span className="verify-value code">{currentResult.ticketNumber}</span>
              </div>
              <div className="verify-row">
                <span className="verify-label">Участник:</span>
                <span className="verify-value">{currentResult.personName || 'Участник'}</span>
              </div>
              {currentResult.ticketType && (
                <div className="verify-row">
                  <span className="verify-label">Тип билета:</span>
                  <span className="verify-value">{currentResult.ticketType}</span>
                </div>
              )}
            </div>

            {!currentResult.checkedIn ? (
              <button
                type="button"
                className="button primary large checkin-btn"
                disabled={checkinLoading}
                onClick={() => void handleCheckin()}
              >
                {checkinLoading ? 'Фиксация входа…' : '✓ Отметить вход (Погасить билет)'}
              </button>
            ) : (
              <div className="checkin-success-pill">✓ Проход зарегистрирован</div>
            )}
          </div>
        )}

        <div className="verify-footer">
          <Link to="/" className="home-link">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  )
}

