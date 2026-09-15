import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { routes } from '../../../routes'
import type { NearbyEventsSummary } from '../../../services/nearbySummary'
import { Icon } from './Icons'

export function DiscoveryCtas({ query }: { query: UseQueryResult<NearbyEventsSummary, Error> }) {
  return (
    <section className="cta-grid">
      <article className="nearby-card">
        <div>
          <span className="overline">Рядом с вами</span>
          <h2>Ивенты рядом</h2>
          {query.isPending && <p aria-busy="true">Считаем ближайшие Ивенты…</p>}
          {query.isError && (
            <div className="nearby-error" role="alert">
              <p>Не удалось загрузить количество Ивентов.</p>
              <button className="text-button" type="button" onClick={() => void query.refetch()}>Повторить</button>
            </div>
          )}
          {query.data && (
            <p>
              <strong>{query.data.upcomingCount} предстоящих Ивентов</strong><br />
              {query.data.city ? `в городе ${query.data.city}` : 'рядом с вами'}
            </p>
          )}
          <Link className="button secondary" to={routes.eventsMap}>Открыть карту</Link>
        </div>
        <div className="map-preview" aria-hidden="true">
          <span className="map-road road-one" /><span className="map-road road-two" />
          <i><Icon name="pin" size={25} /></i>
        </div>
      </article>
      <article className="trainer-cta">
        <div className="training-icon"><Icon name="training" size={28} /></div>
        <span className="overline">Тренировки</span>
        <h2>Найдите своего тренера</h2>
        <p>Выберите направление и удобное время для тренировки.</p>
        <Link className="button primary" to={routes.trainers}>Найти тренера</Link>
      </article>
    </section>
  )
}
