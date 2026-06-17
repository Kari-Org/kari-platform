# Section Catalog

The marketing site is one page (`app/page.tsx`) composed of 8 section components in
`src/components/sections/`, rendered top-to-bottom.

| Order | Section | Purpose |
|---|---|---|
| 1 | `Nav` | Top navigation — logo (`KariMark`), anchor links, CTA |
| 2 | `Hero` | Headline ("Seamless Rides, Your Way"), subhead, primary CTA, hero visual |
| 3 | `Why` | Value propositions — why Kari (the differentiators) |
| 4 | `Steps` | How it works — book → match → ride, step by step |
| 5 | `RideOptions` | The ride types (Solo / Carpool / Shuttle / Subscription) — uses `@kari/types` labels |
| 6 | `Testimonials` | Rider / driver quotes |
| 7 | `Faq` | Frequently asked questions |
| 8 | `Footer` | Links, legal, social, app-store badges |

Shared: `KariMark` (logo) · `icons.tsx` (inline SVG icons). Each section is self-contained (~30–70 lines).

> Static marketing content — **no data fetching**. To change copy, edit the section component directly. The
> type scale + tokens come from [design.md](design.md).
