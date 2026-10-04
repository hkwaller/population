/**
 * Room codes look like `sleepy-fox-42` (makeId in lib/utils.ts): lowercase
 * words joined by hyphens (one adjective, `far-out`, has its own hyphen), then
 * a 0-99 number.
 */
const ROOM_CODE = /^[a-z]+(?:-[a-z]+)+-\d{1,2}$/

/**
 * The room code in a scanned QR code, or null if it isn't one of ours. Accepts
 * a bare code, or a link whose path is exactly `/join/<code>` (what the lobby's
 * QR code encodes). Anything else, a random QR code included, is null.
 */
export function roomCodeFromScan(text: string): string | null {
  const raw = text.trim()
  if (ROOM_CODE.test(raw)) return raw
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const match = url.pathname.match(/^\/join\/([^/]+)\/?$/)
  if (!match) return null
  const code = decodeURIComponent(match[1])
  return ROOM_CODE.test(code) ? code : null
}
