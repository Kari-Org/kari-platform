# 0005. Real S3 compatible storage provider for KYC documents

**Date**: 2026-08-06
**Status**: Accepted
**Reviewed**: 2026-08-06 (re-checked against the live codebase before build: config layer, factory, entity, and upload flow all match this spec; two build caveats added, see tasks 3 and 4)

## Summary

Today the backend stores uploaded identity documents through a `NoopStorageProvider` that does nothing (Phase 0). This decision replaces it with a real provider that writes to the project's S3 compatible object store (Tigris), keeps the objects private (these are KYC documents, so personal data), stores the stable object key on each `Document` row instead of a URL, and hands out a short lived signed link only when a document is read. When storage credentials are absent (local or dev), the backend keeps booting and falls back to the no op, exactly like the Paystack payment provider already does. Uploads still flow through the backend (no client change to how a file is sent); the mobile apps change only to consume a link that now expires.

## Context

The platform ships every external capability behind an interface plus a dependency injection token, with a no op implementation for Phase 0 (foundation §7 #15). Storage is still on that no op: `IdentityService.uploadDocument` calls `StorageProvider.putObject` and saves whatever `url` it returns onto a `Document` row, so uploaded KYC documents are not actually persisted anywhere durable.

The object store itself is already provisioned and proven. Each environment carries `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL`, `AWS_S3_BUCKET_NAME`, and `AWS_DEFAULT_REGION`, and the staging bucket was verified reachable (authenticated `HeadBucket` plus a read). The store is S3 compatible but not AWS proper (Tigris), so any client must honor the custom `AWS_ENDPOINT_URL` and use path style addressing.

The forces that shape this: the documents are personal identity data, so they must not be world readable; the backend must still start in environments with no credentials (the no op path is load bearing for local work); and whatever is persisted on the `Document` row has to stay valid over time, which a signed link (which expires) cannot. The consequence of not deciding is that real onboarding cannot store or retrieve identity documents at all.

## Requirements

**User stories**:
- As a rider or driver, I want my uploaded identity document to be stored safely so that my KYC can be reviewed.
- As a user, I want to see the documents I have submitted so that I know my upload worked.
- As an operator reviewing KYC, I want to open a submitted document so that I can verify identity.
- As the platform, I want documents kept private so that personal data is not exposed by a shareable link.

**Acceptance criteria** (the contract, each independently checkable):
- **AC-1**: With storage credentials present, uploading a document writes the file to the object store under a stable key and persists that key (not a URL) on the `Document` row, with its content type and size.
- **AC-2**: With storage credentials absent, the backend still boots and uploads use `NoopStorageProvider` without error (local and dev keep working).
- **AC-3**: Listing a user's documents returns, per document, a freshly generated signed GET link built from the stored key. The link is never persisted and expires after the configured time to live.
- **AC-4**: Objects are private. A raw object URL without a valid signature is refused by the store.
- **AC-5**: An upload larger than the configured size limit, or of a content type not in the allowed set, is rejected with a 4xx before anything reaches the store.
- **AC-6**: A user receives signed links only for their own documents. An operator with the KYC review permission may retrieve any user's document. Anyone else is refused.
- **AC-7**: `deleteObject(key)` removes an object from the store (provider method available for a future data deletion caller; no public endpoint added in this slice).
- **AC-8**: The provider works against the S3 compatible store by honoring `AWS_ENDPOINT_URL` and path style addressing, verified end to end against staging. This requires the config layer to expose the endpoint and read the provisioned bucket name; today it does neither (see the config reconciliation note).
- **AC-9**: The API returns each document with a signed `url` and an `expiresAt` timestamp; the mobile document display refetches (on an image load error, or once the current time is past `expiresAt`) rather than caching a stale link.

## Options considered

### Option 1: Fix in place, keep it minimal

Make `putObject` write to the store, keep returning a URL, and keep persisting that URL on the `Document` row (so the store would have to serve objects publicly).

**Pros**:
- Smallest change, no migration, no mobile change.

**Cons**:
- Public objects expose personal identity documents to anyone who gets the link, which is not acceptable for KYC data.
- A persisted signed link is not an option either, because signed links expire, so the stored value would rot.

### Option 2: Real provider, private objects, store the key, sign on read (chosen)

Implement a real `S3StorageProvider` that uploads to a private bucket and stores the object key. Retrieval generates a short lived signed link per request. The factory returns the real provider when credentials exist and the no op otherwise (the same shape the Paystack provider already uses).

**Pros**:
- Personal data stays private; links are short lived and never stored.
- The stored key is stable, so rows never rot.
- Local and dev still boot with no credentials.
- Follows the established provider pattern, so it is easy to operate and reason about.

**Cons**:
- Requires a small `Document` entity migration (rename the column, add two fields).
- The mobile apps must handle a link that expires (refetch), a change from a static URL.
- Slightly more provider surface (`getSignedUrl`, `deleteObject`).

### Option 3: Presigned direct to store uploads

The backend issues a presigned PUT and the client uploads straight to the store, bypassing the API for the file bytes.

**Pros**:
- Offloads upload bandwidth from the backend.

**Cons**:
- Bigger surface right now: a new presign endpoint plus an upload rewrite in both rider and driver.
- Loses server side inspection of the bytes (size and type checks move to the client or to bucket policy).
- More moving parts before there is any measured bandwidth problem.

## Decision

**Chosen option**: Option 2: real provider, private objects, store the key, sign on read.

Replace `NoopStorageProvider` with a real `S3StorageProvider` selected by a credential gated factory; persist the object key on each `Document` row and generate a short lived signed link only at read time; keep uploads flowing through the backend (basis: your AGENTS.md provider pattern and the Paystack precedent; and private by default handling for personal data). The upload path stays proxied because it keeps server side validation and avoids a mobile rewrite now; presigned uploads (Option 3) are deferred until bandwidth is a measured problem.

## Rationale

Context makes privacy the deciding force: KYC documents are personal data, so public objects (Option 1) are off the table, and because signed links expire they cannot be the persisted value, which is why the row must hold the stable key and the link must be generated on read. The credential gated factory keeps the no op path alive for environments with no credentials, which foundation §7 treats as load bearing, and it mirrors the Paystack provider so the pattern is already understood in this codebase. Proxied upload is kept over presigned (Option 3) because the only thing Option 3 buys today is bandwidth offload, with no measured bandwidth problem, while it costs a new endpoint, a rider and driver rewrite, and the loss of server side byte validation. The mobile change to refetch an expired link is a small, contained cost and the correct trade for keeping documents private.

## Feature design

**Data model sketch** (`documents` table, changes only):
- Rename `url` (text) to `objectKey` (text): the stable store key, e.g. `documents/{userId}/{type}-{uuid}`.
- Add `contentType` (varchar(128), nullable): recorded so the signed GET can set the right response type.
- Add `sizeBytes` (bigint, nullable): recorded upload size, for audit against the size limit.
- Unchanged: `userId` (uuid, indexed), `type` (varchar(32)), `status` (varchar(16), KycStatus), plus BaseEntity (`id`, `createdAt`, `updatedAt`).
- The `listDocuments` API response still exposes a `url` field, but it is now a freshly signed link computed per request, not a stored column.

**State transitions**: none new. `Document.status` (KycStatus) is unchanged by this slice.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| identity document upload (existing) | POST | multipart file, document type | the created Document mapped to a fresh signed `url` + `expiresAt` | bearer | 413 too large, 415 bad type, 502 store write failed |
| identity documents list (existing) | GET | (current user) | documents, each with a fresh signed `url` + `expiresAt` | bearer, owner scoped | 401, 403 |
| admin document retrieval (new) | GET | target `userId` | that user's documents, each with a signed `url` + `expiresAt` | bearer, KYC review permission | 401, 403, 404 |

Both the upload response and the list response run the stored key through one shared mapper that signs the link and sets `expiresAt`; a signed link is never persisted. No delete endpoint is added in this slice; `deleteObject` exists on the provider for a later data deletion caller.

**Key invariants**:
- A `Document` row persists an object key, never a URL.
- A signed link is never persisted, only returned in a response, and always has a bounded time to live.
- The bucket is private; objects are not world readable.
- Retrieval is owner scoped (or KYC reviewer), enforced in the service, not just the client.

**Security model**:
- Compliance scope: personal data (identity documents). Private by default is mandatory here, not optional.
- The bucket is private (Tigris default) and blocks public access; access is only ever through a short lived signed GET link. Privacy comes from the bucket, not an `ACL` write parameter (see build task 4). A staging check confirms an unsigned raw object URL is refused.
- Content type is validated by sniffing the file's leading bytes (its magic number), not by trusting the client declared multipart type, which is trivially spoofed on a KYC upload.
- A user may retrieve only their own documents; an operator with the KYC review permission may retrieve any. All other callers are refused.
- Never log document bytes or full signed links; log the key and a trace id only (pino rules in library-docs).
- Encryption at rest is the store's default.

**Configuration required**:
- Config reconciliation (load bearing): the credentials provisioned on Railway are `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL`, `AWS_S3_BUCKET_NAME`, `AWS_DEFAULT_REGION`. But the backend config today (`env.schema.ts` and `configuration.ts`) reads `AWS_REGION` and `S3_BUCKET` and has no endpoint field at all. This slice must add `AWS_ENDPOINT_URL` to the schema and `AppConfig.providers.aws.endpoint`, and read the provisioned names (`AWS_S3_BUCKET_NAME`, `AWS_DEFAULT_REGION`), keeping `S3_BUCKET` and `AWS_REGION` as accepted aliases. Presence of the endpoint plus bucket plus keys is what flips the factory to the real provider.
- `STORAGE_SIGNED_URL_TTL_SECONDS`: signed link lifetime, default 900 (15 minutes).
- `STORAGE_MAX_UPLOAD_BYTES`: upload size cap, default 10485760 (10 MB).
- Allowed content types (constant, not env): `image/jpeg`, `image/png`, `application/pdf`, checked by sniffing the file's leading bytes, not the client declared type.

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path: with credentials set, upload a PNG, confirm a key is stored plus content type and size, then list and open the signed link successfully. Verifies **AC-1**, **AC-3**, **AC-8**.
- No credentials: unset credentials, confirm the backend boots and uploads use the no op with no crash. Verifies **AC-2**.
- Privacy: take a stored key, build the raw object URL with no signature, confirm the store refuses it. Verifies **AC-4**.
- Validation: upload a 20 MB file and a `.exe`, confirm both are rejected with a 4xx before any store call. Verifies **AC-5**.
- Authorization: user A requests user B's document link and is refused; a KYC reviewer succeeds. Verifies **AC-6**.
- Expiry (mobile): let a signed link pass its time to live, confirm the app refetches rather than showing a broken image. Verifies **AC-9**.

## Build plan

Build approach: none is recorded in `AGENTS.md` or a scope header, so this uses end to end (Tracer Bullet) slicing by default: stand up a thin working thread through every layer first (upload writes a real key, read returns a working signed link), then thicken it with validation, authorization, delete, and the mobile refetch.

1. Config reconciliation: add `AWS_ENDPOINT_URL` to `env.schema.ts` and `AppConfig.providers.aws.endpoint`, and read the provisioned names `AWS_S3_BUCKET_NAME` and `AWS_DEFAULT_REGION` (keep `S3_BUCKET` and `AWS_REGION` as accepted aliases). Without this the provider has no endpoint or bucket to read. Satisfies **AC-2**, **AC-8**.
2. Migration plus entity: rename `documents.url` to `objectKey`, add `contentType` (nullable) and `sizeBytes` (nullable); update the `Document` entity. The staging bucket is empty and existing values are no op fakes, so a straight rename is safe. Satisfies **AC-1**.
3. Add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, and a byte sniffing helper as backend dependencies; record them in `library-docs.md`; confirm the `pnpm-workspace.yaml` `allowBuilds` gate does not block them. Satisfies **AC-5**, **AC-8**. **Caveat (byte sniffing):** the backend compiles to CommonJS, but `file-type` v17+ is ESM only and will not `require()` cleanly. Either pin `file-type@16` (the last CommonJS release), or skip the dependency entirely and write a tiny magic number check for the three allowed types (JPEG `FF D8 FF`, PNG `89 50 4E 47`, PDF `25 50 44 46`) against the buffer's leading bytes. The tiny local check is the lower risk default here.
4. Implement `S3StorageProvider`: `putObject` writes the object; `getSignedUrl(key, ttl)` presigns a GET and sets `ResponseContentType` from the stored content type; `deleteObject(key)`. Configure the client from the endpoint with `forcePathStyle: true`. Satisfies **AC-1**, **AC-3**, **AC-4**, **AC-7**, **AC-8**. **Caveat (privacy on Tigris):** Tigris buckets are private by default and the store rejects a `PutObjectCommand` that carries an `ACL` parameter, unlike AWS S3 proper. So privacy comes from the bucket being private, not from sending `ACL: 'private'` on the write. Do not set the `ACL` param; instead confirm privacy the way the spec's security model already requires, an unsigned raw object URL is refused (the AC-4 staging check). If a future store needs an explicit ACL, add it behind a config flag rather than unconditionally.
5. Wire the `STORAGE_PROVIDER` factory to return `S3StorageProvider` when the endpoint, bucket, and keys are present, and `NoopStorageProvider` otherwise, mirroring the Paystack factory. Satisfies **AC-2**.
6. Update `IdentityService.uploadDocument` to store the key (a collision safe `{type}-{uuid}`, sanitized, not the raw client filename), content type, and size. Add one shared mapper that turns a stored document into a response carrying a fresh signed `url` and its `expiresAt`, and use it for both the upload response and `listDocuments`. Satisfies **AC-1**, **AC-3**.
7. Add upload validation at the identity upload endpoint: set multer's own `limits.fileSize` to `STORAGE_MAX_UPLOAD_BYTES` (caps bytes before full buffering), map multer's size error to 413, and reject a file whose sniffed type is not allowed with 415, all before the store call. Satisfies **AC-5**.
8. Add an admin retrieval route (`GET` for a target `userId`) guarded by the KYC review permission, and enforce owner only retrieval on the user facing list, both in the service layer. Satisfies **AC-6**.
9. Mobile (rider and driver): consume the signed `url` plus `expiresAt` on the document display surface; refetch on an image load error or once past `expiresAt`. Satisfies **AC-9**.
10. Verify end to end against staging with the real Tigris credentials: config resolves the endpoint and bucket, upload stores a key, the signed GET works and serves the right content type, and an unsigned raw object URL is refused. Satisfies **AC-1**, **AC-3**, **AC-4**, **AC-8**.

## Consequences

**Positive**:
- Real, durable, private storage for identity documents.
- Local and dev keep working with no credentials (no op fallback).
- Follows the existing provider pattern, so it is easy to operate.
- The staging credentials are already proven, so verification is low risk.

**Negative / tradeoffs**:
- Signed links expire, so any consumer must refetch; a client that caches a link will show a broken document after the time to live.
- Uploads stream through the backend in memory (multer buffer), so a large file uses backend memory; the size cap is the mitigation.
- A small entity migration and a new dependency to carry.

**Neutral**:
- The `listDocuments` response keeps its field name (`url`), but the value is now a signed, expiring link, and a new `expiresAt` field rides alongside it.
- `deleteObject` exists before it has a caller; it is there for a future data deletion path.
- The Railway credentials use `AWS_*` names the backend config does not read today (`AWS_S3_BUCKET_NAME`, `AWS_DEFAULT_REGION`, `AWS_ENDPOINT_URL` versus the code's `S3_BUCKET`, `AWS_REGION`, and no endpoint). Build task 1 reconciles this; it also means storage was never actually wired to the provisioned bucket before this slice, so nothing regresses.
- Production needs its own bucket and credentials provisioned and verified the same way staging was.

## Follow-up

- [ ] Record `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` usage in `context/library-docs.md` (new approved dependencies; the "do not install outside this list" rule means the list must be updated).
- [ ] Storage conventions (private by default, key on the row, sign on read, no bytes in logs) belong in a nested `backend/src/identity/AGENTS.md` (or a storage area file) so future work in that area inherits them, rather than root AGENTS.md.
- [ ] Document retention and deletion policy for KYC documents is out of scope here; `deleteObject` is ready, but when and by whom documents are deleted is a separate decision.
- [ ] Provision and verify a production bucket and credentials before this ships to production (staging is verified; production is not).
- [ ] `build-graph.md` marks the "AWS S3 storage" node and the four already built v2 slices as not built; it lags `progress-log.md`. Reconciling it is a context-system task.

## Migration plan

**Strategy**: credential gated (the factory itself is the flag: real provider only where credentials exist), plus a one step schema migration.
**Phases**:
1. Ship the migration (rename `url` to `objectKey`, add `contentType` and `sizeBytes`) and the provider code together. The staging bucket is empty and existing column values are no op fakes, so no data backfill is needed.
2. Verify against staging with real credentials, then provision and verify production credentials before the production deploy.
**Rollback**: revert the commit and rename the column back. No real object data is lost because the bucket held no real objects at cutover.
**Risks**: a time to live set too short breaks mobile display (mitigated by a sensible default plus `expiresAt` and mobile refetch); a wrong endpoint or missing path style setting makes every call fail (caught by the staging end to end check); the config schema not exposing the endpoint or not reading the provisioned bucket name would make the factory silently fall back to the no op (caught by build task 1 and the staging check); large uploads pressure backend memory (mitigated by multer's own size limit capping bytes before buffering).

## References

**Project sources** (verifiable, in this repo):
- `AGENTS.md` and `context/foundation.md` §7 #15: the provider interface plus no op first pattern.
- `context/provider-docs.md` and `context/library-docs.md`: the Paystack provider precedent (real when credentials present, no op otherwise) and the pino logging rules.
- `backend/src/providers/contracts.ts`, `backend/src/providers/providers.module.ts`, `backend/src/identity/identity.service.ts`: the current storage contract, factory, and upload flow this slice changes.

**Practices & standards**:
- Private by default for personal data; access only through short lived signed links.
- Store a stable key, not an expiring link, so persisted rows do not rot.
- Validate upload size and content type at the boundary, before the store call.
