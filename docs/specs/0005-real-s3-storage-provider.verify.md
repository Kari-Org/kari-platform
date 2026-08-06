# Verify: Real S3 storage provider · spec 0005 · updated 2026-08-06

_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._
_Note: several steps are runtime checks that need the backend running with real Tigris credentials — those are staging/post-deploy (see the Commands section)._

## Commands / integration

- [ ] Boot the backend with **no** AWS creds set → it starts, and the Providers log shows `Storage: no credentials — using no-op implementation`. Upload a doc → succeeds, stored `objectKey` is a `noop://local/...` value, no crash → **AC-2**
- [ ] Boot with `AWS_ENDPOINT_URL` + `AWS_S3_BUCKET_NAME` (or `S3_BUCKET`) + keys set → log shows `Storage: AWS S3 credentials present — using live S3 provider` → **AC-8**
- [ ] `pnpm --filter @kari/backend migration:run` (or backend boot with `migrationsRun`) → `documents` table has `objectKey`, `contentType`, `sizeBytes`; no `url` column → **AC-1**
- [ ] With creds set: `POST /identity/documents/PROFILE_PHOTO` (bearer, multipart PNG) → 201; response carries a signed `url` + `expiresAt`; DB row stores an `objectKey` (not a URL), `contentType`, `sizeBytes` → **AC-1, AC-3, AC-8**
- [ ] `GET /identity/documents` (bearer) → each item has a freshly signed `url` (differs across two calls) + `expiresAt`; no signed link is persisted → **AC-3**
- [ ] Take a stored `objectKey`, build the raw object URL with no signature, `curl` it → store refuses (403 / AccessDenied) → **AC-4**
- [ ] `POST /identity/documents/PROFILE_PHOTO` with a 20 MB file → **413** before any store write → **AC-5**
- [ ] `POST /identity/documents/PROFILE_PHOTO` with a `.exe`/text body (bad magic bytes) → **415** before any store write → **AC-5**
- [ ] Provider `deleteObject(key)` removes the object from the store (integration; no public endpoint) → **AC-7**

## Authorization

- [ ] User A `GET /identity/documents` returns only A's documents (owner-scoped in the service) → **AC-6**
- [ ] Admin with `drivers:verify` → `GET /admin/users/:userId/documents` returns that user's docs with fresh signed links → **AC-6**
- [ ] Admin lacking `drivers:verify` (e.g. FINANCE role) → **403** on the same route → **AC-6**

## UI / manual

- [ ] _(AC-9 mobile half)_ **Deferred.** No rider/driver document-display surface exists today, so refetch-on-expiry has nothing to attach to. The backend half of AC-9 (API returns `url` + `expiresAt`) is built and verified above. Revisit when a mobile document-display screen is designed (own `/architect` round).

## Acceptance-criteria coverage

- AC-1 (stores key + type + size) · AC-2 (no-creds no-op boot) · AC-3 (signed link on read, never persisted) · AC-4 (private, unsigned URL refused) · AC-5 (413/415 before store) · AC-6 (owner + KYC-reviewer authz) · AC-7 (deleteObject) · AC-8 (endpoint + path-style, real provider selected) — all covered above.
- AC-9: **backend half covered** (responses carry `url` + `expiresAt`); **mobile half deferred** (no display surface exists).
