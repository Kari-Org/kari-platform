# Review, feat/0005-real-s3-storage, 2026-08-06

**Reviewed by**: Claude Sonnet 5 (author on Opus)
**Scope**: 17 files (11 tracked + 6 untracked new files), branch vs `main` (merge-base `c451521`)
**Verdict**: Changes requested → **Resolved 2026-08-06**

## Resolution (applied by the author after review)
- **Blocker (envelope) — FIXED.** `UploadErrorFilter` now extends `AllExceptionsFilter` (not bare `BaseExceptionFilter`), so the 413 mapping and every other upload-route error (400/415/5xx) render the uniform `ApiResponse` envelope. Runtime-reverified: 415 → `{success:false, error:{code:"HTTP_415"}, traceId}`, 413 → `{success:false, error:{code:"HTTP_413"}, traceId}`, both authenticated.
- **Minor (partial-cred log) — FIXED.** The storage factory now warns which of `endpoint`/`bucket`/`accessKeyId`/`secretAccessKey` is missing when the config is partial, instead of the stale generic "credentials present" line.
- **Minor (admin 404) — accepted as-is.** Empty list is treated as valid list-endpoint semantics for an authorized KYC reviewer; no user-existence lookup added.
- **Minor (`Promise.all` isolation) — accepted as-is.** The presigner is a local HMAC (no network), so a per-item failure is negligible; left as `Promise.all`.

## Summary
This slice replaces the no-op storage provider with a real S3-compatible (Tigris) provider for KYC documents: config reconciliation, an entity migration (`url` → `objectKey` + `contentType` + `sizeBytes`), a credential-gated factory, magic-number content-type sniffing, multer size limiting, and an admin KYC-review retrieval route. The core design is sound and closely tracks spec 0005: private-by-default objects with no `ACL` param, sign-on-read with nothing persisted, a collision-safe/injection-safe key, the correct `drivers:verify` permission, and clean provider-pattern adherence. The one real defect is the new `UploadErrorFilter`: it is scoped too broadly and, for every error on the upload route other than the one it targets, silently drops the platform's uniform `ApiResponse` envelope that every other endpoint returns — including the endpoint's own two other new validation errors (400 "no file", 415 bad type) and any 5xx. That needs a narrow fix before merge; everything else is minor polish.

## Blockers

### 🔴 `UploadErrorFilter` breaks the platform's uniform error envelope for the whole upload route, `backend/src/identity/upload-error.filter.ts:11-19`
**Problem**: The filter is declared `@Catch()` (catches everything, no type filter) and applied with `@UseFilters(UploadErrorFilter)` at the method level on `IdentityController.upload()` (`backend/src/identity/identity.controller.ts:35-36`). Method-scoped filters take priority over the app's global filter (`AllExceptionsFilter`, registered via `APP_FILTER` in `backend/src/app.module.ts:69`). `AllExceptionsFilter` is documented as producing "the uniform `{@link ApiResponse}` envelope" (`backend/src/common/filters/all-exceptions.filter.ts:28`) — `{success, message, data, error: {code, detail}, timestamp, traceId}` — and `packages/types/src/api.ts:1` calls it "the uniform response envelope returned by every backend endpoint."

`UploadErrorFilter extends BaseExceptionFilter` (Nest's bare default), not `AllExceptionsFilter`. It only special-cases `err.code === 'LIMIT_FILE_SIZE'`; every other path calls `super.catch(err, host)`, which is `BaseExceptionFilter`'s generic `{statusCode, message, error}` shape — no `success`, `data`, `timestamp`, or `traceId`, and `error` is a plain string instead of the `ApiError` object. This affects:
- The `BadRequestException('No file uploaded')` this same PR adds (`identity.service.ts:73`).
- The `UnsupportedMediaTypeException(...)` 415 this same PR adds for a bad magic number (`identity.service.ts:78`).
- Even the filter's own intentional 413 mapping (`new PayloadTooLargeException(...)` still goes through `super.catch()` → `BaseExceptionFilter`, not `AllExceptionsFilter`, so the 413 response *also* doesn't match the envelope).
- Any other exception on this route, e.g. an auth failure from a global guard, or an S3/DB failure during the upload — since `@Catch()` with no filter argument catches everything regardless of where it originated in the request pipeline for this handler.

**Why it matters**: `POST /identity/documents/:type` is the mobile upload path for KYC onboarding on both rider and driver apps. Right now every error this endpoint can throw — 400, 413, 415, or a 500 — returns a JSON shape different from literally every other endpoint in the platform. Client code written against the shared `ApiResponse` type (`success`, `data`, `error.code`, `traceId`) gets `undefined` for all of those fields on this one route, which typically means a blank or generic error message shown to the user exactly on the paths (413/415) this PR was built to make actionable, and breaks traceId-based log correlation for this endpoint's failures. The runtime-verify pass for this slice checked status codes (413/415) but not response body shape, so this slipped through.

**Suggested fix**: Have `UploadErrorFilter` extend (or delegate to) `AllExceptionsFilter` instead of `BaseExceptionFilter`, so the non-multer path — and the 413 mapping itself — reuse the app's envelope, logging, and `traceId` population. Only the `LIMIT_FILE_SIZE` → `PayloadTooLargeException` translation is genuinely new logic; everything else should fall through to the same formatting the rest of the app gets.

