import rodinDbUrl from '../assets/fonts/FOT-Rodin Pro DB.otf?url'
import rodinEbUrl from '../assets/fonts/FOT-Rodin Pro EB.otf?url'
import faktosUrl from '../assets/fonts/Faktos.ttf?url'

export type StartupResourceKind = 'font' | 'image'

export interface StartupResource {
  readonly id: string
  readonly label: string
  readonly critical: boolean
  readonly load: (signal: AbortSignal) => Promise<void>
}

export interface StartupManifestResource extends StartupResource {
  readonly kind: StartupResourceKind
  readonly url: string
}

export interface StartupImage {
  src: string
  onload: (() => void) | null
  onerror: ((event?: unknown) => void) | null
  decode?: () => Promise<void>
}

export interface StartupFontFace {
  readonly status?: string
  load: () => Promise<unknown>
}

export interface StartupFontSet {
  load?: (descriptor: string) => Promise<unknown>
  check: (descriptor: string) => boolean
  add?: (face: StartupFontFace) => void
  delete?: (face: StartupFontFace) => boolean
}

export type StartupFontFaceFactory = (
  family: string,
  source: string,
  descriptors: { readonly style: string; readonly weight: string },
) => StartupFontFace

export interface StartupManifestDependencies {
  readonly fonts?: StartupFontSet
  readonly createFontFace?: StartupFontFaceFactory
  readonly createImage?: () => StartupImage
}

interface FontDefinition {
  readonly critical: true
  readonly descriptor: string
  readonly family: string
  readonly format: 'opentype' | 'truetype'
  readonly id: string
  readonly label: string
  readonly url: string
  readonly weight: string
}

interface ImageDefinition {
  readonly critical: boolean
  readonly id: string
  readonly label: string
  readonly path: string
}

const FONT_DEFINITIONS: readonly FontDefinition[] = [
  {
    critical: true,
    descriptor: '400 1em "Rodin"',
    family: 'Rodin',
    format: 'opentype',
    id: 'font-rodin-db',
    label: 'Rodin DB font',
    url: rodinDbUrl,
    weight: '400',
  },
  {
    critical: true,
    descriptor: '800 1em "Rodin"',
    family: 'Rodin',
    format: 'opentype',
    id: 'font-rodin-eb',
    label: 'Rodin EB font',
    url: rodinEbUrl,
    weight: '800',
  },
  {
    critical: true,
    descriptor: '400 1em "Faktos"',
    family: 'Faktos',
    format: 'truetype',
    id: 'font-faktos',
    label: 'Faktos font',
    url: faktosUrl,
    weight: '400',
  },
]

const IMAGE_DEFINITIONS: readonly ImageDefinition[] = [
  {
    critical: true,
    id: 'home-logo',
    label: 'Persona Tunes logo',
    path: 'imgs/Logos/PersonaTunes.svg',
  },
  {
    critical: false,
    id: 'loader-art',
    label: 'Chie loading illustration',
    path: 'imgs/Chie/WorkInProgress.png',
  },
  {
    critical: false,
    id: 'shared-star',
    label: 'Shared star decoration',
    path: 'star.svg',
  },
]

function abortError(): DOMException {
  return new DOMException('Startup resource load was aborted', 'AbortError')
}

function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(abortError())
  }

  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => reject(abortError())
    signal.addEventListener('abort', handleAbort, { once: true })

    promise.then(
      (value) => {
        signal.removeEventListener('abort', handleAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', handleAbort)
        reject(error)
      },
    )
  })
}

function verifyFont(fonts: StartupFontSet, descriptor: string): void {
  if (!fonts.check(descriptor)) {
    throw new Error('Font did not verify: ' + descriptor)
  }
}

function verifyLoadedFace(
  fonts: StartupFontSet,
  descriptor: string,
  face: StartupFontFace,
): void {
  if (face.status !== 'loaded') {
    verifyFont(fonts, descriptor)
  }
}

