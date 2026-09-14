import { Link, useLocation } from 'react-router-dom'
import { routes } from '../routes'

export function PlaceholderPage() {
  const { pathname } = useLocation()
  return <main className="placeholder-page"><div className="placeholder-card"><span className="logo-symbol">D</span><p className="eyebrow">Dance Platform</p><h1>Раздел в разработке</h1><p>Маршрут <code>{pathname}</code> уже подключён. Содержимое появится на следующем этапе.</p><Link className="button primary" to={routes.home}>Вернуться на главную</Link></div></main>
}
