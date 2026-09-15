export function normalizeCoordinate(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate : undefined
}
