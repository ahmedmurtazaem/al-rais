# Dynamic Packaging Engine — Product Requirements Document

**Version:** 1.1
**Date:** 2026-05-19
**Status:** Draft — Awaiting Review
**Author:** Engineering / Product
**Codebase:** `Epicmetry/alrais-middleware`
**Branch:** `path-b/wrap-legacy-flight-search`

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-19 | Initial draft — full DPE specification |
| 1.1 | 2026-05-19 | Refinement pass: clarified insurance scope (in scope, supplier TBD — architecture ready, Phase 4 selection); marked transfer supplier as TBD with candidate list; added Section 3.7 (Unified Cancellation Policy Presentation with insurance interaction); added Section 5.8 (Compensation Failure Operational Response); added Section 7A (Backwards Compatibility and Migration); added Section 8.6 (Insurance Suppliers); added Section 10 (Cost Model and Unit Economics); renumbered Implementation Roadmap to Section 11; updated Appendix A audit cross-reference |

---

## Table of Contents

- [Section 0 — Current State Audit](#section-0--current-state-audit)
- [Section 1 — Product Posture & Vision](#section-1--product-posture--vision)
- [Section 2 — Architectural Foundation](#section-2--architectural-foundation)
- [Section 3 — Layer 1: Composition UI (Package Builder)](#section-3--layer-1-composition-ui-package-builder)
- [Section 4 — Layer 2: Bundle Pricing & Yield Management](#section-4--layer-2-bundle-pricing--yield-management)
- [Section 5 — Layer 3: Multi-Supplier Orchestration (Saga)](#section-5--layer-3-multi-supplier-orchestration-saga)
- [Section 6 — Layer 4: Admin Rule Engine](#section-6--layer-4-admin-rule-engine)
- [Section 7 — Data Model & Schema Design](#section-7--data-model--schema-design)
- [Section 7A — Backwards Compatibility and Migration](#section-7a--backwards-compatibility-and-migration)
- [Section 8 — Supplier Integration Specifications](#section-8--supplier-integration-specifications)
- [Section 9 — Recommendation & Curation Engine Extension](#section-9--recommendation--curation-engine-extension)
- [Section 10 — Cost Model and Unit Economics](#section-10--cost-model-and-unit-economics)
- [Section 11 — Implementation Roadmap & Phasing](#section-11--implementation-roadmap--phasing)
- [Appendix A — Audit Cross-Reference Table](#appendix-a--audit-cross-reference-table)
- [Appendix B — Supplier API Quick Reference](#appendix-b--supplier-api-quick-reference)
- [Appendix C — Type Inventory](#appendix-c--type-inventory)
- [Appendix D — Glossary](#appendix-d--glossary)

---

## Section 0 — Current State Audit

### 0.1 Overview

The Al Rais travel platform currently supports three product verticals — flights, hotels, and sightseeing (activities) — each operating as an independent silo. There is no mechanism to combine these verticals into a bundled package offering. The SOW audit (dated 2026-04-28) confirms that the "Dynamic Package Builder" deliverable is at **0% completion**.

This section documents the exact state of every component that the dynamic packaging engine will depend on, built on, or extend.

### 0.2 Middleware Layer — What Exists

The middleware (`Epicmetry/alrais-middleware`) is the intelligence and aggregation layer sitting atop the legacy services. It currently handles:

| Component | File(s) | Status | Tests |
|-----------|---------|--------|-------|
| Orchestrator (fan-out) | `src/orchestrator/orchestrator.ts` | Implemented | 383 passing |
| Supplier connector interface | `src/types/supplier.ts` | Implemented | Type-level |
| Canonical data model | `src/types/canonical.ts` | Implemented | Type-level |
| Curation engine (7 rules) | `src/curation/engine.ts`, `src/types/curation.ts` | Implemented | Unit + integration |
| Provesio flight connector | `src/connectors/provesio/` | Implemented (strangler wrap) | Unit |
| Duffel flight connector | `src/connectors/duffel/flights.ts` | Implemented | Unit |
| Visa static connector | `src/connectors/visa/` | Implemented | Unit |
| Worker error taxonomy | `src/types/worker-errors.ts` | Implemented | 28 tests |
| Discriminated union guards | `src/types/queue.ts` | Implemented | Type-level |
| Idempotency support | `src/lib/idempotency.ts` | Implemented | 12 tests |
| Saga types (interface only) | `src/types/saga.ts` | Scaffolded (no runtime) | 12 tests |
| Pricing engine | `src/pricing/stub.ts` | **Stub only** (passthrough) | None |
| Request/result store | `src/cache/request-store.ts` | Implemented (DynamoDB) | Unit |
| Circuit breaker | `src/orchestrator/circuit-breaker.ts` | Implemented | Unit |

**Key architectural decisions already locked:**

1. `isolatedModules: true` in tsconfig — prevents `const enum`, must use `as const` objects
2. ES Module syntax with `.js` extension imports throughout
3. `SupplierConnector` interface with optional methods + capabilities array
4. `SupplierMessage<P>` envelope for all worker communication
5. `Promise.allSettled()` fan-out pattern in orchestrator
6. `NormalizedFlightOffer` / `NormalizedHotelOffer` as canonical types
7. `PricingEngine` interface with `applyPricing(input, rules)` signature

### 0.3 Middleware Layer — What Is Missing

| Component | Gap | Required For |
|-----------|-----|-------------|
| Hotel connector (Duffel Stays) | No implementation | Package hotel component |
| Hotel connector (Hotelbeds) | No implementation | Package hotel component (multi-supplier) |
| Activity connector (Viator) | No implementation | Package activity component |
| Transfer connector | No implementation | Package transfer component |
| Insurance connector | No implementation | Package insurance component |
| Package orchestrator | No implementation | Multi-component coordination |
| Saga runtime implementation | Types-only scaffold exists | Compensation/rollback |
| Pricing engine (real) | Passthrough stub exists | Bundle pricing, margin, yield |
| Hotel curation rules | Only flight rules exist | Hotel scoring/selection |
| Activity curation rules | Not started | Activity scoring/selection |
| Package curation rules | Not started | Cross-component bundle scoring |
| Admin rule engine | Not started | Business rule configuration |
| Recommendation engine | Not started | Personalized suggestions |
| Currency conversion | Not started | Multi-currency bundle pricing |
| Package hold management | Not started | Coordinated holds across suppliers |
| Package booking confirmation | Not started | Atomic or saga-based booking |

### 0.4 Frontend Layer — What Exists

| Component | Path | Status |
|-----------|------|--------|
| Flights page | `src/features/flights/pages/FlightsPage.tsx` | Full implementation |
| Hotels page | `src/features/hotels/pages/HotelsPage.tsx` | Full implementation |
| Sightseeing page | `src/features/sightseeing/` | Full implementation |
| **Packages page** | `src/pages/PackagesPage.tsx` | **Empty stub** |
| Flight search hooks | `src/hooks/useFlightSearch.ts` | Implemented |
| Hotel search hooks | `src/hooks/useHotelSearch.ts` | Implemented |
| Activity search hooks | `src/hooks/sightseeing/` | Implemented |
| State management | Zustand stores per domain | Implemented |
| Payment integration | PayFort via `usePayFortTokenization` | Implemented |
| Chatbot (tool calling) | `al-rais-chatbot/` | Implemented (GPT-4o, 5 tools) |

The `PackagesPage.tsx` stub contains only:

```tsx
<div>
  <h1>Packages</h1>
  <p>Search and book packages here.</p>
</div>
```

### 0.5 Chatbot Layer — What Exists

The chatbot (`al-rais-chatbot`) uses OpenAI GPT-4o with tool calling and supports:

| Tool | Operations | Status |
|------|-----------|--------|
| `flightTools` | Search flights, get fare rules | Implemented |
| `hotelTools` | Search hotels, get details | Implemented |
| `transportTools` | Search airport transfers | Implemented |
| `supportTools` | Customer support routing | Implemented |
| **packageTools** | Package search, compose, book | **Not implemented** |

The chatbot has a 5-round maximum for tool calling conversations. The system prompt positions the bot as a "travel assistant" for Al Rais Travel. There is no package-aware tooling.

### 0.6 Legacy Backend Services — What Exists

| Service | Runtime | Supplier | Packaging Support |
|---------|---------|----------|-------------------|
| `flight-search` | Node.js 20 / Lambda | Provesio | None — hardcoded single-supplier |
| `alrais-hotel-search` | Node.js / Lambda | Provesio (hotel) | None |
| `al-rais-supplier` | Node.js / Lambda | Provesio | None |
| `alrais-hotel-beds-availability` | Node.js / Lambda | Hotelbeds | None |
| `alrais-flight-ancillaries` | Node.js / Lambda | Provesio | None |
| `alrais-flight-cancellation` | Node.js / Lambda | Provesio | None |
| `alrais-payment-gateways` | Node.js / Lambda | PayFort | None |
| `alrais-auth-middleware` | Node.js / Lambda | Cognito | N/A |
| `travel_chatbot` | Python / Lambda | OpenAI | None |
| `al-rais-chatbot` | Node.js / Lambda | OpenAI | None |

### 0.7 User Behavior Data — What Exists

| Data Source | Store | Schema |
|-------------|-------|--------|
| Search preferences | DynamoDB (`user-search-preferences`) | `{ userId, browserId, departureAirportCode, arrivalAirportCode, userType }` |
| Flight offer views | DynamoDB (`offer-viewing-{stage}`) | `{ offerId, expireAt }` with TTL |
| High-demand indicators | DynamoDB (`high-demand-flight-indicators-{stage}`) | `{ departureAirportCode, routeAirline }` |
| People viewing flights | DynamoDB (`people-viewing-flights-{stage}`) | `{ route, cabinClass, expireAt }` |
| Passenger cache | Redis (`passenger_cache_{userId}`) | Cached form data, no TTL |
| Booking history | DynamoDB (`prov-booking-{stage}`, `flight-booking-{stage}`) | Full booking records |

### 0.8 SOW Deliverable Status

From SOW Audit Report (2026-04-28):

| SOW Deliverable | SOW % | Actual % | Notes |
|-----------------|-------|----------|-------|
| Flight Search & Booking | 100% | ~85% | Middleware adds multi-supplier, but booking still legacy-dependent |
| Hotel Search & Booking | 100% | ~70% | Hotelbeds availability exists; Duffel Stays not integrated |
| Sightseeing/Activities | 100% | ~60% | UI complete; backend is Viator-ready but not connected |
| **Dynamic Package Builder** | **100%** | **0%** | **Not started** |
| Admin Panel | 50% | ~30% | Partial implementation |
| Chatbot Integration | 100% | ~65% | Flight/hotel tools work; no package tools |
| Loyalty/Miles Program | 100% | ~15% | Profile miles display exists; no earn/burn logic |
| Payment Gateway | 100% | ~80% | PayFort implemented; no multi-currency |

---

## Section 1 — Product Posture & Vision

### 1.1 What Is the Dynamic Packaging Engine?

The Dynamic Packaging Engine (DPE) enables travelers to compose a multi-component trip — combining flights, hotels, activities, transfers, and insurance — into a single bundled package with unified pricing, coordinated booking, and cohesive cancellation policies.

Unlike static packages (pre-built itineraries sold as fixed products), dynamic packages are assembled in real-time from live inventory across multiple suppliers. The traveler selects individual components, the engine validates compatibility (dates, locations, passenger counts), applies bundle pricing rules (discounts, margins, yield adjustments), and orchestrates the booking as a coordinated transaction with rollback capability.

### 1.2 Product Posture: Curating Aggregator

The Al Rais middleware is positioned as a **curating aggregator** — not merely a price comparison tool. This distinction is foundational to how the DPE operates:

| Dimension | Price Comparison | Curating Aggregator |
|-----------|-----------------|---------------------|
| Value proposition | Cheapest price | Best-fit recommendation |
| Output | Sorted list | Curated top 3 with explanations |
| Scoring | Price only | 7 weighted dimensions |
| Package handling | Cart of cheapest items | Intelligent composition with tradeoff analysis |
| Personalization | None | User context (family, carriers, timing) |

The curation engine already implements this for flights with 7 weighted rules:

| Rule | Weight | Dimension |
|------|--------|-----------|
| Price | 0.30 | Total cost normalized across offers |
| Duration | 0.20 | Total travel time including layovers |
| Stops | 0.15 | Number of connections (0 = direct) |
| Departure Time | 0.10 | Proximity to preferred departure window |
| Family | 0.10 | Family-friendly scoring (connections, timing, duration) |
| Carrier | 0.10 | Preferred airline matching |
| Freshness | 0.05 | Recency of the offer (stale offers score lower) |

The DPE extends this curation philosophy to packages. A package is not the cheapest combination of components — it is the **best-fit** combination, scored across:

- Per-component quality (individual curation scores)
- Cross-component compatibility (hotel proximity to airport, activity timing vs. flight schedule)
- Bundle economics (total savings vs. à la carte)
- Logistical coherence (transfer timing, check-in/check-out alignment)

### 1.3 Core User Journeys

**Journey 1: Search-First Composition**
Traveler searches for flights → selects a flight → is offered complementary hotels at the destination → selects a hotel → is offered activities and transfers → reviews the bundled price → books the package.

**Journey 2: Intent-First Composition (Chatbot)**
Traveler tells the chatbot: "I want a 5-day family trip to Dubai from London, budget £3000" → chatbot queries the package engine → engine returns 3 curated package options → traveler selects one → chatbot guides through booking.

**Journey 3: Pre-Built Template**
Admin configures a "Dubai City Break" template: 3 nights, hotel category 4-5 star, desert safari included, airport transfer included → traveler enters dates and passengers → engine fills the template with live inventory → traveler reviews and books.

**Journey 4: Progressive Enhancement**
Traveler books a flight → post-booking, the system recommends a hotel, activities, and transfers at the destination → traveler adds components to the existing booking → system coordinates the additions.

### 1.4 Non-Goals (Explicitly Out of Scope)

1. **Static pre-packaged tours** — DPE is dynamic. Static packages are a content management concern, not an engine concern.
2. **Multi-city dynamic packages** — v1 supports single-destination packages only. Multi-city is Phase 2.
3. **Car rental** — No supplier integration exists. Transfers cover airport-hotel transport.
4. **Loyalty points earn/burn** — Loyalty program is a separate SOW deliverable at 15% completion. DPE does not block on it.
5. **Real-time seat maps or room views** — These are supplier-specific UX features that sit atop the DPE, not inside it.
6. **Payment splitting** — v1 requires full payment at booking. Installment or split payment is Phase 2.

---

## Section 2 — Architectural Foundation

### 2.1 System Topology

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Frontend (React + Vite)                     │
│                                                                      │
│  PackageBuilder UI ─── PackageStore (Zustand) ─── Chatbot Widget     │
│       │                       │                        │             │
└───────┼───────────────────────┼────────────────────────┼─────────────┘
        │ REST                  │ REST                   │ REST
        ▼                      ▼                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Middleware API Gateway (Lambda)                    │
│                                                                      │
│  ┌─────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Package Handlers     │  │ Existing Handlers                    │  │
│  │                      │  │                                      │  │
│  │ package-search       │  │ flight-search   flight-book          │  │
│  │ package-compose      │  │ flight-fare     visa-check           │  │
│  │ package-hold         │  │ hotel-search    hotel-book           │  │
│  │ package-confirm      │  │ activity-search activity-book        │  │
│  │ package-status       │  │ health          destination-context  │  │
│  └─────────┬────────────┘  └──────────────────────────────────────┘  │
│            │                                                         │
│  ┌─────────▼──────────────────────────────────────────────────────┐  │
│  │                    Package Orchestrator                         │  │
│  │                                                                │  │
│  │  ┌──────────────┐  ┌────────────────┐  ┌───────────────────┐  │  │
│  │  │ Composition   │  │ Bundle Pricing  │  │ Saga Coordinator  │  │  │
│  │  │ Engine        │  │ Engine          │  │ (State Machine)   │  │  │
│  │  └──────┬───────┘  └───────┬────────┘  └──────┬────────────┘  │  │
│  │         │                  │                   │               │  │
│  │  ┌──────▼──────────────────▼───────────────────▼───────────┐  │  │
│  │  │              Existing Orchestrator (Fan-Out)             │  │  │
│  │  │  Promise.allSettled() → Normalize → Deduplicate → Curate│  │  │
│  │  └──────┬──────────────────┬───────────────────┬───────────┘  │  │
│  └─────────┼──────────────────┼───────────────────┼──────────────┘  │
│            │                  │                   │                  │
│  ┌─────────▼───┐  ┌──────────▼───┐  ┌────────────▼──────────────┐  │
│  │ Flight      │  │ Hotel        │  │ Activity / Transfer /     │  │
│  │ Connectors  │  │ Connectors   │  │ Insurance Connectors      │  │
│  │             │  │              │  │                            │  │
│  │ Provesio    │  │ Duffel Stays │  │ Viator (activities)       │  │
│  │ Duffel      │  │ Hotelbeds    │  │ TBD (transfers)           │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬───────────────┘  │
└─────────┼────────────────┼──────────────────────┼───────────────────┘
          ▼                ▼                      ▼
   ┌──────────┐    ┌──────────┐           ┌──────────┐
   │ Provesio │    │ Duffel   │           │ Viator   │
   │ (Legacy) │    │ API      │           │ API      │
   └──────────┘    └──────────┘           └──────────┘
```

### 2.2 Layered Architecture

The DPE is organized into four implementation layers, each building on the one below:

| Layer | Name | Responsibility | Dependencies |
|-------|------|---------------|--------------|
| **L1** | Composition UI | Package builder wizard, component selection, chatbot tools | L2 (pricing preview) |
| **L2** | Bundle Pricing & Yield | Margin application, currency conversion, bundle discounts | Existing pricing stub |
| **L3** | Multi-Supplier Orchestration | Coordinated holds, saga-based booking, compensation | Existing saga types |
| **L4** | Admin Rule Engine | Business rule configuration, template management, yield rules | L2 + L3 |

**Layer 5 (Recommendation Engine) is Phase 2** and is covered in Section 9 as a design specification only.

### 2.3 Extending the Existing Connector Interface

The current `SupplierConnector` interface (`src/types/supplier.ts`) supports 9 capabilities:

```typescript
export type SupplierCapability =
  | 'flight_search' | 'flight_book' | 'flight_fare_rules' | 'fare_calendar'
  | 'hotel_search'  | 'hotel_book'  | 'hotel_details'
  | 'visa_check'    | 'destination_context';
```

The DPE requires extending this with:

```typescript
// New capabilities for DPE
| 'activity_search'  | 'activity_book'  | 'activity_details'  | 'activity_availability'
| 'transfer_search'  | 'transfer_book'
| 'insurance_quote'  | 'insurance_book'
| 'hotel_rate_fetch' | 'hotel_quote'                        // Duffel Stays specific
```

The `SupplierConnector` interface gains optional methods:

```typescript
// Activity Operations
searchActivities?(request: ActivitySearchRequest): Promise<SupplierActivityResult>;
getActivityDetails?(productCode: string): Promise<NormalizedActivityOffer | null>;
checkActivityAvailability?(request: ActivityAvailabilityRequest): Promise<ActivityAvailability>;
bookActivity?(request: ActivityBookRequest): Promise<BookingReference>;

// Transfer Operations
searchTransfers?(request: TransferSearchRequest): Promise<SupplierTransferResult>;
bookTransfer?(request: TransferBookRequest): Promise<BookingReference>;

// Insurance Operations
quoteInsurance?(request: InsuranceQuoteRequest): Promise<InsuranceQuote>;
bookInsurance?(request: InsuranceBookRequest): Promise<BookingReference>;
```

### 2.4 Extending the Operation Taxonomy

The current `OperationModule` and `Operation` types (`src/types/queue.ts`) must be extended:

```typescript
// Current:
export type OperationModule = 'flight' | 'hotel' | 'transfer' | 'activity' | 'insurance' | 'package';

// 'transfer', 'activity', 'insurance' already declared — just unused
// 'package' already declared — PackageOperation types already defined:
export type PackageOperation =
  | 'search_bundle'
  | 'compose_package'
  | 'hold_package'
  | 'confirm_package'
  | 'price_package';
```

The `PackageOperation` types are already defined in `queue.ts` (lines 31-36) and the worker already returns `'unsupported'` for them. This is intentional — the types were designed-in from the start.

### 2.5 Extending the ModuleOperationMap

The `ModuleOperationMap` discriminated union (`queue.ts:55-65`) currently only defines `flight` operations. The DPE extends it:

```typescript
export interface ModuleOperationMap {
  flight: { /* existing */ };
  hotel: {
    search: HotelSearchPayload;
    book: HotelBookPayload;
    hold: HotelHoldPayload;
    confirm: { bookingId: string };
    cancel: { bookingId: string; reason?: string };
  };
  activity: {
    search: ActivitySearchPayload;
    book: ActivityBookPayload;
    availability_check: ActivityAvailabilityPayload;
    cancel: { bookingId: string; reason?: string };
  };
  transfer: {
    search: TransferSearchPayload;
    book: TransferBookPayload;
    cancel: { bookingId: string; reason?: string };
  };
  insurance: {
    search: InsuranceSearchPayload;
    book: InsuranceBookPayload;
    cancel: { policyId: string; reason?: string };
  };
  package: {
    search_bundle: PackageSearchPayload;
    compose_package: PackageComposePayload;
    hold_package: PackageHoldPayload;
    confirm_package: PackageConfirmPayload;
    price_package: PackagePricePayload;
  };
}
```

### 2.6 Canonical Types — New Models

The canonical type system (`src/types/canonical.ts`) must be extended with:

```typescript
// ─── Activity Types ──────────────────────────────────────
export interface NormalizedActivityOffer {
  id: string;
  supplier: string;
  supplierOfferId: string;          // e.g., Viator product code
  title: string;
  description: string;
  category: string;                 // e.g., 'adventure', 'cultural', 'food'
  subcategory?: string;
  duration: {
    fixedDurationMinutes?: number;
    rangeDurationMinutes?: { min: number; max: number };
    description: string;            // e.g., "3-4 hours"
  };
  images: { url: string; caption?: string }[];
  location: {
    city: string;
    countryCode: string;
    latitude?: number;
    longitude?: number;
    meetingPoint?: string;
  };
  pricing: {
    pricePerAdult: PriceBreakdown;
    pricePerChild?: PriceBreakdown;
    groupPricing?: { minPax: number; maxPax: number; pricePerPerson: PriceBreakdown };
  };
  availability: {
    nextAvailableDate?: string;
    operatingDays?: string[];       // e.g., ['MON', 'WED', 'FRI']
    startTimes?: string[];          // e.g., ['09:00', '14:00']
  };
  cancellationPolicy: {
    freeCancellationUntil?: string; // ISO 8601 datetime
    refundable: boolean;
    rules: string[];
  };
  inclusions: string[];
  exclusions: string[];
  reviewScore?: number;             // 0-5 scale
  reviewCount?: number;
  bookable: boolean;
  fetchedAt: string;
  metadata?: Record<string, unknown>;
}

// ─── Transfer Types ──────────────────────────────────────
export interface NormalizedTransferOffer {
  id: string;
  supplier: string;
  supplierOfferId: string;
  type: 'private' | 'shared' | 'luxury';
  vehicleType: string;              // e.g., 'sedan', 'minivan', 'bus'
  maxPassengers: number;
  pickup: {
    location: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    dateTime: string;
  };
  dropoff: {
    location: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    estimatedArrival?: string;
  };
  durationMinutes?: number;
  price: PriceBreakdown;
  cancellationPolicy: string;
  inclusions: string[];
  bookable: boolean;
  fetchedAt: string;
  metadata?: Record<string, unknown>;
}

// ─── Insurance Types ─────────────────────────────────────
export interface NormalizedInsuranceQuote {
  id: string;
  supplier: string;
  supplierQuoteId: string;
  planName: string;
  coverageType: 'basic' | 'standard' | 'comprehensive';
  coverageDetails: {
    medicalCover: number;           // Max amount in display currency
    tripCancellation: number;
    baggageLoss: number;
    flightDelay: number;
  };
  price: PriceBreakdown;
  policyTerms: string;
  bookable: boolean;
  fetchedAt: string;
  metadata?: Record<string, unknown>;
}

// ─── Package Types ───────────────────────────────────────
export interface NormalizedPackageOffer {
  id: string;
  /** Components that make up this package */
  components: PackageComponent[];
  /** Bundle pricing (may differ from sum of components) */
  bundlePrice: BundlePriceBreakdown;
  /** Compatibility validation result */
  compatibility: PackageCompatibility;
  /** Curation score if curated */
  curationScore?: number;
  /** Human-readable package description */
  description: string;
  /** Labels for curated packages */
  label?: 'best_overall' | 'best_value' | 'adventure' | 'luxury' | 'family';
  /** Tradeoff notes */
  tradeoffs: string[];
  /** Cancellation policy summary */
  cancellationSummary: string;
  createdAt: string;
}

export interface PackageComponent {
  module: OperationModule;
  offerId: string;
  supplier: string;
  /** Reference to the normalized offer */
  offer: NormalizedFlightOffer | NormalizedHotelOffer | NormalizedActivityOffer
       | NormalizedTransferOffer | NormalizedInsuranceQuote;
  /** Component-level price before bundle adjustment */
  componentPrice: PriceBreakdown;
  /** Hold status if held */
  holdStatus?: 'not_held' | 'held' | 'expired' | 'failed';
  holdExpiresAt?: string;
  /** Booking reference once booked */
  bookingReference?: BookingReference;
}

export interface BundlePriceBreakdown {
  /** Sum of component prices (à la carte total) */
  aLaCarteTotal: number;
  /** Bundle discount applied */
  bundleDiscount: number;
  /** Margin applied by pricing engine */
  marginApplied: number;
  /** Final bundle price */
  bundleTotal: number;
  /** Display currency */
  displayCurrency: string;
  /** Savings percentage */
  savingsPercent: number;
  /** Per-component pricing breakdown */
  componentBreakdown: {
    module: OperationModule;
    supplier: string;
    supplierPrice: number;
    displayPrice: number;
    marginApplied: number;
  }[];
}

export interface PackageCompatibility {
  valid: boolean;
  warnings: PackageWarning[];
  errors: PackageError[];
}

export interface PackageWarning {
  code: string;
  message: string;
  component: OperationModule;
  severity: 'info' | 'warning';
}

export interface PackageError {
  code: string;
  message: string;
  component: OperationModule;
  severity: 'error';
}
```

---

## Section 3 — Layer 1: Composition UI (Package Builder)

### 3.1 Overview

Layer 1 is the user-facing composition interface. It enables travelers to build a package by selecting components step-by-step, with the engine validating compatibility and providing pricing previews at each step.

### 3.2 Package Builder Wizard — Step Flow

```
Step 1: Trip Intent
  → Destination, dates, passengers, trip type (leisure/business/family)

Step 2: Flight Selection
  → Search flights → curated top 3 + full list → select one
  → Or: "I already have flights" (skip, enter booking ref)

Step 3: Hotel Selection
  → Search hotels at destination → curated top 3 + full list → select one
  → Dates auto-populated from flight arrival/departure
  → Or: "I already have a hotel" (skip)

Step 4: Activities & Transfers (Optional)
  → Browse activities at destination during trip dates
  → Add airport transfers (arrival + departure)
  → Multi-select: traveler can add 0..N activities

Step 5: Insurance (Optional)
  → Offer travel insurance quotes based on trip details
  → Single-select: one plan or skip

Step 6: Review & Price
  → Show all selected components
  → Bundle pricing breakdown (à la carte vs. bundle)
  → Compatibility validation summary
  → Cancellation policy per component (see Section 3.7)
  → Insurance coverage summary (see Section 3.7.6)

Step 7: Booking
  → Passenger details (pre-filled from cache)
  → Payment (PayFort)
  → Coordinated hold → confirm flow
```

### 3.3 API Endpoints — Package Handlers

#### 3.3.1 POST /api/packages/search

Initiates a package search. Fans out component searches in parallel based on the trip intent.

**Request:**

```typescript
interface PackageSearchRequest {
  destination: string;              // IATA city code or city name
  departureCity: string;            // IATA city code
  departureDate: string;            // YYYY-MM-DD
  returnDate: string;               // YYYY-MM-DD
  passengers: {
    adults: number;
    children: number;
    childrenAges?: number[];
    infants: number;
  };
  tripType: 'leisure' | 'business' | 'family' | 'adventure';
  components: {
    flights: boolean;               // default: true
    hotels: boolean;                // default: true
    activities: boolean;            // default: false
    transfers: boolean;             // default: false
    insurance: boolean;             // default: false
  };
  preferences?: {
    hotelStarRating?: number;       // min star rating
    cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
    maxBudget?: number;
    budgetCurrency?: string;
    activityCategories?: string[];
    directFlightsOnly?: boolean;
  };
  currency: string;                 // ISO 4217 display currency
}
```

**Response:**

```typescript
interface PackageSearchResponse {
  requestId: string;
  status: 'completed' | 'partial' | 'pending';
  packages: NormalizedPackageOffer[];    // curated top 3
  components: {
    flights: NormalizedFlightOffer[];
    hotels: NormalizedHotelOffer[];
    activities: NormalizedActivityOffer[];
    transfers: NormalizedTransferOffer[];
    insurance: NormalizedInsuranceQuote[];
  };
  supplierStatuses: SupplierStatusEntry[];
  totalLatencyMs: number;
}
```

**Behavior:**

1. Parse and validate the request via zod schema
2. Fan out parallel searches for each enabled component via the existing orchestrator
3. Run the composition engine to generate 3 curated package combinations
4. Apply bundle pricing to each package
5. Return curated packages + individual component lists for mix-and-match

#### 3.3.2 POST /api/packages/compose

Composes a custom package from selected individual components.

**Request:**

```typescript
interface PackageComposeRequest {
  requestId: string;                  // from package-search
  components: {
    flightOfferId?: string;           // middleware offer ID
    hotelOfferId?: string;
    activityOfferIds?: string[];
    transferOfferIds?: string[];
    insuranceQuoteId?: string;
  };
  currency: string;
}
```

**Response:**

```typescript
interface PackageComposeResponse {
  packageId: string;                  // UUID
  package: NormalizedPackageOffer;
  bundlePrice: BundlePriceBreakdown;
  compatibility: PackageCompatibility;
  holdAvailable: boolean;
  holdDurationMinutes: number;
}
```

**Behavior:**

1. Retrieve selected offers from the request store (DynamoDB)
2. Validate cross-component compatibility (dates, location, passenger counts)
3. Apply bundle pricing rules
4. Return the composed package with pricing and compatibility results
5. Store the package composition in DynamoDB with a TTL

#### 3.3.3 POST /api/packages/hold

Places coordinated holds on all holdable components.

**Request:**

```typescript
interface PackageHoldRequest {
  packageId: string;
  holdDurationMinutes: number;        // requested hold duration (max from admin rules)
}
```

**Response:**

```typescript
interface PackageHoldResponse {
  packageId: string;
  sagaId: string;                     // saga tracking ID
  holds: {
    module: OperationModule;
    supplier: string;
    holdStatus: 'held' | 'failed' | 'not_holdable';
    holdExpiresAt?: string;
    error?: string;
  }[];
  overallStatus: 'all_held' | 'partial' | 'failed';
  /** Earliest expiry across all holds */
  effectiveExpiry: string;
}
```

**Behavior:**

1. Retrieve the composed package from DynamoDB
2. Create a saga definition with steps for each holdable component
3. Execute holds in sequence (flights first, then hotels, then activities) — each step has a compensation action
4. If any hold fails, trigger saga compensation to release prior holds
5. Return hold statuses and the saga ID for tracking

#### 3.3.4 POST /api/packages/confirm

Confirms a held package — converts holds to bookings.

**Request:**

```typescript
interface PackageConfirmRequest {
  packageId: string;
  sagaId: string;
  passengers: PassengerDetail[];
  contactEmail: string;
  contactPhone: string;
  paymentToken: string;               // PayFort tokenized payment
}
```

**Response:**

```typescript
interface PackageConfirmResponse {
  packageId: string;
  sagaId: string;
  bookingStatus: 'confirmed' | 'partial' | 'failed';
  bookings: {
    module: OperationModule;
    supplier: string;
    bookingReference: BookingReference;
    status: BookingStatus;
  }[];
  totalCharged: number;
  currency: string;
  compensationActions?: {
    module: OperationModule;
    action: string;
    status: string;
  }[];
}
```

#### 3.3.5 GET /api/packages/:packageId/status

Retrieves the current status of a package (hold state, booking state, saga state).

**Request:** Path param `packageId`

**Response:**

```typescript
interface PackageStatusResponse {
  packageId: string;
  sagaId?: string;
  phase: 'composed' | 'holding' | 'held' | 'confirming' | 'confirmed' | 'failed' | 'cancelled';
  components: {
    module: OperationModule;
    holdStatus?: string;
    bookingStatus?: string;
    bookingReference?: string;
  }[];
  bundlePrice: BundlePriceBreakdown;
  createdAt: string;
  updatedAt: string;
}
```

### 3.4 Chatbot Integration — Package Tools

The chatbot (`al-rais-chatbot`) must gain a `packageTools` tool set:

```typescript
const packageTools = [
  {
    type: 'function',
    function: {
      name: 'searchPackages',
      description: 'Search for travel packages combining flights, hotels, activities, transfers',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string', description: 'Destination city or IATA code' },
          departureCity: { type: 'string', description: 'Departure city or IATA code' },
          departureDate: { type: 'string', description: 'Departure date YYYY-MM-DD' },
          returnDate: { type: 'string', description: 'Return date YYYY-MM-DD' },
          adults: { type: 'number' },
          children: { type: 'number' },
          tripType: { type: 'string', enum: ['leisure', 'business', 'family', 'adventure'] },
          maxBudget: { type: 'number', description: 'Max budget in AED' },
        },
        required: ['destination', 'departureCity', 'departureDate', 'returnDate', 'adults'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'composePackage',
      description: 'Compose a custom package from selected components',
      parameters: {
        type: 'object',
        properties: {
          requestId: { type: 'string' },
          flightOfferId: { type: 'string' },
          hotelOfferId: { type: 'string' },
          activityOfferIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['requestId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getPackageStatus',
      description: 'Check the status of a package booking',
      parameters: {
        type: 'object',
        properties: {
          packageId: { type: 'string' },
        },
        required: ['packageId'],
      },
    },
  },
];
```

### 3.5 Frontend — Package Store (Zustand)

The frontend uses Zustand for state management. The DPE requires a new `usePackageStore`:

```typescript
interface PackageState {
  // Search
  searchParams: PackageSearchRequest | null;
  searchResults: PackageSearchResponse | null;
  isSearching: boolean;

  // Composition
  selectedFlight: NormalizedFlightOffer | null;
  selectedHotel: NormalizedHotelOffer | null;
  selectedActivities: NormalizedActivityOffer[];
  selectedTransfers: NormalizedTransferOffer[];
  selectedInsurance: NormalizedInsuranceQuote | null;

  // Package
  composedPackage: NormalizedPackageOffer | null;
  bundlePrice: BundlePriceBreakdown | null;
  compatibility: PackageCompatibility | null;

  // Booking
  packageId: string | null;
  sagaId: string | null;
  holdStatus: PackageHoldResponse | null;
  bookingStatus: PackageConfirmResponse | null;

  // Wizard
  currentStep: number;
  completedSteps: number[];

  // Actions
  setSearchParams: (params: PackageSearchRequest) => void;
  searchPackages: () => Promise<void>;
  selectFlight: (offer: NormalizedFlightOffer) => void;
  selectHotel: (offer: NormalizedHotelOffer) => void;
  addActivity: (offer: NormalizedActivityOffer) => void;
  removeActivity: (offerId: string) => void;
  selectTransfer: (offer: NormalizedTransferOffer) => void;
  selectInsurance: (quote: NormalizedInsuranceQuote) => void;
  composePackage: () => Promise<void>;
  holdPackage: () => Promise<void>;
  confirmPackage: (passengers: PassengerDetail[], paymentToken: string) => Promise<void>;
  reset: () => void;
}
```

### 3.6 Compatibility Validation Rules

The composition engine validates cross-component compatibility:

| Rule | Check | Severity |
|------|-------|----------|
| Date alignment | Hotel check-in ≤ flight arrival date | Error |
| Date alignment | Hotel check-out ≥ flight departure date (return) | Error |
| Location match | Hotel city matches flight destination | Error |
| Passenger count | Hotel max occupancy ≥ passenger count | Error |
| Activity date range | Activity date within trip date range | Warning |
| Transfer timing | Airport transfer arrival time ≥ flight arrival + 1h buffer | Warning |
| Transfer timing | Airport transfer departure ≤ flight departure - 3h | Warning |
| Activity overlap | No two activities on the same day at overlapping times | Warning |
| Insurance coverage | Insurance covers full trip duration | Warning |
| Hold expiry alignment | All hold expiries within 30 min of each other | Info |

### 3.7 Unified Cancellation Policy Presentation

Dynamic packages aggregate components from different suppliers, each with independent cancellation policies. The DPE must capture, normalize, and present these policies so the traveler understands the combined cancellation picture before booking.

#### 3.7.1 Per-Component Cancellation Policy Capture

Each normalized offer already carries a cancellation policy field. The composition engine extracts and normalizes these into a common structure:

```typescript
interface ComponentCancellationPolicy {
  module: OperationModule;
  supplier: string;
  offerId: string;
  /** Whether a full refund is available before the deadline */
  freeCancellationAvailable: boolean;
  /** Deadline after which cancellation penalties apply (ISO 8601) */
  freeCancellationDeadline?: string;
  /** Penalty schedule after the free cancellation window */
  penalties: {
    fromHoursBeforeDeparture: number;
    penaltyPercent: number;          // 0-100
    penaltyAmount?: number;          // absolute amount if applicable
    currency?: string;
  }[];
  /** Whether this component is non-refundable under all conditions */
  nonRefundable: boolean;
  /** Raw supplier terms for legal display */
  supplierTermsText: string;
}
```

**Extraction rules by supplier:**

| Supplier | Source Field | Free Cancellation Signal |
|----------|-------------|-------------------------|
| Provesio (flight) | Fare rules `cancellationPolicy` | `refundable: true` + penalty schedule |
| Duffel Flights | `offer.conditions.refund_before_departure` | `allowed: true` + `penalty_amount` |
| Duffel Stays | `rate.cancellation_timeline` | Timeline entries with `before` dates |
| Hotelbeds | `rate.cancellationPolicies[]` | `amount` field per deadline |
| Viator | `cancellationPolicy` | `type: 'FREE_CANCELLATION'` + `cutoffTime` |

#### 3.7.2 Package-Level Derivation

The package-level cancellation policy is derived as the **most restrictive** across all components:

```
Package free cancellation deadline = min(component free cancellation deadlines)
Package non-refundable = true if ANY component is non-refundable
Package penalty at time T = sum of component penalties at time T
```

```typescript
interface PackageCancellationSummary {
  /** Overall: can the package be fully cancelled for free right now? */
  freeCancellationAvailable: boolean;
  /** Earliest deadline across all components */
  freeCancellationDeadline?: string;
  /** Time remaining until the free cancellation window closes */
  freeCancellationRemainingHours?: number;
  /** Whether any component is non-refundable */
  hasNonRefundableComponent: boolean;
  /** Which components are non-refundable */
  nonRefundableComponents: { module: OperationModule; supplier: string }[];
  /** Per-component policies for detailed view */
  componentPolicies: ComponentCancellationPolicy[];
  /** Human-readable summary for display */
  displayText: string;
}
```

#### 3.7.3 User-Facing Presentation

The package review step (Step 5) must display:

1. **Header badge:** One of:
   - "Free cancellation until {date}" (green)
   - "Partial free cancellation" (yellow) — some components refundable, some not
   - "Non-refundable" (red) — at least one critical component is non-refundable

2. **Component breakdown table:**

| Component | Free Cancellation | Deadline | Penalty After |
|-----------|------------------|----------|---------------|
| Flight (Duffel) | Yes | 2026-07-08 23:59 | 100% fare |
| Hotel (Duffel Stays) | Yes | 2026-07-05 14:00 | 1 night charge |
| Desert Safari (Viator) | Yes | 2026-07-09 00:00 | 100% |
| Airport Transfer | No (non-refundable) | — | 100% |

3. **Combined warning:** "Your package can be cancelled for free until **July 5, 2026 at 2:00 PM** (determined by the hotel component). After this date, cancellation penalties apply per component."

#### 3.7.4 Cancellation Execution

When a traveler cancels a confirmed package:

```
1. Retrieve the PackageCancellationSummary
2. Calculate per-component penalties based on current time
3. Display total refund amount = totalPaid - sum(penalties)
4. Require traveler confirmation of the penalty breakdown
5. Execute saga compensation:
   a. Cancel each component via its supplier API (reverse booking order)
   b. Each supplier returns actual refund amount
   c. Sum actual refunds (may differ from estimate due to timing)
6. Issue refund via PayFort
7. Update package status to 'cancelled'
```

#### 3.7.5 Edge Cases

| Scenario | Handling |
|----------|---------|
| Component already expired (hold window passed) | Skip cancellation for that component; mark as auto-expired |
| Supplier API down during cancellation | Retry 3x with backoff; if all fail, queue for manual cancellation |
| Cancellation during the hold phase (pre-booking) | Release holds only — no penalties apply |
| Partial cancellation (cancel one component, keep others) | Not supported in v1 — must cancel entire package |
| Price changed between penalty calculation and execution | Use supplier's actual refund amount, not pre-calculated estimate |
| Free cancellation deadline passes while traveler is reviewing | Show real-time countdown; re-calculate if deadline passes during session |

#### 3.7.6 Insurance Interaction with Package Cancellation

When a package includes travel insurance, the cancellation presentation changes significantly. Insurance covers the non-refundable portions of other components, so the traveler's financial exposure is reduced.

**Presentation logic:**

```
if (package includes insurance with trip_cancellation coverage):
  coverageLimit = insurance.coverageDetails.tripCancellation
  totalPenalties = sum(component penalties at current time)
  coveredAmount = min(totalPenalties, coverageLimit)
  outOfPocket = max(0, totalPenalties - coverageLimit)

  Display:
    "Your travel insurance covers up to AED {coverageLimit} in cancellation penalties."
    "Estimated cancellation penalties: AED {totalPenalties}"
    "Covered by insurance: AED {coveredAmount}"
    "Your out-of-pocket cost: AED {outOfPocket}"
else:
  Display standard cancellation breakdown (Section 3.7.3)
```

**Header badge update for insured packages:**

- "Covered for cancellation up to AED {coverageLimit}" (blue) — replaces standard badge when insurance is present
- If `coverageLimit >= totalPenalties`: "Fully covered for cancellation" (green)
- If `coverageLimit < totalPenalties`: "Partially covered — AED {outOfPocket} out-of-pocket" (yellow)

**Insurance cancellation itself:** Insurance policies are typically non-refundable once the trip begins. Before trip start, insurance can be cancelled for a full refund (cooling-off period, typically 14 days from purchase). The package cancellation flow should cancel insurance last (it's needed to cover other component penalties during the cancellation process).

**Edge case — insurance claim vs. cancellation:** If the traveler is cancelling due to a covered reason (illness, emergency), the insurance claim process is separate from the package cancellation flow. The DPE initiates the cancellation; the insurance claim is handled directly with the insurer. The system should provide the policy reference and insurer contact details in the cancellation confirmation.

---

## Section 4 — Layer 2: Bundle Pricing & Yield Management

### 4.1 Overview

The existing pricing engine (`src/pricing/stub.ts`) is a passthrough — it returns the supplier price unchanged. The DPE requires a real pricing engine that:

1. Converts multi-currency component prices to a single display currency
2. Applies per-component margins
3. Calculates bundle discounts
4. Applies yield management rules (demand-based adjustments)
5. Produces a transparent breakdown for the traveler

### 4.2 PricingEngine Interface Extension

The existing `PricingEngine` interface:

```typescript
export interface PricingEngine {
  applyPricing(input: PricingInput, rules: PricingRules | null): PricingOutput;
}
```

This interface is sufficient for component-level pricing. For bundle pricing, we add:

```typescript
export interface BundlePricingEngine extends PricingEngine {
  /**
   * Price a complete package bundle.
   * Applies per-component margins, bundle discounts, and yield adjustments.
   */
  priceBundle(
    components: ComponentPricingInput[],
    bundleRules: BundlePricingRules,
    yieldContext: YieldContext,
  ): BundlePricingOutput;
}

export interface ComponentPricingInput {
  module: OperationModule;
  supplier: string;
  supplierTotal: number;
  supplierCurrency: string;
  displayCurrency: string;
}

export interface BundlePricingRules {
  /** Per-module margin overrides */
  moduleMargins: Record<OperationModule, number>;    // e.g., { flight: 0.03, hotel: 0.12 }
  /** Bundle discount (applied after margins) */
  bundleDiscountPercent: number;                     // e.g., 0.05 = 5%
  /** Minimum margin floor — never go below this */
  minimumMarginPercent: number;                      // e.g., 0.02 = 2%
  /** Display currency */
  displayCurrency: string;
  /** Rounding rule */
  roundingStrategy: 'round' | 'ceil' | 'floor';
  /** Rounding precision (decimal places) */
  roundingPrecision: number;
}

export interface YieldContext {
  /** Days until departure (affects yield factor) */
  daysUntilDeparture: number;
  /** Demand level for the route */
  demandLevel: 'low' | 'normal' | 'high' | 'peak';
  /** Day of week for booking */
  bookingDayOfWeek: number;          // 0=Sun, 6=Sat
  /** Season at destination */
  season: 'off_peak' | 'shoulder' | 'peak';
}

export interface BundlePricingOutput {
  components: {
    module: OperationModule;
    supplier: string;
    supplierTotal: number;
    convertedTotal: number;          // After currency conversion
    marginApplied: number;
    displayTotal: number;            // After margin
  }[];
  subtotal: number;                  // Sum of component display totals
  bundleDiscount: number;            // Discount amount
  yieldAdjustment: number;          // Yield adjustment (positive = markup, negative = reduction)
  total: number;                     // Final bundle price
  displayCurrency: string;
  aLaCarteComparison: number;       // What components would cost individually
  savingsAmount: number;
  savingsPercent: number;
}
```

### 4.3 Currency Conversion

The DPE must convert supplier prices from native currencies to the display currency. Component suppliers use:

| Supplier | Native Currency | Notes |
|----------|----------------|-------|
| Provesio | AED | Default; may return USD for some routes |
| Duffel Flights | Variable | Returns in booking currency |
| Duffel Stays | Variable | Returns in property currency |
| Hotelbeds | Variable | EUR or hotel's native currency |
| Viator | Variable | Returns in requested currency |

**Currency conversion approach:**

1. Use Open Exchange Rates API (already in middleware config: `openExchangeRates.appId`)
2. Cache exchange rates in Redis with 1-hour TTL
3. Apply conversion at bundle pricing time, not per-component
4. Round to 2 decimal places for display currencies
5. Store both supplier and display amounts for audit trail

### 4.4 Margin Rules

Default per-module margins (configurable via admin rule engine):

| Module | Default Margin | Range | Notes |
|--------|---------------|-------|-------|
| Flight | 3% | 1-8% | Low margin, high volume |
| Hotel | 12% | 5-25% | Higher margin, negotiated rates |
| Activity | 10% | 5-20% | Viator commission is 8-12%; our margin is on top |
| Transfer | 8% | 3-15% | Commodity service |
| Insurance | 15% | 10-30% | Highest-margin component in the package mix; affiliate commission model (20-40% of premium typical). Critical for yield management — insurance margin subsidizes bundle discounts on lower-margin components (flights, transfers) |

**Margin calculation order:**

```
1. Convert supplier price to display currency
2. Apply per-module margin: displayPrice = convertedPrice × (1 + marginPercent)
3. Sum all component display prices → subtotal
4. Apply bundle discount: discount = subtotal × bundleDiscountPercent
5. Apply yield adjustment: yieldAdjustment = (subtotal - discount) × yieldFactor
6. Final total = subtotal - discount + yieldAdjustment
7. Ensure total ≥ sum(supplierPrices × (1 + minimumMarginPercent))
```

### 4.5 Yield Management Rules

Yield factors adjust the bundle price based on demand signals:

| Factor | Trigger | Adjustment |
|--------|---------|------------|
| Advance booking | >60 days before departure | -2% (encourage early booking) |
| Last minute | <7 days before departure | +5% (scarcity premium) |
| Peak season | Dec 15 - Jan 5, Jun 15 - Aug 31 | +8% |
| Shoulder season | Mar-Apr, Oct-Nov | +2% |
| Weekend booking | Fri-Sun booking | +1% (convenience premium) |
| High route demand | Route has >80th percentile searches | +3% |
| Low route demand | Route has <20th percentile searches | -3% (stimulate demand) |
| Returning customer | User has previous bookings | -2% (loyalty) |

Yield factors are additive (summed, not multiplied) and capped at +15% / -10%.

### 4.6 Bundle Discount Tiers

| Components in Bundle | Discount |
|---------------------|----------|
| 2 (flight + hotel) | 3% |
| 3 (+ activity or transfer) | 5% |
| 4+ (all components) | 7% |
| With insurance | Additional 1% |

---

## Section 5 — Layer 3: Multi-Supplier Orchestration (Saga)

### 5.1 Overview

The saga orchestration layer coordinates multi-component bookings with rollback capability. If a hotel booking succeeds but a flight booking fails, the hotel hold must be released. This is the hardest layer — distributed transactions across independent supplier APIs.

### 5.2 Existing Saga Types

The saga types scaffold already exists (`src/types/saga.ts`):

```typescript
export interface SagaStep {
  stepId: string;
  module: OperationModule;
  operation: Operation;
  supplier: string;
  correlationId: string;
  status: 'pending' | 'completed' | 'compensating' | 'compensated' | 'failed';
  compensationAction?: CompensationAction;
}

export interface CompensationAction {
  operation: Operation;        // e.g., 'cancel' to undo 'book'
  payload: unknown;
  maxRetries: number;
  retryDelayMs: number;
}

export interface SagaDefinition {
  sagaId: string;
  packageId: string;
  steps: SagaStep[];
  status: 'running' | 'completed' | 'compensating' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface ISagaOrchestrator {
  createSaga(packageId: string, steps: Omit<SagaStep, 'status'>[]): Promise<SagaDefinition>;
  executeStep(sagaId: string, stepId: string): Promise<SagaStep>;
  compensate(sagaId: string): Promise<SagaDefinition>;
  getSagaStatus(sagaId: string): Promise<SagaDefinition | null>;
}

export const COMPENSATION_MAP = {
  book: 'cancel',
  hold: 'cancel',
  confirm: 'cancel',
} as const satisfies Record<string, Operation>;
```

### 5.3 Saga Runtime Implementation

The `ISagaOrchestrator` interface needs a runtime implementation. Two viable approaches:

#### Option A: AWS Step Functions (Recommended)

```
Advantages:
  - Built-in state management (DynamoDB-backed)
  - Visual workflow debugging
  - Automatic retries with backoff
  - waitForTaskToken pattern for async supplier responses
  - Native error handling with Catch/Retry

Disadvantages:
  - Additional AWS service dependency
  - State machine definition in ASL (Amazon States Language)
  - Cold start overhead for Step Function execution
  - Cost: $25 per million state transitions
```

**Step Functions workflow:**

```
PackageBookingSaga
  ├── HoldFlight (Task → Lambda → Provesio/Duffel)
  │     ├── Success → HoldHotel
  │     └── Failure → CompensationBranch
  │
  ├── HoldHotel (Task → Lambda → Duffel Stays/Hotelbeds)
  │     ├── Success → HoldActivities
  │     └── Failure → CompensateFlight → CompensationBranch
  │
  ├── HoldActivities (Map state → parallel Lambda per activity)
  │     ├── All Success → ConfirmAll
  │     └── Any Failure → CompensateHotel → CompensateFlight → CompensationBranch
  │
  ├── ConfirmAll (Parallel)
  │     ├── ConfirmFlight
  │     ├── ConfirmHotel
  │     └── ConfirmActivities
  │
  └── CompensationBranch
        ├── For each completed step (reverse order)
        │     └── Cancel/Release hold (with retry 3x, exponential backoff)
        └── Emit failure event
```

#### Option B: Custom State Machine (DynamoDB-backed)

```
Advantages:
  - No additional AWS service
  - Full control over state transitions
  - Lower per-invocation cost

Disadvantages:
  - Must build retry, backoff, timeout logic manually
  - Must build state persistence manually
  - Must build compensation sequencing manually
  - Higher engineering effort and maintenance burden
```

**Recommendation:** Use **AWS Step Functions** for the saga orchestrator. The complexity of distributed compensation with retries and timeouts across multiple suppliers justifies the managed service. The Step Functions callback pattern (`waitForTaskToken`) is well-suited for suppliers with async booking flows (e.g., Provesio's `asyncFetch` pattern).

### 5.4 Saga Execution Sequence

```
1. Client calls POST /api/packages/hold
2. Package handler creates a SagaDefinition in DynamoDB
3. Package handler starts Step Functions execution with saga state
4. Step Functions executes HoldFlight:
   a. Invoke supplier-worker Lambda with hold operation
   b. Worker calls supplier API (Provesio or Duffel)
   c. If async: worker sends task token to SQS, Step Functions waits
   d. Async completion handler calls SendTaskSuccess/SendTaskFailure
   e. On success: record hold reference, proceed to next step
   f. On failure: trigger compensation branch
5. Repeat for HoldHotel, HoldActivities
6. If all holds succeed: return hold confirmation to client
7. Client calls POST /api/packages/confirm
8. Step Functions executes ConfirmAll in parallel
9. If any confirmation fails: compensate other confirmed components
10. Return final booking status
```

### 5.5 Hold Expiry Management

Different suppliers have different hold durations:

| Supplier | Hold Duration | Extensible | Notes |
|----------|-------------|-----------|-------|
| Provesio (flight) | 5 minutes (prov-booking) | No | Very short; must confirm quickly |
| Duffel (flight) | Variable (offer `expires_at`) | No | Typically 30 min |
| Duffel Stays (hotel) | Quote-based expiry | No | Quote valid for limited time |
| Hotelbeds (hotel) | Until cancellation deadline | Yes | Can hold until free cancellation date |
| Viator (activity) | Cart hold (variable) | No | Cart-based hold system |

**Effective hold duration:** The package's effective hold is the **minimum** across all component holds. The system must:

1. Track the earliest hold expiry across all components
2. Set a warning threshold at 80% of the effective hold
3. If the client does not confirm within the hold window, auto-compensate all holds
4. Use DynamoDB TTL or Step Functions timeout to trigger automatic expiry

### 5.6 Compensation Rules

From `COMPENSATION_MAP`:

| Forward Operation | Compensation | Idempotent | Notes |
|-------------------|-------------|-----------|-------|
| `hold` | `cancel` | Yes | Release the hold |
| `book` | `cancel` | Yes | Cancel the booking |
| `confirm` | `cancel` | Yes | Cancel confirmed booking (may incur penalties) |

Compensation execution rules:

1. **Reverse order:** Compensate in reverse order of execution (last-booked first-cancelled)
2. **Retry policy:** 3 retries with exponential backoff (1s, 2s, 4s)
3. **Idempotency:** Compensation operations must be idempotent — use the idempotency key from the original operation
4. **Dead letter:** If compensation fails after all retries, log the failure and raise an alert for manual intervention
5. **No partial cancellation on confirmation:** If 2 of 3 confirmations succeed and 1 fails, attempt to cancel the 2 successful ones. If cancellation of a confirmed component fails, escalate to manual resolution.

### 5.7 Error Classification in Package Context

The existing error taxonomy (`src/types/worker-errors.ts`) applies to package operations. Additional package-specific error codes:

```typescript
// Package-specific error codes (add to WORKER_ERROR_CODES)
PACKAGE_COMPONENT_UNAVAILABLE: 'PACKAGE_COMPONENT_UNAVAILABLE',
PACKAGE_HOLD_EXPIRED: 'PACKAGE_HOLD_EXPIRED',
PACKAGE_PRICE_CHANGED: 'PACKAGE_PRICE_CHANGED',
PACKAGE_COMPATIBILITY_ERROR: 'PACKAGE_COMPATIBILITY_ERROR',
PACKAGE_SAGA_COMPENSATION_FAILED: 'PACKAGE_SAGA_COMPENSATION_FAILED',
PACKAGE_PARTIAL_BOOKING: 'PACKAGE_PARTIAL_BOOKING',
```

Classification:

| Code | Category | Retryable | Action |
|------|----------|----------|--------|
| `PACKAGE_COMPONENT_UNAVAILABLE` | `client_error` | No | Re-search, offer alternative |
| `PACKAGE_HOLD_EXPIRED` | `transient` | Yes | Re-hold if inventory available |
| `PACKAGE_PRICE_CHANGED` | `transient` | Yes | Re-price and present updated price |
| `PACKAGE_COMPATIBILITY_ERROR` | `client_error` | No | Show validation errors |
| `PACKAGE_SAGA_COMPENSATION_FAILED` | `internal` | No | Manual intervention required |
| `PACKAGE_PARTIAL_BOOKING` | `internal` | No | Manual intervention required |

### 5.8 Compensation Failure Operational Response

When saga compensation fails (i.e., a `PACKAGE_SAGA_COMPENSATION_FAILED` or `PACKAGE_PARTIAL_BOOKING` error occurs), the system enters a critical state where supplier-side resources are held or confirmed but the package-level transaction has failed. This section defines the detection, escalation, and resolution protocol.

#### 5.8.1 Detection

Compensation failures are detected via:

1. **Step Functions execution failure:** The compensation branch exhausts all retries (3 attempts with exponential backoff) and enters a `Failed` terminal state.
2. **Dead letter queue:** Failed compensation messages land in the SQS dead letter queue (`supplier-worker-dlq-{stage}`).
3. **DynamoDB saga state:** Saga status transitions to `'failed'` with one or more steps stuck in `'compensating'` (not `'compensated'`).

**CloudWatch alarm configuration:**

```
Metric: Custom/SagaCompensationFailure
Threshold: >= 1 in 5 minutes
Actions: SNS → PagerDuty + Slack #ops-critical
Dimensions: { stage, sagaId }
```

#### 5.8.2 Immediate Automated Actions

When compensation failure is detected, the system automatically:

1. **Freezes the saga:** Sets a `frozen: true` flag on the saga record to prevent any further automated actions.
2. **Logs full context:** Emits a structured log entry with `level: 'fatal'` containing:
   - `sagaId`, `packageId`, `correlationId`
   - All step statuses (which succeeded, which failed compensation)
   - Supplier hold/booking references for each component
   - Customer contact info (email, phone)
   - Total financial exposure (sum of supplier charges that could not be reversed)
3. **Creates an incident record:** Writes to DynamoDB `compensation-incidents-{stage}` table:

```
PK: INCIDENT#{incidentId}
SK: META

Attributes:
  incidentId: string (UUID)
  sagaId: string
  packageId: string
  userId: string
  status: 'open' | 'investigating' | 'resolved'
  financialExposure: { amount: number; currency: string }
  stuckSteps: SagaStep[] (steps in 'compensating' status)
  resolvedSteps: SagaStep[] (steps successfully compensated)
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  resolution: string | null
```

#### 5.8.3 Manual Intervention Procedure

The on-call operations team must:

1. **Acknowledge the incident** within 15 minutes (SLA).
2. **Assess stuck steps:** For each step stuck in `'compensating'`:
   - Log into the supplier portal (Provesio admin, Duffel dashboard, Viator partner portal, Hotelbeds extranet).
   - Verify the hold/booking status in the supplier's system.
   - If the supplier shows the hold as already expired or cancelled, mark the step as `'compensated'` in DynamoDB.
   - If the supplier shows an active hold/booking, manually cancel it via the supplier portal and record the cancellation reference.
3. **Update the incident record** with resolution details.
4. **Close the saga:** Set saga status to `'failed'` with all steps in terminal states (`'compensated'` or `'failed'`).

#### 5.8.4 Customer Communication

| Trigger | Channel | Message |
|---------|---------|---------|
| Compensation failure detected | Email (automated) | "We encountered an issue processing your travel package. Our team is reviewing it and will contact you within 2 hours." |
| Manual resolution complete — no charge | Email | "Your package booking was cancelled and no charges were applied." |
| Manual resolution complete — partial charge | Email + Phone | "Your package booking encountered an issue. We were unable to cancel [component]. We are processing a refund of [amount] and will contact you regarding the remaining [amount]." |
| Resolution exceeds 4 hours | Phone (ops team) | Direct call to customer with status update |

#### 5.8.5 Financial Liability Calculation

```
Financial exposure = sum of (supplier charges for steps NOT successfully compensated)

For each stuck step:
  if step.operation == 'hold':
    exposure += 0  (holds do not charge; they expire naturally)
  if step.operation == 'book' and booking is cancellable:
    exposure += cancellation_penalty (per supplier terms)
  if step.operation == 'confirm' and booking is confirmed:
    exposure += full_booking_amount - refundable_portion
```

**Key principle:** Holds that fail to cancel are low-risk — they expire on their own (Provesio: 5 min, Duffel: ~30 min, Viator: cart TTL). Confirmed bookings that fail to cancel are high-risk and require immediate manual intervention.

#### 5.8.6 Post-Incident Analysis

After every compensation failure (or weekly if none occurred):

1. **Root cause analysis:** Why did the compensation call fail? (supplier API down, auth expired, rate limit, network partition)
2. **Pattern detection:** Is this a recurring failure for a specific supplier? If so, consider:
   - Increasing retry count for that supplier
   - Adding a circuit breaker on the compensation path
   - Pre-validating cancellation capability before booking
3. **Metrics review:**
   - Monthly compensation failure rate (target: <0.1% of all saga executions)
   - Mean time to resolution (target: <2 hours)
   - Financial exposure per incident (target: <AED 5,000)
4. **Runbook update:** If new failure modes are discovered, update the ops runbook.

---

## Section 6 — Layer 4: Admin Rule Engine

### 6.1 Overview

The admin rule engine enables business users to configure pricing rules, package templates, supplier priorities, and yield management parameters without code changes. This is implemented as a configuration layer backed by DynamoDB with an admin API.

### 6.2 Rule Categories

#### 6.2.1 Pricing Rules

```typescript
interface PricingRuleConfig {
  ruleId: string;
  name: string;
  type: 'margin' | 'discount' | 'yield' | 'floor' | 'cap';
  scope: {
    modules?: OperationModule[];     // applies to specific modules
    suppliers?: string[];            // applies to specific suppliers
    routes?: string[];               // IATA route pairs (e.g., 'DXB-LHR')
    destinations?: string[];         // destination cities
  };
  value: number;                     // percentage or absolute amount
  valueType: 'percent' | 'absolute';
  priority: number;                  // higher = applied first
  active: boolean;
  validFrom: string;                 // ISO 8601
  validUntil: string;               // ISO 8601
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 6.2.2 Package Templates

```typescript
interface PackageTemplate {
  templateId: string;
  name: string;                      // e.g., "Dubai City Break"
  description: string;
  destination: string;
  defaultDurationNights: number;
  components: {
    flights: {
      required: boolean;
      defaultCabinClass: string;
      preferredSuppliers?: string[];
    };
    hotels: {
      required: boolean;
      minStarRating: number;
      maxStarRating: number;
      preferredSuppliers?: string[];
      boardBasis?: string;
    };
    activities: {
      required: boolean;
      defaultCategories: string[];
      maxActivities: number;
      suggestedActivities: string[];  // Viator product codes
    };
    transfers: {
      required: boolean;
      type: 'private' | 'shared';
    };
    insurance: {
      required: boolean;
      coverageType: string;
    };
  };
  pricingRuleIds: string[];          // refs to PricingRuleConfig
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 6.2.3 Supplier Priority Rules

```typescript
interface SupplierPriorityRule {
  ruleId: string;
  module: OperationModule;
  /** Ordered list — first = highest priority */
  supplierPriority: string[];
  /** Conditions under which this priority applies */
  conditions: {
    routes?: string[];
    destinations?: string[];
    seasons?: ('off_peak' | 'shoulder' | 'peak')[];
    tripTypes?: string[];
  };
  active: boolean;
}
```

### 6.3 Admin API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/pricing-rules` | List all pricing rules |
| POST | `/api/admin/pricing-rules` | Create a pricing rule |
| PUT | `/api/admin/pricing-rules/:ruleId` | Update a pricing rule |
| DELETE | `/api/admin/pricing-rules/:ruleId` | Deactivate a pricing rule |
| GET | `/api/admin/package-templates` | List package templates |
| POST | `/api/admin/package-templates` | Create a template |
| PUT | `/api/admin/package-templates/:templateId` | Update a template |
| GET | `/api/admin/supplier-priorities` | List supplier priority rules |
| POST | `/api/admin/supplier-priorities` | Create priority rule |
| GET | `/api/admin/yield-config` | Get current yield configuration |
| PUT | `/api/admin/yield-config` | Update yield configuration |

### 6.4 Rule Evaluation Order

When pricing a package, rules are evaluated in this order:

```
1. Load active pricing rules for the package's scope (module, supplier, route, destination)
2. Sort by priority (descending)
3. Apply floor rules first (minimum margins)
4. Apply margin rules
5. Apply discount rules (bundle discounts, promotional discounts)
6. Apply yield rules based on yield context
7. Apply cap rules last (maximum price limits)
8. Validate: final price ≥ sum of supplier costs + minimum margin
```

---

## Section 7 — Data Model & Schema Design

### 7.1 DynamoDB Tables

#### 7.1.1 Packages Table

```
Table: packages-{stage}
  PK: PACKAGE#{packageId}
  SK: META

  Attributes:
    packageId: string (UUID)
    requestId: string
    userId: string
    components: PackageComponent[] (JSON)
    bundlePrice: BundlePricingOutput (JSON)
    compatibility: PackageCompatibility (JSON)
    phase: 'composed' | 'holding' | 'held' | 'confirming' | 'confirmed' | 'failed' | 'cancelled'
    sagaId: string | null
    createdAt: string (ISO 8601)
    updatedAt: string (ISO 8601)
    ttl: number (epoch seconds)

  GSI: GSI_User_Packages
    PK: USER#{userId}
    SK: createdAt
```

#### 7.1.2 Package Holds Table

```
Table: package-holds-{stage}
  PK: PACKAGE#{packageId}
  SK: HOLD#{module}#{supplier}

  Attributes:
    holdId: string (UUID)
    module: OperationModule
    supplier: string
    supplierHoldReference: string
    status: 'pending' | 'held' | 'expired' | 'released' | 'confirmed'
    expiresAt: string (ISO 8601)
    compensationPayload: JSON
    createdAt: string
    updatedAt: string
    ttl: number
```

#### 7.1.3 Saga State Table

```
Table: saga-state-{stage}
  PK: SAGA#{sagaId}
  SK: META

  Attributes:
    sagaId: string (UUID)
    packageId: string
    status: 'running' | 'completed' | 'compensating' | 'failed'
    steps: SagaStep[] (JSON)
    currentStepIndex: number
    createdAt: string
    updatedAt: string
    ttl: number

  Additional items per step:
  PK: SAGA#{sagaId}
  SK: STEP#{stepId}

  Attributes:
    stepId: string
    module: OperationModule
    operation: Operation
    supplier: string
    status: SagaStep['status']
    result: JSON | null
    compensationAction: CompensationAction | null
    executedAt: string | null
    compensatedAt: string | null
```

#### 7.1.4 Pricing Rules Table

```
Table: pricing-rules-{stage}
  PK: RULE#{ruleId}
  SK: META

  Attributes:
    ruleId: string (UUID)
    name: string
    type: string
    scope: JSON
    value: number
    valueType: string
    priority: number
    active: boolean
    validFrom: string
    validUntil: string
    createdBy: string
    createdAt: string
    updatedAt: string

  GSI: GSI_Active_Rules
    PK: ACTIVE#true
    SK: priority (number, descending)
```

#### 7.1.5 Package Templates Table

```
Table: package-templates-{stage}
  PK: TEMPLATE#{templateId}
  SK: META

  Attributes:
    templateId: string (UUID)
    name: string
    description: string
    destination: string
    components: JSON
    pricingRuleIds: string[]
    active: boolean
    createdBy: string
    createdAt: string
    updatedAt: string

  GSI: GSI_Destination_Templates
    PK: DEST#{destination}
    SK: name
```

### 7.2 Redis Cache Keys

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `pkg:search:{sha256(params)}` | 180s | Package search result cache |
| `pkg:compose:{packageId}` | 900s (15 min) | Composed package (pre-hold) |
| `pkg:hold:{packageId}` | hold duration | Active hold state |
| `fx:rates:{baseCurrency}` | 3600s (1 hour) | Exchange rates |
| `pkg:template:{templateId}` | 3600s | Cached package template |
| `pkg:rules:active` | 300s (5 min) | Active pricing rules (denormalized) |
| `demand:{route}:{date}` | 3600s | Route demand level for yield |

### 7.3 Offer Map Extension

The existing offer map (`OfferMap` in the orchestrator) maps middleware UUIDs to supplier-native IDs. For the DPE, the offer map must also store:

- Hotel offer IDs (Duffel Stays quote IDs, Hotelbeds rate keys)
- Activity offer IDs (Viator product codes + option codes)
- Transfer offer IDs
- Insurance quote IDs

The offer map uses the same DynamoDB pattern as existing flight offers:

```
PK: OFFER#{middlewareOfferId}
SK: MAP

Attributes:
  module: OperationModule
  supplier: string
  supplierOfferId: string
  supplierMetadata: JSON (search key, session context, etc.)
  expiresAt: string
  ttl: number
```

---

## Section 7A — Backwards Compatibility and Migration

### 7A.1 Coexistence with Existing Flows

The DPE introduces new API endpoints, handlers, and state management alongside the existing flight, hotel, and activity flows. Both systems must coexist without interference during the phased rollout.

**Coexistence principles:**

1. **Additive, not replacement.** All existing endpoints (`/api/flights/search`, `/api/hotels/search`, `/api/activities/search`) continue to function unchanged. Package endpoints are new paths (`/api/packages/*`).
2. **Shared infrastructure.** DPE reuses existing connectors (`ProvesioFlightConnector`, `DuffelFlightConnector`), the orchestrator, the curation engine, and the request store. No duplication of connector logic.
3. **Separate state.** Package state (DynamoDB `packages-{stage}`, `package-holds-{stage}`, `saga-state-{stage}`) uses new tables. Existing tables (`flight-booking-{stage}`, `offer-viewing-{stage}`) are untouched.
4. **Feature flag gating.** Package-related UI and API routes are gated behind a `feature_flags.packages_enabled` flag in `org_settings`. When disabled, package endpoints return `501 Not Implemented` and the frontend hides the Packages nav item.

### 7A.2 Frontend Migration Path

The frontend has independent pages per vertical (`FlightsPage`, `HotelsPage`, `SightseeingPage`). The DPE adds `PackagesPage` alongside them.

**Migration stages:**

| Stage | Behavior | Nav State |
|-------|----------|-----------|
| Pre-DPE (current) | Flights, Hotels, Sightseeing pages work independently | No "Packages" nav item |
| Phase 1 | Packages nav item appears (feature flag). PackagesPage shows Step 1-2 (flight + hotel only) | "Packages (Beta)" badge |
| Phase 2 | Full wizard (Steps 1-7). Individual pages still work independently | "Packages" nav item |
| Phase 3 | Cross-sell triggers on individual pages ("Add to package?"). Chatbot gains package tools | Full integration |
| Steady state | Individual pages and Packages page coexist permanently | Both available |

**Key constraint:** Individual booking flows (book a flight only, book a hotel only) must never be disrupted. The DPE is an additive feature, not a replacement for standalone bookings.

### 7A.3 Cart and Session Continuity

The existing system has no unified cart. Each vertical manages its own selection state:

- Flights: Selected offer stored in flight search hook state
- Hotels: Selected hotel in hotel search hook state
- Sightseeing: Selected activities in sightseeing hook state

The DPE introduces `usePackageStore` (Zustand) as a unified cart for package flows. This store is independent of the per-vertical hooks.

**Session continuity rules:**

1. **No cross-contamination.** Selecting a flight on `FlightsPage` does not affect `usePackageStore`. Selecting a flight inside the Package wizard does not affect `useFlightSearch`.
2. **Import, not share.** If a user starts on `FlightsPage`, selects a flight, then navigates to Packages, the package wizard offers "Import your selected flight?" — copying the offer into `usePackageStore` as a one-time action.
3. **TTL alignment.** Package session state in `usePackageStore` respects offer TTL. If a flight offer expires while the user is selecting hotels, the wizard shows a re-search prompt for that component.
4. **Browser persistence.** `usePackageStore` uses Zustand `persist` middleware with `sessionStorage` (not `localStorage`) — package state does not survive tab close. This prevents stale package sessions from confusing users.

### 7A.4 Chatbot Tool Coexistence

The chatbot currently has 5 tool sets: `flightTools`, `hotelTools`, `transportTools`, `supportTools`, and a system prompt. Adding `packageTools` brings the total to **6 tool sets**.

**Implications:**

1. **Tool count limit.** OpenAI GPT-4o supports up to 128 tools per request, so 6 tool sets is well within limits. However, each additional tool increases prompt token consumption. The current 5-round tool-calling conversation limit should be monitored — package searches may require more rounds (search → compose → status).
2. **Tool routing.** The chatbot's intent detection must distinguish between:
   - "Search flights to Dubai" → `flightTools.searchFlights`
   - "Plan a trip to Dubai" → `packageTools.searchPackages`
   - "Book a package" → `packageTools.composePackage`
3. **Fallback behavior.** If `packages_enabled` feature flag is off, `packageTools` is not registered in the tool list. The chatbot responds: "Package booking is coming soon! For now, I can help you book flights, hotels, or activities individually."
4. **System prompt update.** The chatbot system prompt must be updated to mention package capabilities and guide users toward package flows when their intent suggests multi-component travel.

### 7A.5 API Versioning

The middleware API does not currently use explicit versioning (no `/v1/` prefix). The DPE does not introduce versioning either — package endpoints are new paths, not modifications to existing ones.

**Versioning strategy:**

1. **No breaking changes.** Existing endpoint contracts are frozen. Field additions are backwards-compatible (new optional fields only).
2. **Package endpoints are unversioned.** `/api/packages/search` is the canonical path. If breaking changes are needed in the future, introduce `/api/v2/packages/search` at that time.
3. **Response shape stability.** All package response types include a `version?: string` field (not currently set). If response shapes need to diverge in the future, this field enables client-side handling.
4. **Supplier connector interface stability.** The `SupplierConnector` interface uses optional methods (`searchActivities?`, `quoteInsurance?`). New capabilities are additive — existing connectors do not need modification.

---

## Section 8 — Supplier Integration Specifications

### 8.1 Viator Partner API (Activities)

**Authentication:** API key header (`exp-api-key`)

**Base URL:** `https://api.viator.com/partner`

**Rate Limits:** 150 requests per 10 seconds

**Key Endpoints:**

| Operation | Method | Path | Purpose |
|-----------|--------|------|---------|
| Search | POST | `/products/search` | Search for activities at a destination |
| Details | GET | `/products/{productCode}` | Get full product details |
| Availability | POST | `/availability/check` | Check date/time availability |
| Pricing | POST | `/availability/check` | Pricing included in availability response |
| Hold | POST | `/carts` | Add to cart (implicit hold) |
| Book | POST | `/bookings/book` | Confirm booking from cart |
| Cancel | POST | `/bookings/{bookingRef}/cancel` | Cancel a booking |

**Booking flow:**

```
1. Search products → select product
2. Check availability for specific date/pax → get bookableItems with pricing
3. Add to cart (creates implicit hold)
4. Confirm booking with traveler details + payment
```

**Commission model:** Viator pays 8-12% commission on net rates. The middleware receives net rates and marks up per admin rules.

**UAE inventory (key destination IDs):**
- Dubai: `d828`
- Abu Dhabi: `d4474`
- Sharjah: `d25614`
- Ras Al Khaimah: `d26028`

**Connector implementation pattern:**

```typescript
export class ViatorActivityConnector implements SupplierConnector {
  readonly name = 'viator';
  readonly capabilities: SupplierCapability[] = [
    'activity_search', 'activity_book', 'activity_details', 'activity_availability',
  ];
  readonly auth: SupplierAuth; // ApiKeyAuth with exp-api-key header

  async searchActivities(request: ActivitySearchRequest): Promise<SupplierActivityResult> {
    // POST /products/search with destination, date range, category filters
    // Normalize response to NormalizedActivityOffer[]
  }

  async getActivityDetails(productCode: string): Promise<NormalizedActivityOffer | null> {
    // GET /products/{productCode}
    // Normalize to NormalizedActivityOffer
  }

  async checkActivityAvailability(request: ActivityAvailabilityRequest): Promise<ActivityAvailability> {
    // POST /availability/check with productCode, travelDate, paxMix
    // Returns available time slots with pricing
  }

  async bookActivity(request: ActivityBookRequest): Promise<BookingReference> {
    // POST /carts (hold) → POST /bookings/book (confirm)
    // Returns BookingReference
  }
}
```

### 8.2 Duffel Stays API (Hotels)

**Authentication:** Bearer token (reuses existing `DuffelBearerAuth` from flights)

**Base URL:** `https://api.duffel.com`

**Rate Limits:** 60 requests per 60 seconds

**Key Endpoints:**

| Operation | Method | Path | Purpose |
|-----------|--------|------|---------|
| Search | POST | `/stays/search` | Search for hotels |
| Fetch rates | GET | `/stays/search_results/{id}/rates` | Get all room rates |
| Quote | POST | `/stays/quotes` | Lock in a rate (price guarantee) |
| Book | POST | `/stays/bookings` | Confirm booking |
| Cancel | POST | `/stays/bookings/{id}/actions/cancel` | Cancel booking |

**Booking flow (4-step):**

```
1. POST /stays/search → search_result_id
2. GET /stays/search_results/{id}/rates → paginated room rates
3. POST /stays/quotes → quote with guaranteed price (30-min validity)
4. POST /stays/bookings → confirmed booking with reference
```

**Data model notes:**
- Search returns `accommodation` objects with basic info
- Rates are fetched separately (may require pagination)
- Quote step locks the price — acts as an implicit hold
- Booking is the final confirmation

**Connector implementation pattern:**

```typescript
export class DuffelStaysConnector implements SupplierConnector {
  readonly name = 'duffel_stays';
  readonly capabilities: SupplierCapability[] = [
    'hotel_search', 'hotel_book', 'hotel_details', 'hotel_rate_fetch', 'hotel_quote',
  ];
  readonly auth: SupplierAuth; // Reuse DuffelBearerAuth

  async searchHotels(request: HotelSearchRequest): Promise<SupplierHotelResult> {
    // POST /stays/search
    // Then GET /stays/search_results/{id}/rates for each result
    // Normalize to NormalizedHotelOffer[]
  }

  async getHotelDetails(hotelId: string): Promise<NormalizedHotelOffer | null> {
    // No dedicated endpoint — use search with specific property filter
  }

  async bookHotel(offerId: string, guestDetails: Record<string, unknown>): Promise<BookingReference> {
    // POST /stays/quotes (lock rate) → POST /stays/bookings (confirm)
    // Returns BookingReference
  }
}
```

### 8.3 Hotelbeds API (Hotels)

**Authentication:** HMAC — `SHA256(apiKey + secret + epoch)` per request

**Base URL:** `https://api.test.hotelbeds.com/hotel-api/1.0` (test), `https://api.hotelbeds.com/hotel-api/1.0` (prod)

**Rate Limits:** Varies by plan (typically 100-300 req/s)

**Key Endpoints:**

| Operation | Method | Path | Purpose |
|-----------|--------|------|---------|
| Search | POST | `/hotels` | Availability search |
| Details | GET | `/hotels/{hotelCode}/details` | Hotel content/details |
| Rate check | POST | `/checkrates` | Verify rate is still available |
| Book | POST | `/bookings` | Confirm booking |
| Cancel | DELETE | `/bookings/{reference}` | Cancel booking |

**Existing state:** The legacy service `alrais-hotel-beds-availability` already calls the Hotelbeds API. The middleware connector should wrap or replace this service.

**HmacAuth implementation:**

```typescript
export class HotelbedsHmacAuth implements SupplierAuth {
  readonly type = 'hmac';

  async getHeaders(): Promise<Record<string, string>> {
    const epoch = Math.floor(Date.now() / 1000);
    const signature = createHash('sha256')
      .update(this.apiKey + this.secret + epoch)
      .digest('hex');
    return {
      'Api-key': this.apiKey,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }
}
```

### 8.4 Provesio (Flights — Existing)

Already implemented via `ProvesioFlightConnector` + `LegacyApiAuth`. The strangler pattern wraps the legacy `flight-search` Lambda.

**Key limitations for DPE:**
- Hold duration is extremely short (5 minutes for prov-booking)
- Async fetch pattern adds latency (polling required)
- Session is a shared singleton (not per-request)
- No hotel or activity capabilities — flights only

### 8.5 Duffel (Flights — Existing)

Already implemented via `DuffelFlightConnector` + `DuffelBearerAuth`.

**Key advantages for DPE:**
- Offer-based pricing (price locked until `expires_at`)
- Direct booking without hold step (or create order with `pending` payment)
- Same auth token works for Stays

### 8.6 Insurance Suppliers (Supplier TBD — Architecture Ready)

No specific insurance supplier is committed. The connector interface and canonical types (`NormalizedInsuranceQuote`, `insurance_quote`/`insurance_book` capabilities) are designed to accommodate any compliant travel insurance API. Supplier selection is a Phase 4 deliverable.

**Candidates to evaluate:**

| Supplier | API Style | Auth | Coverage Types | Commission Model | Notes |
|----------|-----------|------|---------------|-----------------|-------|
| AXA Travel Insurance | REST | API Key | Basic, Standard, Comprehensive | 20-30% affiliate commission | Strong UAE/GCC presence |
| Allianz Partners | REST | OAuth 2.0 | Medical, Trip Cancel, Baggage | 25-35% affiliate commission | Global leader, multi-language |
| World Nomads | REST | API Key | Adventure, Standard, Explorer | 20-28% affiliate commission | Popular for adventure travel |
| AIG Travel Guard | REST | API Key + HMAC | Basic, Gold, Platinum | 25-40% affiliate commission | Multi-tier products |

**Selection criteria (for Phase 4 evaluation):**

1. **UAE regulatory compliance** — Must be licensed or partnered with a UAE-licensed insurer (UAE Insurance Authority)
2. **API maturity** — RESTful, sandbox environment, webhook support for claim status
3. **Commission rate** — Target 20-40% of premium (insurance is the highest-margin package component)
4. **Product flexibility** — Must support per-trip quoting based on destination, duration, passenger ages, and trip cost
5. **Cancellation integration** — API must support policy cancellation with refund during cooling-off period (14 days)
6. **Multi-currency** — Must quote in AED and USD at minimum

**Connector pattern (architecture-ready):**

```typescript
export class InsuranceConnector implements SupplierConnector {
  readonly name = 'tbd_insurance';     // Replaced at supplier selection
  readonly capabilities: SupplierCapability[] = [
    'insurance_quote', 'insurance_book',
  ];
  readonly auth: SupplierAuth;         // Auth type depends on supplier

  async quoteInsurance(request: InsuranceQuoteRequest): Promise<NormalizedInsuranceQuote[]> {
    // POST /quotes with trip details, passenger info, coverage level
    // Normalize response to NormalizedInsuranceQuote[]
  }

  async bookInsurance(request: InsuranceBookRequest): Promise<BookingReference> {
    // POST /policies with quote ID, passenger details, payment
    // Returns BookingReference with policy number
  }
}
```

**Commercial model:** Insurance operates on an affiliate commission model. Unlike other components where the middleware marks up a net price, insurance suppliers pay commission on the gross premium. The middleware receives 20-40% of the premium as commission, which makes insurance the highest-margin component in the bundle. This margin is important for yield management — insurance commission can subsidize bundle discounts on lower-margin components (flights at 3%, transfers at 8%).

### 8.7 Supplier Comparison Matrix

| Capability | Provesio | Duffel Flights | Duffel Stays | Hotelbeds | Viator | Insurance (TBD) |
|-----------|----------|---------------|-------------|-----------|--------|----------------|
| Auth type | Session (legacy) | Bearer | Bearer | HMAC | API Key | TBD |
| Rate limit | Unknown | 100/s | 60/60s | 100-300/s | 150/10s | TBD |
| Hold support | Yes (5 min) | Implicit (offer expiry) | Quote (30 min) | Until cancel deadline | Cart hold | N/A (instant) |
| Async booking | Yes (fetchUrl) | No (sync) | No (sync) | No (sync) | No (sync) | No (sync) |
| Cancellation | Via legacy | API call | API call | DELETE | API call | API call |
| Commission model | B2B negotiated | Markup on published | Markup on published | Net rate + markup | Net rate + 8-12% | Affiliate 20-40% |
| Currency | AED (mostly) | Variable | Variable | EUR/variable | Variable | TBD |
| Existing connector | Yes | Yes | No | No | No | No |

---

## Section 9 — Recommendation & Curation Engine Extension

### 9.1 Overview

The recommendation engine extends the existing curation system to:
1. Curate individual component results (flights, hotels, activities) using weighted rules
2. Score and rank package combinations
3. Provide personalized recommendations based on user behavior data

### 9.2 Component-Level Curation Extension

The existing flight curation engine (7 rules, `src/curation/engine.ts`) is the template. Each new module gets its own rule set:

#### 9.2.1 Hotel Curation Rules

| Rule | Weight | Scoring Logic |
|------|--------|--------------|
| Price | 0.25 | Cheapest room rate normalized 0-1 |
| Star Rating | 0.20 | (starRating - minStars) / (maxStars - minStars) |
| Location | 0.20 | Inverse of distance from city center or airport |
| Review Score | 0.15 | reviewScore / 5.0 |
| Board Basis | 0.10 | breakfast > room_only > half_board (depends on trip type) |
| Cancellation | 0.10 | Free cancellation scores 1.0, non-refundable scores 0.2 |

#### 9.2.2 Activity Curation Rules

| Rule | Weight | Scoring Logic |
|------|--------|--------------|
| Review Score | 0.30 | reviewScore / 5.0 |
| Price | 0.20 | Cheapest normalized 0-1 |
| Category Match | 0.20 | Match against user's trip type preferences |
| Duration Fit | 0.15 | Penalize activities that are too long for remaining trip time |
| Availability | 0.15 | More available time slots score higher |

#### 9.2.3 Package-Level Curation Rules

For scoring complete packages:

| Rule | Weight | Scoring Logic |
|------|--------|--------------|
| Total Price | 0.25 | Bundle price normalized across candidate packages |
| Component Quality | 0.20 | Average of individual component curation scores |
| Schedule Coherence | 0.20 | Penalize tight connections, early check-ins, activity gaps |
| Savings | 0.15 | Bundle discount % (higher is better) |
| Flexibility | 0.10 | Free cancellation components score higher |
| Supplier Diversity | 0.10 | Slight preference for fewer suppliers (simpler cancellation) |

### 9.3 Recommendation Maturity Levels

The recommendation engine matures through 4 levels:

#### Level 1: Popularity-Based (v1)

- Rank activities by booking volume at the destination
- Rank hotels by review count + score
- No personalization — same recommendations for all users

**Data source:** Viator review counts, Hotelbeds popularity scores

#### Level 2: Rule-Based Scoring (v1)

- Use the curation rules above to score and rank
- User context (family, business, adventure) adjusts weights
- Template-based bundles for popular destinations

**Data source:** Trip type from search params, user context from `UserContext`

#### Level 3: Collaborative Filtering (Phase 2)

- "Users who booked this flight also booked these hotels/activities"
- Cosine similarity on user attributes (nationality, booking history, season)
- Co-occurrence matrix: `P(activity | destination, hotel_category)`

**Data source:** Booking history across all users (DynamoDB scan)

**Implementation approach:**

```typescript
interface CoOccurrenceEntry {
  destination: string;
  componentA: { module: OperationModule; id: string };
  componentB: { module: OperationModule; id: string };
  coOccurrenceCount: number;
  confidence: number;    // P(B|A) = co-occurrence / A-count
}
```

1. Build co-occurrence matrix from booking history (batch job, weekly)
2. Store in DynamoDB or S3 (Parquet for large datasets)
3. At recommendation time, look up co-occurrences for selected components
4. Boost co-occurring components in curation scoring

#### Level 4: ML-Based (Phase 3)

- Neural collaborative filtering or transformer-based recommendations
- Requires significant booking volume (>10K packages)
- SageMaker or Bedrock for model hosting
- Out of scope for this PRD — mentioned for roadmap context only

### 9.4 Cross-Sell and Upsell Triggers

| Trigger | When | Recommendation |
|---------|------|---------------|
| Flight booked | Post-booking confirmation | "Add a hotel in {destination}?" |
| Hotel booked | Post-booking confirmation | "Add activities in {city}?" |
| Flight + hotel selected | Package composition step 4 | "Popular activities at {destination}" |
| Cart review | Before payment | "Add travel insurance for {price}?" |
| Chatbot intent | User mentions destination | Top 3 curated packages |
| Return visit | User revisits within 24h | Show saved package drafts |

---

## Section 10 — Cost Model and Unit Economics

### 10.1 Per-Booking Cost Breakdown

Each package booking incurs infrastructure costs across multiple AWS services. This section models the cost per booking at three volume tiers.

**Cost components per package booking:**

| Resource | Operation | Unit Cost (us-east-1) | Invocations per Booking | Cost per Booking |
|----------|-----------|----------------------|------------------------|-----------------|
| Lambda (handlers) | Package search, compose, hold, confirm, status | $0.20 / 1M requests + compute | ~8 invocations | ~$0.0002 |
| Lambda (workers) | Supplier worker per component (fan-out) | $0.20 / 1M + compute (~500ms avg) | ~12 invocations (3-5 components × search + hold + confirm) | ~$0.0005 |
| DynamoDB (reads) | Package state, offer map, pricing rules | $0.25 / 1M RRU | ~30 reads | ~$0.000008 |
| DynamoDB (writes) | Package record, hold records, saga state | $1.25 / 1M WRU | ~15 writes | ~$0.000019 |
| Step Functions | Saga state transitions (hold + confirm) | $25 / 1M transitions | ~20 transitions | ~$0.0005 |
| SQS | Supplier messages (FIFO) | $0.50 / 1M requests | ~15 messages | ~$0.000008 |
| Redis (ElastiCache) | Offer cache, FX rates, pricing rules | ~$0.068/hr (cache.t3.micro) | Amortized | ~$0.001 (at 1K bookings/month) |
| API Gateway | REST API requests | $3.50 / 1M | ~10 requests | ~$0.000035 |
| Supplier API calls | External HTTP calls | Free (no AWS cost) | ~12 calls | $0 (but subject to supplier rate limits) |
| CloudWatch | Logs + custom metrics | $0.50/GB ingested | ~2KB per booking | ~$0.000001 |

**Estimated cost per booking: ~$0.002 (excluding Redis amortization)**

### 10.2 Volume Tier Projections

| Metric | Tier 1: 100 bookings/month | Tier 2: 1,000 bookings/month | Tier 3: 10,000 bookings/month |
|--------|---------------------------|------------------------------|-------------------------------|
| **Searches (est. 20:1 ratio)** | 2,000 | 20,000 | 200,000 |
| Lambda compute | $0.15 | $1.50 | $15.00 |
| DynamoDB (on-demand) | $0.05 | $0.50 | $5.00 |
| Step Functions | $0.04 | $0.40 | $4.00 |
| SQS (FIFO) | $0.02 | $0.15 | $1.50 |
| Redis (ElastiCache) | $49.00 (t3.micro) | $49.00 (t3.micro) | $98.00 (t3.small) |
| API Gateway | $0.07 | $0.70 | $7.00 |
| CloudWatch | $1.00 | $5.00 | $25.00 |
| **Total infra/month** | **~$50** | **~$57** | **~$156** |
| **Cost per booking** | **$0.50** | **$0.06** | **$0.016** |

**Key insight:** At low volumes (Tier 1), Redis dominates cost — it's a fixed baseline regardless of usage. At scale (Tier 3), cost per booking drops to ~$0.016. The system is cost-efficient at any volume tier.

### 10.3 Margin Floor Implications

The minimum margin floor (`minimumMarginPercent` in `BundlePricingRules`) must cover infrastructure costs plus a contribution margin.

| Average Package Value (AED) | Min Margin (2%) | Infra Cost (Tier 2) | Remaining Margin | Viable? |
|-----------------------------|-----------------|---------------------|-----------------|---------|
| 500 | 10.00 | 0.22 | 9.78 | Yes |
| 2,000 | 40.00 | 0.22 | 39.78 | Yes |
| 10,000 | 200.00 | 0.22 | 199.78 | Yes |

Infrastructure cost is negligible relative to package value. The margin floor is driven by business economics (commission structure, supplier agreements), not infrastructure costs.

**Insurance contribution to margin:** Insurance operates on an affiliate commission model. At 15% default margin on a typical AED 150 premium:

| Volume Tier | Insurance Revenue / Booking | Insurance as % of Total Margin |
|-------------|---------------------------|-------------------------------|
| Avg package AED 2,000, 5% overall margin | AED 22.50 insurance commission | 22.5% of AED 100 total margin |
| Avg package AED 5,000, 4% overall margin | AED 22.50 insurance commission | 11.3% of AED 200 total margin |

Insurance margin is a significant contributor — it subsidizes lower margins on flights and transfers, making aggressive bundle discounts viable.

### 10.4 Optimization Opportunities

| Opportunity | Estimated Savings | Implementation Effort | Phase |
|-------------|------------------|-----------------------|-------|
| **DynamoDB reserved capacity** | 50-75% on reads/writes | Low (billing change) | Tier 2+ |
| **Lambda reserved concurrency** | Reduced cold starts, consistent latency | Low | Phase 2 |
| **Redis result caching** | Reduce supplier API calls by 30-40% | Medium (cache invalidation logic) | Phase 1 |
| **Step Functions Express** | 80% cost reduction vs. Standard ($1 vs. $25/1M) | Medium (max 5-min execution) | Phase 2 |
| **SQS Standard (non-FIFO)** | 60% cost reduction | Low (if ordering not critical for search) | Phase 1 |
| **Supplier response caching** | Reduce fan-out calls for identical searches | Medium (TTL management, stale detection) | Phase 1 |
| **DynamoDB auto-scaling** | Right-size provisioned capacity | Low | Tier 3 |

**Recommended Phase 1 optimization:** Switch Step Functions to Express Workflows for the hold/confirm saga (execution completes within 5 minutes). This reduces per-transition cost from $25/1M to ~$1/1M — an 80% savings on the second-largest cost component.

---

## Section 11 — Implementation Roadmap & Phasing

### 11.1 Phase 1: Foundation (Connectors + Pricing)

**Goal:** Get hotel and activity inventory flowing through the middleware with real pricing.

| # | Task | Files | Dependencies |
|---|------|-------|-------------|
| 1 | Implement `DuffelStaysConnector` | `src/connectors/duffel/stays.ts` | Existing `DuffelBearerAuth` |
| 2 | Implement `ViatorActivityConnector` | `src/connectors/viator/activities.ts` | New `ApiKeyAuth` |
| 3 | Add canonical types for activities, transfers, insurance | `src/types/canonical.ts` | None |
| 4 | Add request/response types for new modules | `src/types/requests.ts`, `src/types/responses.ts` | Task 3 |
| 5 | Extend `SupplierCapability` type and connector interface | `src/types/supplier.ts` | Task 3 |
| 6 | Extend `ModuleOperationMap` with hotel/activity operations | `src/types/queue.ts` | Task 4, 5 |
| 7 | Implement `BundlePricingEngine` (replace stub) | `src/pricing/bundle-pricing.ts` | None |
| 8 | Implement currency conversion service | `src/pricing/currency.ts` | Open Exchange Rates API |
| 9 | Add hotel search handler | `src/handlers/hotel-search.ts` | Task 1 |
| 10 | Add activity search handler | `src/handlers/activity-search.ts` | Task 2 |
| 11 | Add hotel curation rules | `src/curation/hotel-rules.ts` | Task 3 |
| 12 | Add activity curation rules | `src/curation/activity-rules.ts` | Task 3 |
| 13 | Tests: connector unit tests, pricing tests, curation tests | `src/__tests__/` | All above |

**Exit criteria:** Hotel search and activity search return curated results through the middleware API. Bundle pricing produces correct breakdowns with margins and currency conversion.

### 11.2 Phase 2: Package Composition + Saga

**Goal:** Enable package creation, coordinated holds, and saga-based booking.

| # | Task | Files | Dependencies |
|---|------|-------|-------------|
| 14 | Implement composition engine (compatibility validation) | `src/orchestrator/composition.ts` | Phase 1 |
| 15 | Implement `SagaOrchestrator` runtime (DynamoDB state machine) | `src/orchestrator/saga-orchestrator.ts` | Existing saga types |
| 16 | Add Step Functions definition (IaC) | `infra/step-functions/package-booking.asl.json` | Task 15 |
| 17 | Add package search handler | `src/handlers/package-search.ts` | Task 14 |
| 18 | Add package compose handler | `src/handlers/package-compose.ts` | Task 14, 7 |
| 19 | Add package hold handler | `src/handlers/package-hold.ts` | Task 15, 16 |
| 20 | Add package confirm handler | `src/handlers/package-confirm.ts` | Task 15, 16 |
| 21 | Add package status handler | `src/handlers/package-status.ts` | Task 15 |
| 22 | DynamoDB tables: packages, package-holds, saga-state | IaC / serverless.yml | None |
| 23 | Add hold expiry management (TTL + auto-compensation) | `src/workers/hold-expiry-worker.ts` | Task 15 |
| 24 | Package-specific error codes in worker-errors | `src/types/worker-errors.ts` | None |
| 25 | Tests: composition, saga, hold/confirm flows | `src/__tests__/` | All above |

**Exit criteria:** End-to-end package booking flow works: search → compose → hold → confirm, with saga compensation on failure.

### 11.3 Phase 3: Admin + Chatbot + Frontend

**Goal:** Admin configuration UI, chatbot package tools, and frontend package builder.

| # | Task | Files | Dependencies |
|---|------|-------|-------------|
| 26 | Admin pricing rules API | `src/handlers/admin/pricing-rules.ts` | Phase 1 (pricing engine) |
| 27 | Admin package templates API | `src/handlers/admin/package-templates.ts` | Phase 2 |
| 28 | Admin yield config API | `src/handlers/admin/yield-config.ts` | Phase 1 (pricing engine) |
| 29 | Admin supplier priority API | `src/handlers/admin/supplier-priorities.ts` | None |
| 30 | Chatbot package tools | `al-rais-chatbot/tools/packageTools.ts` | Phase 2 API |
| 31 | Frontend: PackageBuilder wizard | `PackagesPage.tsx` + components | Phase 2 API |
| 32 | Frontend: Package store (Zustand) | `src/store/usePackageStore.tsx` | Phase 2 API |
| 33 | Frontend: Bundle pricing display | `src/components/molecules/BundlePriceCard.tsx` | Phase 1 pricing |
| 34 | Tests: admin API, chatbot tools | `src/__tests__/` | All above |

**Exit criteria:** Admins can configure pricing rules and templates. Chatbot can search and present packages. Frontend wizard enables end-to-end package booking.

### 11.4 Phase 4: Recommendation + Optimization

**Goal:** Personalized recommendations, collaborative filtering, and performance optimization.

| # | Task | Files | Dependencies |
|---|------|-------|-------------|
| 35 | Package-level curation rules | `src/curation/package-rules.ts` | Phase 2 |
| 36 | Co-occurrence matrix builder (batch) | `src/workers/recommendation-batch.ts` | Booking data |
| 37 | Cross-sell triggers | `src/handlers/recommendations.ts` | Task 36 |
| 38 | Response caching for hotel/activity results | `src/cache/` | Phase 1 connectors |
| 39 | Performance optimization (parallel fan-out tuning) | `src/orchestrator/` | All phases |
| 40 | Hotelbeds connector (second hotel supplier) | `src/connectors/hotelbeds/` | Hotelbeds API access |
| 41 | Transfer connector (TBD supplier) | `src/connectors/transfers/` | Supplier selection |
| 42 | Insurance connector (TBD supplier) | `src/connectors/insurance/` | Supplier selection |

**Exit criteria:** Recommendation engine provides personalized package suggestions. Multi-supplier hotel search (Duffel Stays + Hotelbeds) with deduplication. Performance meets SLA (<3s for package search).

### 11.5 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Package search latency (p95) | <3000ms | Fan-out to 3-4 suppliers in parallel |
| Package compose latency (p95) | <500ms | DynamoDB reads + pricing calculation |
| Package hold latency (p95) | <5000ms | Sequential holds across suppliers |
| Package confirm latency (p95) | <8000ms | Parallel confirmations |
| Package search availability | 99.5% | Partial results acceptable (degrade gracefully) |
| Saga compensation success rate | 99.9% | Dead letter for manual intervention |

### 11.6 Testing Strategy

| Level | Coverage Target | Focus |
|-------|----------------|-------|
| Unit tests (connectors) | >90% | API call mocking, response normalization, error handling |
| Unit tests (pricing) | >95% | Margin calculation, currency conversion, yield rules |
| Unit tests (composition) | >90% | Compatibility validation rules |
| Integration tests (saga) | >85% | Hold/confirm sequences, compensation flows |
| Contract tests (supplier APIs) | Per connector | Response shape validation against real API samples |
| E2E tests (API) | Happy paths | Full package search → compose → hold → confirm |

### 11.7 Observability

| Signal | Implementation |
|--------|---------------|
| Structured logging | Extend existing `logger` with package-specific context fields |
| Correlation ID | Thread `correlationId` from package-search through all component operations |
| Saga tracing | Log saga state transitions with `sagaId` + `stepId` |
| Metrics (CloudWatch) | Package search latency, hold success rate, saga compensation rate, supplier error rates |
| Alerts | Saga compensation failure → PagerDuty/Slack |
| Dashboard | Package booking funnel (search → compose → hold → confirm → complete) |

---

## Appendix A — Audit Cross-Reference Table

This table maps every DPE requirement to existing codebase artifacts and identifies gaps.

| Requirement | Existing Artifact | File Path | Status | Gap |
|-------------|------------------|-----------|--------|-----|
| Multi-supplier fan-out | `Orchestrator` | `src/orchestrator/orchestrator.ts` | Implemented | Extend for hotel/activity modules |
| Canonical flight model | `NormalizedFlightOffer` | `src/types/canonical.ts:93` | Implemented | None |
| Canonical hotel model | `NormalizedHotelOffer` | `src/types/canonical.ts:134` | Implemented | Extend with DPE-specific fields |
| Canonical activity model | — | — | **Missing** | Create `NormalizedActivityOffer` |
| Canonical transfer model | — | — | **Missing** | Create `NormalizedTransferOffer` |
| Canonical insurance model | — | — | **Missing** | Create `NormalizedInsuranceQuote` |
| Canonical package model | — | — | **Missing** | Create `NormalizedPackageOffer` |
| Supplier connector interface | `SupplierConnector` | `src/types/supplier.ts:94` | Implemented | Extend with activity/transfer/insurance methods |
| Supplier capabilities enum | `SupplierCapability` | `src/types/supplier.ts:19` | Implemented | Add new capabilities |
| Operation taxonomy | `OperationModule`, `Operation` | `src/types/queue.ts:20-38` | Implemented | Modules already include `activity`, `transfer`, `insurance`, `package` |
| Package operations | `PackageOperation` | `src/types/queue.ts:31-36` | Implemented | Types exist, workers return `unsupported` |
| Package context | `PackageContext` | `src/types/queue.ts:168` | Designed-in | Ready for runtime use |
| Pricing rules | `PricingRules` | `src/types/queue.ts:176` | Designed-in | Ready for runtime use |
| Pricing engine interface | `PricingEngine` | `src/pricing/stub.ts:39` | **Stub** | Replace with `BundlePricingEngine` |
| Pricing engine impl | `PassthroughPricingEngine` | `src/pricing/stub.ts:47` | **Stub** | Replace with real implementation |
| Flight curation rules | `CurationRule[]` | `src/types/curation.ts` | Implemented (7 rules) | Template for hotel/activity rules |
| Curation result shape | `CurationResult` | `src/types/curation.ts:89` | Implemented | Extend for packages |
| User context | `UserContext` | `src/types/curation.ts:56` | Implemented | Extend with package preferences |
| Saga types | `SagaStep`, `SagaDefinition`, `ISagaOrchestrator` | `src/types/saga.ts` | **Types only** | Implement runtime |
| Compensation map | `COMPENSATION_MAP` | `src/types/saga.ts:71` | Implemented | Ready for use |
| Error taxonomy | `WORKER_ERROR_CODES` | `src/types/worker-errors.ts` | Implemented (16 codes) | Add package-specific codes |
| Error classification | `classifyError()` | `src/types/worker-errors.ts` | Implemented | Extend for package codes |
| Error inference | `inferErrorCode()` | `src/types/worker-errors.ts` | Implemented | Extend for package errors |
| Idempotency | `IdempotencyStore` | `src/lib/idempotency.ts` | Implemented | Reuse for package bookings |
| Module/op type safety | `ModuleOperationMap` | `src/types/queue.ts:55` | Implemented (flight only) | Add hotel/activity/package maps |
| Type guards | `isValidModule()`, `isValidModuleOperation()` | `src/types/queue.ts:96-103` | Implemented | Extend sets with new operations |
| Circuit breaker | `CircuitBreaker` | `src/orchestrator/circuit-breaker.ts` | Implemented | Reuse for new connectors |
| Request store | `RequestStore` | `src/cache/request-store.ts` | Implemented | Reuse for package requests |
| Provesio connector | `ProvesioFlightConnector` | `src/connectors/provesio/` | Implemented | None (flights only) |
| Duffel flight connector | `DuffelFlightConnector` | `src/connectors/duffel/flights.ts` | Implemented | None |
| Duffel stays connector | — | — | **Missing** | Implement |
| Hotelbeds connector | Legacy `alrais-hotel-beds-availability` | Legacy service | **Not in middleware** | Port or wrap |
| Viator connector | — | — | **Missing** | Implement |
| Transfer connector | — | — | **Missing** | Implement (supplier TBD) |
| Insurance connector | — | — | **Missing** | Implement (supplier TBD) |
| Currency conversion | `openExchangeRates.appId` in config | `src/lib/config.ts` | **Config only** | Implement conversion service |
| Package search handler | — | — | **Missing** | Implement |
| Package compose handler | — | — | **Missing** | Implement |
| Package hold handler | — | — | **Missing** | Implement |
| Package confirm handler | — | — | **Missing** | Implement |
| Package status handler | — | — | **Missing** | Implement |
| Admin pricing rules API | — | — | **Missing** | Implement |
| Admin templates API | — | — | **Missing** | Implement |
| Chatbot package tools | — | — | **Missing** | Implement |
| Frontend package builder | `PackagesPage.tsx` (empty stub) | FE codebase | **Stub** | Implement wizard |
| Frontend package store | — | — | **Missing** | Implement Zustand store |
| DynamoDB packages table | — | — | **Missing** | Create |
| DynamoDB saga state table | — | — | **Missing** | Create |
| DynamoDB pricing rules table | — | — | **Missing** | Create |
| Step Functions definition | — | — | **Missing** | Create |
| Hotel curation rules | — | — | **Missing** | Implement |
| Activity curation rules | — | — | **Missing** | Implement |
| Package curation rules | — | — | **Missing** | Implement |
| Co-occurrence matrix | — | — | **Missing** (Phase 2) | Batch job |
| Unified cancellation policy | — | — | **Missing** | Implement `ComponentCancellationPolicy` + `PackageCancellationSummary` (Section 3.7) |
| Compensation failure response | — | — | **Missing** | Implement incident detection, DLQ monitoring, ops runbook (Section 5.8) |
| Backwards compatibility | Feature flag infrastructure | `org_settings.feature_flags` | **Partial** | Add `packages_enabled` flag, session isolation (Section 7A) |
| Insurance connector | — | — | **Missing** | Implement (supplier TBD — Phase 4 selection). Architecture ready (Section 8.6) |
| Cost model / unit economics | — | — | **Design only** | Per-booking cost ~$0.002; margin floor viable at 2% (Section 10) |

---

## Appendix B — Supplier API Quick Reference

### Viator Partner API

```
Auth:     exp-api-key header
Base:     https://api.viator.com/partner
Limits:   150 req / 10 sec
Sandbox:  https://api.sandbox.viator.com/partner

Search:   POST /products/search
          Body: { destId, startDate, endDate, currencyCode, topX }
          Returns: { products: [{ productCode, title, rating, reviewCount, pricing }] }

Detail:   GET /products/{productCode}
          Returns: { productCode, title, description, images, inclusions, exclusions }

Avail:    POST /availability/check
          Body: { productCode, travelDate, paxMix: [{ ageBand, numberOfTravelers }] }
          Returns: { bookableItems: [{ startTime, totalPrice }] }

Book:     POST /bookings/book
          Body: { items, booker, communication, partnerBookingRef }
          Returns: { bookingRef, status, items }

Cancel:   POST /bookings/{bookingRef}/cancel
          Body: { reasonCode }
          Returns: { refund, status }
```

### Duffel Stays API

```
Auth:     Authorization: Bearer {token}
Base:     https://api.duffel.com
Limits:   60 req / 60 sec
Version:  Duffel-Version: v2

Search:   POST /stays/search
          Body: { rooms, check_in_date, check_out_date, location }
          Returns: { data: { id, results: [{ accommodation }] } }

Rates:    GET /stays/search_results/{id}/rates
          Returns: { data: [{ accommodation, rooms }] }
          Note: Paginated — may require multiple calls

Quote:    POST /stays/quotes
          Body: { search_result_id, rate_id, rooms }
          Returns: { data: { id, total_amount, total_currency, expires_at } }

Book:     POST /stays/bookings
          Body: { quote_id, guests, email, phone }
          Returns: { data: { id, booking_reference, status } }

Cancel:   POST /stays/bookings/{id}/actions/cancel
          Returns: { data: { id, status, cancellation } }
```

### Hotelbeds API

```
Auth:     Api-key + X-Signature (SHA256 of key+secret+epoch)
Base:     https://api.hotelbeds.com/hotel-api/1.0
Limits:   Plan-dependent (100-300 req/s)

Search:   POST /hotels
          Body: { stay, occupancies, hotels, filter }
          Returns: { hotels: { hotels: [{ code, name, rooms }] } }

Check:    POST /checkrates
          Body: { rooms: [{ rateKey }] }
          Returns: { hotel: { rooms: [{ rates }] } }

Book:     POST /bookings
          Body: { holder, rooms: [{ rateKey, paxes }] }
          Returns: { booking: { reference, status } }

Cancel:   DELETE /bookings/{reference}
          Returns: { booking: { reference, status, cancellationReference } }
```

---

## Appendix C — Type Inventory

### New Types Required

| Type | File | Description |
|------|------|-------------|
| `NormalizedActivityOffer` | `src/types/canonical.ts` | Canonical activity representation |
| `NormalizedTransferOffer` | `src/types/canonical.ts` | Canonical transfer representation |
| `NormalizedInsuranceQuote` | `src/types/canonical.ts` | Canonical insurance representation |
| `NormalizedPackageOffer` | `src/types/canonical.ts` | Canonical package bundle |
| `PackageComponent` | `src/types/canonical.ts` | Single component within a package |
| `BundlePriceBreakdown` | `src/types/canonical.ts` | Bundle pricing output |
| `PackageCompatibility` | `src/types/canonical.ts` | Compatibility validation result |
| `ActivitySearchRequest` | `src/types/requests.ts` | Activity search input |
| `ActivityBookRequest` | `src/types/requests.ts` | Activity booking input |
| `TransferSearchRequest` | `src/types/requests.ts` | Transfer search input |
| `TransferBookRequest` | `src/types/requests.ts` | Transfer booking input |
| `InsuranceQuoteRequest` | `src/types/requests.ts` | Insurance quote input |
| `InsuranceBookRequest` | `src/types/requests.ts` | Insurance booking input |
| `PackageSearchRequest` | `src/types/requests.ts` | Package search input |
| `PackageComposeRequest` | `src/types/requests.ts` | Package composition input |
| `PackageHoldRequest` | `src/types/requests.ts` | Package hold input |
| `PackageConfirmRequest` | `src/types/requests.ts` | Package booking input |
| `BundlePricingEngine` | `src/pricing/bundle-pricing.ts` | Extended pricing interface |
| `BundlePricingRules` | `src/pricing/bundle-pricing.ts` | Bundle pricing configuration |
| `YieldContext` | `src/pricing/bundle-pricing.ts` | Yield management context |
| `ComponentPricingInput` | `src/pricing/bundle-pricing.ts` | Per-component pricing input |
| `BundlePricingOutput` | `src/pricing/bundle-pricing.ts` | Bundle pricing result |
| `PricingRuleConfig` | `src/types/admin.ts` | Admin pricing rule schema |
| `PackageTemplate` | `src/types/admin.ts` | Admin package template schema |
| `SupplierPriorityRule` | `src/types/admin.ts` | Supplier priority configuration |

### Extended Types (Modifications)

| Type | File | Change |
|------|------|--------|
| `SupplierCapability` | `src/types/supplier.ts` | Add activity, transfer, insurance capabilities |
| `SupplierConnector` | `src/types/supplier.ts` | Add optional activity/transfer/insurance methods |
| `ModuleOperationMap` | `src/types/queue.ts` | Add hotel, activity, transfer, insurance, package entries |
| `VALID_MODULE_OPERATIONS` | `src/types/queue.ts` | Add new module:operation combinations |
| `WORKER_ERROR_CODES` | `src/types/worker-errors.ts` | Add package-specific error codes |
| `UserContext` | `src/types/curation.ts` | Add package preferences (budget, trip type) |

---

## Appendix D — Glossary

| Term | Definition |
|------|-----------|
| **A la carte** | Individual component prices summed without bundle discount |
| **Bundle** | A package of 2+ travel components sold together |
| **Compensation** | The rollback operation for a saga step (e.g., cancel a hold) |
| **Composition** | The process of selecting and validating components for a package |
| **Connector** | A module that implements `SupplierConnector` for a specific supplier API |
| **Curation** | The process of scoring and selecting the best offers from a larger set |
| **DPE** | Dynamic Packaging Engine — the system described in this PRD |
| **Fan-out** | Sending parallel requests to multiple suppliers simultaneously |
| **Hold** | A temporary reservation of inventory before final booking |
| **Idempotency** | Ensuring that repeated requests produce the same result (no duplicates) |
| **Margin** | The markup applied on top of the supplier's net price |
| **Normalization** | Converting supplier-specific data to canonical middleware types |
| **Offer map** | The mapping from middleware offer UUIDs to supplier-native identifiers |
| **Saga** | A distributed transaction pattern with compensation for rollback |
| **Strangler** | A pattern where a new system wraps and gradually replaces a legacy system |
| **Yield management** | Dynamic pricing based on demand, seasonality, and booking timing |
| **Package context** | The `PackageContext` object that links a component operation to its parent package |
| **Prov-booking** | Provesio's provisional booking (hold) — 5-minute expiry |
| **Quote** | Duffel Stays' price lock mechanism — acts as a hold with guaranteed pricing |
| **Step Functions** | AWS service for orchestrating multi-step workflows with state management |

---

*End of Dynamic Packaging Engine PRD v1.1*
