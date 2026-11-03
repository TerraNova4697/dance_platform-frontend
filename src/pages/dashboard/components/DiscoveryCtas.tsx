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
          <span className="overline">Поиск событий</span>
          <h2>Соревнования и мастер-классы</h2>
          {query.isPending && <p aria-busy="true">Считаем ближайшие мероприятия…</p>}
          {query.isError && (
            <div className="nearby-error" role="alert">
              <p>Не удалось загрузить количество мероприятий.</p>
              <button className="text-button" type="button" onClick={() => void query.refetch()}>
                Повторить
              </button>
            </div>
          )}
          {query.data && (
            <p>
              <strong>{query.data.upcomingCount} предстоящих мероприятий</strong>
              <br />
              {query.data.city ? `в городе ${query.data.city} и по всему миру` : 'по всему миру'}
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
            <Link className="button primary" to="/events?type=tournament">
              Найти соревнования
            </Link>
            <Link className="button secondary" to="/events?type=master_class">
              Найти мастер-классы
            </Link>
          </div>
        </div>
        <div className="map-preview" aria-hidden="true">
          <span className="map-road road-one" />
          <span className="map-road road-two" />
          <i>
            <Icon name="pin" size={25} />
          </i>
        </div>
      </article>
      <article className="trainer-cta">
        <div className="training-icon">
          <Icon name="training" size={28} />
        </div>
        <span className="overline">Тренировки</span>
        <h2>Найдите своего тренера</h2>
        <p>Выберите направление и удобное время для тренировки.</p>
        <Link className="button primary" to={routes.trainers}>
          Найти тренера
        </Link>
      </article>
    </section>
  )
}
