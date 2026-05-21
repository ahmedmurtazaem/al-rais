# Path B Refactor: Middleware Wraps Legacy Flight-Search

## Context

The Al Rais middleware (14 commits, 296 tests) was originally built to call Provesio's API directly. It reimplemented session authentication, async fetch polling, and search payload construction from scratch.

The existing `flight-search` Lambda service (in `Epicmetry/flight-search`) already handles all of this in production, plus:

- Redis caching of search results
- DynamoDB booking records and audit trail
- SQS async booking pipelines
- High-demand tracking and people-viewing indicators
- Email notifications on booking
- Provesio session and conversation management

**The gap**: The middleware reimplemented ~30% of the legacy service's operational functionality. Deploying both would create two competing Provesio integrations with no shared state.

## Decision: Path B (Wrap) over Path A (Replace)

**Path A** (full replacement) would have required migrating all legacy infrastructure into the middleware: booking pipelines, DynamoDB tables, SQS workers, email notifications. Estimated 4-6 weeks.

**Path B** (wrap) refactors the middleware's Provesio connector to call the legacy service's API Gateway endpoints instead of Provesio directly. The middleware becomes an intelligence layer on top of the legacy service.

Path B was chosen because:
1. Preserves all existing operational infrastructure without changes
2. No legacy-side modifications required
3. Achievable within the May 21 demo timeline
4. The middleware adds genuine value (curation, multi-supplier, visa context) without duplicating operational concerns

## Architecture After Path B

```
Frontend
    |
    v
+----------------------------------------------+
|  Middleware API Gateway                       |
|  /middleware/flights/search                   |
|  /middleware/flights/offers/{id}/book          |
|  /middleware/flights/fare-rules               |
+----------+-----------------------------------+
           |
           v
+---------------------+
|   Orchestrator       |  Fan-out via Promise.allSettled()
|   + Circuit Breaker  |
+------+------+--------+
       |      |
       v      v
+----------+ +----------+
| Legacy   | |  Duffel  |  Both implement SupplierConnector
| Provesio | | (direct) |
| (via API)| |          |
+----+-----+ +----------+
     |
     v
+---------------------+
| Legacy flight-search |  Existing Lambda service
| API Gateway          |  Handles Provesio auth, caching,
| /flightSearch        |  async polling, SQS, DynamoDB
| /flightProvBooking   |
| /fareRuleSearch      |
+---------------------+
```

## File-by-File Change Summary

### Replaced

| File | Before | After |
|------|--------|-------|
| `src/connectors/provesio/auth.ts` | `ProvesioSessionAuth` — Provesio login, Redis session caching, conversationId management | `LegacyApiAuth` — forwards incoming Authorization header to legacy API. No Provesio credentials, no Redis |
| `src/connectors/provesio/flights.ts` | Calls Provesio endpoints directly, builds native payloads, handles async polling | Calls legacy API Gateway endpoints (`/flightSearch`, `/flightProvBooking`, `/fareRuleSearch`, `/reservationFlightBooking`). Legacy handles auth, polling, caching |
| `src/lib/config.ts` | `provesio: { username, password, companyCode, apiKey, baseUrl, mainEndpoint }` | `legacy: { flightApiUrl }` — single URL, legacy handles credentials |
| `src/connectors/registry.ts` | Constructs `ProvesioSessionAuth` with 5 credential fields | Constructs `LegacyApiAuth()` with no credentials |

### Deleted

| File | Reason |
|------|--------|
| `src/connectors/provesio/async-fetch.ts` | Legacy handles async polling internally |
| `src/connectors/provesio/async-fetch.test.ts` | Tests for deleted module |

### Updated

| File | Change |
|------|--------|
| `src/connectors/provesio/normalizer.ts` | Added optional `searchKey` parameter — propagated to each offer's `metadata.searchKey` |
| `src/cache/offer-map.ts` | Added `searchKey` field to `OfferMapEntry` |
| `src/handlers/flight-search.ts` | Forwards Authorization header to legacy connector; stores `searchKey` in offer map |
| `src/handlers/flight-book.ts` | Forwards Authorization header; passes `searchKey` from offer map to booking request |
| `src/handlers/flight-fare-rules.ts` | Forwards Authorization header |
| `.env.example` | Replaced 6 `PROVESIO_*` vars with `LEGACY_FLIGHT_API_URL` |

### Unchanged

