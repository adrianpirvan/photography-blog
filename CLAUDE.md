# Development Instructions — adrianpirvan.com photography blog

## Stack
Static HTML/CSS/JS site. No build step, no framework. Serve locally with:
```
python3 -m http.server 8000
```

## Adding a new article
1. Create `content/<slug>/article.md` (see existing articles for format)
2. Add photos to `content/<slug>/photos/`
3. Add an entry to `content/posts.json`
4. **Run the image conversion script** (see below — this is mandatory)
5. Commit everything including the generated `.webp` files

## ⚠️ Image optimization — always run after adding photos
Every photo must be converted to WebP before committing. Run:
```
python3 scripts/convert-images.py
```
This generates 800w, 1600w, and 2400w WebP versions alongside the originals.
The script skips files already up to date, so it's safe to run at any time.

**If you start a session and see new photos without matching `.webp` files — run the script.**

## Branch structure
- `main` — production
- `dev` — integration branch; merge features here before promoting to main
- `article/<name>` — parked article drafts (e.g. `article/tenerife`)
- `feature/<name>` — parked feature work (e.g. `feature/narrator`, `feature/image-optimization`)

## Parked branches (as of July 2026)
- `article/tenerife` — Tenerife May 2026 article; inline galleries, real photos, WebP done. Placeholder images still present in some galleries (picsum.photos URLs — these are intentional stubs, not bugs).
- `feature/narrator` — ElevenLabs AI narration for the Tenerife article. Audio generated but voice settings (stability/style) still to be tuned. Script: `scripts/generate-narration.py`.

## Image rendering
- Carousel posts: `posts.js` generates `srcset` + `data-hd-src` automatically
- Inline gallery posts (`[[gallery]]` blocks): `posts.js` generates `srcset` automatically; external URLs (http) are skipped
- Lightbox: loads the 2400w WebP via `data-hd-src`
- External/placeholder images (picsum.photos etc.) are excluded from srcset automatically
