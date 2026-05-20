// itinerary.jsx — AI-generated travel itinerary page

const FALLBACK_ITINERARY = {
  destination: "Bali, Indonesia",
  origin: "Dubai (DXB)",
  summary: "A relaxed family beach week with cultural moments — Seminyak beach base, a Ubud day, and easy kid-friendly excursions.",
  startDate: "Jul 18, 2026",
  endDate: "Jul 23, 2026",
  travelers: "2 Adults · 1 Child",
  cabin: "Economy",
  durationDays: 5,
  total: 2480,
  currency: "USD",
  flights: {
    outbound: { from: "DXB", to: "DPS", airline: "Emirates", date: "Jul 18", depart: "09:35", arrive: "21:50", duration: "8h 15m", stops: "Direct" },
    return:   { from: "DPS", to: "DXB", airline: "Emirates", date: "Jul 23", depart: "00:25", arrive: "05:30", duration: "9h 05m", stops: "Direct" },
    price: 1180
  },
  hotel: {
    name: "The Trans Resort Bali",
    location: "Seminyak, Bali",
    nights: 5,
    rating: 4.7,
    price: 820,
    features: ["Beachfront pool", "Family rooms", "Kid's club", "Breakfast included"]
  },
  budget: {
    flights: 1180, hotel: 820, activities: 280, food: 200,
  },
  days: [
    {
      day: 1, location: "Seminyak", title: "Arrive & unwind",
      intro: "Land in the late afternoon, transfer to the hotel, and shake off jet lag with a sunset walk on Seminyak beach.",
      activities: [
        { time: "16:30", name: "Airport pickup",      detail: "Private transfer to Seminyak — about 40 min.", cost: 28 },
        { time: "18:00", name: "Check-in & relax",    detail: "Settle in, pool dip for the kid.",            cost: 0 },
        { time: "19:30", name: "Sunset on the beach", detail: "Seminyak beach, just south of the hotel.",     cost: 0 },
        { time: "20:30", name: "Dinner at La Lucciola", detail: "Beachfront Italian — kid menu, easy walk.",   cost: 70 },
      ]
    },
    {
      day: 2, location: "Seminyak", title: "Beach & spa day",
      intro: "Slow pancake breakfast, a long beach morning, and an afternoon family-friendly spa.",
      activities: [
        { time: "08:00", name: "Breakfast at hotel",   detail: "Included buffet.",                            cost: 0 },
        { time: "10:00", name: "Seminyak beach",       detail: "Sunbeds rented in front of Ku De Ta.",         cost: 18 },
        { time: "14:00", name: "Family spa session",   detail: "Bodyworks — 60 min massage + manicure.",       cost: 55 },
        { time: "19:00", name: "Dinner at Mama San",   detail: "Pan-Asian, vegetarian options, kid-friendly.", cost: 65 },
      ]
    },
    {
      day: 3, location: "Ubud", title: "Culture in Ubud",
      intro: "A full-day Ubud trip — rice terraces, monkey forest, and the night market.",
      activities: [
        { time: "08:30", name: "Drive to Ubud",        detail: "Private driver for the day.",                  cost: 70 },
        { time: "10:30", name: "Tegallalang Rice Terraces", detail: "Easy walk, lots of photo stops.",        cost: 8 },
        { time: "13:00", name: "Lunch at Locavore",    detail: "Try local warung-style nasi campur.",          cost: 50 },
        { time: "15:00", name: "Sacred Monkey Forest", detail: "Kid loves this — be careful with snacks.",     cost: 12 },
        { time: "18:00", name: "Drive back to Seminyak", detail: "About 90 min with traffic.",                 cost: 0 },
      ]
    },
    {
      day: 4, location: "Uluwatu", title: "Cliffs & Kecak fire dance",
      intro: "Half-day in Uluwatu — Padang Padang beach, then the famous sunset Kecak performance.",
      activities: [
        { time: "10:00", name: "Padang Padang beach",  detail: "Easy snorkel for older kids.",                 cost: 15 },
        { time: "13:00", name: "Lunch at Single Fin",  detail: "Cliffside burgers, great view.",               cost: 45 },
        { time: "17:30", name: "Uluwatu Temple",       detail: "Sarongs provided at entrance.",                cost: 10 },
        { time: "18:30", name: "Kecak fire dance",     detail: "60 min performance with the sunset.",          cost: 30 },
      ]
    },
    {
      day: 5, location: "Seminyak", title: "Slow morning & fly home",
      intro: "Last swim, beachfront breakfast, then airport drop-off for the late-night flight.",
      activities: [
        { time: "09:00", name: "Breakfast & pool",     detail: "Take your time.",                              cost: 0 },
        { time: "12:00", name: "Late checkout",        detail: "Arranged with hotel.",                         cost: 0 },
        { time: "18:00", name: "Souvenir shopping",    detail: "Seminyak Square — easy walk.",                 cost: 60 },
        { time: "21:30", name: "Airport drop-off",     detail: "Private transfer.",                            cost: 28 },
      ]
    },
  ]
};

