# Handoff: Al Rais AI Trip Planner

## Overview
A two-mode AI travel planner for Al Rais Travels:

1. **Homepage hero (`index.html`)** — empty-state AI Trip Planner replaces the previous plane scroll animation. A user types where they want to go (e.g. "DXB → Italy, 7 days, food & art") and is routed to the full planner.
2. **Full planner (`itinerary.html`)** — agentic chat-style UI. Left sidebar lists past plans; main column starts empty until the user prompts a trip, then renders a planning sequence and the generated itinerary inline. Refinement composer at the bottom lets the user iterate on the same plan ("make it cheaper", "add 2 days", etc.) — each refinement appends to the same chat thread.

The planner uses `window.claude.complete()` to generate the itinerary JSON. A fallback (Bali, 5 days) is served if the AI call fails so the page is never broken.

## About the Design Files
The files in this bundle are **design references created in HTML/React (via Babel-in-browser)** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these HTML designs in the target codebase's existing environment** (React, Vue, native, etc.) using its established patterns and libraries — or, if no environment exists yet, to choose the most appropriate framework and implement the designs there.

## Fidelity
**High-fidelity (hifi).** All colors, typography, spacing, radii, gradients, shadows, animations, and interaction states are final and should be recreated pixel-perfectly. The brand uses **primary blue `#2351A3`** and **accent red `#E11D2E`** from the Al Rais logo.

## Screens / Views

### 1. Homepage Hero — AI Planner Empty State
- **File**: `index.html` (renders `<EmptyState>` from `planner.jsx` inside a `.planner-hero` wrapper)
- **Purpose**: Replace the previous plane-zoom scroll hero with an agentic planner entry point.
- **Layout** (vertical stack, max-width 760px, centered, ~100vh):
  - Drifting cloud layer (6 absolutely-positioned SVG clouds, slow horizontal drift, 24–42s loops)
  - "Al Rais Trip Planner AI" pill badge (white, blue text, globe icon, 7px×14px padding, 1px line-soft border)
  - H1 "Where to next?" — Hedvig Letters Serif, 64px, weight 400, color `#0D1E3D`, letter-spacing -1.5px
  - Sub copy "Tell me where you're going and I'll build a complete plan…" — Satoshi 17px, max-width 520px, `var(--ink-soft)`
  - Big composer card (white, 22px radius, ~18×20px padding, 1.5px line-soft border that turns blue on focus with a 4px focus halo). Inside:
    - 32×32 gradient blue→navy→red sparkle icon
    - Textarea (3 rows when "big", Satoshi 18px, transparent background)
    - 40×40 round send button (blue→navy→red gradient)
  - Hint row below ("Enter to send · Shift+Enter for new line", "Powered by Al Rais AI")
  - "Or start from an idea" label (uppercase, tracked, var(--mute))
  - 2-column grid of 6 suggestion cards (white, 14px radius, emoji + line of text)
- **Background**: `linear-gradient(180deg, #DCE9FB 0%, #EAF1FB 45%, #F4F6FB 100%)`

### 2. Full Planner Empty State
- **File**: `itinerary.html` (renders `<PlannerShell>`)
- **Purpose**: The dedicated planner page. Identical hero content to homepage but with a 300px sidebar to the left tracking chat history.
- **Layout**: `grid-template-columns: 300px 1fr` filling the viewport below the 88px nav.
- **Sidebar (`.pl-sidebar`, white, 1px right border)**:
  - Top: 38×38 brand orb (blue→navy→red gradient), "AI Trip Planner" / "by Al Rais Travels" stack, then **New plan** button (full-width, solid `--blue`, white text, 12px radius)
  - Middle: "Recent plans" label, scrollable list of past chats. Empty state shows a chat-bubble icon + "Your trip conversations will appear here."
  - Each chat row: title (truncated to ~46 chars), location pin + destination + msg count + relative time. Active row has a brand-tinted gradient background.
  - Footer: muted tip card ("Tip · Be specific: origin, dates, budget…")

### 3. Active Chat
- Visible after user submits a prompt.
- Scrollable thread of messages:
  - User bubble: right-aligned, primary blue background, white text, 18/18/4/18 radius
  - AI bubble: left-aligned, white, 1px line-soft border, with a 30×30 brand-gradient avatar
- While generating, a **Planning Card** appears (orb spinner + 5-step list: Understanding → Searching flights → Matching hotels → Designing day-by-day → Polishing). Each step animates done/active/wait state.
- Once generated, the full `<ItineraryView>` renders below (dark blue hero with destination, summary, stats; flights & hotel cards; day-by-day list; budget bar; final CTA to booking).
- Bottom composer (sticky, fade gradient above): primary refinement input + 5 quick-action chips ("Make it cheaper", "Add 2 more days", etc.).

## Interactions & Behavior

### Empty state → Planning → Itinerary
1. User types in the composer or clicks a suggestion chip.
2. On homepage: prompt is saved to `sessionStorage.alrais.aiPrompt` and `window.location` navigates to `itinerary.html`.
3. On planner page: prompt creates a new chat object (with id, title, messages, itinerary=null). Sidebar updates with the new chat highlighted.
4. `generateItinerary(prompt)` is called — uses `window.claude.complete()` with a strict JSON schema system prompt. Returns parsed JSON.
5. While pending: the **Planning Card** shows; `loadingStep` advances every 1.4s through the 5 steps.
6. On success: itinerary attached to chat; chat title updated to "{origin} → {destination}"; an AI bubble is added with the destination summary.
7. On failure: fallback itinerary (Bali, 5 days) is shown — page never breaks.

