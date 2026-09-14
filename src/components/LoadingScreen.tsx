export function LoadingScreen() {
  return (
    <main className="loading-screen" aria-live="polite" aria-busy="true">
      <span className="spinner" aria-hidden="true" />
      <span>Проверяем сессию…</span>
    </main>
  )
}
