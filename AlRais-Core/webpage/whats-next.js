/* =========================================================
   What's Next — interactive matrix logic
   ========================================================= */

(function(){
  'use strict';

  // ---------- Suppliers data ----------
  const SUPPLIERS = [
    { name:'Provesio',           module:'Flights · Hotels · Activities', rationale:'Multi-content aggregator established in the UAE market. Covers regional and global content under a single integration.', commercial:'Aggregator markup · net pricing', status:'live',  reg:'Credentials issued' },
    { name:'Duffel',             module:'Flights',                       rationale:'NDC-first aggregator. Strong coverage of low-cost carriers and modern airline content.',                                  commercial:'Per-booking fee · net + Duffel margin', status:'live', reg:'Credentials issued' },
    { name:'PayFort (Amazon)',   module:'Payment gateway',               rationale:'UAE-native payment processor. Currently the live gateway in the platform.',                                                 commercial:'Per-transaction fee',                  status:'live', reg:'Credentials issued' },

    { name:'Hotelbeds',          module:'Hotels · Transfers',            rationale:'Largest hotel wholesaler globally. Essential for competitive hotel inventory and pre-negotiated rates.',                    commercial:'Net rates · merchant model',           status:'built', reg:'Awaiting credentials' },
    { name:'Viator',             module:'Activities · Experiences',      rationale:'Largest activities and experiences marketplace globally. Strong inventory for UAE-outbound destinations.',                  commercial:'Affiliate commission',                 status:'built', reg:'Awaiting credentials' },
    { name:'Visa Static',        module:'Visa requirements',             rationale:'In-house static dataset covering the top 50 UAE-origin destination pairs. Powers inline visa context in curation.',         commercial:'In-house · no cost',                   status:'built', reg:'Live · in-house' },

    { name:'Sabre',              module:'Flights',                       rationale:'Tier-one global GDS. Comprehensive coverage including legacy carriers; preferred for corporate and business travel.',       commercial:'GDS subscription + segment fees',      status:'ready', reg:'Awaiting registration' },
    { name:'Amadeus',            module:'Flights',                       rationale:'Tier-one global GDS. Strongest single source for European and Middle Eastern carrier content.',                            commercial:'GDS subscription + segment fees',      status:'ready', reg:'Awaiting registration' },
    { name:'Travelport',         module:'Flights',                       rationale:'Tier-one global GDS. Useful as a third source for coverage redundancy and rate competition.',                              commercial:'GDS subscription + segment fees',      status:'ready', reg:'Awaiting registration' },
    { name:'Booking.com Affiliate', module:'Hotels',                     rationale:'Broad consumer-grade hotel inventory. Useful as a secondary source for coverage and price comparison.',                     commercial:'Affiliate commission',                 status:'ready', reg:'Awaiting registration' },
    { name:'GetYourGuide',       module:'Activities · Experiences',      rationale:'Secondary activities source for coverage redundancy and broader European inventory.',                                       commercial:'Affiliate commission',                 status:'ready', reg:'Awaiting registration' },
    { name:'Google Places',      module:'Reviews · Photos · Place data', rationale:'Authoritative source for hotel and activity reviews, ratings, photos, and place context. No registration gating.',          commercial:'Per-call pricing · cache to control',  status:'ready', reg:'Awaiting GCP project' },
    { name:'Sherpa',             module:'Visa requirements',             rationale:'Comprehensive visa, health, and entry-requirement data. Live successor to the static visa layer.',                          commercial:'Per-call pricing',                     status:'ready', reg:'Awaiting registration' },
    { name:'Tabby',              module:'Installment payments',          rationale:'Buy-now-pay-later, dominant in the UAE and Saudi markets. Strong fit for higher-ticket package bookings.',                  commercial:'Per-transaction merchant fee',         status:'ready', reg:'Awaiting registration' },
    { name:'Tamara',             module:'Installment payments',          rationale:'Buy-now-pay-later, complementary to Tabby. Strong in the Saudi market.',                                                   commercial:'Per-transaction merchant fee',         status:'ready', reg:'Awaiting registration' },
    { name:'Insurance providers',module:'Travel insurance',              rationale:'Multiple providers evaluated. Selection depends on Al Rais\'s underwriter preferences.',                                    commercial:'Commission per policy',                status:'ready', reg:'Provider selection pending' },
  ];

  const STATUS_LABEL = {
    live:  'Live',
    built: 'Built & tested',
    ready: 'Framework ready',
  };

  function bindSuppliers(){
    const grid = document.getElementById('spGrid');
    if (!grid) return;
    grid.innerHTML = SUPPLIERS.map(s => `
      <div class="sp-card" data-status="${s.status}">
        <div class="sp-head">
          <div>
            <div class="sp-name">${s.name}</div>
            <div class="sp-module">${s.module}</div>
          </div>
        </div>
        <div class="sp-rationale">${s.rationale}</div>
        <div class="sp-foot">
          <div class="sp-status">${STATUS_LABEL[s.status]}</div>
          <div class="sp-reg">${s.reg}</div>
        </div>
      </div>
    `).join('');

    // Filter chips
    const chips = document.querySelectorAll('.sp-chip');
    chips.forEach(c => c.addEventListener('click', () => {
      chips.forEach(x => x.classList.toggle('on', x === c));
      const f = c.dataset.filter;
      grid.querySelectorAll('.sp-card').forEach(card => {
        card.classList.toggle('hidden', f !== 'all' && card.dataset.status !== f);
      });
    }));
  }

  // ---------- Decisions ----------
  const DECISIONS = [
    { area:'Carrier prioritization',     decides:'Which airlines should be preferred or de-prioritized in the recommendation engine. For example, prioritizing Emirates and Etihad codeshares on regional routes, or boosting carriers Al Rais has commercial agreements with.', why:'Shapes which offers customers see first. Directly influences booking mix and supplier-margin economics.' },
    { area:'Markup strategy',            decides:'Markup percentages by module (flights, hotels, activities, packages), by supplier, by destination, and by customer segment (B2B vs B2C, registered vs guest, corporate accounts).',                                              why:'Determines platform revenue per booking. The engine applies whatever the commercial team configures.' },
    { area:'Refundability bias',         decides:'Whether the recommendation engine should favor refundable fares by default, by traveler type (business vs leisure), or by booking lead time.',                                                                                  why:'Builds trust with business travelers. Affects average booking value.' },
    { area:'Package composition rules',  decides:'Default component bundles to surface (flight + hotel, flight + hotel + activity, flight + hotel + transfer), and which combinations to promote on the homepage.',                                                                why:'Drives package attach rate — the single highest-margin product type.' },
    { area:'Promotional curation labels',decides:'Which scoring outcomes trigger which labels. The SOW specified Unreal Deal, Once in a Lifetime, Good, Value, Reserve. The thresholds and rules behind each label are commercial decisions.',                                       why:'These labels are how the platform communicates value judgment to customers. Al Rais owns the editorial voice.' },
    { area:'Destination promotion',      decides:'Featured destinations by season, festival, or commercial campaign. Curation can weight these higher in package and recommendation surfaces.',                                                                                     why:'Aligns the platform with marketing calendars and seasonal demand.' },
    { area:'Supplier failover order',    decides:'When a customer searches for a route or property served by multiple suppliers, which supplier the platform should prefer when prices are within a tolerance band.',                                                              why:'Manages supplier relationships, volume commitments, and margin differentials.' },
    { area:'Currency & FX handling',     decides:'Display currencies, FX margin applied on conversion, and whether prices are shown in supplier currency or customer-local currency.',                                                                                              why:'Affects perceived price competitiveness and platform FX margin.' },
    { area:'Customer segmentation rules',decides:'Definitions for B2B vs B2C, corporate account tiers, loyalty thresholds, and any associated pricing or curation differences.',                                                                                                    why:'Enables differentiated commercial treatment without engineering changes.' },
    { area:'Blackout dates & constraints',decides:'Routes, properties, or suppliers to suppress during specific date ranges or commercial scenarios.',                                                                                                                              why:'Operational flexibility for events, supplier disputes, or risk management.' },
  ];

  function bindDecisions(){
    const grid = document.getElementById('dcGrid');
    if (!grid) return;
    grid.innerHTML = DECISIONS.map((d, i) => `
      <div class="dc-card" data-idx="${i}">
        <div class="dc-num">${String(i+1).padStart(2,'0')} / 10</div>
        <div class="dc-tag">Decision area</div>
        <div class="dc-title">${d.area}</div>
        <div class="dc-body">
          <div class="dc-decides">
            <div class="lbl">What Al Rais decides</div>
            <p>${d.decides}</p>
          </div>
          <div class="dc-why">
            <div class="lbl">Why it matters</div>
            <p>${d.why}</p>
          </div>
        </div>
        <div class="dc-toggle"><span class="arrow">▸</span> Tap to expand</div>
      </div>
    `).join('');

    grid.addEventListener('click', e => {
      const card = e.target.closest('.dc-card');
      if (!card) return;
      const wasOpen = card.classList.contains('open');
      grid.querySelectorAll('.dc-card').forEach(c => c.classList.remove('open'));
      if (!wasOpen) card.classList.add('open');
    });
  }

  // ---------- Tunable vs Structural ----------
  const TUNABLE = [
    { name:'Scoring weights',          desc:'Each curation rule has a weight that determines how much it contributes to the final recommendation. Adjustable per audience or campaign — price, duration, stops, departure-time fit, family compatibility, refundability.' },
    { name:'Markup formulas',          desc:'Per-module, per-supplier, per-destination, and per-segment markup percentages and fixed amounts. Configurable independently of the engineering layer.' },
    { name:'Curation labels & thresholds', desc:'The SOW labels — Unreal Deal, Value, Reserve, etc. — and the scoring thresholds that trigger each one.' },
    { name:'Recommendation triggers',  desc:'When and where recommendations surface in the customer journey: post-search, post-flight booking, cart review, in-chatbot.' },
    { name:'Visa intelligence rules',  desc:'Which nationalities and destinations have visa context surfaced, and the depth of information shown.' },
    { name:'Supplier priority & failover', desc:'Order in which suppliers are queried, fallback behavior when one fails, and tie-breaking rules when offers are equivalent.' },
    { name:'Search defaults & filters',desc:'Default search parameters by audience, default filter selections on results pages, and the order of filters in the UI.' },
    { name:'Promotional & seasonal content', desc:'Featured destinations, package templates, marketing copy, and curation overrides for specific date ranges or campaigns.' },
  ];

  const STRUCTURAL = [
    { name:'Canonical data model',     desc:'The unified types used to represent flights, hotels, activities, and packages across all suppliers. Changing these would require coordinated updates across every connector, the curation engine, the website, and the chatbot.' },
    { name:'Connector interface',      desc:'The contract every supplier connector implements. Stability here is what makes new supplier integration measured in days rather than months.' },
    { name:'Saga & composition logic', desc:'The orchestration that holds multi-supplier packages atomically and rolls back cleanly on partial failure. Structural to the platform\'s reliability guarantees.' },
    { name:'Booking hold windows',     desc:'Time windows during which a quoted price is held before requiring payment. Set by the supplier in their commercial terms — the platform respects what each supplier allows.' },
    { name:'Supplier-imposed terms',   desc:'Cancellation policies, refund processing times, baggage rules, change fees. Determined by the supplier and surfaced by the platform. Cannot be overridden — only displayed accurately.' },
    { name:'Identity & auth architecture', desc:'User accounts, B2B vs B2C segmentation, role-based access in the admin panel, OAuth flows. Changes here are engineering work, not configuration.' },
  ];

  function bindTunable(){
    const tList = document.getElementById('tunableList');
    const sList = document.getElementById('structuralList');
    if (!tList || !sList) return;
    const render = (arr, container) => {
      container.innerHTML = arr.map(item => `
        <div class="ts-item">
          <div class="ts-name">${item.name}</div>
          <div class="ts-desc">${item.desc}</div>
        </div>
      `).join('');
      container.addEventListener('click', e => {
        const item = e.target.closest('.ts-item');
        if (!item) return;
        item.classList.toggle('open');
      });
    };
    render(TUNABLE, tList);
    render(STRUCTURAL, sList);
  }

  // ---------- Boot ----------
  function boot(){
    bindSuppliers();
    bindDecisions();
    bindTunable();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
