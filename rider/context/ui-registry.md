# UI Registry

What the rider app renders with. Styling is **NativeWind** (className-only); tokens come from
`@kari/mobile-core` (re-exported at `@/theme/tokens`). Ground truth for tokens: **context/design-tokens.md**.

## Shared primitives — re-exported from `@kari/mobile-core`
These live in `src/components/` as **one-line re-exports** (verified: `KariButton`, `Screen`). Do not
reimplement locally. The 10 primitives:

`Screen` · `KariButton` · `InputField` · `PhoneInput` · `Select` · `Checkbox` · `OptionRow` ·
`StepDots` · `ScreenHeader` · `SuccessBadge`

(OTP entry uses `react-native-otp-entry` directly, not a shared primitive.)

## App-specific components — `src/components/` (local)
| Component | Purpose | Used by |
|---|---|---|
| `AddressAutocomplete` | Places-backed autocomplete field (calls `placesApi.autocomplete`) | `rides`, `preferences`, `book` |
| `BrandMark` | Kari logo mark + optional wordmark | auth + onboarding headers |
| `DotTabBar` | Custom bottom tab bar (dark, yellow active dot) | the `(tabs)` `tabBar` |

## Design tokens (summary — full rules in context/design-tokens.md)
- **Dark theme:** `bg #070707` · `surface #121212` · `card #181818` · `hairline #2A2A2A` · `text #FFFFFF` ·
  `muted #CBCBCB` · `subtle #888888` · `brand #FFFF00` · `success #3BD17A` · `danger #FF5A5F`.
- **Fonts:** **HankenGrotesk** (text, 400/500/600/700), **ArchivoExpanded** (the "Kari" wordmark),
  GeistMono (mono). Loaded in `_layout`; the splash uses ArchivoExpanded + HankenGrotesk (compliant).
- Use token classes (`bg-bg`, `text-text`, `bg-brand text-bg`); **never** default Tailwind palette
  (`bg-yellow-400`) or raw hex.

## Layout conventions
- Every screen wraps in `<Screen>` (safe-area + dark bg). Pushed screens get a `<ScreenHeader>` back chevron.
- Tabs use the custom `DotTabBar`; flow screens (book, ride, …) are pushed on the stack, not tabs.
