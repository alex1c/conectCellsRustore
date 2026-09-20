# Hexonica — Interactive Onboarding (Phase 4.4)

Short interactive tutorial on the real 6×8 hex board.

## First launch

`onboardingDone == false` (default)
→ interactive tutorial (`source=first_launch`)
→ Home

Skip or complete both set `connectcells.onboarding.done.v1 = true`.

Later launches go straight to Home.

## Replay

Home / Settings → **Как играть**
→ same tutorial (`source=help`)
→ returns to previous route

Replay does **not** reset active party, best score, best level, or settings.

## Steps

1. Select highlighted cell  
2. Move to highlighted empty  
3. Free-path tip  
4. Guided merge (4×1 → 4)  
5. Merge tip  
6. Large-group tip (≥5 helps pressure)  
7. Spawn demo move  
8. Levels tip  
9. Done → **Играть**

## Isolation

- Local `GameState` only (`createGameFromBoard` / `applyMove`)
- No `saveGameState` / best updates
- No banners / interstitial / rewarded
- Tutorial analytics: `tutorial_start|step|complete|skip` only  
  (no `move` / `merge` / `game_over` gameplay events)

## DEV

DevPanel → **Reset onboarding** clears the flag and opens the tutorial.
