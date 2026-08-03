import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  resolve(process.cwd(), 'src/components/loadingScreen/loadingScreen.css'),
  'utf8',
)

describe('LoadingScreen CSS contract', () => {
  it('keeps selectors scoped and provides responsive reduced-motion safeguards', () => {
    expect(css).not.toMatch(/(?:^|})\s*(?:img|p)\s*{/m)
    expect(css).toContain('min-height: 100dvh')
    expect(css).toContain('min-width: 0')
    expect(css).toContain('.loadingScreen__button:focus-visible')
    expect(css).toContain('@media (max-width: 30rem)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).not.toContain('ease-in-out')
  })
})
