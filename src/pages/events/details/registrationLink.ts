export function withRegistrationParam(href: string, key: 'slot' | 'package', value: string): string {
  const parameter = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
  if (!href.startsWith('/login?')) return `${href}${href.includes('?') ? '&' : '?'}${parameter}`

  const loginParams = new URLSearchParams(href.slice(href.indexOf('?') + 1))
  const destination = loginParams.get('redirect') ?? '/'
  const destinationWithParameter = `${destination}${destination.includes('?') ? '&' : '?'}${parameter}`
  loginParams.set('redirect', destinationWithParameter)
  return `/login?${loginParams}`
}
