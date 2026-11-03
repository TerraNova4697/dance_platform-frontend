import type { BookingConflictItem } from '../api/booking'

type TimeConflictWarningModalProps = {
  conflicts: BookingConflictItem[]
  message?: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

function formatInterval(startRaw: string, endRaw: string): string {
  try {
    const start = new Date(startRaw.replace(' ', 'T'))
    const end = new Date(endRaw.replace(' ', 'T'))
    const datePart = start.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    })
    const startTime = start.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const endTime = end.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${datePart}, ${startTime} – ${endTime}`
  } catch {
    return `${startRaw} – ${endRaw}`
  }
}

export function TimeConflictWarningModal({
  conflicts,
  message,
  loading = false,
  onCancel,
  onConfirm,
}: TimeConflictWarningModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(6, 5, 6, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Предупреждение о пересечении времени"
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '20px',
          maxWidth: '460px',
          width: '100%',
          padding: '24px',
          boxShadow: 'var(--shadow-card-tactile)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: 'var(--text-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.16)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fcd34d',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            ⚠️
          </span>
          <h3 style={{ margin: 0, fontSize: '20px', fontFamily: 'var(--font-serif)', fontWeight: 600 }}>
            Пересечение по времени (менее 30 минут)
          </h3>
        </div>

        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {message ||
            'У вас уже есть подтверждённая запись на другое занятие или мероприятие в это же время или с интервалом менее 30 минут:'}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {conflicts.map((item, idx) => (
            <div
              key={`${item.activity_type}_${idx}`}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fcd34d',
                  }}
                >
                  {item.type_label}
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {item.title}
                </strong>
              </div>
              {item.subtitle && (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {item.subtitle}
                </span>
              )}
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fcd34d' }}>
                🕒 {formatInterval(item.start_datetime, item.end_datetime)}
              </span>
            </div>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Вы уверены, что хотите продолжить запись несмотря на накладку по времени?
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '4px',
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Бронирование…' : 'Всё равно записаться'}
          </button>
        </div>
      </div>
    </div>
  )
}
