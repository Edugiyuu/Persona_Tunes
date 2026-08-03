import { describe, expect, it, vi } from 'vitest'
import { createStartupManifest, type StartupImage } from './startupManifest'

const fakeImage = (): StartupImage => ({
  decode: () => Promise.resolve(),
  onerror: null,
  onload: null,
  src: '',
})

describe('startup font retry', () => {
  it('removes a failed face and creates a fresh FontFace on retry', async () => {
    let verified = false
    let shouldFail = true
    const fonts = {
      add: vi.fn(),
      check: vi.fn(() => verified),
      delete: vi.fn(() => true),
    }
    const createFontFace = vi.fn(() => ({
      load: vi.fn(async () => {
        if (shouldFail) {
          shouldFail = false
          throw new Error('temporary network failure')
        }
        verified = true
      }),
    }))
    const manifest = createStartupManifest('/', {
      createFontFace,
      createImage: fakeImage,
      fonts,
    })
    const faktos = manifest.find(({ id }) => id === 'font-faktos')
    const signal = new AbortController().signal

    await expect(faktos?.load(signal)).rejects.toThrow(
      'temporary network failure',
    )
    await expect(faktos?.load(signal)).resolves.toBeUndefined()

    expect(createFontFace).toHaveBeenCalledTimes(2)
    expect(createFontFace).toHaveBeenLastCalledWith(
      'Faktos',
      expect.stringContaining('Faktos'),
      { style: 'normal', weight: '400' },
    )
    expect(fonts.add).toHaveBeenCalledTimes(2)
    expect(fonts.delete).toHaveBeenCalledTimes(1)
  })
})
