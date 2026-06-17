# Web (Marketing Site) Context

Code-verified reference for the **Kari marketing website** (`web/` = `@kari/web`). A **Next.js 15 static
marketing site** — distinct in stack and design from the apps. **No `ARCHITECTURE.md` exists for web** (none
was ever written); this folder is its context.

> **Authority: code is ground truth.**

## Files
[section-catalog.md](section-catalog.md) · [design.md](design.md)

## What it is
A **single-page marketing landing site** for Kari — hero, value props, how-it-works, ride options,
testimonials, FAQ, footer. Public, **no backend integration** (marketing content is static — by design).
`app/page.tsx` composes 8 section components: **Nav → Hero → Why → Steps → RideOptions → Testimonials → Faq → Footer**.

## Stack
- **Next.js 15 (App Router) + React 19 + TypeScript**, **Tailwind CSS 3**. Dev/serve on **port 3002**.
- Self-hosted **variable fonts** in `public/fonts` (Hanken Grotesk, Archivo Expanded, Geist Mono).
- `@kari/types` is a workspace dep (used by `RideOptions` for ride-type labels). **No API / Query / socket** — static.

## Structure
```
web/
├── app/
│   ├── layout.tsx          # <html>/<body>, metadata (title/desc/icons/manifest), themeColor #000D26
│   ├── page.tsx            # composes the 8 sections
│   └── globals.css         # imports tokens.css + Tailwind layers + base (body font, page wash)
└── src/
    ├── components/
    │   ├── KariMark.tsx · icons.tsx
    │   └── sections/       # Nav, Hero, Why, Steps, RideOptions, Testimonials, Faq, Footer
    └── styles/tokens.css   # the web design system (CSS custom properties) — see design.md
```

## ⚠ Design-token divergence (important)
The website is the **LIGHT surface** — white paper washed with a warm white→yellow gradient. It has its
**own** token system in `src/styles/tokens.css` and **must NOT pull tokens from `@kari/mobile-core`** (that
package is React-Native / NativeWind only — a near-black app canvas). Web shares the *brand* (yellow
`#FFFF00`, Hanken Grotesk text, Archivo Expanded wordmark) but is otherwise a separate light theme. See
[design.md](design.md) and context/design-tokens.md.

## Status
**Built** — a complete single-page marketing site (8 sections, full light design system, SEO metadata). Not
wired to the backend (it doesn't need to be). *(This corrects the earlier "barely scaffolded / ~23 lines"
note — the 23-line `page.tsx` just composes the sections.)*
