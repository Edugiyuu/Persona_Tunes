import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  resolve(process.cwd(), 'src/components/GuideTour/GuideTour.css'),
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

describe('GuideTour CSS contract', () => {
  it('stacks every portrait frame in one box, so nothing shifts (AC-5)', () => {
    expect(css).toMatch(/\.GuideFrame\s*{[^}]*position:\s*absolute/)
    expect(css).toMatch(/\.GuideFrame\s*{[^}]*inset:\s*0/)
    // The frames are absolutely positioned, so the box needs its own size.
    expect(css).toMatch(/\.GuidePortrait\s*{[^}]*aspect-ratio:\s*1/)
  })

  it('stands her on the left, per D-3 (AC-5)', () => {
    expect(css).toMatch(/\.GuidePortrait\s*{[^}]*left:\s*0/)
    expect(css).not.toMatch(/\.GuidePortrait\s*{[^}]*right:/)
  })

  it('paints one mouth frame at a time off `data-speaking` (AC-5)', () => {
    expect(css).toMatch(/\.GuideMouthOpen\s*{[^}]*opacity:\s*0/)
    expect(css).toMatch(
      /\.GuideFace\[data-speaking='true'\]\s\.GuideMouthClosed\s*{[^}]*opacity:\s*0/,
    )
  })

  it('has no blink: the eyes-closed art is not wired up', () => {
    expect(css).not.toContain('GuideBlink')
  })

  it('puts the dialogue box on the side she is not standing on (AC-10)', () => {
    expect(css).toMatch(/\.GuideDialogue\s*{[^}]*margin-left:\s*auto/)
  })

  it('lets clicks through the guide layer to the spotlit entry (AC-4)', () => {
    expect(css).toMatch(/\.GuideStage\s*{[^}]*pointer-events:\s*none/)
  })

  it('hides driver.js chrome entirely, per D-1 (AC-4)', () => {
    expect(css).toMatch(/\.driver-popover\s*{[^}]*display:\s*none\s*!important/)
  })

  it('stops every loop and transition under reduced motion (AC-9)', () => {
    const reduced = mediaBlock('(prefers-reduced-motion: reduce)')

    expect(reduced).toMatch(/\.GuideFrame\s*{[^}]*transition:\s*none/)
    expect(reduced).toMatch(/\.driver-active-element\s*{[^}]*animation:\s*none/)
    expect(reduced).toMatch(
      /\.driver-fade\s\.driver-overlay\s*{[^}]*animation:\s*none/,
    )
  })

  it('keeps the spotlight pulse out of the reduced-motion path (AC-9)', () => {
    expect(css).toContain('@keyframes GuideSpotlight')
    expect(css).toMatch(/\.driver-active-element\s*{[^}]*animation:\s*GuideSpotlight/)
  })

  it('reserves room for the typed line so the plate cannot reflow', () => {
    expect(css).toMatch(/\.GuideLine\s*{[^}]*min-height:/)
  })

  it('keeps every selector scoped to the guide or to driver.js', () => {
    expect(css).not.toMatch(/(?:^|})\s*(?:img|button|nav|p|h2|div)\s*{/m)
  })
})
