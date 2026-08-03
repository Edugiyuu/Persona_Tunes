import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(resolve(process.cwd(), 'src/App.css'), 'utf8')

describe('startup font declarations', () => {
  it('preserves the original Rodin face while declaring verified canonical fonts', () => {
    const faces = appCss.match(/@font-face\s*\{[^}]+\}/g) ?? []
    const originalRodin = faces.find((face) =>
      face.includes("font-family: 'Rodin';"),
    )
    const rodinDb = faces.find((face) =>
      face.includes("font-family: 'Rodin DB';"),
    )
    const rodinEb = faces.find((face) =>
      face.includes("font-family: 'Rodin EB';"),
    )
    const faktos = faces.find((face) =>
      face.includes("font-family: 'Faktos';"),
    )

    expect(faces).toHaveLength(4)
    expect(originalRodin).toContain('FOT-Rodin Pro EB.otf')
    expect(originalRodin).toContain('font-weight: 400')
    expect(rodinDb).toContain('FOT-Rodin Pro DB.otf')
    expect(rodinDb).toContain('font-weight: 400')
    expect(rodinEb).toContain('FOT-Rodin Pro EB.otf')
    expect(rodinEb).toContain('font-weight: 800')
    expect(faktos).toContain("Faktos.ttf') format('truetype')")
    expect(appCss).not.toContain('/Persona_Tunes/')
  })
})