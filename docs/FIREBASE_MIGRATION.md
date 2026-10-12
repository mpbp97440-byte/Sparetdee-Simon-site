# V14 — Firebase / Cloudflare migration

## Architecture

Static GitHub Pages front. MPBP440Analytics preserves its API. Firebase modular
SDK **13.0.0**, released 7 October 2026, is pinned for App/Auth/Firestore/Analytics.
No compat SDK, Functions, Storage, service account or paid hosting is used.

Official version: https://firebase.google.com/support/release-notes/js
Aggregations: https://firebase.google.com/docs/firestore/query-data/aggregation-queries
Query rules: https://firebase.google.com/docs/firestore/security/rules-query

Anonymous Auth is lazy and reused. GA4 receives page/artist/event/video/like/
comment/platform/play events, never UID, email, display name or comment text.
Page locations omit query/hash. GA4 is the traffic reference; CMS shows actual
Firestore counts only. No additional analytics collection or OAuth secret.

## Collections and rules

- admins/{uid}: existing role active=true, role=admin, never publicly writable.
- content_registry/{contentId}: active=true gates engagement writes.
- engagement/{contentId}/views/{uid}: immutable unique view with createdAt.
- engagement/{contentId}/likes/{uid}: unique toggle with createdAt.
- comments/{id}: contentId, contentType, authorUid, displayName, message, status,
  createdAt. Approved-only public reads; admin-only moderation and soft deletion.

firestore.rules is the required security contract, NOT proof of deployed rules.
No rules are deployed automatically. Compare console rules before production.
Missing own like/view documents must be readable and active clip collection
aggregations allowed. Missing registry documents must be readable as absent.
Registry bootstrap is attempted once per browser session after dual admin
validation; failure warns without blocking the CMS.

Comments use equality filters and default single-field index merging, sorted
locally. Keep default indexes for status, contentId, contentType. No composite
index is required. Restore any single-field exemptions before approval. Admin
lists are bounded to 200, public comments to 100 per clip; counts are server-side.

## Worker / CMS

Existing URL: https://mpbp440-cms-worker.mpbp97440.workers.dev.
GET /health; POST /admin-verify, /admin-bootstrap-registry, /admin-media-upload,
/admin-publish-site. Firebase ID token is obtained at request time, never logged
or saved by application code. Firebase SDK manages its own persisted session.
FormData retains browser-generated Content-Type. Only Worker talks to GitHub.
401/403 closes admin UI. App Check enforcement remains disabled.

Draft key: mpbp440.cms.draft.firebase.v1, containing payload/savedAt/uid only.
Draft stays on this device. Temporary blob URLs are rejected. Binary imports
remain in memory and must be reselected after reload. Automatic restoration is
not added: replaying stale partial payloads against newer JSON risks overwrite.
Upload/publication errors keep changes. Do not blindly retry an unknown publish
outcome: a timed-out request may already have committed. Heavy video uses YouTube.

## Rollout / tests

Work only on v14-firebase-cloudflare-migration. No merge before user approval.
Worker health/unauthorized test; one localhost anonymous Auth test and read-only
Firestore check. Admin login/denial/expired token/upload/publish/draft use isolated
mocks, never real publishing. No credentials requested. Cache version bumped;
network-first pages and offline fallback retained. Legacy Supabase files removed
from runtime; supabase/ is **DEPRECATED / NOT USED AT RUNTIME**. Do not run its
migrations. No Worker, Firebase project/domain/rules/secret change is performed.

Missing registry shows unavailable stats and prevents writes; successful admin
session bootstraps the catalog. Githack preview is navigation/visual only, with
writes and GA disabled. Real Auth is tested on authorized localhost. Do not add
githack to Auth domains.

Closed Supabase historical likes/views/comments cannot be recovered without an
export. This migration preserves all static content and existing Firebase data;
it does not fabricate or seed historical engagement.

## Verification outcome — 13 October 2026

- Static syntax/JSON, V14 markup/CSS/content/link preservation: passed.
- Isolated SDK/Worker browser suite: 22 routes HTTP 200, no JS errors or internal
  404; views/likes/comments, admin role/auth rejection, draft, upload/publish
  simulation and registry warning passed. No real Firestore content writes.
- Service worker active, new cache, offline fallback HTTP 200: passed.
- Real Worker health: HTTP 200, ok=true, version=1.0.0; unauthenticated verify:
  HTTP 401. Production CORS preflight: 204; localhost preflight: 403 (CMS tests
  are mocked; production origin is allowed).
- Real localhost anonymous Auth: FAILED with
  auth/api-key-not-valid.-please-pass-a-valid-api-key. The supplied Web config is
  used verbatim. No public Hosting init.json configuration is available (404).
  Consequently live Firestore permissions, registry, counts, indexes and admin
  login cannot be certified. A corrected public Firebase Web API key/config is
  required before approval. Do not merge this branch into main yet.
- firestore.rules is a proposed required contract; actual deployed rules were
  not fetched or changed. No automatic rules/index deployment is performed.
