# Kari — Logo & App Icon Kit

The official **Kari** brand mark ("Pin-K"): a location pin with a monogram **K**
carved into its negative space. One shape, two meanings — *place* and *Kari*.
Everything here is drawn from scratch as clean vectors, plus ready-to-ship raster
exports.

> Brand colours — **Yellow `#FFFF00`** · **Navy `#000D26`** · Near-black `#0A0A0A`
> Wordmark font — **Archivo Expanded** (included in `/fonts`, OFL)

---

## What's inside

```
kari-brand-kit/
├─ mark/                      the logomark on its own
│  ├─ kari-mark.svg           ← currentColor (inherits CSS color — best for code)
│  ├─ kari-mark-yellow.svg    ← #FFFF00
│  ├─ kari-mark-navy.svg      ← #000D26
│  ├─ kari-mark-white.svg     ← #FFFFFF
│  ├─ kari-mark-black.svg     ← #000000
│  ├─ kari-mark-yellow-512.png   transparent PNG
│  └─ kari-mark-navy-512.png     transparent PNG
├─ lockup/                    mark + "Kari" wordmark
│  ├─ kari-lockup-horizontal-navy.svg     (for light backgrounds)
│  ├─ kari-lockup-horizontal-white.svg    (for dark backgrounds)
│  ├─ kari-lockup-stacked-navy.svg
│  └─ kari-lockup-stacked-white.svg
├─ app-icon/                  store-ready icons
│  ├─ kari-appicon.svg        yellow mark on navy squircle (1024, master)
│  ├─ kari-appicon-yellow.svg navy mark on yellow squircle
│  ├─ kari-appicon-dark.svg   yellow mark on near-black squircle
│  ├─ ios-1024.png            iOS App Store icon (no transparency)
│  ├─ android-512.png         Play Store icon
│  └─ maskable-512.png        Android adaptive / PWA maskable (full-bleed, safe zone)
├─ favicon/
│  ├─ favicon.svg             scalable favicon (navy tile + yellow mark)
│  ├─ favicon-16.png  favicon-32.png  favicon-48.png
│  ├─ apple-touch-icon-180.png
│  └─ icon-192.png  icon-512.png      (PWA manifest)
└─ fonts/
   ├─ Archivo-Variable.ttf    wordmark font (width axis → set 125% for "Expanded")
   └─ OFL.txt                 license
```

---

## Usage rules (the short version)

- **Primary pairing** = yellow mark on navy. On light backgrounds use the **navy**
  mark; on dark, **yellow** or **white**.
- **Clear space** = half the pin's width on every side. Don't crowd it.
- **Minimum size** = 16px (the mark is built to keep the K open that small).
- **Never** stretch, rotate, recolour outside the palette, add effects/gradients,
  or place the yellow mark on a light background (low contrast).
- The mark needs a **solid fill** — the K is negative space, so no outline-only
  version.

---

## For Claude Code / developers

**Web (favicon + PWA).** Drop `favicon/` into `public/` and add to `<head>`:

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-32.png" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon-180.png" />
<link rel="manifest" href="/site.webmanifest" />
```

`site.webmanifest` icons:

```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "theme_color": "#000D26",
  "background_color": "#000D26"
}
```

**Inline in components.** Use `mark/kari-mark.svg` (it's `fill="currentColor"`), so
it inherits the surrounding text colour — set `color` / `className` to recolour.

**iOS (Expo / Xcode).** Use `app-icon/ios-1024.png` as the App Store icon (it has
no transparency, as required).

**Android (Expo / Studio).** Use `android-512.png`, and `maskable-512.png` for the
adaptive foreground/round icon (content sits in the central safe zone).

**Lockups.** The wordmark is **Archivo Expanded** (Archivo's width axis at 125%).
The lockup SVGs reference that font by name — for fully portable files,
**outline the text to paths** in your vector tool before shipping, or keep
`fonts/Archivo-Variable.ttf` available. For UI, prefer mark + live `<text>`/HTML
so it stays crisp.

---

*Need other sizes, an animated splash version, or the icons pre-wired into the
`web/` and Expo apps? Ask and I'll generate them.*