const SYSTEM_PROMPT = `You are Al Rais Travels' AI itinerary planner. Generate a realistic, detailed travel itinerary as PURE JSON only. No markdown, no commentary, no fences. The JSON must match this exact schema:

{
  "destination": string,
  "origin": string,
  "summary": string (2 sentences),
  "startDate": string (e.g. "Jul 18, 2026"),
  "endDate": string,
  "travelers": string,
  "cabin": "Economy" | "Business" | "First",
  "durationDays": number,
  "total": number (USD total cost, integer),
  "currency": "USD",
  "flights": {
    "outbound": { "from": IATA, "to": IATA, "airline": string, "date": string, "depart": "HH:MM", "arrive": "HH:MM", "duration": string, "stops": "Direct" | "1 Stop" | "2 Stops" },
    "return":   { same shape },
    "price": number (round-trip total for all travelers)
  },
  "hotel": { "name": string, "location": string, "nights": number, "rating": number, "price": number (total), "features": [string, string, string, string] },
  "budget": { "flights": number, "hotel": number, "activities": number, "food": number },
  "days": [
    { "day": number, "location": string, "title": string, "intro": string,
      "activities": [
        { "time": "HH:MM", "name": string, "detail": string, "cost": number }
      ]
    }
  ]
}

Rules:
- durationDays === days.length, between 3 and 10
- 3-5 activities per day with realistic times
- prices in USD, plausible for the destination
- budget categories sum approximately to total
- If user request mentions a budget, respect it (total within ±10%)
- If user request omits info, make sensible defaults (return JSON, do not ask questions)`;

async function generateItinerary(userPrompt) {
  if (!window.claude || !window.claude.complete) {
    return FALLBACK_ITINERARY;
  }
  try {
    const raw = await window.claude.complete({
      messages: [
        { role: 'user', content: `${SYSTEM_PROMPT}\n\nUser request: ${userPrompt}\n\nRespond with JSON only.` }
      ]
    });
    // strip code fences if any
    let txt = String(raw).trim();
    if (txt.startsWith('```')) {
      txt = txt.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
    }
    const jsonStart = txt.indexOf('{');
    const jsonEnd   = txt.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      txt = txt.slice(jsonStart, jsonEnd + 1);
    }
    const data = JSON.parse(txt);
    // basic validation
    if (!data.days || !Array.isArray(data.days) || data.days.length === 0) throw new Error('bad shape');
    return data;
  } catch (err) {
    console.error('AI itinerary error', err);
    return FALLBACK_ITINERARY;
  }
}

function Loading({ step }) {
  return (
    <div className="ai-loading">
      <div className="ai-loading__orb"/>
      <h3 className="ai-loading__title">Crafting your itinerary…</h3>
      <p className="ai-loading__sub">Al Rais AI is matching flights, hotels, and activities to your request.</p>
      <div className="ai-loading__step">
        <span className="pulse"/> {step}
      </div>
    </div>
  );
}

