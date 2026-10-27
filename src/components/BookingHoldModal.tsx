import { useEffect, useState } from 'react'
import { confirmBookingPayment, cancelBookingHold, type InitiateBookingResult, type ConfirmPaymentResult } from '../api/booking'
import { FrappeApiError } from '../api/frappe'

type BookingHoldModalProps = {
  session: InitiateBookingResult
  title: string
  subtitle?: string
  onSuccess: (result?: ConfirmPaymentResult) => void
  onClose: () => void
}

function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function BookingHoldModal({
  session,
  title,
  subtitle,
  onSuccess,
  onClose,
}: BookingHoldModalProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const expires = new Date(session.expires_at).getTime()
    return Math.max(0, Math.floor((expires - Date.now()) / 1000))
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      const expires = new Date(session.expires_at).getTime()
      const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000))
      setSecondsLeft(diff)
      if (diff <= 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [session.expires_at])

  const isExpired = secondsLeft <= 0

  async function handleConfirm() {
    if (loading || isExpired) return
    setLoading(true)
    setError(null)
    try {
      const result = await confirmBookingPayment(session.checkout_session_id)
      onSuccess(result)
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) {
        setError(err.message)
      } else {
        setError('Не удалось подтвердить бронирование. Попробуйте снова.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (loading) return
    setLoading(true)
    try {
      await cancelBookingHold(session.checkout_session_id)
    } catch {
      // Ignore cleanup error
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card booking-hold-modal">
        <div className="modal-header">
          <h3>Резервирование места</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={isExpired ? onClose : handleCancel}
            aria-label="Закрыть"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="hold-timer-section">
          {!isExpired ? (
            <>
              <div className="timer-badge">
                <span className="timer-icon" aria-hidden="true">⏱️</span>
                <span className="timer-digits">{formatRemainingTime(secondsLeft)}</span>
              </div>
              <p className="timer-note">
                Место зарезервировано за вами на 15 минут. Завершите подтверждение, пока действует бронь.
              </p>
            </>
          ) : (
            <div className="timer-expired-banner" role="alert">
              ⚠️ Время бронирования истекло. Место освобождено и снова доступно для записи.
            </div>
          )}
        </div>

        <div className="booking-summary-box">
          <div className="booking-summary-title">{title}</div>
          {subtitle && <div className="booking-summary-sub">{subtitle}</div>}
          <div className="booking-summary-price">
            <span>К оплате:</span>
            <strong>
              {session.amount > 0
                ? `${session.amount.toLocaleString()} ${session.currency}`
                : 'Бесплатно'}
            </strong>
          </div>
        </div>

        <div className="payment-stub-banner" style={{ background: '#f8fafc', border: '1px dashed #94a3b8', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
          <strong>ℹ️ Демо-режим (Sprint 1):</strong> Онлайн-оплата отключена. Нажмите кнопку ниже для подтверждения бронирования и мгновенного выпуска QR-билета.
        </div>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <div className="modal-actions">
          {!isExpired ? (
            <>
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleConfirm()}
                disabled={loading}
              >
                {loading ? 'Подтверждение…' : 'Подтвердить запись'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void handleCancel()}
                disabled={loading}
              >
                Отменить бронь
              </button>
            </>
          ) : (
            <button type="button" className="secondary-button" onClick={onClose}>
              Закрыть
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

