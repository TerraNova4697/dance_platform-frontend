import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { routes } from '../../../routes'
import type { TrainingBookingPreview } from '../../../types/dashboard'
import { formatDay, formatTimeRange } from '../../../utils/date'
import { Icon } from './Icons'
import { EmptyState, Meta, SectionHeading, Skeleton, WidgetError } from './Shared'

export function MyTrainingsSection({ query }: { query: UseQueryResult<TrainingBookingPreview[], Error> }) {
  return <section className="dashboard-section"><SectionHeading title="Мои тренировки" to={routes.calendar} />{query.isPending ? <Skeleton count={2} /> : query.isError ? <WidgetError message="Не удалось загрузить тренировки." onRetry={() => void query.refetch()} /> : !query.data.length ? <EmptyState title="Нет предстоящих тренировок" description="Найдите тренера и выберите удобное время." action={<Link className="button primary" to={routes.trainers}>Найти тренера</Link>} /> : <div className="cards-grid cards-grid-two">{query.data.map((training) => <article className="training-card" key={training.id}><div className="training-icon"><Icon name="training" size={25} /></div><div className="card-body"><span className="status-pill">Запись подтверждена</span><h3>{training.title}</h3><div className="training-time"><strong>{formatDay(training.startAt)}</strong><span>{formatTimeRange(training.startAt, training.endAt)}</span></div><p className="trainer-name">{training.trainerName}</p>{training.venueName && <Meta icon="pin">{training.venueName}</Meta>}<div className="card-actions"><Link to={routes.training(training.id)}>Подробнее</Link><Link to={routes.training(training.id)}>Перенести</Link></div></div></article>)}</div>}</section>
}

export function DiscoveryCtas({ nearbyCount }: { nearbyCount: number }) {
  return <section className="cta-grid"><article className="nearby-card"><div><span className="overline">Рядом с вами</span><h2>Ивенты рядом</h2><p><strong>{nearbyCount} предстоящих Ивентов</strong><br />в вашем городе</p><Link className="button secondary" to={routes.eventsMap}>Открыть карту</Link></div><div className="map-preview" aria-hidden="true"><span className="map-road road-one" /><span className="map-road road-two" /><i><Icon name="pin" size={25} /></i></div></article><article className="trainer-cta"><div className="training-icon"><Icon name="training" size={28} /></div><span className="overline">Тренировки</span><h2>Найдите своего тренера</h2><p>Выберите направление и удобное время для тренировки.</p><Link className="button primary" to={routes.trainers}>Найти тренера</Link></article></section>
}