### Refinement
- Composer at bottom of active chat appends a new user message and re-runs generation with full context (`Previous request: <history> / Refinement: <new>`).
- Quick chips do the same.

### Persistence
- Chats persisted to `localStorage.alrais.chats` (full JSON of all chats).
- On mount, picks up `sessionStorage.alrais.aiPrompt` (set by homepage hero) and auto-starts a new chat.

### Navigation
- "Continue to booking" CTA in itinerary writes a synthetic search to `sessionStorage.alrais.search` and routes to `listings.html`.

## State Management
`PlannerShell` holds:
- `chats`: array of `{ id, title, createdAt, messages: [{role, text, ts}], itinerary }` (persisted to localStorage on every change)
- `activeId`: currently-selected chat id (or null = empty state)
- `pending`: boolean, true while generation is in flight
- `loadingStep`: string, current planning-step label

Each user action is one of:
- `handleNewPrompt(prompt)` — creates chat + generates
- `handleRefine(prompt)` — appends message + regenerates with context
- `deleteChat(id)` — removes chat; clears active if it was the active one
- `onNew()` — sets activeId=null (returns to empty state)

## Design Tokens

### Colors (already in `:root` in `styles.css`)
```
--blue:        #2351A3   /* primary */
--blue-2:      #0563C1
--blue-deep:   #0D1E3D
--blue-soft:   rgba(13,105,242,0.08)
--red:         #E11D2E   /* accent */
--red-deep:    #B5141F
--red-soft:    rgba(225,29,46,0.08)
--ink:         #20242A
--ink-soft:    #3D3D3D
--mute:        #A2A2A2
--line:        #D6D6D6
--line-soft:   #EAEAEA
--bg:          #ffffff
--bg-soft:     #F4F6FB
```

### Typography
- **Display / hero serif**: 'Hedvig Letters Serif', 64px / 1.05, weight 400, letter-spacing -1.5px
- **Headings**: 'Montserrat', 700, letter-spacing -0.3 to -1px
- **Body**: 'Satoshi', 15–18px, line-height 1.5
- **Labels / metadata**: 'Plus Jakarta Sans', 11–14px, often uppercase tracked for section labels

### Radii
- 10–14px for chat rows / small cards
- 18px for composer (22px for "big" variant)
- 20px for the itinerary hero / CTA banner
- 999px for pills / chips

### Shadows
- Composer rest: `0 18px 44px rgba(20,40,90,.10), 0 4px 12px rgba(20,40,90,.06)`
- Composer focus: `0 22px 56px rgba(35,81,163,.18), 0 0 0 4px rgba(35,81,163,.10)`
- Itinerary CTA: `0 8px 30px rgba(20,40,90,.05)`

### Motion
- All transforms / opacity transitions: `.12–.2s ease`
- Cloud drifts: 24–42s ease-in-out, infinite alternate (paused if `prefers-reduced-motion`)
- Planning orb spin: 1.6s linear infinite; planning-step ring-spin: .8s linear infinite

## Assets
- `assets/logo.png` — Al Rais Travel logo (used in nav). Blue + red brand colors are derived from this logo.
- Other homepage assets (`avatar.png`, `bahrain.png`, `dest-*.png`, `oman.png`, `plane-zoom-*.png`, `testimonial.jpg`) remain unused by the planner itself but are still consumed by other homepage sections.
- Cloud illustrations are inline SVG data URIs in `styles.css` (`.pl-cloud` background-image).
- All icons are inline SVG inside `planner.jsx` / `itinerary.jsx` — no icon library required.

## Files in this bundle
- `index.html` — homepage with the AI Planner empty state as hero
- `itinerary.html` — full planner page with sidebar
- `planner.jsx` — `PlannerShell`, `Sidebar`, `EmptyState`, `ActiveChat`, `Composer`, `MessageBubble`, `PlanningCard`
- `itinerary.jsx` — `generateItinerary`, `ItineraryView`, `FALLBACK_ITINERARY`, `SYSTEM_PROMPT`
- `styles.css` — full stylesheet (planner blocks at the end, prefixed `.pl-`)
- `landing-sections.jsx` — homepage sections below the hero (Destinations, Deals, Partners, WhyUs, Testimonials, CtaStrip, Footer, Navbar)
- `hero.jsx` — **no longer rendered on the homepage**, but kept because it exports shared utilities (`AIRPORTS`, `fmtDate`, `fmtDayName`, `Icon`) used by `listings.jsx`. In a real codebase, extract these utilities into their own module and delete the `Hero` component.
- `listings.html` + `listings.jsx` + `listings.css` — flight listings page (booking step after itinerary).
- `assets/` — images.

## Implementation notes for the developer
- The Babel-in-browser `text/babel` pattern is for prototyping only — replicate as proper React components (TS preferred) with module imports.
- `window.claude.complete()` is a sandbox-only helper. In production, route the JSON-mode prompt through your own LLM endpoint with the same `SYSTEM_PROMPT` schema, and keep the fallback path for resilience.
- Cross-component state lives in `PlannerShell` only. No global store needed.
- The `<ItineraryView>` is fully driven by the itinerary JSON — no hardcoded content. The schema is documented inside `SYSTEM_PROMPT` in `itinerary.jsx`.
- The sidebar is hidden on viewports < 740px (`@media (max-width: 740px) .pl-sidebar { display: none }`). Replace with a sheet/drawer for mobile in production.
