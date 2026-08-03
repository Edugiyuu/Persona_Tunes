import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(resolve(process.cwd(), 'src/App.css'), 'utf8')

describe('startup font declarations', () => {
  it('declares Rodin DB, Rodin EB, and Faktos with Vite-managed URLs', () => {
    expect(appCss.match(/@font-face/g)).toHaveLength(3)
    expect(appCss).toContain("url('./assets/fonts/FOT-Rodin Pro DB.otf') format('opentype')")
    expect(appCss).toContain("url('./assets/fonts/FOT-Rodin Pro EB.otf') format('opentype')")
    expect(appCss).toContain("url('./assets/fonts/Faktos.ttf') format('truetype')")
    expect(appCss).toContain('font-weight: 400')
    expect(appCss).toContain('font-weight: 800')
    expect(appCss).not.toContain('/Persona_Tunes/')
  })
})