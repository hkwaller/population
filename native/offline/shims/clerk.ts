/** Stand-in for @clerk/nextjs in the offline island: always a guest, already loaded. */
export function useUser() {
  return { isLoaded: true, isSignedIn: false, user: null }
}
