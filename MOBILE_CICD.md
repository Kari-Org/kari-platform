# Mobile CI/CD (rider + driver)

Dedicated pipeline for the Expo apps, **fully separate** from the backend/web/admin
(Railway) pipeline. GitHub Actions is the orchestrator; the native builds, OTA
updates, and store submissions run on **EAS** servers. Nothing here gates or is
gated by `ci.yml` or Railway.

| Workflow           | File                                   | Trigger                                                   | Does                                        |
| ------------------ | -------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| **Mobile CI**      | `.github/workflows/mobile-ci.yml`      | PR / push to `main` on mobile paths                       | typecheck + lint + test (the gate)          |
| **Mobile OTA**     | `.github/workflows/mobile-ota.yml`     | push to `main` → `preview`; manual dispatch → any channel | `eas update` (ship JS, no store round-trip) |
| **Mobile Release** | `.github/workflows/mobile-release.yml` | tag `mobile-v*`; manual dispatch                          | `eas build` (+ `eas submit` on production)  |

Shared setup (pnpm + Node from `.nvmrc` + frozen install + Turbo cache) lives in the
composite action `.github/actions/mobile-setup`.

## Trigger cheat-sheet

- **Open a PR touching `rider/`, `driver/`, or `packages/`** → gate runs for the
  affected app(s). Require **`Mobile CI / gate-ok`** in branch protection.
- **Merge to `main`** → gate re-runs, then an **OTA to the `preview` channel** for the
  changed app(s). Internal testers on a `preview` build get the JS immediately.
- **Ship a preview/prod binary now** → run **Mobile Release** via _Run workflow_
  (pick app / platform / profile; tick `submit` for a store submission).
- **Cut a production release** → push a tag: `git tag mobile-v0.2.0 && git push origin
mobile-v0.2.0` → production build **and** store submit for both apps.
- **Production JS hotfix (no store review)** → run **Mobile OTA** via _Run workflow_
  with `channel = production`.

## OTA vs. build — which one?

`runtimeVersion.policy` is `appVersion`, so an OTA only reaches installed binaries whose
`app.json` `version` matches the update's.

- **OTA (`eas update`)** — JS/TS, React components, styles, JS-bundled assets, business
  logic. No native change, **same `version`**.
- **New binary (`eas build`)** — a new/updated native dependency, a change to `app.json`
  native fields (plugins, permissions, `infoPlist`, splash, bundle id), any `eas.json`
  change, or a **`version` bump** (which changes `runtimeVersion`, so old installs can't
  receive it over the air).

## Versioning

Production uses `appVersionSource: remote` + `autoIncrement`, so **EAS owns** the iOS
build number / Android `versionCode` and bumps them each production build. You only bump
the user-facing `version` in `app.json` when you want a new store version (that also
starts a fresh OTA lineage — see above).

## One-time setup

1. **`EXPO_TOKEN` GitHub secret** — expo.dev → (robot) account → **Access Tokens** →
   create → add as repo secret `EXPO_TOKEN`. This is the only GitHub secret the pipeline
   needs; store/signing credentials live on EAS, not GitHub.

2. **Per-environment backend URL** — `src/lib/env.ts` already reads
   `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_SOCKET_URL` with top precedence over the
   `app.json` fallback. Set them as EAS env vars per environment (run in each of `rider/`
   and `driver/`, since they're separate EAS projects):

   ```bash
   # production
   eas env:create --environment production --name EXPO_PUBLIC_API_URL \
     --value https://karibackend-production.up.railway.app --visibility plaintext
   eas env:create --environment production --name EXPO_PUBLIC_SOCKET_URL \
     --value https://karibackend-production.up.railway.app --visibility plaintext
   # preview -> point at staging when it exists; otherwise reuse the prod URL
   eas env:create --environment preview --name EXPO_PUBLIC_API_URL --value <url> --visibility plaintext
   # development -> leave UNSET: env.ts auto-derives the LAN dev host
   ```

   `EXPO_PUBLIC_*` values are embedded in the client bundle, so `plaintext` visibility is
   correct (they are not secrets). The build/update profiles reference these via each
   `eas.json` build profile's `environment`, and `eas update --environment <env>` loads
   the same set. Without them, builds fall back to `extra.apiBaseUrl` in `app.json`
   (currently the production URL).

3. **Build (signing) credentials** — run `eas build` once per app/platform interactively
   (or `eas credentials`) so EAS stores the iOS distribution cert / provisioning profile
   and the Android keystore. After that, the `--non-interactive` CI builds reuse them.

4. **Store submit credentials** (only for `eas submit` / production releases):
   - iOS: an App Store Connect API key (Key ID, Issuer ID, `.p8`).
   - Android: a Google Play service-account JSON.
     Configure via `eas credentials` or the `submit.production` block in `eas.json`. Until
     these exist, run Mobile Release with `submit = false` (build only) and don't push a
     `mobile-v*` tag.
