# Asset Inventory

Rhythm Tunes is media-heavy. Assets are split between deployable frontend files, two source-tree test tracks, external Cloudinary video URLs, and a tracked backup library.

## Quantitative inventory

| Location | Files | Size | Formats |
|---|---:|---:|---|
| `frontend/public/` | 37 | 23,661,247 bytes (22.56 MiB) | 1 GLB, 3 MP3, 2 OTF, 21 PNG, 3 SVG, 1 TTF, 6 WAV |
| `frontend/src/Sounds/` | 2 | 11,576,582 bytes (11.04 MiB) | 2 MP3 |
| `MusicsBackUp/` | 18 | 68,053,725 bytes (64.90 MiB) | 9 MP3, 4 PNG, 3 LRC, 2 TXT |

## Locations and purpose

- `frontend/public/imgs/`: character art, cut-ins, patch-note portraits, and the Persona Tunes logo.
- `frontend/public/audios/UI/`: interface SFX and menu music.
- `frontend/public/audios/Chie/`: character voice clips.
- `frontend/public/fonts/`: Rodin and Faktos font files.
- `frontend/public/3dModels/`: experimental cartoon TV model.
- `frontend/src/Sounds/`: large test audio files bundled under the source tree; no active import was found.
- `MusicsBackUp/`: original/instrumental tracks, album images, and lyric files used as a content backup/source set.
- `VITE_VIDEO1_URL` through `VITE_VIDEO3_URL`: external background-video locations supplied through environment configuration.

## Risks and recommendations

1. Confirm redistribution rights for Persona imagery, commercial fonts, recordings, and lyrics before public deployment; the repository contains no actual license file despite the README's open-source statement.
2. Remove or relocate unused `frontend/src/Sounds/` test tracks to prevent accidental bundling and repository growth.
3. Establish an asset manifest linking a music record to source, instrumental, cover, lyrics, ownership/license, and Cloudinary public IDs.
4. Normalize Vite public paths through `import.meta.env.BASE_URL`; avoid hard-coded deployment bases.
5. Add compression/format guidance and lazy loading for heavy images, audio, video, and 3D content.

