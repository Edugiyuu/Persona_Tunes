import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  resolve(process.cwd(), 'src/components/ModeSelector/ModeSelector.css'),
  'utf8',
)

/** The block of a `@media (...) { ... }` rule, by its condition. */
const mediaBlock = (condition: string) => {
  const start = css.indexOf(`@media ${condition}`)
  if (start === -1) return ''

  const open = css.indexOf('{', start)
  let depth = 0
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(open + 1, i)
    }
  }
  return ''
}

describe('ModeSelector CSS contract', () => {
  it('drives the blink from a keyframed animation on the closed-eye frame', () => {
    expect(css).toContain('@keyframes ModeArtworkBlink')
    expect(css).toMatch(/\.ModeArtworkBlink\s*{[^}]*animation:\s*ModeArtworkBlink/)
  })

  it('stacks the two frames in the same box so a blink cannot shift layout', () => {
    expect(css).toMatch(/\.ModeArtworkFrame\s*{[^}]*position:\s*absolute/)
    expect(css).toMatch(/\.ModeArtworkFrame\s*{[^}]*inset:\s*0/)
  })

  it('stops the blink under reduced motion, with the eyes left open', () => {
    const reduced = mediaBlock('(prefers-reduced-motion: reduce)')

    expect(reduced).toMatch(/\.ModeArtworkBlink\s*{[^}]*animation:\s*none/)
    // opacity 0 on the closed-eye frame is what "eyes open" means here.
    expect(reduced).toMatch(/\.ModeArtworkBlink\s*{[^}]*opacity:\s*0/)
  })

  it('keeps every selector scoped to the mode selector', () => {
    expect(css).not.toMatch(/(?:^|})\s*(?:img|button|nav|h2)\s*{/m)
  })
})