function StatIcon({ name }) {
  const map = {
    map: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    cal: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    coin: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5a2.5 2.5 0 0 1 2.5-2.5h1a2.5 2.5 0 0 1 0 5h-1a2.5 2.5 0 0 0 0 5h1a2.5 2.5 0 0 0 2.5-2.5"/></svg>,
    plane: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.2.6-.6.5-1.1z"/></svg>,
    bed: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16M22 12v8M2 8h20M2 12h20M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>,
    spark: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/></svg>,
  };
  return map[name] || null;
}

function ItineraryView({ data, prompt }) {
  const budgetColors = { flights:'#2351A3', hotel:'#0563C1', activities:'#6E45E2', food:'#0E8A4E' };
  const budgetTotal = Object.values(data.budget).reduce((a,b)=>a+b,0);

  return (
    <div className="itin-wrap">
      <div className="itin-hero">
        <div>
          {prompt && (
            <div className="itin-hero__prompt">
              <StatIcon name="spark"/>
              <span>"{prompt}"</span>
            </div>
          )}
          <h1>{data.destination}</h1>
          <p>{data.summary}</p>
          <div style={{position:'relative',display:'inline-flex',alignItems:'center',gap:14,marginTop:18,padding:'10px 16px',background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.18)',borderRadius:12,backdropFilter:'blur(6px)'}}>
            <span style={{fontFamily:'Plus Jakarta Sans',sans:'',fontSize:13,opacity:.8}}>From</span>
            <strong style={{fontSize:15}}>{data.origin}</strong>
            <span style={{opacity:.5}}>→</span>
            <strong style={{fontSize:15}}>{data.destination.split(',')[0]}</strong>
            <span style={{opacity:.5}}>·</span>
            <span style={{fontSize:14,opacity:.85}}>{data.startDate} → {data.endDate}</span>
          </div>
        </div>
        <div className="itin-hero__stats">
          <div className="itin-hero__stat">
            <span className="ico"><StatIcon name="cal"/></span>
            <div><div className="v">{data.durationDays} days</div><div className="l">Trip duration</div></div>
          </div>
          <div className="itin-hero__stat">
            <span className="ico"><StatIcon name="users"/></span>
            <div><div className="v">{data.travelers}</div><div className="l">Travelers</div></div>
          </div>
          <div className="itin-hero__stat">
            <span className="ico"><StatIcon name="plane"/></span>
            <div><div className="v">{data.cabin}</div><div className="l">Cabin class</div></div>
          </div>
          <div className="itin-hero__stat">
            <span className="ico"><StatIcon name="coin"/></span>
            <div><div className="v">${data.total.toLocaleString()} {data.currency}</div><div className="l">Estimated total</div></div>
          </div>
        </div>
      </div>

      {/* Flights & hotel */}
      <section className="itin-section">
        <div className="itin-section__head">
          <h2 className="itin-section__title">Flights & stay</h2>
          <span className="itin-section__sub">Curated for your dates and budget</span>
        </div>
        <div className="cards-2">
          {/* Flights card */}
          <div className="card">
            <div className="card__head">
              <span className="b"><StatIcon name="plane"/></span>
              <span className="t">{data.flights.outbound.airline} · Round trip</span>
            </div>
            <h3 className="card__title">{data.flights.outbound.from} ⇄ {data.flights.outbound.to}</h3>
            <div className="card__sub">{data.flights.outbound.stops} · {data.flights.outbound.airline}</div>
            <div className="card__row">
              <span className="k">Outbound · {data.flights.outbound.date}</span>
              <span className="v">{data.flights.outbound.depart} → {data.flights.outbound.arrive} <span style={{color:'var(--mute)',fontWeight:500,marginLeft:6}}>({data.flights.outbound.duration})</span></span>
            </div>
            <div className="card__row">
              <span className="k">Return · {data.flights.return.date}</span>
              <span className="v">{data.flights.return.depart} → {data.flights.return.arrive} <span style={{color:'var(--mute)',fontWeight:500,marginLeft:6}}>({data.flights.return.duration})</span></span>
            </div>
            <div className="card__row" style={{marginTop:6,borderTop:'1px solid var(--line)'}}>
              <span className="k">Estimated total</span>
              <span className="v" style={{color:'var(--blue)',fontSize:18}}>${data.flights.price.toLocaleString()}</span>
            </div>
          </div>
          {/* Hotel card */}
          <div className="card">
            <div className="card__head">
              <span className="b"><StatIcon name="bed"/></span>
              <span className="t">{data.hotel.nights} nights · ★ {data.hotel.rating}</span>
            </div>
            <h3 className="card__title">{data.hotel.name}</h3>
            <div className="card__sub">{data.hotel.location}</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,margin:'4px 0 10px'}}>
              {data.hotel.features.map((f,i) => (
                <span key={i} style={{background:'var(--blue-soft)',color:'var(--blue)',fontFamily:'Plus Jakarta Sans',fontSize:12,fontWeight:600,padding:'4px 10px',borderRadius:999}}>{f}</span>
              ))}
            </div>
            <div className="card__row" style={{borderTop:'1px solid var(--line)'}}>
              <span className="k">Estimated total</span>
              <span className="v" style={{color:'var(--blue)',fontSize:18}}>${data.hotel.price.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Day by day */}
      <section className="itin-section">
        <div className="itin-section__head">
          <h2 className="itin-section__title">Day-by-day plan</h2>
          <span className="itin-section__sub">{data.days.length} days · {data.days.reduce((n,d)=>n+d.activities.length,0)} activities</span>
        </div>
        <div className="day-list">
          {data.days.map(d => (
            <div className="day" key={d.day}>
              <div className="day__rail">
                <div className="n">Day</div>
                <div className="num">{String(d.day).padStart(2,'0')}</div>
                <div className="loc">{d.location}</div>
              </div>
              <div className="day__body">
                <h3 className="day__title">{d.title}</h3>
                <p className="day__intro">{d.intro}</p>
                <div className="day__activities">
                  {d.activities.map((a,i) => (
                    <div className="act" key={i}>
                      <div className="act__time">{a.time}</div>
                      <div className="act__dot"/>
                      <div className="act__body">
                        <span className="n">{a.name}</span>
                        {a.detail}
                      </div>
                      <div className="act__cost">
                        {a.cost > 0 ? `$${a.cost}` : 'Free'}
                        <span className="c">per group</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Budget */}
      <section className="itin-section">
        <div className="itin-section__head">
          <h2 className="itin-section__title">Budget breakdown</h2>
          <span className="itin-section__sub">${data.total.toLocaleString()} {data.currency} total</span>
        </div>
        <div className="card">
          <div className="budget-bar">
            {Object.entries(data.budget).map(([k,v]) => (
              <span key={k} style={{width:`${(v/budgetTotal*100)}%`, background:budgetColors[k]||'#999'}} title={`${k}: $${v}`}/>
            ))}
          </div>
          <div className="budget-legend">
            {Object.entries(data.budget).map(([k,v]) => (
              <div key={k} className="d">
                <span className="sw" style={{background:budgetColors[k]||'#999'}}/>
                <span style={{textTransform:'capitalize'}}>{k}</span>
                <strong style={{marginLeft:4}}>${v.toLocaleString()}</strong>
                <span style={{color:'var(--mute)',marginLeft:4}}>({Math.round(v/budgetTotal*100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confirm CTA */}
      <div className="itin-cta">
        <div>
          <h3>Love it? Let's lock it in.</h3>
          <p>Book the recommended flights and hotel in one click. Activities are flexible — pay as you go on the ground.</p>
        </div>
        <button className="go" onClick={()=>{
          // wire to listings: pre-fill from→to
          if (data.flights && data.flights.outbound) {
            sessionStorage.setItem('alrais.search', JSON.stringify({
              from: { code: data.flights.outbound.from, city: data.flights.outbound.from, name: data.flights.outbound.from + ' Airport' },
              to:   { code: data.flights.outbound.to,   city: data.flights.outbound.to,   name: data.flights.outbound.to   + ' Airport' },
              depart: new Date().toISOString(),
              returnD: null,
              pax: { adults: 2, children: 1, infants: 0 },
              cabin: data.cabin || 'Economy',
              tripType: 'round',
            }));
          }
          window.location.href = 'listings.html';
        }}>
          Continue to booking
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

function ItineraryPage() {
  const prompt = sessionStorage.getItem('alrais.aiPrompt') || '';
  const [data, setData] = React.useState(() => {
    try { const c = sessionStorage.getItem('alrais.itinerary'); return c ? JSON.parse(c) : null; } catch { return null; }
  });
  const [step, setStep] = React.useState('Understanding your request');

  React.useEffect(() => {
    if (data) return;
    let alive = true;
    const steps = [
      'Understanding your request',
      'Searching flights',
      'Matching hotels in your budget',
      'Designing your day-by-day plan',
      'Polishing the itinerary',
    ];
    let i = 0;
    const tick = setInterval(() => { i = Math.min(i+1, steps.length-1); if (alive) setStep(steps[i]); }, 1400);
    generateItinerary(prompt || 'Plan a relaxing 5-day trip to Bali for a family of 3, around $2500 budget, beach hotel, easy activities.').then(d => {
      if (!alive) return;
      clearInterval(tick);
      try { sessionStorage.setItem('alrais.itinerary', JSON.stringify(d)); } catch {}
      setData(d);
    });
    return () => { alive = false; clearInterval(tick); };
  }, []);

  if (!data) return <div className="itin-wrap"><Loading step={step}/></div>;
  return <ItineraryView data={data} prompt={prompt}/>;
}

// Re-prompt panel (sticky bottom bar to refine the trip)
function RefinePrompt() {
  const [val, setVal] = React.useState('');
  const submit = () => {
    if (!val.trim()) return;
    sessionStorage.setItem('alrais.aiPrompt', val);
    sessionStorage.removeItem('alrais.itinerary');
    window.location.reload();
  };
  return (
    <div style={{
      position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',
      width:720,maxWidth:'92vw',background:'#fff',borderRadius:18,
      boxShadow:'0 24px 50px rgba(20,40,90,.2), 0 4px 12px rgba(20,40,90,.08)',
      border:'1px solid var(--line-soft)',padding:'12px 14px',
      display:'flex',gap:10,alignItems:'center',zIndex:50,
    }}>
      <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#6E45E2,#2351A3)',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/></svg>
      </div>
      <input
        value={val} onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>{ if(e.key==='Enter') submit(); }}
        placeholder="Refine your trip — e.g. 'add a snorkel day' or 'cheaper hotel'"
        style={{flex:1,border:'none',outline:'none',fontFamily:'Satoshi',fontSize:15,color:'var(--ink)',background:'transparent'}}
      />
      <button onClick={submit} disabled={!val.trim()}
        style={{background:'linear-gradient(135deg,#6E45E2,#2351A3)',color:'#fff',border:'none',borderRadius:12,padding:'10px 18px',fontFamily:'Satoshi',fontWeight:700,fontSize:14,cursor:val.trim()?'pointer':'not-allowed',opacity:val.trim()?1:.5,display:'inline-flex',alignItems:'center',gap:6}}>
        Re-plan
      </button>
    </div>
  );
}

Object.assign(window, { ItineraryPage, RefinePrompt, ItineraryView, generateItinerary, FALLBACK_ITINERARY });
