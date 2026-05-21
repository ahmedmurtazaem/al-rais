/* =========================================================
   Constellation — interactive section logic
   ========================================================= */

(function(){
  'use strict';

  // ---------- Number counter (for hero strip) ----------
  function bindCounters(){
    document.querySelectorAll('[data-counter]').forEach(el => {
      window.AlRais.onEnter(el, () => {
        const target = parseInt(el.dataset.counter, 10);
        const dur = 1200;
        const t0 = performance.now();
        function tick(t){
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    });
  }

  // =========================================================
  // 02 — Journey (search travels)
  // =========================================================
  const journeyDetails = {
    1: {
      label: 'REQUEST · CLIENT → MIDDLEWARE',
      title: '01 · The user search arrives.',
      body: 'A canonical payload — origin, destination, dates, passengers, currency. The middleware authenticates, validates with a Zod schema, and rate-limits before any supplier sees the call.',
      code: `<span class="k">POST</span> /middleware/flights/search\n<span class="k">Authorization</span>: Bearer ey…\n<span class="k">Content-Type</span>: application/json\n\n{\n  <span class="s">"slices"</span>: [{ <span class="s">"origin"</span>:<span class="s">"DXB"</span>, <span class="s">"destination"</span>:<span class="s">"LHR"</span>, <span class="s">"departureDate"</span>:<span class="s">"2026-06-12"</span> }],\n  <span class="s">"passengers"</span>: { <span class="s">"adults"</span>: <span class="n">1</span>, <span class="s">"children"</span>: <span class="n">0</span> },\n  <span class="s">"cabinClass"</span>: <span class="s">"economy"</span>,\n  <span class="s">"currency"</span>: <span class="s">"AED"</span>,\n  <span class="s">"preferences"</span>: { <span class="s">"travelType"</span>: <span class="s">"business"</span>, <span class="s">"directOnly"</span>: <span class="t">false</span> }\n}`,
      pills: [['p50 latency', '2 ms'], ['validator', 'Zod'], ['auth', 'Cognito JWT']],
    },
    2: {
      label: 'FAN-OUT · ORCHESTRATOR',
      title: '02 · Every connected supplier, queried in parallel.',
      body: 'Promise.allSettled over the supplier registry. A timeout budget of 8s. Per-supplier circuit breakers wrap each call. A failing supplier never blocks the others.',
      code: `<span class="k">await</span> Promise.allSettled([\n  registry.get(<span class="s">'provesio'</span>).searchFlights(req),  <span class="c">// session-auth</span>\n  registry.get(<span class="s">'duffel'</span>).searchFlights(req),    <span class="c">// bearer token</span>\n  registry.get(<span class="s">'sabre'</span>).searchFlights(req),     <span class="c">// SOAP/REST</span>\n  registry.get(<span class="s">'travelpayouts'</span>).fareContext(req) <span class="c">// price intel only</span>\n]);\n\n<span class="c">// Returns 4 settled results: 3 fulfilled, 1 timed_out</span>`,
      pills: [['budget', '8 s'], ['retry', 'exp backoff ×3'], ['breakers', 'per-supplier']],
    },
    3: {
      label: 'NORMALIZE · CANONICAL MODEL',
      title: '03 · 73 results converge into one shape.',
      body: 'Each supplier\'s native response transforms into NormalizedFlightOffer. Airline metadata is enriched. Cross-supplier duplicates are fingerprinted on carrier+flight+departure and deduped — the cheapest wins, alternatives are kept in meta.',
      code: `<span class="k">interface</span> <span class="w">NormalizedFlightOffer</span> {\n  id: <span class="t">string</span>;             <span class="c">// middleware-issued UUID</span>\n  supplier: <span class="t">string</span>;       <span class="c">// 'provesio' | 'duffel' | ...</span>\n  slices: <span class="t">Slice[]</span>;\n  price: { total: <span class="t">number</span>; currency: <span class="t">string</span>; validUntil: <span class="t">string</span>; };\n  refundable: <span class="t">boolean</span>;\n  baggageIncluded: <span class="t">BaggageAllowance</span>;\n  bookable: <span class="t">boolean</span>;\n  metadata: { searchKey?: <span class="t">string</span>; alternativePrices: <span class="t">[]</span>; };\n}`,
      pills: [['offers in', '73'], ['after dedupe', '59'], ['enrichers', 'logo + airline']],
    },
    4: {
      label: 'CURATE · 7 WEIGHTED RULES',
      title: '04 · Score, rank, pick three.',
      body: 'Each offer is scored 0–1 across seven rules — price, duration, stops, departure-time fit, family compatibility, carrier preference, freshness. The top three are labelled (cheapest / fastest / best match) and an explanation is generated.',
      code: `<span class="k">function</span> <span class="w">score</span>(offer, all, ctx) {\n  <span class="k">return</span> (\n    weights.price    * priceScore(offer, all) +\n    weights.duration * durationScore(offer, all) +\n    weights.stops    * stopsScore(offer) +\n    weights.depart   * departFit(offer, ctx) +\n    weights.family   * familyScore(offer, ctx) +\n    weights.carrier  * carrierScore(offer, ctx) +\n    weights.fresh    * freshness(offer)\n  );\n}\n\n<span class="c">// Pure function. No IO. Deterministic.</span>`,
      pills: [['rules', '7'], ['top picks', '3'], ['explainable', '✓']],
    },
    5: {
      label: 'RESPOND · UNIFIED ENVELOPE',
      title: '05 · One response. Every supplier accounted for.',
      body: 'The frontend receives curated picks, full sorted list, plus meta showing which suppliers responded, their latency, and any errors. Cached offers are marked. The offer-map ledger remembers which supplier owns each offer for the booking step.',
      code: `<span class="k">200 OK</span>\n\n{\n  <span class="s">"data"</span>: {\n    <span class="s">"curated"</span>: { <span class="s">"recommended"</span>, <span class="s">"cheapest"</span>, <span class="s">"fastest"</span> },\n    <span class="s">"offers"</span>: <span class="t">[…59 sorted]</span>,\n    <span class="s">"context"</span>: { <span class="s">"visa"</span>, <span class="s">"fareCalendar"</span>, <span class="s">"destination"</span> }\n  },\n  <span class="s">"meta"</span>: {\n    <span class="s">"suppliers"</span>: {\n      <span class="s">"provesio"</span>: { status:<span class="s">"success"</span>, latencyMs:<span class="n">287</span>, count:<span class="n">24</span> },\n      <span class="s">"duffel"</span>:   { status:<span class="s">"success"</span>, latencyMs:<span class="n">412</span>, count:<span class="n">31</span> },\n      <span class="s">"sabre"</span>:    { status:<span class="s">"timed_out"</span>, latencyMs:<span class="n">8000</span>, count:<span class="n">0</span> }\n    },\n    <span class="s">"processingMs"</span>: <span class="n">1438</span>\n  }\n}`,
      pills: [['total latency', '1.4 s'], ['offer map', 'persisted'], ['response', 'cacheable']],
    }
  };

  function bindJourney(){
    const stops = document.querySelectorAll('#journey .stop');
    const detail = document.getElementById('journeyDetail');
    if (!detail) return;

    function activate(n){
      stops.forEach(s => s.classList.toggle('on', parseInt(s.dataset.stop) === n));
      const d = journeyDetails[n];
      detail.innerHTML = `
        <div class="jd-card">
          <div class="label">${d.label}</div>
          <h4>${d.title}</h4>
          <p>${d.body}</p>
          <div class="jd-meta">
            ${d.pills.map(([k,v]) => `<span class="pill"><span class="dot"></span>${k} · <strong style="color:var(--ink);font-family:'Montserrat',sans-serif;font-weight:700;margin-left:4px;">${v}</strong></span>`).join('')}
          </div>
        </div>
        <div class="code">${d.code}</div>
      `;
    }

    stops.forEach(s => s.addEventListener('click', () => activate(parseInt(s.dataset.stop))));

    // Auto-advance once on scroll-in
    window.AlRais.onEnter(document.getElementById('journey'), () => {
      let i = 1;
      activate(1);
      const iv = setInterval(() => {
        i++;
        if (i > 5){ clearInterval(iv); return; }
        activate(i);
      }, 1300);
    });
  }

  // =========================================================
  // 03 — Connector pattern
  // =========================================================
  function bindConnectors(){
    const grid = document.getElementById('connGrid');
    const pending = document.getElementById('connPending');
    const countEl = document.getElementById('pendingCount');
    if (!grid || !pending) return;

    let pendingCount = pending.querySelectorAll('.conn-pill:not(.added)').length;
    countEl.textContent = pendingCount;

    const meta = {
      hotelbeds: { caps:'hotel_search, hotel_book, content_api', auth:'HMAC-SHA256 · per-request', p50:'318 ms' },
      viator:    { caps:'activity_search, activity_book, availability', auth:'Bearer · partner key', p50:'401 ms' },
      sabre:     { caps:'flight_search, flight_book, fare-rules', auth:'Sonic credentials · SOAP', p50:'612 ms' },
      tabby:     { caps:'payment_intent, capture, webhook', auth:'Bearer · public + secret key', p50:'214 ms' },
      google:    { caps:'place_details, photos, autocomplete', auth:'API key · session token', p50:'182 ms' },
    };

    pending.addEventListener('click', (ev) => {
      const pill = ev.target.closest('.conn-pill');
      if (!pill || pill.classList.contains('added')) return;
      const s = pill.dataset.supplier;
      const m = meta[s];
      if (!m) return;

      // Remove placeholder card (one each click)
      const ph = grid.querySelector('.conn-card.placeholder');
      if (ph) ph.remove();

      // Add new live card
      const card = document.createElement('div');
      card.className = 'conn-card live added';
      card.dataset.supplier = s;
      card.innerHTML = `
        <div class="conn-status">● Live · just connected</div>
        <div class="conn-name">${pill.querySelector('.conn-pill-name').textContent}</div>
        <div class="conn-meta">
          <span class="kv"><b>capabilities:</b> ${m.caps}</span>
          <span class="kv"><b>auth:</b> ${m.auth}</span>
          <span class="kv"><b>p50:</b> ${m.p50}</span>
        </div>
      `;
      grid.appendChild(card);

      // Mark pending as added
      pill.classList.add('added');
      pill.querySelector('.conn-pill-r').textContent = '✓ Live';
      pendingCount--;
      countEl.textContent = pendingCount;
    });
  }

  // =========================================================
  // 04 — Curation engine
  // =========================================================
  const OFFERS = [
    { id:'EK5',   car:'Emirates',     code:'EK 5',    sup:'Provesio', price:4250, durMin:430, stops:0, depart:9,  fam:0.9, carPref:1.0,  refund:true,  bag:true },
    { id:'EK7',   car:'Emirates',     code:'EK 7',    sup:'Provesio', price:5010, durMin:430, stops:0, depart:14, fam:0.9, carPref:1.0,  refund:true,  bag:true },
    { id:'EK35',  car:'Emirates',     code:'EK 35',   sup:'Provesio', price:3960, durMin:455, stops:0, depart:23, fam:0.6, carPref:1.0,  refund:false, bag:true },
    { id:'BA106', car:'British Airways',code:'BA 106',sup:'Duffel',   price:3820, durMin:445, stops:0, depart:17, fam:0.5, carPref:0.6,  refund:false, bag:true },
    { id:'BA108', car:'British Airways',code:'BA 108',sup:'Duffel',   price:4180, durMin:445, stops:0, depart:13, fam:0.7, carPref:0.6,  refund:true,  bag:true },
    { id:'QR1004',car:'Qatar Airways',code:'QR 1004', sup:'Sabre',    price:3610, durMin:410, stops:1, depart:8,  fam:0.85,carPref:0.85, refund:true,  bag:true },
    { id:'QR8',   car:'Qatar Airways',code:'QR 8',    sup:'Sabre',    price:3450, durMin:425, stops:1, depart:21, fam:0.7, carPref:0.85, refund:false, bag:true },
    { id:'TK761', car:'Turkish',      code:'TK 761',  sup:'Duffel',   price:3120, durMin:540, stops:1, depart:12, fam:0.6, carPref:0.5,  refund:true,  bag:true },
    { id:'EY11',  car:'Etihad',       code:'EY 11',   sup:'Provesio', price:4090, durMin:435, stops:0, depart:10, fam:0.9, carPref:0.95, refund:true,  bag:true },
    { id:'EY13',  car:'Etihad',       code:'EY 13',   sup:'Provesio', price:3870, durMin:445, stops:0, depart:22, fam:0.7, carPref:0.95, refund:false, bag:true },
    { id:'G9521', car:'Air Arabia',   code:'G9 521',  sup:'Duffel',   price:2180, durMin:570, stops:1, depart:6,  fam:0.3, carPref:0.7,  refund:false, bag:false },
    { id:'WY101', car:'Oman Air',     code:'WY 101',  sup:'Sabre',    price:2940, durMin:540, stops:1, depart:18, fam:0.5, carPref:0.4,  refund:false, bag:true },
    { id:'SV805', car:'Saudia',       code:'SV 805',  sup:'Sabre',    price:3220, durMin:560, stops:1, depart:7,  fam:0.7, carPref:0.55, refund:true,  bag:true },
    { id:'LH633', car:'Lufthansa',    code:'LH 633',  sup:'Duffel',   price:4310, durMin:520, stops:1, depart:11, fam:0.65,carPref:0.55, refund:true,  bag:true },
    { id:'KL428', car:'KLM',          code:'KL 428',  sup:'Duffel',   price:4020, durMin:560, stops:1, depart:14, fam:0.65,carPref:0.5,  refund:true,  bag:true },
    { id:'AF655', car:'Air France',   code:'AF 655',  sup:'Duffel',   price:4150, durMin:550, stops:1, depart:15, fam:0.65,carPref:0.5,  refund:true,  bag:true },
    { id:'EK99',  car:'Emirates',     code:'EK 99',   sup:'Provesio', price:5240, durMin:430, stops:0, depart:16, fam:0.95,carPref:1.0,  refund:true,  bag:true },
    { id:'FD53',  car:'Flydubai',     code:'FD 53',   sup:'Provesio', price:2380, durMin:530, stops:1, depart:11, fam:0.4, carPref:0.75, refund:false, bag:false },
  ];

  const WEIGHTS = { price:30, duration:20, stops:15, depart:10, family:10, carrier:10, fresh:5 };
  // Best match prefers business profile by default (depart 9am window)
  const CTX = { departWindow:9 };

  function fmtPrice(n){ return 'AED '+n.toLocaleString(); }
  function fmtDur(m){ const h=Math.floor(m/60),mm=m%60; return `${h}h ${mm}m`; }

  function priceScore(o, all){
    const min = Math.min(...all.map(x=>x.price));
    const max = Math.max(...all.map(x=>x.price));
    if (max===min) return 1;
    return 1 - (o.price - min) / (max - min);
  }
  function durationScore(o, all){
    const min = Math.min(...all.map(x=>x.durMin));
    const max = Math.max(...all.map(x=>x.durMin));
    if (max===min) return 1;
    return 1 - (o.durMin - min) / (max - min);
  }
  function stopsScore(o){ return o.stops===0 ? 1.0 : o.stops===1 ? 0.6 : 0.3; }
  function departFit(o, ctx){
    const diff = Math.abs(o.depart - ctx.departWindow);
    return Math.max(0, 1 - diff/10);
  }
  function familyScore(o){ return o.fam; }
  function carrierScore(o){ return o.carPref; }
  function freshness(){ return 1.0; }

  function scoreOffer(o, all, w){
    const W = w.price + w.duration + w.stops + w.depart + w.family + w.carrier + w.fresh;
    const s = (
      w.price    * priceScore(o, all) +
      w.duration * durationScore(o, all) +
      w.stops    * stopsScore(o) +
      w.depart   * departFit(o, CTX) +
      w.family   * familyScore(o) +
      w.carrier  * carrierScore(o) +
      w.fresh    * freshness(o)
    ) / W;
    return s;
  }

  function renderCuration(){
    const osList = document.getElementById('osList');
    const cList = document.getElementById('cList');
    const offerCount = document.getElementById('offerCount');
    if (!osList || !cList) return;

    // Score all offers
    const scored = OFFERS.map(o => ({...o, score: scoreOffer(o, OFFERS, WEIGHTS)}))
      .sort((a,b) => b.score - a.score);

    // Top 3 logic: cheapest = min price, fastest = min duration, best = highest score
    const cheapest = [...OFFERS].sort((a,b)=>a.price-b.price)[0];
    const fastest  = [...OFFERS].sort((a,b)=>a.durMin-b.durMin)[0];
    const best     = scored.find(s => s.id !== cheapest.id && s.id !== fastest.id) || scored[0];

    offerCount.textContent = OFFERS.length;

    // Render full stream (top 18 by score)
    const topIds = new Set([best.id, cheapest.id, fastest.id]);
    osList.innerHTML = scored.slice(0, 14).map(o => {
      let rowClass = '';
      let badge = '';
      if (o.id === best.id){ rowClass = 'top1'; badge = '<span class="badge2">★ Best</span>'; }
      else if (o.id === cheapest.id){ rowClass = 'top2'; badge = '<span class="badge2">$ Cheap</span>'; }
      else if (o.id === fastest.id){ rowClass = 'top3'; badge = '<span class="badge2">⚡ Fast</span>'; }
      return `
        <div class="os-row ${rowClass}">
          ${badge || `<span class="badge2" style="background:transparent;color:transparent;border:1px solid transparent;">·</span>`}
          <div>
            <div class="car">${o.car} ${o.code}</div>
            <div class="det">${o.sup} · ${fmtDur(o.durMin)} · ${o.stops===0?'direct':o.stops+' stop'} · ${o.refund?'refundable':'non-refundable'}${o.bag?'':' · no bag'}</div>
          </div>
          <div class="pr">${fmtPrice(o.price)}</div>
          <div class="sc">${(o.score).toFixed(2)}</div>
        </div>
      `;
    }).join('');

    // Top 3 cards
    cList.innerHTML = '';
    cList.innerHTML = [
      ['best', '★ Best Match', best, explain(best, 'best')],
      ['cheap', '$ Cheapest', cheapest, explain(cheapest, 'cheap')],
      ['fast', '⚡ Fastest', fastest, explain(fastest, 'fast')]
    ].map(([cls, lbl, o, why]) => `
      <div class="c-card ${cls} swap">
        <div class="c-top">
          <span class="c-bdg">${lbl}</span>
          <div class="c-price">${fmtPrice(o.price)}</div>
        </div>
        <div class="c-name">${o.car} · ${o.code}</div>
        <div class="c-why">${why}</div>
        <div class="c-meta">
          <span>${fmtDur(o.durMin)}</span>
          <span>·</span>
          <span>${o.stops===0?'direct':o.stops+' stop'}</span>
          <span>·</span>
          <span>${o.sup}</span>
          ${o.refund ? '<span>·</span><span>refundable</span>' : ''}
        </div>
      </div>
    `).join('');
  }

  function explain(o, kind){
    const reasons = [];
    if (kind === 'best'){
      if (o.stops === 0) reasons.push('Direct flight');
      if (o.refund) reasons.push('refundable Flex fare');
      if (o.bag) reasons.push('checked baggage included');
      if (o.depart >= 8 && o.depart <= 14) reasons.push('morning/afternoon departure');
    } else if (kind === 'cheap'){
      reasons.push('Lowest total price');
      if (!o.bag) reasons.push('<strong style="color:var(--red);">heads up — bag not included</strong>');
      if (!o.refund) reasons.push('non-refundable');
    } else if (kind === 'fast'){
      reasons.push(`Shortest total duration · ${fmtDur(o.durMin)}`);
      if (o.stops > 0) reasons.push(`${o.stops} stop`);
    }
    return reasons.join('. ') + '.';
  }

  function bindCuration(){
    const sliders = document.querySelectorAll('.w-rule input[type=range]');
    sliders.forEach(s => {
      const update = () => {
        const key = s.dataset.w;
        const val = parseInt(s.value, 10);
        WEIGHTS[key] = val;
        // Update display
        const total = Object.values(WEIGHTS).reduce((a,b)=>a+b, 0);
        const norm = (val/total).toFixed(2);
        s.parentElement.querySelector('.w-val').textContent = norm;
        s.style.setProperty('--p', (val/60*100)+'%');
        renderCuration();
      };
      s.addEventListener('input', update);
      s.style.setProperty('--p', (s.value/60*100)+'%');
    });

    const reset = document.getElementById('wReset');
    if (reset) reset.addEventListener('click', () => {
      const defaults = { price:30, duration:20, stops:15, depart:10, family:10, carrier:10, fresh:5 };
      Object.assign(WEIGHTS, defaults);
      sliders.forEach(s => {
        s.value = defaults[s.dataset.w];
        s.dispatchEvent(new Event('input'));
      });
    });

    renderCuration();
  }

  // =========================================================
  // 05 — Saga
  // =========================================================
  const SAGA_RAILS = [
    { id:'flight',    name:'Flight · Flydubai',   ic:'✈',  duration:1200, supplier:'Duffel'   },
    { id:'hotel',     name:'Hotel · dGates LHR',  ic:'🏨', duration:1100, supplier:'Hotelbeds' },
    { id:'activity',  name:'Activity · Karting',  ic:'🎟', duration:1400, supplier:'Viator'    },
    { id:'transfer',  name:'Transfer · Airport',  ic:'🚐', duration:1300, supplier:'TBD' },
    { id:'insurance', name:'Insurance · Premium', ic:'🛡', duration:900,  supplier:'TBD' }
  ];
  let sagaKill = 'transfer';
  let sagaRunning = false;

  function bindSaga(){
    const rails = document.getElementById('sagaRails');
    const log = document.getElementById('sagaLogList');
    if (!rails) return;

    function buildRails(){
      rails.innerHTML = SAGA_RAILS.map(r => `
        <div class="saga-rail idle" data-rail="${r.id}">
          <div class="rail-name"><div class="ic">${r.ic}</div>${r.name}</div>
          <div class="rail-track">
            <div class="rail-fill"></div>
            <div class="rail-events" data-events>—</div>
          </div>
          <div class="rail-status">Idle</div>
        </div>
      `).join('');
    }
    buildRails();

    // Kill picker
    document.querySelectorAll('.killbtn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.killbtn').forEach(x => x.classList.toggle('on', x === b));
        sagaKill = b.dataset.kill;
      });
    });

    function addLog(text, cls){
      const ts = new Date().toLocaleTimeString('en-US', { hour12:false }).slice(3);
      const div = document.createElement('div');
      div.className = 'll ' + (cls||'');
      div.innerHTML = `<span class="t">${ts}</span><span class="m">${text}</span>`;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }
    function resetSaga(){
      sagaRunning = false;
      buildRails();
      log.innerHTML = '';
      addLog('Saga reset · holds released. Ready to run.', 'ok');
    }

    async function runSaga(){
      if (sagaRunning) return;
      sagaRunning = true;
      log.innerHTML = '';
      buildRails();
      addLog('Saga started · 5 components · 1 transaction.', 'ok');

      const order = ['flight','hotel','activity','transfer','insurance'];
      const railEls = {};
      order.forEach(id => railEls[id] = rails.querySelector(`[data-rail="${id}"]`));
      let killedIdx = -1;

      for (let i = 0; i < order.length; i++){
        const id = order[i];
        const meta = SAGA_RAILS.find(x => x.id === id);
        const el = railEls[id];
        el.classList.remove('idle');
        el.classList.add('running');
        el.querySelector('.rail-status').textContent = 'Holding…';
        el.querySelector('[data-events]').textContent = `→ POST /hold {supplier:"${meta.supplier}"}`;
        addLog(`Requesting hold · ${meta.name} (${meta.supplier})`);

        // animate fill
        await new Promise(r => setTimeout(r, 80));
        el.querySelector('.rail-fill').style.width = '100%';
        await new Promise(r => setTimeout(r, meta.duration));

        if (id === sagaKill){
          el.classList.remove('running');
          el.classList.add('failed');
          el.querySelector('.rail-status').textContent = 'Failed';
          el.querySelector('[data-events]').textContent = `✕ ${meta.supplier} returned 503 — provider unavailable`;
          addLog(`Hold FAILED · ${meta.name} · provider unavailable`, 'fail');
          killedIdx = i;
          break;
        }

        el.classList.remove('running');
        el.classList.add('held');
        el.querySelector('.rail-status').textContent = 'Held ✓';
        el.querySelector('[data-events]').textContent = `✓ Hold acquired · ref ${id}-${Math.random().toString(36).slice(2,8)}`;
        addLog(`Hold acquired · ${meta.name}`, 'ok');
      }

      if (killedIdx >= 0){
        addLog('Compensating · releasing prior holds (reverse order)…', 'warn');
        for (let j = killedIdx - 1; j >= 0; j--){
          const id = order[j];
          const el = railEls[id];
          await new Promise(r => setTimeout(r, 500));
          el.classList.remove('held');
          el.classList.add('released');
          el.querySelector('.rail-fill').style.width = '0%';
          el.querySelector('.rail-status').textContent = 'Released';
          el.querySelector('[data-events]').textContent = `↺ Hold released cleanly`;
          addLog(`Released · ${SAGA_RAILS.find(x=>x.id===id).name}`, 'warn');
        }
        addLog('Saga aborted · no partial booking. Customer can retry or swap suppliers.', 'warn');
      } else {
        addLog('All holds acquired. Saga ready to commit on payment.', 'ok');
      }
      sagaRunning = false;
    }

    document.getElementById('sagaPlay').addEventListener('click', runSaga);
    document.getElementById('sagaReset').addEventListener('click', resetSaga);

    // Auto-play once on first reveal
    window.AlRais.onEnter(document.querySelector('#saga'), () => setTimeout(runSaga, 400));
  }

  // =========================================================
  // 06 — AI agent graph
  // =========================================================
  const AI_TIMELINE = [
    { agent:'flight',   tool:'searchFlights',    result:'24 offers · curated 3' },
    { agent:'hotel',    tool:'searchHotels',     result:'18 properties · Sukhumvit cluster' },
    { agent:'activity', tool:'searchActivities', result:'12 family-friendly · top 5 returned' },
    { agent:'flight',   tool:'getFareRules',     result:'EK 384 · refundable verified' },
    { agent:'reco',     tool:'checkVisa',        result:'UAE → TH · visa-free 30d' },
    { agent:'package',  tool:'composePackage',   result:'compatibility ✓ · bundle saving AED 85' },
    { agent:'package',  tool:'holdPackage',      result:'5 holds acquired · expires 10:00' },
    { agent:'reco',     tool:'recommend',        result:'co-occurrence: + River Cruise, eSIM' },
  ];

  function bindAI(){
    const agents = document.querySelectorAll('.ai-agent');
    const tools  = document.querySelectorAll('.ai-tool');
    const linesSvg = document.querySelector('.ai-lines');
    const transBody = document.getElementById('aiTransBody');
    const replayBtn = document.getElementById('aiReplay');

    function clearLines(){ while (linesSvg.firstChild) linesSvg.removeChild(linesSvg.firstChild); }
    function drawLine(agentEl, toolEl, opts={}){
      const path = window.AlRais.drawConnector(linesSvg, agentEl, toolEl, {
        stroke: opts.color || 'rgba(228,0,43,0.55)',
        width: 2,
        cls: 'pulse-path'
      });
      return path;
    }
    function clearStates(){
      agents.forEach(a => a.classList.remove('firing'));
      tools.forEach(t => t.classList.remove('firing'));
    }

    async function replay(){
      replayBtn.disabled = true;
      clearLines();
      clearStates();
      transBody.innerHTML = '';

      for (let i = 0; i < AI_TIMELINE.length; i++){
        const step = AI_TIMELINE[i];
        const agentEl = document.querySelector(`.ai-agent[data-agent="${step.agent}"]`);
        const toolEl  = document.querySelector(`.ai-tool[data-tool="${step.tool}"]`);

        clearStates();
        if (agentEl) agentEl.classList.add('firing');
        if (toolEl)  toolEl.classList.add('firing');

        clearLines();
        if (agentEl && toolEl) drawLine(agentEl, toolEl);

        const line = document.createElement('div');
        line.className = 'ai-trans-line';
        const ts = String(i+1).padStart(2,'0');
        line.innerHTML = `<span class="ts">step ${ts}</span><span class="ag">${step.agent}Agent</span><span class="arr">→</span>${step.tool}() <span class="arr">→</span> <span class="res">${step.result}</span>`;
        transBody.appendChild(line);
        transBody.scrollTop = transBody.scrollHeight;

        await new Promise(r => setTimeout(r, 750));
      }

      // Final summary
      const summary = document.createElement('div');
      summary.className = 'ai-trans-line';
      summary.innerHTML = `<span class="ts">done</span><span class="res">✓ Package proposed · AED 2,927 · 9:45 to confirm.</span>`;
      transBody.appendChild(summary);

      replayBtn.disabled = false;
    }

    replayBtn.addEventListener('click', replay);

    // Auto-play on scroll-in
    window.AlRais.onEnter(document.querySelector('#ai'), () => setTimeout(replay, 400));
  }

  // =========================================================
  // 07 — Recommendation co-occurrence graph
  // =========================================================
  const DESTINATIONS = [
    { id:'BKK', label:'Bangkok',     x: 540, y: 160 },
    { id:'CRUISE', label:'River Cruise', x: 320, y:  80 },
    { id:'AYUT',   label:'Ayutthaya',    x: 720, y:  90 },
    { id:'ESIM',   label:'eSIM 30d',     x: 880, y: 180 },
    { id:'LHR',    label:'London',       x: 180, y: 280 },
    { id:'PREMIER',label:'EPL Tour',     x:  60, y: 340 },
    { id:'PADD',   label:'Paddington Hotel', x: 220, y: 380 },
    { id:'CMB',    label:'Colombo',      x: 460, y: 380 },
    { id:'BEACH',  label:'Beach Stay',   x: 360, y: 440 },
    { id:'KUL',    label:'Kuala Lumpur', x: 740, y: 280 },
    { id:'PEN',    label:'Penang Food',  x: 880, y: 320 },
    { id:'DXB',    label:'Dubai',        x: 540, y: 280 },
    { id:'DESSAFARI', label:'Desert Safari', x: 620, y: 400 },
  ];

  // Booking stream — pairs that co-occur
  const BOOKINGS = [
    ['BKK','CRUISE'], ['BKK','AYUT'], ['BKK','ESIM'], ['BKK','AYUT'],
    ['LHR','PREMIER'], ['LHR','PADD'], ['LHR','ESIM'], ['LHR','PREMIER'],
    ['CMB','BEACH'], ['CMB','BEACH'],
    ['KUL','PEN'], ['KUL','PEN'], ['KUL','ESIM'],
    ['DXB','DESSAFARI'], ['DXB','DESSAFARI'], ['DXB','ESIM'],
    ['BKK','CRUISE'], ['BKK','ESIM'], ['BKK','AYUT'],
    ['LHR','PADD'], ['LHR','PREMIER'], ['LHR','PADD'],
    ['BKK','CRUISE'],
  ];

  function bindReco(){
    const svg = document.getElementById('recoGraph');
    if (!svg) return;
    const detail = document.getElementById('recoDetail');
    const bookingsEl = document.getElementById('recoBookings');
    const edgesEl    = document.getElementById('recoEdges');
    const clustersEl = document.getElementById('recoClusters');

    let edges = {}; // key 'A|B' -> count
    let bookCount = 0;
    let nodeEls = {};

    function buildNodes(){
      svg.innerHTML = '';
      DESTINATIONS.forEach(d => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'reco-node');
        g.setAttribute('transform', `translate(${d.x} ${d.y})`);
        g.dataset.id = d.id;
        // Inner group is the thing that scales on hover — keeps the outer
        // translate untouched so nodes don't jump to origin.
        const inner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        inner.setAttribute('class', 'reco-node-inner');
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', 28);
        inner.appendChild(c);
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('dy', '4');
        t.textContent = d.label;
        inner.appendChild(t);
        g.appendChild(inner);
        svg.appendChild(g);
        nodeEls[d.id] = g;
        g.addEventListener('click', () => showDetail(d.id));
      });
    }

    function getCount(a,b){ const k = [a,b].sort().join('|'); return edges[k] || 0; }
    function setCount(a,b,n){ const k = [a,b].sort().join('|'); edges[k] = n; }

    function drawEdges(){
      // Remove existing edges
      svg.querySelectorAll('.reco-edge').forEach(e => e.remove());
      // Draw all edges (insert before nodes so they're below)
      Object.entries(edges).forEach(([k, n]) => {
        const [a,b] = k.split('|');
        const da = DESTINATIONS.find(x => x.id === a);
        const db = DESTINATIONS.find(x => x.id === b);
        if (!da || !db) return;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        path.setAttribute('x1', da.x); path.setAttribute('y1', da.y);
        path.setAttribute('x2', db.x); path.setAttribute('y2', db.y);
        path.setAttribute('class', 'reco-edge' + (n >= 3 ? ' heavy' : ''));
        svg.insertBefore(path, svg.firstChild);
      });
    }

    function showDetail(id){
      const dest = DESTINATIONS.find(d => d.id === id);
      if (!dest) return;
      // Find neighbours sorted by count desc
      const neighbours = [];
      Object.entries(edges).forEach(([k, n]) => {
        const [a,b] = k.split('|');
        if (a === id) neighbours.push({ id:b, n });
        if (b === id) neighbours.push({ id:a, n });
      });
      neighbours.sort((x,y) => y.n - x.n);
      // Highlight
      Object.values(nodeEls).forEach(el => el.classList.remove('hot'));
      nodeEls[id].classList.add('hot');
      neighbours.forEach(nb => nodeEls[nb.id] && nodeEls[nb.id].classList.add('hot'));

      if (neighbours.length === 0){
        detail.innerHTML = `<div class="rd-card"><div class="rd-title">${dest.label}</div><div>No co-occurrence data yet · stream more bookings.</div></div>`;
        return;
      }
      detail.innerHTML = `
        <div class="rd-card">
          <div class="rd-title">Travellers who booked <strong style="color:var(--royal);">${dest.label}</strong> also booked:</div>
          <div class="rd-row">
            ${neighbours.slice(0,6).map(nb => {
              const lbl = DESTINATIONS.find(d => d.id === nb.id).label;
              return `<span class="rd-chip">${lbl} <small style="color:var(--mute-soft);margin-left:6px;">×${nb.n}</small></span>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    async function streamBookings(){
      buildNodes();
      edges = {}; bookCount = 0;
      bookingsEl.textContent = '0'; edgesEl.textContent = '0'; clustersEl.textContent = '0';

      // Stream out the loop multiple times for variety
      const stream = [...BOOKINGS, ...BOOKINGS, ...BOOKINGS].slice(0, 60);
      for (const [a, b] of stream){
        const cur = getCount(a,b);
        setCount(a, b, cur + 1);
        bookCount++;
        bookingsEl.textContent = bookCount;
        edgesEl.textContent = Object.keys(edges).length;
        // Approx clusters = unique strong-connected hubs
        const clusters = Object.values(edges).filter(n => n >= 2).length;
        clustersEl.textContent = clusters;
        // Pulse the two nodes briefly
        if (nodeEls[a]) nodeEls[a].classList.add('hot');
        if (nodeEls[b]) nodeEls[b].classList.add('hot');
        drawEdges();
        await new Promise(r => setTimeout(r, 90));
        if (nodeEls[a]) nodeEls[a].classList.remove('hot');
        if (nodeEls[b]) nodeEls[b].classList.remove('hot');
      }
    }

    buildNodes();
    document.getElementById('recoStream').addEventListener('click', streamBookings);
    document.getElementById('recoReset').addEventListener('click', () => {
      edges = {}; bookCount = 0;
      bookingsEl.textContent = '0'; edgesEl.textContent = '0'; clustersEl.textContent = '0';
      buildNodes();
      detail.innerHTML = '<div class="rd-head">Click any destination to see what travellers also booked.</div>';
    });

    // Auto-stream on first reveal
    window.AlRais.onEnter(document.querySelector('#reco'), () => setTimeout(streamBookings, 400));
  }

  // =========================================================
  // 08 — Visa intelligence
  // =========================================================
  const VISA_DATA = {
    // Each key: passport-dest. Value: { req, badge, title, sub, days, fee, type, docs }
    'AE-TH': { req:false, badge:'Visa-free', title:'No visa required.', sub:'UAE passport — visa-free entry to Thailand for 30 days.', days:'—', fee:'—', type:'Visa on arrival waiver', docs:'Passport with 6+ months validity, return ticket.' },
    'AE-MY': { req:false, badge:'Visa-free', title:'No visa required.', sub:'UAE passport — visa-free 90 days in Malaysia.', days:'—', fee:'—', type:'Direct entry', docs:'Passport, return ticket, hotel booking.' },
    'AE-GB': { req:true,  badge:'eVisa required', title:'Standard Visitor visa required.', sub:'UAE passport holders may apply for an Electronic Travel Authorisation.', days:'~3 weeks', fee:'~AED 600', type:'Standard Visitor', docs:'Passport, photo, financial proof, itinerary, accommodation.' },
    'AE-GE': { req:false, badge:'Visa-free', title:'Visa-free 365 days.', sub:'UAE passport — visa-free to Georgia for up to one year.', days:'—', fee:'—', type:'Direct entry', docs:'Passport with 6+ months validity.' },
    'AE-US': { req:true,  badge:'B1/B2 required', title:'Visitor visa interview required.', sub:'UAE passport — B1/B2 visa needs in-person interview.', days:'4-8 weeks', fee:'~AED 700', type:'B1/B2', docs:'DS-160, photo, passport, financial proof, ties to UAE.' },
    'AE-JP': { req:false, badge:'Visa-free', title:'Visa-free 30 days.', sub:'UAE passport — short-stay visa-free since 2017.', days:'—', fee:'—', type:'Direct entry', docs:'Passport, onward ticket.' },
    'AE-TR': { req:false, badge:'Visa-free', title:'Visa-free 90 days.', sub:'UAE passport — visa-free to Turkey for tourism.', days:'—', fee:'—', type:'Direct entry', docs:'Passport with 6+ months validity.' },

    'SA-TH': { req:false, badge:'Visa on arrival', title:'Visa on arrival.', sub:'Saudi passport — 30-day VOA available at Thai airports.', days:'On arrival', fee:'~THB 2,000', type:'Visa on arrival', docs:'Passport, return ticket, hotel, photo.' },
    'SA-MY': { req:false, badge:'Visa-free', title:'No visa required.', sub:'Saudi passport — visa-free 30 days in Malaysia.', days:'—', fee:'—', type:'Direct entry', docs:'Passport, return ticket.' },
    'SA-GB': { req:true,  badge:'eVisa required', title:'Standard Visitor visa required.', sub:'Saudi passport — Standard Visitor visa needed for tourism.', days:'~3 weeks', fee:'~AED 600', type:'Standard Visitor', docs:'Passport, photo, financial proof, itinerary.' },

    'PK-TH': { req:true, badge:'eVisa required', title:'eVisa required.', sub:'Pakistani passport — apply online before travel.', days:'~3 business days', fee:'~AED 90', type:'eVisa (tourism)', docs:'Passport scan, photo, return ticket, hotel booking.' },
    'PK-MY': { req:true, badge:'eVisa required', title:'eNTRI / eVisa required.', sub:'Pakistani passport — eVisa or eNTRI before travel.', days:'~3-5 business days', fee:'~AED 110', type:'eVisa', docs:'Passport scan, photo, bank statement, itinerary.' },
    'PK-GB': { req:true, badge:'Visa required', title:'Visitor visa required.', sub:'Pakistani passport — biometric appointment required.', days:'3-8 weeks', fee:'~AED 600', type:'Standard Visitor', docs:'Passport, biometrics, financial proof, ties to PK.' },
    'PK-GE': { req:false,badge:'Visa-free', title:'Visa-free entry.', sub:'Pakistani passport — visa-free 1 year for tourism.', days:'—', fee:'—', type:'Direct entry', docs:'Passport with 6+ months validity.' },
    'PK-US': { req:true, badge:'B1/B2 required', title:'Visitor visa interview required.', sub:'Pakistani passport — B1/B2 visa, in-person interview.', days:'8-12 weeks', fee:'~AED 700', type:'B1/B2', docs:'DS-160, photo, passport, financial proof.' },

    'IN-TH': { req:false, badge:'Visa on arrival', title:'Visa on arrival.', sub:'Indian passport — 30-day VOA available.', days:'On arrival', fee:'~THB 2,000', type:'Visa on arrival', docs:'Passport, return ticket, hotel, photo.' },
    'IN-MY': { req:true,  badge:'eVisa required', title:'eVisa required.', sub:'Indian passport — eVisa or eNTRI before travel.', days:'~2-3 business days', fee:'~AED 110', type:'eVisa', docs:'Passport scan, photo, bank statement.' },
    'IN-GB': { req:true,  badge:'Visa required', title:'Standard Visitor visa required.', sub:'Indian passport — biometric appointment needed.', days:'3-6 weeks', fee:'~AED 600', type:'Standard Visitor', docs:'Passport, biometrics, financial proof.' },

    'EG-TH': { req:true, badge:'eVisa required', title:'eVisa required.', sub:'Egyptian passport — apply online before travel.', days:'~5 business days', fee:'~AED 110', type:'eVisa', docs:'Passport scan, photo, bank statement.' },
    'PH-TH': { req:false, badge:'Visa-free', title:'Visa-free 30 days.', sub:'Filipino passport — visa-free to Thailand.', days:'—', fee:'—', type:'Direct entry', docs:'Passport, return ticket.' },
  };

  function bindVisa(){
    const passports = document.querySelectorAll('#vpPassports .vp-opt');
    const dests     = document.querySelectorAll('#vpDests .vp-opt');
    const result    = document.getElementById('visaResult');
    if (!result) return;

    let pass = 'AE', dest = 'TH';

    function render(){
      const key = `${pass}-${dest}`;
      const d = VISA_DATA[key];
      if (!d){
        result.className = 'visa-result';
        result.innerHTML = `
          <div class="vr-head">
            <div class="vr-flag-pair">${flag(pass)} → ${flag(dest)}</div>
            <div class="vr-badge" style="background:#FFF4E5;color:#A65500;">Not in static table</div>
          </div>
          <h3 class="vr-title">Looking it up.</h3>
          <p class="vr-sub">This combination would route to a live visa-intelligence provider (Sherpa / IATA Timatic). Returned inline at the point of search.</p>
        `;
        return;
      }
      result.className = 'visa-result ' + (d.req ? 'req' : 'free');
      result.innerHTML = `
        <div class="vr-head">
          <div class="vr-flag-pair">${flag(pass)} → ${flag(dest)}</div>
          <div class="vr-badge ${d.req?'req':'free'}">${d.badge}</div>
        </div>
        <h3 class="vr-title">${d.title}</h3>
        <p class="vr-sub">${d.sub}</p>
        <div class="vr-grid">
          <div><small>Entry type</small><strong>${d.type}</strong></div>
          <div><small>Processing</small><strong>${d.days}</strong></div>
          <div><small>Cost</small><strong>${d.fee}</strong></div>
          <div><small>Documents</small><strong style="font-size:13px;line-height:1.45;font-weight:500;color:var(--mute);">${d.docs}</strong></div>
        </div>
      `;
    }

    function flag(code){
      const map = { AE:'🇦🇪', SA:'🇸🇦', PK:'🇵🇰', IN:'🇮🇳', EG:'🇪🇬', PH:'🇵🇭',
                    TH:'🇹🇭', MY:'🇲🇾', GB:'🇬🇧', GE:'🇬🇪', US:'🇺🇸', JP:'🇯🇵', TR:'🇹🇷' };
      return map[code] || code;
    }

    passports.forEach(el => el.addEventListener('click', () => {
      passports.forEach(p => p.classList.toggle('on', p === el));
      pass = el.dataset.passport;
      render();
    }));
    dests.forEach(el => el.addEventListener('click', () => {
      dests.forEach(d => d.classList.toggle('on', d === el));
      dest = el.dataset.dest;
      render();
    }));
    render();
  }

  // =========================================================
  // 09 — Closing drop target
  // =========================================================
  function bindClosing(){
    const floats = document.querySelectorAll('#closingFloats .float-chip');
    const dz = document.getElementById('dropZone');
    const dzList = document.getElementById('dzList');
    const csCount = document.getElementById('csCount');
    const csDays = document.getElementById('csDays');

    let count = 0;
    let totalDays = 0;

    floats.forEach(f => {
      f.addEventListener('click', () => {
        if (f.classList.contains('added')) return;
        const name = f.dataset.name;
        const days = parseInt(f.dataset.days, 10);
        count++;
        totalDays += days;
        csCount.textContent = count;
        // Animate days counter
        const t0 = parseInt(csDays.textContent, 10) || 0;
        const dur = 600;
        const start = performance.now();
        (function tick(t){
          const p = Math.min(1, (t-start)/dur);
          csDays.textContent = Math.round(t0 + (totalDays - t0) * p);
          if (p < 1) requestAnimationFrame(tick);
        })(start);

        const item = document.createElement('div');
        item.className = 'dz-item';
        item.textContent = name;
        dzList.appendChild(item);
        f.classList.add('added');

        dz.classList.add('active');
        setTimeout(() => dz.classList.remove('active'), 700);
      });
    });
  }

  // ---------- Boot ----------
  function boot(){
    bindCounters();
    bindJourney();
    bindConnectors();
    bindCuration();
    bindSaga();
    bindAI();
    bindReco();
    bindVisa();
    bindClosing();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
