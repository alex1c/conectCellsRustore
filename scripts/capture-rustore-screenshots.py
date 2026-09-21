"""
Capture RuStore gameplay screenshots from a DEV build on a connected device.

Uses the DEV ScreenshotCaptureBar (top strip) so taps stay above the gesture zone.
Fixtures auto-hide the bar after load for clean captures.
"""
from __future__ import annotations

import re
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image

SERIAL = sys.argv[1] if len(sys.argv) > 1 else '6af40c5'
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / 'store-assets' / 'screenshots'
TMP = ROOT / 'tmp-shot-work'
TMP.mkdir(exist_ok=True)

TARGET_W = 1080
TARGET_H = 1920

# accessibilityLabel stays the full fixture id; on-screen text is shortened.
SHOTS = [
	('screenshotNormal', '01-hero.png', None, 860),
	('screenshotMove', '02-movement.png', 'select', 180),
	('screenshotMerge', '03-merge.png', None, 420),
	('screenshotCascade', '04-cascade.png', None, 980),
	('screenshotHigh', '05-high-values.png', None, 4860),
	('screenshotLevel', '06-levels.png', None, 1450),
]


def adb (*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
	return subprocess.run(
		['adb', '-s', SERIAL, *args],
		check=check,
		capture_output=True,
		text=True,
		encoding='utf-8',
		errors='replace',
	)


def dump_ui () -> str:
	adb('shell', 'uiautomator', 'dump', '/sdcard/ui.xml')
	local = TMP / 'ui.xml'
	adb('pull', '/sdcard/ui.xml', str(local))
	return local.read_text(encoding='utf-8', errors='replace')


def nodes (xml: str) -> list[dict[str, object]]:
	out: list[dict[str, object]] = []
	# Match nodes with text and/or content-desc.
	for m in re.finditer(
		r'content-desc="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',
		xml,
	):
		x1, y1, x2, y2 = map(int, m.groups()[1:])
		out.append({
			'desc': m.group(1),
			'text': '',
			'cx': (x1 + x2) // 2,
			'cy': (y1 + y2) // 2,
		})
	for m in re.finditer(
		r'text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',
		xml,
	):
		x1, y1, x2, y2 = map(int, m.groups()[1:])
		out.append({
			'desc': '',
			'text': m.group(1),
			'cx': (x1 + x2) // 2,
			'cy': (y1 + y2) // 2,
		})
	return out


def find_label (xml: str, *labels: str) -> dict[str, object] | None:
	wanted = set(labels)
	for n in nodes(xml):
		if n['text'] in wanted or n['desc'] in wanted:
			return n
	return None


def find_prefix_text (xml: str, prefix: str) -> dict[str, object] | None:
	for n in nodes(xml):
		if str(n['text']).startswith(prefix):
			return n
	return None


def tap (x: int, y: int) -> None:
	adb('shell', 'input', 'tap', str(x), str(y))
	time.sleep(0.4)


def set_immersive (enabled: bool) -> None:
	value = 'immersive.full=*' if enabled else 'null'
	adb('shell', 'settings', 'put', 'global', 'policy_control', value, check=False)
	time.sleep(0.5)


def score_from_ui (xml: str) -> int | None:
	# ScoreHeader shows the numeric score as its own text node near the top.
	# Prefer exact fixture scores when present.
	candidates: list[int] = []
	for n in nodes(xml):
		text = str(n['text'])
		if text.isdigit() and int(n['cy']) < 450:
			candidates.append(int(text))
	return candidates[0] if candidates else None


def dismiss_dev_menus () -> None:
	xml = dump_ui()
	if find_label(xml, 'Reload', 'Go home', 'Open React Native dev menu'):
		# Close Expo/RN menu overlay.
		adb('shell', 'input', 'keyevent', 'KEYCODE_BACK', check=False)
		time.sleep(0.5)


def ensure_game () -> None:
	adb(
		'shell',
		'am',
		'start',
		'-n',
		'ru.forestmusic.connectcells/.MainActivity',
		check=False,
	)
	time.sleep(1.0)
	dismiss_dev_menus()
	xml = dump_ui()
	if find_prefix_text(xml, 'DEV') or find_label(
		xml,
		'shots',
		'Normal',
		'hideScreenshotBar',
		'showScreenshotBar',
	):
		return
	n = find_label(xml, 'Продолжить', 'Continue')
	if n:
		tap(int(n['cx']), int(n['cy']))
		time.sleep(1.0)
		return
	n = find_label(xml, 'Новая игра', 'New Game')
	if n:
		tap(int(n['cx']), int(n['cy']))
		time.sleep(1.0)
		return
	print('Could not enter game')
	for item in nodes(xml):
		label = item['text'] or item['desc']
		if label:
			print(' ', repr(label))
	raise SystemExit(3)


def show_shot_bar () -> None:
	dismiss_dev_menus()
	xml = dump_ui()
	if find_label(xml, 'Normal', 'screenshotNormal', 'hideScreenshotBar'):
		return
	n = find_label(xml, 'shots', 'showScreenshotBar')
	if n:
		tap(int(n['cx']), int(n['cy']))
		time.sleep(0.55)
		xml = dump_ui()
		if find_label(xml, 'Normal', 'screenshotNormal'):
			return
	# Invisible toggle fallback (opacity 0 may omit accessibility nodes).
	size = adb('shell', 'wm', 'size', check=False).stdout
	height = 2400
	for part in size.replace('Physical size:', '').strip().split('x'):
		if part.strip().isdigit() and int(part) > 1000:
			height = int(part.strip())
	tap(140, height - 160)
	time.sleep(0.55)
	xml = dump_ui()
	if find_label(xml, 'Normal', 'screenshotNormal'):
		return
	print('Screenshot bar not found; visible labels:')
	for item in nodes(xml):
		label = item['text'] or item['desc']
		if label:
			print(' ', repr(label)[:80])
	raise SystemExit('Screenshot bar not found (need __DEV__ reload)')


def load_fixture (fixture_id: str, expected_score: int) -> None:
	show_shot_bar()
	short = fixture_id.replace('screenshot', '')
	xml = dump_ui()
	n = find_label(xml, fixture_id, short)
	if n is None:
		raise SystemExit(f'Missing chip {fixture_id}/{short}')
	tap(int(n['cx']), int(n['cy']))
	time.sleep(1.2)
	xml = dump_ui()
	score = score_from_ui(xml)
	print(f'  loaded score={score} expected={expected_score}')
	if score != expected_score:
		print('  WARNING: score mismatch — fixture may not have applied')


def hide_shot_bar () -> None:
	xml = dump_ui()
	if not find_label(xml, 'Normal', 'screenshotNormal'):
		return
	hide = find_label(xml, 'hide', 'hideScreenshotBar')
	if hide:
		tap(int(hide['cx']), int(hide['cy']))
		time.sleep(0.4)


def select_move_cell () -> None:
	# screenshotMove: value 2 near row 2 col 1
	tap(280, 980)
	time.sleep(0.35)


def capture_crop (name: str) -> Path:
	remote = '/sdcard/rustore_shot.png'
	adb('shell', 'screencap', '-p', remote)
	raw = TMP / f'{name}-raw.png'
	adb('pull', remote, str(raw))
	im = Image.open(raw).convert('RGB')
	w, h = im.size
	if w != TARGET_W:
		scale = TARGET_W / float(w)
		im = im.resize(
			(TARGET_W, int(round(h * scale))),
			Image.Resampling.LANCZOS,
		)
		w, h = im.size
	# Drop status bar (~80) and stop before DEV/nav (~1930 on OPPO 2400).
	top = 80
	bottom = min(h, 1930)
	content = im.crop((0, top, TARGET_W, bottom))
	# Pad to exact 1080x1920 with brand background (no geometry distortion).
	canvas = Image.new('RGB', (TARGET_W, TARGET_H), (16, 24, 38))
	canvas.paste(content, (0, 0))
	OUT_DIR.mkdir(parents=True, exist_ok=True)
	out = OUT_DIR / name
	canvas.save(out, format='PNG', optimize=True)
	print(f'Wrote {out} {canvas.size}')
	return out


def main () -> None:
	try:
		set_immersive(True)
		ensure_game()
		for fixture_id, filename, action, expected in SHOTS:
			print('===', fixture_id, '->', filename)
			load_fixture(fixture_id, expected)
			if action == 'select':
				select_move_cell()
			hide_shot_bar()
			time.sleep(0.25)
			capture_crop(filename)
		print('DONE')
	finally:
		set_immersive(False)


if __name__ == '__main__':
	main()
