#!/usr/bin/env python3
"""
Generate Android adaptive-icon layers from the approved master.

Master (never overwritten):
  assets/icon_gpt.png

Outputs (tracked):
  assets/android-icon-foreground.png  — scaled artwork + transparent safe padding
  assets/android-icon-background.png  — solid #101826 (matches artwork navy)

Default scale places the COMPLETE master at ~72% of the 1024 canvas so OEM
rounded masks (e.g. OPPO) do not clip the bottom «Гексоника» title.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / 'assets' / 'icon_gpt.png'
FOREGROUND_OUT = ROOT / 'assets' / 'android-icon-foreground.png'
BACKGROUND_OUT = ROOT / 'assets' / 'android-icon-background.png'

CANVAS = 1024
# Dark navy used by expo.android.adaptiveIcon.backgroundColor / splash.
BG_RGB = (0x10, 0x18, 0x26)


def generate_foreground (scale: float) -> Image.Image:
	"""Center the full master on a transparent canvas at the given scale."""
	if not (0.40 <= scale <= 0.95):
		raise ValueError(f'scale out of range: {scale}')

	master = Image.open(MASTER).convert('RGBA')
	# Scale the COMPLETE artwork — never crop the master to fit the mask.
	art_size = max(1, int(round(CANVAS * scale)))
	art = master.resize((art_size, art_size), Image.Resampling.LANCZOS)

	canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
	offset = ((CANVAS - art_size) // 2, (CANVAS - art_size) // 2)
	canvas.paste(art, offset, art)
	return canvas


def generate_background () -> Image.Image:
	"""Solid adaptive background compatible with the artwork navy."""
	return Image.new('RGB', (CANVAS, CANVAS), BG_RGB)


def main () -> None:
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument(
		'--scale',
		type=float,
		default=0.65,
		help='Artwork size as fraction of canvas (default 0.65; OPPO-safe)',
	)
	args = parser.parse_args()

	if not MASTER.is_file():
		raise SystemExit(f'Missing master: {MASTER}')

	fg = generate_foreground(args.scale)
	bg = generate_background()
	FOREGROUND_OUT.parent.mkdir(parents=True, exist_ok=True)
	fg.save(FOREGROUND_OUT, format='PNG')
	bg.save(BACKGROUND_OUT, format='PNG')

	pad = (CANVAS - int(round(CANVAS * args.scale))) / 2
	print(f'master={MASTER.name} (unchanged)')
	print(f'canvas={CANVAS}x{CANVAS}')
	print(
		f'scale={args.scale:.2f} artwork~{int(round(CANVAS * args.scale))}px '
		f'pad~{pad:.1f}px/side',
	)
	print(f'wrote {FOREGROUND_OUT.relative_to(ROOT)}')
	print(f'wrote {BACKGROUND_OUT.relative_to(ROOT)}')


if __name__ == '__main__':
	main()
