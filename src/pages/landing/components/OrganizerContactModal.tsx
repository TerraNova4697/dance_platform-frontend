import { useState } from 'react'

type OrganizerContactModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function OrganizerContactModal({ isOpen, onClose }: OrganizerContactModalProps) {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    eventName: '',
    city: '',
    message: '',
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div
      className="contact-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Связаться с командой On Dance Space"
    >
      <div className="contact-modal-container" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="contact-modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ✕
        </button>

        {submitted ? (
          <div className="contact-success-state">
            <div className="contact-success-icon">✓</div>
            <h3 className="contact-success-title">Спасибо за обращение!</h3>
            <p className="contact-success-text">
              Наша команда свяжется с вами в течение рабочего дня для обсуждения размещения вашего турнира или мастер-класса.
            </p>
            <button
              type="button"
              className="hero-cta-primary"
              onClick={() => {
                setSubmitted(false)
                onClose()
              }}
            >
              Закрыть окно
            </button>
          </div>
        ) : (
          <>
            <div className="contact-modal-header">
              <span className="contact-modal-eyebrow">ОРГАНИЗАТОРАМ</span>
              <h2 className="contact-modal-title">Обсудить размещение события</h2>
              <p className="contact-modal-subtitle">
                On Dance Space поможет представить ваше событие танцевальному сообществу, автоматизировать регистрацию и приём оплат.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-form-grid">
                <div className="contact-form-field">
                  <label htmlFor="org-name">Ваше имя *</label>
                  <input
                    id="org-name"
                    required
                    type="text"
                    placeholder="Александр Иванов"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="contact-form-field">
                  <label htmlFor="org-phone">Телефон / WhatsApp *</label>
                  <input
                    id="org-phone"
                    required
                    type="tel"
                    placeholder="+7 700 000 00 00"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="contact-form-field">
                  <label htmlFor="org-email">Email *</label>
                  <input
                    id="org-email"
                    required
                    type="email"
                    placeholder="organizer@dance.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="contact-form-field">
                  <label htmlFor="org-city">Город проведения</label>
                  <input
                    id="org-city"
                    type="text"
                    placeholder="Астана / Алматы / Москва"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="contact-form-field full-width">
                <label htmlFor="org-event">Название турнира / сборов</label>
                <input
                  id="org-event"
                  type="text"
                  placeholder="Silk Way Cup 2026 / Международные сборы Latin"
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                />
              </div>

              <div className="contact-form-field full-width">
                <label htmlFor="org-message">Комментарий или ссылка на положение</label>
                <textarea
                  id="org-message"
                  rows={3}
                  placeholder="Расскажите кратко о датах, масштабе и ваших пожеланиях..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <div className="contact-direct-info">
                <span>Прямая связь с куратором: </span>
                <a href="mailto:di@tocloud.kz" className="contact-link">di@tocloud.kz</a>
              </div>

              <div className="contact-form-actions">
                <button type="submit" className="hero-cta-primary full-width">
                  <span>Отправить заявку</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
