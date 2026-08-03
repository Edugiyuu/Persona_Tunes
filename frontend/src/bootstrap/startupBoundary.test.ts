import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('startup network boundary', () => {
  it('keeps remote route fonts out of the application shell', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    const musicCss = readFileSync(
      resolve(process.cwd(), 'src/components/SelectMusic/SelectMusic.css'),
      'utf8',
    )

    expect(html).not.toContain('fonts.googleapis.com')
    expect(html).not.toContain('fonts.gstatic.com')
    expect(musicCss).toContain('fonts.googleapis.com/css2?family=Nunito')
    expect(musicCss).not.toContain('family=Bitter')
  })
})
