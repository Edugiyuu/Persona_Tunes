/**
 * The one bit the guide remembers: when the player last answered the prompt.
 *
 * Anything older than a day counts as never answered (D-2). Private windows
 * throw on every `localStorage` access, so nothing here is allowed to escape.
 */

export const GUIDE_STORAGE_KEY = 'rt.guide.seen'
export const GUIDE_TTL_MS = 24 * 60 * 60 * 1000

export function readGuideAnsweredAt(): number | null {
  try {
    const raw = window.localStorage.getItem(GUIDE_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function hasAnsweredRecently(now = Date.now()): boolean {
  const answeredAt = readGuideAnsweredAt()
  if (answeredAt === null) {
    return false
  }
  return now - answeredAt < GUIDE_TTL_MS
}

export function rememberAnswer(now = Date.now()): void {
  try {
    window.localStorage.setItem(GUIDE_STORAGE_KEY, String(now))
  } catch {
    // A browser that refuses to remember just asks again next time.
  }
}
