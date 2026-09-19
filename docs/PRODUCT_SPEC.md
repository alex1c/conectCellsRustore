# Гексоника — Product Specification

Store title: **Гексоника — числовая головоломка**.
Package id: `ru.forestmusic.connectcells` (unchanged).

## Product principle

This is **not** a mini-game collection.

It is one high-quality endless puzzle with a hex path-merge core loop —
inspired by the *general idea* of merging numbered cells, implemented as an
original game without copying third-party names, art, assets, sounds, UI, copy,
or visual identity.

### Core value

- Extremely understandable rules
- Short time-to-first-fun
- Endless single-run sessions
- Satisfaction from group merges
- Especially satisfying **cascades**
- Desire to beat one's own high score

## Core loop

```
select cell
→ choose empty destination
→ pathfinding across empty hexes
→ merge / cascade / terminal clear   OR   spawn pressure
→ plan the next move
```

Terminal rule (confirmed): `sourceValue >= 128` scores then clears (no result cell).
Below 128: persistent `source × 4` result.

## V1.0 production shell

Home (Continue / New Game), Settings, How to Play, About,
Yandex Ads (Home/Settings/HowToPlay banners, Game Over interstitial,
Rewarded Undo), AppMetrica events, multi-day persistence.

Gameplay screen has **no** banners.