function loadInjectedFont(
  fonts: StartupFontSet,
  descriptor: string,
  signal: AbortSignal,
): Promise<void> {
  if (!fonts.load) {
    return Promise.reject(new Error('Injected font loader is unavailable'))
  }

  return withAbort(fonts.load(descriptor), signal).then(() => {
    verifyFont(fonts, descriptor)
  })
}

function loadRetryableFont(
  fonts: StartupFontSet,
  createFontFace: StartupFontFaceFactory,
  definition: FontDefinition,
  signal: AbortSignal,
): Promise<void> {
  if (fonts.check(definition.descriptor)) {
    return Promise.resolve()
  }

  if (!fonts.add || !fonts.delete) {
    return Promise.reject(new Error('Retryable FontFaceSet methods are unavailable'))
  }

  const source =
    'url("' + definition.url + '") format("' + definition.format + '")'
  const face = createFontFace(definition.family, source, {
    style: 'normal',
    weight: definition.weight,
  })
  fonts.add(face)

  return withAbort(Promise.resolve(face.load()).then(() => undefined), signal)
    .then(() => {
      verifyLoadedFace(fonts, definition.descriptor, face)
    })
    .catch((error: unknown) => {
      fonts.delete?.(face)
      throw error
    })
}
function loadImage(
  createImage: () => StartupImage,
  url: string,
  signal: AbortSignal,
): Promise<void> {
  const image = createImage()

  if (typeof image.decode === 'function') {
    image.src = url
    return withAbort(image.decode(), signal)
  }

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      image.onload = null
      image.onerror = null
      signal.removeEventListener('abort', handleAbort)
    }
    const handleAbort = () => {
      cleanup()
      reject(abortError())
    }

    if (signal.aborted) {
      handleAbort()
      return
    }

    image.onload = () => {
      cleanup()
      resolve()
    }
    image.onerror = () => {
      cleanup()
      reject(new Error(`Image failed to load: ${url}`))
    }
    signal.addEventListener('abort', handleAbort, { once: true })
    image.src = url
  })
}

function browserFonts(): StartupFontSet {
  return document.fonts
}

function browserFontFace(
  family: string,
  source: string,
  descriptors: { readonly style: string; readonly weight: string },
): StartupFontFace {
  return new FontFace(family, source, descriptors)
}

function browserImage(): StartupImage {
  return new Image()
}

export function publicAssetUrl(baseUrl: string, assetPath: string): string {
  const normalizedBase = `/${baseUrl.replace(/^\/+|\/+$/g, '')}`
  const baseWithSlash = normalizedBase === '/' ? '/' : `${normalizedBase}/`
  return `${baseWithSlash}${assetPath.replace(/^\/+/, '')}`
}

export function createStartupManifest(
  baseUrl: string,
  dependencies: StartupManifestDependencies = {},
): readonly StartupManifestResource[] {
  const fonts = dependencies.fonts ?? browserFonts()
  const createFontFace =
    dependencies.createFontFace ??
    (dependencies.fonts ? undefined : browserFontFace)
  const createImage = dependencies.createImage ?? browserImage

  const fontResources = FONT_DEFINITIONS.map(
    (definition): StartupManifestResource => ({
      critical: definition.critical,
      id: definition.id,
      kind: 'font',
      label: definition.label,
      load: (signal) =>
        createFontFace
          ? loadRetryableFont(fonts, createFontFace, definition, signal)
          : loadInjectedFont(fonts, definition.descriptor, signal),
      url: definition.url,
    }),
  )

  const imageResources = IMAGE_DEFINITIONS.map(
    ({ critical, id, label, path }): StartupManifestResource => {
      const url = publicAssetUrl(baseUrl, path)

      return {
        critical,
        id,
        kind: 'image',
        label,
        load: (signal) => loadImage(createImage, url, signal),
        url,
      }
    },
  )

  return [...fontResources, ...imageResources]
}
