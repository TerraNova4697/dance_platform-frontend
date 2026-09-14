import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icons'

export function SectionHeading({ title, to, linkLabel = 'Все' }: { title: string; to?: string; linkLabel?: string }) {
  return <div className="section-heading"><h2>{title}</h2>{to && <Link to={to}>{linkLabel} <span aria-hidden="true">→</span></Link>}</div>
}

export function Skeleton({ variant = 'card', count = 1 }: { variant?: 'feature' | 'row' | 'card'; count?: number }) {
  return <div className={`skeleton-list skeleton-${variant}`} aria-label="Загрузка" aria-busy="true">{Array.from({ length: count }, (_, index) => <div className="skeleton-item" key={index}><span /><span /><span /></div>)}</div>
}

export function WidgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="widget-state" role="alert"><p>{message}</p><button className="text-button" type="button" onClick={onRetry}>Повторить</button></div>
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="widget-state empty-state"><div className="empty-icon">✦</div><strong>{title}</strong>{description && <p>{description}</p>}{action}</div>
}

export function Meta({ icon, children }: { icon: 'pin' | 'clock'; children: ReactNode }) {
  return <span className="meta"><Icon name={icon} size={16} />{children}</span>
}
