import { describe, expect, it, vi } from 'vitest'
import { createStartupManifest, type StartupImage } from './startupManifest'

const fakeImage = (): StartupImage => ({
  decode: () => Promise.resolve(),
  onerror: null,
  onload: null,
  src: '',
})

describe('programmatic FontFace verification', () => {
  it('accepts the newly loaded face when a failed CSS twin keeps FontFaceSet.check false', async () => {
    const fonts = {
      add: vi.fn(),
      check: vi.fn(() => false),
      delete: vi.fn(() => true),
    }
    const createFontFace = vi.fn(() => {
      const face = {
        status: 'unloaded',
        load: vi.fn(async () => {
          face.status = 'loaded'
          return face
        }),
      }
      return face
    })
    const manifest = createStartupManifest('/', {
      createFontFace,
      createImage: fakeImage,
      fonts,
    })
    const faktos = manifest.find(({ id }) => id === 'font-faktos')

    await expect(
      faktos?.load(new AbortController().signal),
    ).resolves.toBeUndefined()
    expect(fonts.delete).not.toHaveBeenCalled()
  })
})