## Minor

### 🟡 Admin document retrieval never returns 404 for an unknown/documentless user, `backend/src/admin/admin.controller.ts:174-179`
**Problem**: The spec's API surface table lists `401, 403, 404` as the key errors for `GET /admin/users/:userId/documents`, but the handler just calls `this.identity.listDocuments(userId)`, which returns `[]` for a non-existent or documentless `userId` — there's no existence check.
**Why it matters**: Low impact (an admin sees an empty list rather than an error), but it's a documented spec deviation and an empty list is ambiguous between "user has no docs" and "no such user."
**Suggested fix**: Either accept `[]` as intentional list-endpoint semantics and update the spec's error table, or have the route look up the user first and throw `NotFoundException` when absent.

### 🟡 Misleading log line when storage credentials are partially set, `backend/src/providers/providers.module.ts:101`
**Problem**: When `s3Bucket` is set but `endpoint`, `accessKeyId`, or `secretAccessKey` is missing, the factory falls back to `NoopStorageProvider` (correct) but logs via `note('Storage', !!s3Bucket, 'AWS S3')`, which — because only `s3Bucket` is checked — prints "Storage: AWS S3 credentials present (real impl lands in its phase; using no-op for now)". That message is stale Phase-0 boilerplate (the real impl exists now, just wasn't selected) and doesn't say *which* piece is missing.
**Why it matters**: An operator debugging "why is storage falling back to no-op in an environment where I set the bucket" gets a log line that reads as if everything is fine, hiding exactly the failure mode the spec calls out as a migration risk ("the config schema not exposing the endpoint ... would make the factory silently fall back to the no-op").
**Suggested fix**: Log which of `endpoint`/`s3Bucket`/`accessKeyId`/`secretAccessKey` is present/missing when not all four are set, rather than reusing the generic `note()` helper built for single-credential providers.

### 🟡 `listDocuments` has no per-document failure isolation, `backend/src/identity/identity.service.ts:87-90`
**Problem**: `Promise.all(docs.map((d) => this.toResponse(d)))` — if signing any single document fails (e.g. a transient S3 client error), the whole list call rejects and the user sees a 500 for the entire list instead of the documents that could be signed.
**Why it matters**: Low likelihood (the presigner is a local HMAC computation, not a network call, so failures here are rare), but for a user with multiple documents one bad key would hide all of them.
**Suggested fix**: Not urgent given the low failure surface; if this shows up in practice, use `Promise.allSettled` and drop/flag failed items instead of failing the whole list.

## Strengths
- Key construction is injection-safe and correctly satisfies AC-1: `documents/${userId}/${type}-${randomUUID()}` uses only a JWT-derived UUID and an enum-validated `type` (`ParseEnumPipe(DocumentType)`), never the raw client filename.
- The credential-gated factory (`providers.module.ts:90-102`) correctly ANDs all four required fields (`endpoint`, `s3Bucket`, `accessKeyId`, `secretAccessKey`) before selecting the real provider — no partial-credential foot-gun, and `region` always has a schema default so it can't block the gate.
- Privacy model is implemented exactly as the spec's build caveat requires: no `ACL` param on `PutObjectCommand` (Tigris would reject it), privacy comes from the private bucket, and the code/comments explicitly call this out (`s3.provider.ts:23-27`, `56`).
- `sizeBytes` bigint↔number transformer is correct and appropriately scoped: TypeORM returns bigint columns as strings to avoid precision loss elsewhere, and the transformer's `Number()` conversion is safe given the 10 MB upload cap is nowhere near `Number.MAX_SAFE_INTEGER`.
- The signed link is genuinely never persisted — the `Document` entity has no `url` column at all after the migration, and `DocumentResponse.url`/`expiresAt` are computed per-request in `toResponse()`.
- Admin authorization is correctly wired: `drivers:verify` is the right permission (defined in `packages/types/src/rbac.ts:26` as "approve/reject KYC (NIN + liveness)"), and the controller-level `@UseGuards(RolesGuard, PermissionsGuard)` + `@Roles(UserRole.ADMIN)` on `AdminController` apply to the new route automatically.
- Logging discipline matches the spec's "never log document bytes or full signed links" rule throughout `s3.provider.ts` and `providers.module.ts` — only keys and high-level status are logged.
- `context/library-docs.md` was updated with the new dependency and its rules, per the project's "do not install outside this list" convention.

## Test coverage
No unit/integration test runner exists for this project (test signal: none-yet); the project's stated gate is typecheck + `/check verify`. `docs/specs/0005-real-s3-storage-provider.verify.md` covers all 9 ACs with concrete steps, with AC-4/AC-8's Tigris end-to-end and the AC-9 mobile half correctly deferred to staging/a future slice rather than treated as gaps here. The one thing the existing verify steps do not exercise is response *body shape* on the 413/415 paths (only status code), which is exactly what let the `UploadErrorFilter` envelope regression above pass unnoticed — worth adding an envelope-shape assertion to that verify step alongside the status-code check.
