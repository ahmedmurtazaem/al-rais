# Architecture

## System Overview

The Al Rais travel platform has two services in the flight search domain:

1. **Legacy flight-search service** (`Epicmetry/flight-search`) — the operational backbone
2. **Middleware** (`Epicmetry/alrais-middleware`) — the intelligence and aggregation layer

These are complementary, not competing. The middleware sits on top of the legacy service and adds capabilities that the legacy service was never designed to provide.

## Separation of Concerns

### Middleware Owns

| Concern | Implementation |
|---------|---------------|
| Multi-supplier fan-out | `Orchestrator` queries all registered connectors in parallel |
| Curated three-option output | `CurationEngine` scores offers across 7 weighted rules |
| Plain-language explanations | `ExplanationGenerator` produces human-readable rationale |
| Tradeoff annotations | `TradeoffAnalyzer` compares curated options pairwise |
| Cross-supplier deduplication | `Deduplicator` fingerprints by carrier:flight:departure |
| Per-supplier circuit breakers | `CircuitBreaker` tracks failures and opens/closes circuits |
| Visa intelligence | `VisaStaticConnector` provides requirements by nationality/destination |
| Canonical data model | All suppliers normalize to `NormalizedFlightOffer` |
| Offer ID indirection | `OfferMap` maps middleware UUIDs to supplier-native IDs |
| Duffel integration | `DuffelFlightConnector` calls Duffel API directly |

### Legacy Service Owns

| Concern | Notes |
|---------|-------|
| Provesio authentication | Session login, sessionId caching, conversationId management |
| Provesio payload construction | formOfPayment, travelType, responseParameters, cabin mapping |
| Async fetch polling | Exponential backoff polling when Provesio returns asyncFetch URLs |
| Redis search caching | Cached Provesio responses keyed by search parameters |
| DynamoDB booking records | LOG_TRACE table with conversationId, searchKey, booking state |
| SQS booking pipeline | Async booking confirmation and ticketing |
| Email notifications | Booking confirmation and itinerary emails |
| High-demand tracking | peopleViewing and highDemandIndicators from Provesio |

### Where Each Flow Lives

```
Search:  Frontend -> Middleware -> [Legacy API (Provesio) + Duffel] -> Normalize -> Curate -> Response
Book:    Frontend -> Middleware -> [Legacy API (Provesio) | Duffel] -> Booking Reference
Fare:    Frontend -> Middleware -> [Legacy API (Provesio) | Duffel] -> Fare Rules
Visa:    Frontend -> Middleware -> VisaStaticConnector -> Requirements
```

## Architecture Diagram

```
Frontend (React / Next.js)
    |
    v
+----------------------------------------------+
|  Middleware API Gateway (Lambda)              |
|                                               |
|  Handlers:                                    |
|    flight-search    flight-book               |
|    flight-fare-rules   visa-check             |
|    health           destination-context       |
|                                               |
|  Intelligence Layer:                          |
|    Orchestrator -> Normalizer -> Deduplicator |
|    CurationEngine (7 rules) -> Selection      |
|    ExplanationGenerator -> TradeoffAnalyzer    |
+----------+----------------+------------------+
           |                |
           v                v
+----------------+  +----------------+
| Legacy Provesio|  |  Duffel        |
| (via API GW)   |  |  (direct API)  |
| LegacyApiAuth  |  |  BearerAuth    |
+-------+--------+  +----------------+
        |
        v
+-------------------------------+
| Legacy flight-search Lambda   |
|                               |
| - Provesio session auth       |
| - Search + async polling      |
| - Redis caching               |
| - DynamoDB audit trail        |
| - SQS booking pipeline        |
| - Email notifications          |
+-------------------------------+
        |
        v
+-------------------------------+
| Provesio Supplier API         |
+-------------------------------+
```

## Connector Architecture

Every supplier implements the `SupplierConnector` interface:

```typescript
interface SupplierConnector {
  readonly name: string;
  readonly capabilities: SupplierCapability[];
  readonly auth: SupplierAuth;

  searchFlights?(request: FlightSearchRequest): Promise<SupplierFlightResult>;
  bookFlight?(request: FlightBookRequest): Promise<BookingReference>;
  confirmBooking?(bookingId: string): Promise<BookingReference>;
  getFareRules?(offerId: string): Promise<Record<string, unknown>>;
  // ...
}
```

Current connectors:

| Connector | Auth Strategy | Target |
|-----------|--------------|--------|
| `ProvesioFlightConnector` | `LegacyApiAuth` (forwarded bearer token) | Legacy API Gateway |
| `DuffelFlightConnector` | `DuffelBearerAuth` (static API key) | Duffel API directly |
| `VisaStaticConnector` | None | Static JSON data |

The `Orchestrator` queries the `ConnectorRegistry` for all connectors with a given capability (e.g., `flight_search`) and fans out to them in parallel.

## Evolution Path

### Phase 1 (Current)

Middleware wraps legacy service. The legacy service is the operational backbone for all Provesio operations. The middleware adds curation, multi-supplier aggregation, visa context, and a unified API shape.

**Status**: Implemented. 295 tests passing.

### Phase 1.5 (Near-term)

- Wire `ResponseCache` for Duffel results (120s TTL) to stay within rate limits
- Add response caching for aggregated results
- Smoke test against dev/QA legacy API endpoints
- Frontend feature flag integration (`VITE_USE_MIDDLEWARE`)

### Phase 2 (Evaluation)

Evaluate whether to:
- Migrate Provesio direct integration into the middleware (Path A)
- Keep the wrap pattern and add more intelligence (better curation rules, fare calendars, hotel aggregation)
- Add more suppliers (Hotelbeds, Amadeus) as direct connectors

This evaluation should be data-driven based on:
- Latency overhead of the proxy hop
- Operational complexity of maintaining two services
- Feature velocity (how fast can we add capabilities in each pattern)

## Key Architectural Constraints

1. **Handlers never import connectors directly.** All supplier access goes through the Orchestrator via the ConnectorRegistry.

2. **Curation rules are pure functions.** No IO, no side effects, deterministic. `score(offer, allOffers, context?) -> number` between 0 and 1.

3. **No supplier-specific types beyond the connector boundary.** Everything after the connector uses canonical types from `types/canonical.ts`.

4. **Circuit breakers are per-supplier.** A Duffel outage never affects Provesio calls.

5. **The offer map is the source of truth for booking.** Clients only see middleware UUIDs. The offer map resolves them to supplier-native IDs + session context (including `searchKey` for legacy booking continuity).

6. **Auth tokens are request-scoped.** The `LegacyApiAuth` receives the caller's Authorization header per request. No shared tokens between concurrent requests.
