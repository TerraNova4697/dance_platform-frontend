import { Link, useLocation } from 'react-router-dom'
import { routes } from '../routes'
import { BrandLogo } from '../components/BrandLogo'

export function PlaceholderPage() {
  const { pathname } = useLocation()
  return (
    <main className="placeholder-page">
      <div className="placeholder-card">
        <div style={{ marginBottom: '18px' }}>
          <BrandLogo size={36} showText={true} />
        </div>
        <p className="eyebrow">on dance space</p>
        <h1>Раздел в разработке</h1>
        <p>Маршрут <code>{pathname}</code> уже подключён. Содержимое появится на следующем этапе.</p>
        <Link className="button primary" to={routes.home}>Вернуться на главную</Link>
      </div>
    </main>
  )
}
