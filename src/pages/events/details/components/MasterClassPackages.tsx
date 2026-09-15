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
            <div><strong>{item.title}</strong>{item.description && <span className="section-empty">{item.description}</span>}</div>
            <b>{formatCurrency(item.price, item.currency)}</b>
            <Link className="button secondary" to={withRegistrationParam(registrationHref, 'package', item.id)}>Выбрать</Link>
          </article>
        ))}
      </div>
    </section>
  )
}