All of these are untouched:
- `SupplierConnector` interface (`src/types/supplier.ts`)
- `Orchestrator` (`src/orchestrator/orchestrator.ts`)
- `CircuitBreaker` (`src/orchestrator/circuit-breaker.ts`)
- `CurationEngine` + all rules (`src/curation/`)
- `Deduplicator` (`src/normalizer/deduplicator.ts`)
- `Normalizer pipeline` (`src/normalizer/normalizer.ts`)
- `DuffelFlightConnector` (`src/connectors/duffel/`)
- `VisaStaticConnector` (`src/connectors/visa/`)
- `ResponseCache` (`src/cache/response-cache.ts`)
- All canonical types (`src/types/canonical.ts`)
- Response formatting (`src/handlers/response.ts`)

## searchKey Flow

The legacy booking handler requires a `searchKey` to look up the Provesio conversationId from DynamoDB's LOG_TRACE table. This is how it flows:

1. Middleware calls legacy `/flightSearch`
2. Legacy returns the raw Provesio response, which includes `commonData.searchKey`
3. Middleware extracts `searchKey` during normalization and stores it in the offer map
4. When booking, middleware retrieves `searchKey` from offer map and sends it to legacy `/flightProvBooking`
5. Legacy uses `searchKey` to look up the conversationId and complete the booking

**Fallback**: If Provesio doesn't return `commonData.searchKey`, the middleware falls back to using `offerId`. The legacy handler can work without it by generating a new conversationId.

No legacy-side changes were needed for this flow.

## Risk Notes

### Auth Token Forwarding
The middleware forwards the incoming `Authorization` header to the legacy API Gateway. If the legacy authorizer rejects the forwarded token (e.g., audience mismatch), we would need a service-to-service auth mechanism (Cognito service account or IAM-based Lambda invoke). This would be a contained change to `LegacyApiAuth.getHeaders()`.

### Response Shape Drift
If the legacy handler's response shape changes, the normalizer may produce malformed offers. Mitigated by:
- Integration tests with fixtures captured from the real legacy API
- The normalizer handles missing fields gracefully (all fields optional with defaults)

### searchKey Propagation
The legacy booking flow requires `searchKey` from Provesio's `commonData.searchKey`. If this field is absent, the middleware falls back to `offerId`. The legacy handler generates a new conversationId in this case. No data loss, just a minor booking flow variation.

### Duffel Rate Limits
Duffel has a 60-request/60-second rate limit. The `ResponseCache` class is defined but not yet wired into handlers. For heavy demo traffic, wire it with a 120s TTL to prevent quota exhaustion.

## Verification

1. **TypeScript**: `npx tsc --noEmit` — clean compilation, zero errors
2. **Tests**: 295 passing across 26 test files
3. **Manual smoke test** (planned):
   - POST `/middleware/flights/search` with DXB-LHR
   - Verify `suppliers.provesio.status === 'success'`
   - Verify offers have normalized slices, segments, prices
   - Booking flow: search -> fare rules -> book -> confirm
4. **Circuit breaker**: Stop legacy Lambda, verify middleware returns Duffel-only results with `provesio: 'circuit_open'`

## Future Direction

Path B is the right choice for Phase 1. Over time, some legacy capabilities may migrate into the middleware:

- **Phase 1** (current): Middleware wraps legacy. Legacy is the operational backbone.
- **Phase 1.5**: Wire `ResponseCache` for Duffel. Add response caching for aggregated results.
- **Phase 2** (evaluation, not commitment): Assess which legacy features could move into the middleware based on operational needs. Candidates: direct Provesio integration (if session management proves problematic through the proxy), booking state management, notification orchestration.

Path A (full replacement) remains an option for Phase 2 if the team decides the proxy pattern creates too much operational overhead. But the decision should be data-driven, not speculative.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LEGACY_FLIGHT_API_URL` | Yes | Legacy flight-search API Gateway URL |
| `DUFFEL_ACCESS_TOKEN` | Yes | Duffel API access token |
| `REDIS_HOST` | Yes | Redis host for response caching |
| `REDIS_PORT` | No | Redis port (default: 6379) |
| `REDIS_TLS` | No | Enable TLS (default: true) |
| `DEFAULT_CURRENCY` | No | Display currency (default: AED) |
| `STAGE` | No | Deployment stage (default: dev) |

**Removed** (legacy handles these):
- `PROVESIO_USERNAME`
- `PROVESIO_PASSWORD`
- `PROVESIO_COMPANY_CODE`
- `PROVESIO_API_KEY`
- `PROVESIO_BASE_URL`
- `PROVESIO_MAIN_ENDPOINT`

## Legacy API Endpoints

| Dev | `https://y0v4qcjjo5.execute-api.eu-west-1.amazonaws.com/dev2` |
|-----|--------------------------------------------------------------|
| QA  | `https://le9ey3bd4m.execute-api.eu-west-1.amazonaws.com/qa`  |
