# Design System (web)

The marketing website's design system — `src/styles/tokens.css` (CSS custom properties), imported by
`app/globals.css` alongside Tailwind. **This is the LIGHT surface** — distinct from the dark app/admin theme.

## The divergence (read first)
- **Apps + admin = dark**; **web = light** (white paper, warm white→yellow page gradient).
- Web has its **own tokens** (`src/styles/tokens.css`) — do **not** import from `@kari/mobile-core` (RN/NativeWind only).
- **Shared brand DNA:** yellow `#FFFF00`, **Hanken Grotesk** (text), **Archivo Expanded** (wordmark), Geist Mono.
- *(The `tokens.css` header comment calls mobile-core "Poppins" — that's stale; mobile uses HankenGrotesk too now. The real divergence is light-vs-dark + the separate token file, not the font.)*

## Fonts (self-hosted variable, `public/fonts`)
`Hanken Grotesk` (300–800 + italic) · `Archivo Expanded` (wordmark, width axis pinned 125%) · `Geist Mono`.

## Key tokens
- **Brand:** `--kari-yellow #FFFF00` · `--kari-gold #FFD700` · `--kari-amber #FFBB00` · `--kari-glow #FFF049`.
- **Ink / neutrals (light):** `--ink #000D26` (deep navy text) · `--paper #FFFFFF` · `--paper-2/3` · `--line` · `--on-light*`.
- **Semantic:** success / info / warning / danger / rating.
- **Signature gradients:** `--grad-page` (white→cream→soft-yellow) · `--grad-amber`.
- **Radius:** sm 10 → 2xl 32, pill 999. **Spacing:** 4-pt grid. **Elevation:** sm/md/lg + `--shadow-yellow`.
- **Layout:** `--container 1200px`, `--gutter 40px`.

## Type scale (semantic classes)
`.kari-hero` (clamp 48–92px, -3px) · `.kari-h1/h2/h3` · `.kari-body` (17/1.6) · `.kari-body-sm` · `.kari-label` ·
`.kari-wordmark` (Archivo Expanded) · `.kari-price` (tabular nums). Size + weight carry hierarchy.

> context/design-tokens.md is ground truth for the **dark** app/admin theme; this **light** web theme lives here.
