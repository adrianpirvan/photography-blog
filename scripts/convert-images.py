#!/usr/bin/env python3
"""
Converts all photos in content/*/photos/ to WebP at 800w, 1600w, and 2400w.
Run from anywhere in the repo before deploying or after adding new photos.

Usage:
    python3 scripts/convert-images.py

Skips files already up to date (compares modification times).
Requires: pip3 install Pillow
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is required: pip3 install Pillow")

REPO_ROOT = Path(__file__).parent.parent
WIDTHS    = [800, 1600, 2400]
QUALITY   = 85
SUFFIXES  = {'.jpg', '.jpeg', '.png'}


def needs_update(source: Path, target: Path) -> bool:
    return not target.exists() or source.stat().st_mtime > target.stat().st_mtime


def convert(source: Path):
    stem   = source.stem
    parent = source.parent

    with Image.open(source) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        orig_w, orig_h = img.size

        for w in WIDTHS:
            if w > orig_w:
                continue  # never upscale

            target = parent / f"{stem}-{w}.webp"

            if not needs_update(source, target):
                print(f"  skip  {target.name}")
                continue

            h       = round(orig_h * w / orig_w)
            resized = img.resize((w, h), Image.LANCZOS)
            resized.save(target, 'WEBP', quality=QUALITY, method=6)
            size_kb = target.stat().st_size // 1024
            print(f"  →     {target.name}  ({w}×{h}, {size_kb} KB)")


def main():
    content_dir = REPO_ROOT / 'content'

    sources = [
        p for p in content_dir.rglob('*')
        if p.is_file()
        and p.suffix.lower() in SUFFIXES
        and 'photos' in p.parts
        and not any(f'-{w}.webp' in p.name for w in WIDTHS)
    ]

    if not sources:
        print("No source images found.")
        return

    print(f"Converting {len(sources)} image(s) — quality {QUALITY}, sizes {WIDTHS}\n")

    for source in sorted(sources):
        print(source.relative_to(REPO_ROOT))
        convert(source)
        print()

    print("Done.")


if __name__ == '__main__':
    main()
