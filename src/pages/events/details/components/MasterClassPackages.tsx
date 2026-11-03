import { Link } from 'react-router-dom'
import type { MasterClassPackage } from '../../../../types/eventDetails'
import { formatCurrency } from '../../../../utils/currency'
import { withRegistrationParam } from '../registrationLink'

export function MasterClassPackages({ packages, registrationHref }: { packages: MasterClassPackage[]; registrationHref: string }) {
  if (!packages.length) return null
  return (
    <section className="event-content-card">
      <h2>Пакеты</h2>
      <div className="ticket-type-list">
        {packages.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.title}</strong>
              {item.description && <span className="section-empty">{item.description}</span>}
              {item.alreadyBooked && <span className="availability availability-available">Вы уже записаны ✓</span>}
            </div>
            <b>{formatCurrency(item.price, item.currency)} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>/ пакет</span></b>
            {item.alreadyBooked ? (
              <button className="button secondary" type="button" disabled>Записаны ✓</button>
            ) : (
              <Link className="button secondary" to={withRegistrationParam(registrationHref, 'package', item.id)}>Выбрать пакет</Link>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
