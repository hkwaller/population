import { navigate } from './nav'

/** Stand-in for next/navigation in the offline island: there is one screen stack, no URLs. */
export function useRouter() {
  return { push: navigate, replace: navigate, back: () => navigate('/'), refresh: () => {}, prefetch: () => {} }
}

export function usePathname() {
  return '/'
}

export function useSearchParams() {
  return new URLSearchParams()
}
