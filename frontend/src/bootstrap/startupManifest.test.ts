import { describe, expect, it, vi } from 'vitest'
import {
  createStartupManifest,
  publicAssetUrl,
  type StartupImage,
} from './startupManifest'

function fakeFonts(verified = true) {
  return {
    check: vi.fn(() => verified),
    load: vi.fn(() => Promise.resolve([])),
  }
}

function fakeImage(): StartupImage & { triggerLoad: () => void } {
  let onload: (() => void) | null = null

  return {
    decode: vi.fn(() => Promise.resolve()),
    onerror: null,
    get onload() {
      return onload
    },
    set onload(handler) {
      onload = handler
    },
    src: '',
    triggerLoad: () => onload?.(),
  }
}

describe('publicAssetUrl', () => {
  it.each([
    ['/', '/star.svg'],
    ['/Persona_Tunes/', '/Persona_Tunes/star.svg'],
    ['/Persona_Tunes', '/Persona_Tunes/imgs/Logos/PersonaTunes.svg'],
  ])('joins base %s without duplicate slashes', (baseUrl, expected) => {
    const path = expected.endsWith('star.svg')
      ? '/star.svg'
      : '/imgs/Logos/PersonaTunes.svg'

    expect(publicAssetUrl(baseUrl, path)).toBe(expected)
  })
})

describe('createStartupManifest', () => {
  it('declares exactly the approved six local resources and excludes heavy media', () => {
    const manifest = createStartupManifest('/Persona_Tunes/', {
      createImage: fakeImage,
      fonts: fakeFonts(),
    })

    expect(manifest.map(({ critical, id, kind }) => ({ critical, id, kind }))).toEqual([
      { critical: true, id: 'font-rodin-db', kind: 'font' },
      { critical: true, id: 'font-rodin-eb', kind: 'font' },
      { critical: true, id: 'font-faktos', kind: 'font' },
      { critical: true, id: 'home-logo', kind: 'image' },
      { critical: false, id: 'loader-art', kind: 'image' },
      { critical: false, id: 'shared-star', kind: 'image' },
    ])

    const urls = manifest.map(({ url }) => url)
    expect(urls.slice(0, 3).map(decodeURIComponent)).toEqual([
      expect.stringContaining('/src/assets/fonts/FOT-Rodin Pro DB.otf'),
      expect.stringContaining('/src/assets/fonts/FOT-Rodin Pro EB.otf'),
      expect.stringContaining('/src/assets/fonts/Faktos.ttf'),
    ])
    expect(urls.slice(3)).toEqual([
      '/Persona_Tunes/imgs/Logos/PersonaTunes.svg',
      '/Persona_Tunes/imgs/Chie/WorkInProgress.png',
      '/Persona_Tunes/star.svg',
    ])
    expect(urls.join(' ')).not.toContain('/Persona_Tunes/fonts/')
    expect(urls.join(' ')).not.toMatch(/audio|video|api|3dModels|glb/i)
  })

  it('loads and verifies each required font face through the font-loading API', async () => {
    const fonts = fakeFonts()
    const manifest = createStartupManifest('/', {
      createImage: fakeImage,
      fonts,
    })
    const controller = new AbortController()

    await Promise.all(
      manifest
        .filter(({ kind }) => kind === 'font')
        .map(({ load }) => load(controller.signal)),
    )

    expect(fonts.load.mock.calls.map(([descriptor]) => descriptor)).toEqual([
      '400 1em "Rodin"',
      '800 1em "Rodin"',
      '400 1em "Faktos"',
    ])
    expect(fonts.check.mock.calls.map(([descriptor]) => descriptor)).toEqual([
      '400 1em "Rodin"',
      '800 1em "Rodin"',
      '400 1em "Faktos"',
    ])
  })

  it('rejects readiness when a requested font does not verify', async () => {
    const manifest = createStartupManifest('/', {
      createImage: fakeImage,
      fonts: fakeFonts(false),
    })

    await expect(manifest[0].load(new AbortController().signal)).rejects.toThrow(
      'Font did not verify: 400 1em "Rodin"',
    )
  })

  it('sets a base-safe image URL and awaits decode when available', async () => {
    const image = fakeImage()
    const manifest = createStartupManifest('/Persona_Tunes/', {
      createImage: () => image,
      fonts: fakeFonts(),
    })
    const logo = manifest.find(({ id }) => id === 'home-logo')
    const load = logo?.load(new AbortController().signal)

    expect(image.src).toBe('/Persona_Tunes/imgs/Logos/PersonaTunes.svg')
    await expect(load).resolves.toBeUndefined()
    expect(image.decode).toHaveBeenCalledOnce()
  })

  it('falls back to the load event when image.decode is unavailable', async () => {
    const image = fakeImage()
    image.decode = undefined
    const manifest = createStartupManifest('/', {
      createImage: () => image,
      fonts: fakeFonts(),
    })
    const star = manifest.find(({ id }) => id === 'shared-star')
    const load = star?.load(new AbortController().signal)

    let settled = false
    void load?.then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled).toBe(false)

    image.triggerLoad()

    await expect(load).resolves.toBeUndefined()
  })
})