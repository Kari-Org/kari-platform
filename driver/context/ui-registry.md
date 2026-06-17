# UI Registry

Styling is **NativeWind**; primitives, `colors`, and theme come **directly from `@kari/mobile-core`** — the
driver app has **no local theme/component re-export shims** (unlike rider). Token rules: context/design-tokens.md.

## Shared primitives — imported from `@kari/mobile-core`
`Screen` · `KariButton` · `InputField` · `PhoneInput` · `Select` · `Checkbox` · `OptionRow` · `StepDots` ·
`ScreenHeader` · `SuccessBadge` (the 10), plus `colors` / theme. Imported directly — **not** re-exported into `src/`.

## App-specific components — `src/components/` (local, driver-only)
| Component | Purpose |
|---|---|
| `IncomingRequest` | The **dispatch overlay** (`{ offer: Ride }`): rider, fare, distance, accept / reject / counter. Rendered by `(tabs)/_layout` when an offer is pending. |
| `SwipeToAccept` | Swipe-to-accept gesture control for a dispatch |
| `BrandMark` | Kari logo mark + optional wordmark |

## Navigation chrome
- Tabs use **default Expo `Tabs` + Ionicons** (home / trips / account) — **not** a custom DotTabBar (rider's pattern differs).

## Design tokens
- Same dark theme + `#FFFF00` as rider (from `@kari/mobile-core`). **Fonts: HankenGrotesk** (text) +
  **ArchivoExpanded** (wordmark) + GeistMono — loaded in `app/_layout.tsx`.

## Design-token compliance ✓
Previously the `index.tsx` wordmark, tab labels, and `SwipeToAccept` referenced unloaded `Poppins_*` (system-font
fallback). **Resolved** — they now use `ArchivoExpanded` (wordmark) + `HankenGrotesk_*` (labels/text). `grep Poppins` is clean.
