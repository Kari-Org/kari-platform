# Design Tokens

Design tokens for KariPlatform mobile and admin apps. Use these exact values — never hardcode colors or use default Tailwind palette classes.

> **This file is ground truth — the repo must comply with it.** Where code diverges (e.g. the rider splash
> referencing an unloaded Poppins font → system-font fallback), the *code* is the bug to fix, not this doc.
> Known compliance gaps are tracked in progress-tracker.md.

---

## Mobile Apps (Rider + Driver)

All tokens defined in `packages/mobile-core/src/theme/tokens.ts` and the Tailwind preset at `packages/mobile-core/tailwind-preset.js`.

### Colors
```typescript
brand:    '#FFFF00'   // Kari yellow — primary accent
bg:       '#070707'   // App background (near-black)
surface:  '#121212'   // Card/modal surfaces
card:     '#181818'   // Elevated card background
hairline: '#2A2A2A'   // Subtle borders/dividers
text:     '#FFFFFF'   // Primary text
muted:    '#CBCBCB'   // Secondary text
subtle:   '#888888'   // Tertiary/placeholder text
success:  '#3BD17A'   // Positive states (ride complete, match)
danger:   '#FF5A5F'   // Error states, cancel, panic
```

### Fonts
```
Primary: HankenGrotesk (Regular 400, Medium 500, SemiBold 600, Bold 700)
Wordmark: Archivo Expanded
Monospace: Geist Mono 400
```
Font file: `brand/fonts/Archivo-Variable.ttf` (wordmark only). HankenGrotesk and GeistMono loaded via `expo-font` from Google Fonts.

### Design Principles (Mobile)
- **Dark theme everywhere** — black backgrounds, white text, yellow accents
- Brand yellow `#FFFF00` used sparingly: primary buttons, active states, key CTAs
- No gradients on card surfaces — flat dark colors only
- Borders use `hairline` (#2A2A2A) — never pure white or gray
- Success/danger for semantic states only — never as decorative colors

### NativeWind Usage
```tsx
// Correct — uses preset tokens
className="bg-bg text-text"
className="bg-brand text-bg"  // Yellow button with dark text
className="border-hairline"

// Never — default Tailwind
className="bg-black text-white"
className="bg-yellow-400"
```

---

## Admin Dashboard

### Theme
- **Dark theme** matching the Kari brand
- 17px root font size
- Kari logo: `admin/public/kari-logo.png` (copied from `rider/assets/logo.png`)

### Stack
- Tailwind CSS 3 (NOT v4 — different from the reference project)
- shadcn/ui components
- Colors configured in `tailwind.config.ts`

### Key Colors
```
Background:     Dark (near-black)
Surface:        Slightly lighter dark
Accent:         Kari brand yellow or purple (TBD per design phase)
Text primary:   White
Text secondary: Gray
Success:        Green
Danger:         Red
```

---

## Web (Marketing Site) — Light Theme

The marketing site (`web/`) is the **one light surface** — apps + admin are dark. It has its **own** token
system in `web/src/styles/tokens.css` (CSS custom properties) and **must not** import `@kari/mobile-core`
(RN/NativeWind only). Full detail: `web/context/design.md`.

- **Theme:** light — white paper washed with a warm white→yellow page gradient (`--grad-page`).
- **Shared brand:** yellow `#FFFF00`, **Hanken Grotesk** (text), **Archivo Expanded** (wordmark), Geist Mono — self-hosted variable fonts.
- **Ink:** deep navy `#000D26` (text + logo road) — not the apps' near-black canvas.
- **Type:** semantic CSS classes (`.kari-hero`, `.kari-h1/2/3`, `.kari-body`, `.kari-wordmark`, …).

So the platform has **two surfaces**: dark (mobile apps + admin) and light (web). Brand DNA is shared; the canvas is not.

---

## Brand Assets

Located in `brand/`:

| Asset | Path | Usage |
|-------|------|-------|
| Logo mark (SVG) | `brand/mark/` | App icons, in-app branding |
| Logo lockup | `brand/lockup/` | Mark + "Kari" wordmark together |
| App icon | `brand/app-icon/` | Store-ready icons (iOS/Android) |
| Favicon | `brand/favicon/` | Web + admin browser tabs |
| Wordmark font | `brand/fonts/Archivo-Variable.ttf` | "Kari" text in logos |

### Brand Colors
```
Primary:    #FFFF00 (brand yellow)
Background: #070707 (near-black)
```

The brand is built around high-contrast yellow-on-black. All product surfaces should reinforce this.

---

## Invariants

- Never use default Tailwind color classes (`bg-gray-800`, `text-yellow-400`) in any Kari product
- Always import tokens from `@kari/mobile-core/theme/tokens` for programmatic use
- Always use the NativeWind preset for className-based styling
- Brand yellow is `#FFFF00` — never substitute with another yellow
- Dark theme is mandatory for mobile apps — no light mode
- **Web (marketing site) is the exception** — a light theme with its own tokens (`web/src/styles/tokens.css`); never use `@kari/mobile-core` tokens for web
- Admin uses dark theme by default (matches brand)
