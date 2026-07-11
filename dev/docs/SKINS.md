# GITL Skins — Authoring Guide

Skins are **data, not code**. A skin is a small JSON file that sets a whitelisted
set of CSS custom properties (plus two enumerated effects) on the panel root.
A skin can never add, remove, hide, or rewire a control — structure and behavior
belong to GITL core. Unknown tokens are silently ignored, which is what makes
skins **forward- and backward-compatible** across GITL versions.

## The 30-second modding loop
1. Setup tab → pick the preset closest to what you want → **⬇** (export)
2. Edit the `.gitl.json` in any text editor
3. **⬆** (import) — done. Share the file in the Workshop thread if you like it.

## File format
```json
{
  "kind": "skin",
  "gitlSkin": 1,
  "name": "My Skin",
  "author": "you",
  "tokens": { "--g-accent": "#4ade80" },
  "fx": { "border": "aurora", "ghost": "float" }
}
```
Set only the tokens you want to change — everything else inherits Classic.

## Tokens
| Token | Role |
|---|---|
| `--g-bg` / `--g-bg-deep` | panel body / deepest wells |
| `--g-surface` / `-2` / `-3` | buttons / wells / chips |
| `--g-hover` | hover fill |
| `--g-border` / `--g-border-2` | hairlines / strong lines |
| `--g-text` / `-mid` / `-dim` / `-hot` / `-low` / `-faint` / `-ghost` | text ramp (hot = brightest) |
| `--g-muted` | secondary icons/labels |
| `--g-accent` / `--g-accent-text` / `--g-accent-deep` / `--g-accent-bg` | the accent family (hue slider rotates these four) |
| `--g-ok` / `--g-ok-deep` / `--g-ok-bg`, `--g-warn`, `--g-err` | status colors |
| `--g-radius`, `--g-shadow`, `--g-font`, `--g-blur` | shape, elevation, type, backdrop blur |
| `--g-aur1..3` | gradient stops for the aurora border fx |

`fx` — enumerated, core-implemented, state-aware (lively while running, subtle when idle), all `prefers-reduced-motion`-safe:
`border: none|aurora|glow` · `ghost: none|float|flicker|halo|glow` · `tabs: none|underline|pill` · `progress: none|shimmer|ekg` · `surface: none|sheen`

## Rules the validator enforces
- ≤ 8 KB file, values ≤ 240 chars
- No `url(`, `expression(`, `@import`, `javascript:`, `<`, `>`, `{`, `}`, `;`
  (colors, gradients, rgba/hsl, shadows, and font stacks are all fine)
- Unknown tokens/fx: dropped silently (never an error)

## Tips
- Keep it dark-leaning unless you retune the full text ramp (see the Paper
  preset for a working light example).
- Test contrast on the Run tab status line and the active tab pill first.
- Firefox-safe animation only: the aurora border is `background-position`
  keyframes on an oversized gradient — don't rely on `@property` tricks.
