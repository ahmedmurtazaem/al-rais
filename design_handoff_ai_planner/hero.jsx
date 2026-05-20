// hero.jsx — Scroll-driven hero with cabin windows morphing into search bar
// Loaded as text/babel.

const AIRPORTS = [
  { code: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'UAE' },
  { code: 'AUH', city: 'Abu Dhabi', name: 'Zayed International Airport', country: 'UAE' },
  { code: 'BOS', city: 'Boston', name: 'Boston International Airport', country: 'USA' },
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy Intl', country: 'USA' },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles Intl', country: 'USA' },
  { code: 'LHR', city: 'London', name: 'Heathrow Airport', country: 'UK' },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle', country: 'France' },
  { code: 'SIN', city: 'Singapore', name: 'Changi Airport', country: 'Singapore' },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'Thailand' },
  { code: 'DPS', city: 'Bali',   name: 'Ngurah Rai International', country: 'Indonesia' },
  { code: 'BAH', city: 'Manama', name: 'Bahrain International Airport', country: 'Bahrain' },
  { code: 'MCT', city: 'Muscat', name: 'Muscat International Airport', country: 'Oman' },
  { code: 'DOH', city: 'Doha',   name: 'Hamad International Airport', country: 'Qatar' },
  { code: 'IST', city: 'Istanbul', name: 'Istanbul Airport', country: 'Turkey' },
];

const fmtDate = (d) => {
  if (!d) return null;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtDayName = (d) => d ? d.toLocaleDateString('en-US', { weekday: 'long' }) : '';

// ------------------ Icons ------------------
const Icon = {
  Plane: (p) => (
    <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.2.6-.6.5-1.1z"/>
    </svg>
  ),
  PlaneArrival: (p) => (
    <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22h20M3.84 14.61l1.4 1.65c.4.48 1.03.66 1.62.46l13.5-4.5c1-.34 1.6-1.37 1.4-2.4-.21-1.06-1.23-1.78-2.3-1.6L15 9 8.6 2.79c-.34-.33-.83-.45-1.28-.3l-1.42.47c-.5.16-.68.78-.36 1.2l4.06 5.4-3.86 1.1L4 9.5c-.3-.2-.7-.2-1 0l-.7.5c-.4.3-.55.84-.34 1.3l1.88 3.3z"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  Users: (p) => (
    <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Search: (p) => (
    <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
    </svg>
  ),
  ChevDown: (p) => (
    <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ArrowRight: (p) => (
    <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  ),
  Swap: (p) => (
    <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4v16M3 8l4-4 4 4M17 20V4M21 16l-4 4-4-4"/>
    </svg>
  ),
};

// ------------------ Cloud SVG ------------------
const Cloud = ({ className, style }) => (
  <div className={`cloud ${className||''}`} style={{
    ...style,
    backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 120'><defs><radialGradient id='g' cx='40%' cy='40%' r='60%'><stop offset='0%' stop-color='%23ffffff'/><stop offset='60%' stop-color='%23ffffff' stop-opacity='0.95'/><stop offset='100%' stop-color='%23ffffff' stop-opacity='0.6'/></radialGradient></defs><g fill='url(%23g)'><ellipse cx='80' cy='75' rx='70' ry='34'/><ellipse cx='140' cy='60' rx='62' ry='42'/><ellipse cx='200' cy='70' rx='70' ry='38'/><ellipse cx='250' cy='80' rx='52' ry='28'/><ellipse cx='40' cy='85' rx='42' ry='22'/></g></svg>`)}")`,
  }} />
);

// ------------------ Suggestion field popover ------------------
function AirportPopover({ value, onChange, exclude, onClose }) {
  const [q, setQ] = React.useState('');
  const opts = AIRPORTS.filter(a =>
    a.code !== (exclude && exclude.code) &&
    (!q || (a.city + ' ' + a.code + ' ' + a.name).toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="field-popover" onMouseDown={e=>e.stopPropagation()}>
      <input
        autoFocus
        placeholder="Search city or airport"
        value={q}
        onChange={e=>setQ(e.target.value)}
        style={{width:'100%',padding:'10px 12px',border:'1px solid var(--line-soft)',borderRadius:10,fontFamily:'Satoshi',fontSize:14,marginBottom:6,outline:'none'}}
      />
      {opts.slice(0,8).map(a => (
        <div key={a.code} className="opt" onClick={()=>{ onChange(a); onClose(); }}>
          <span className="code">{a.code}</span>
          <span className="city">{a.city}</span>
          <span className="meta">{a.country}</span>
        </div>
      ))}
      {opts.length === 0 && <div style={{padding:14,color:'var(--mute)',fontSize:14}}>No matches</div>}
    </div>
  );
}

// ------------------ Calendar ------------------
function Calendar({ value, onChange, onClose }) {
  const today = new Date();
  const [view, setView] = React.useState(() => {
    const d = value || today; return { y: d.getFullYear(), m: d.getMonth() };
  });
  const first = new Date(view.y, view.m, 1);
  const startDow = first.getDay(); // 0=Sun
  const daysInMonth = new Date(view.y, view.m+1, 0).getDate();
  const monthName = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const sameDay = (a,b) => a && b && a.toDateString() === b.toDateString();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.y, view.m, d));

  return (
    <div className="calendar" onMouseDown={e=>e.stopPropagation()}>
      <div className="cal-head">
        <button onClick={()=>setView(v=>{ const m=v.m-1; return m<0?{y:v.y-1,m:11}:{y:v.y,m}; })}>‹</button>
        <span>{monthName}</span>
        <button onClick={()=>setView(v=>{ const m=v.m+1; return m>11?{y:v.y+1,m:0}:{y:v.y,m}; })}>›</button>
      </div>
      <div className="cal-grid">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="dow">{d}</div>)}
        {cells.map((d,i) => d ? (
          <div key={i} className={`d ${sameDay(d,value)?'selected':''}`}
               onClick={()=>{ onChange(d); onClose(); }}>{d.getDate()}</div>
        ) : <div key={i}/>)}
      </div>
    </div>
  );
}

// ------------------ Passengers ------------------
function Passengers({ value, onChange, onClose }) {
  const rows = [
    { k:'adults',    label:'Adults', sub:'12+ years', min:1 },
    { k:'children',  label:'Children', sub:'2–11 years', min:0 },
    { k:'infants',   label:'Infants', sub:'Under 2 years', min:0 },
  ];
  return (
    <div className="pax-popover" onMouseDown={e=>e.stopPropagation()}>
      {rows.map(r => (
        <div className="pax-row" key={r.k}>
          <div>
            <div className="pax-row__label">{r.label}</div>
            <div className="pax-row__sub">{r.sub}</div>
          </div>
          <div className="pax-ctrl">
            <button disabled={value[r.k] <= r.min} onClick={()=>onChange({...value, [r.k]: value[r.k]-1})}>−</button>
            <span className="n">{value[r.k]}</span>
            <button onClick={()=>onChange({...value, [r.k]: value[r.k]+1})}>+</button>
          </div>
        </div>
      ))}
      <button onClick={onClose} style={{marginTop:12,width:'100%',background:'var(--blue)',color:'#fff',padding:'10px 0',borderRadius:10,fontWeight:700,fontFamily:'Satoshi'}}>Done</button>
    </div>
  );
}

// ------------------ Plane illustration ------------------
function PlaneIllustration({ revealMask }) {
  // 22 cabin windows; the 4 'morph' ones are at indices 4, 9, 14, 19 (spread out)
  const COUNT = 22;
  const MORPH_IDX = [4, 9, 14, 19];
  return (
    <div className="plane" style={{ ['--reveal']: revealMask }}>
      {/* tail */}
      <div className="tail-fin" />
      <div className="tail-cone" />
      {/* wing under fuselage so windows stay readable */}
      <div className="wing" />
      <div className="wing-engine" />
      {/* fuselage */}
      <div className="nose" />
      <div className="fuselage" />
      <div className="cockpit" />
      <div className="fuselage-stripe" />
      <div className="fuselage-brand">AL RAIS TRAVEL</div>
      <svg className="fuselage-swoosh" viewBox="0 0 140 62" fill="none">
        <path d="M5 50 C 40 0, 90 -10, 135 30" stroke="#2351A3" strokeWidth="6" strokeLinecap="round"/>
        <path d="M10 56 C 50 14, 100 6, 132 38" stroke="#0563C1" strokeWidth="4" strokeLinecap="round" opacity=".7"/>
      </svg>
      {/* windows */}
      <div className="windows">
        {Array.from({length: COUNT}).map((_, i) => (
          <div key={i}
               className={`window-dot ${MORPH_IDX.includes(i) ? 'morph' : ''}`}
               data-idx={i}
          />
        ))}
      </div>
    </div>
  );
}

// ------------------ Main Hero ------------------
function Hero({ onSearch, onAiPlan, scrollHook }) {
  const [progress, setProgress] = React.useState(0);
  const [tripType, setTripType] = React.useState('oneway'); // oneway | round | ai
  const [cabin, setCabin] = React.useState('Economy');
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [from, setFrom] = React.useState(AIRPORTS.find(a => a.code === 'BOS'));
  const [to, setTo]     = React.useState(AIRPORTS.find(a => a.code === 'DXB'));
  const [depart, setDepart] = React.useState(new Date(2026, 4, 24)); // May 24, 2026
  const [returnD, setReturnD] = React.useState(new Date(2026, 4, 31));
  const [pax, setPax] = React.useState({ adults: 1, children: 0, infants: 0 });
  const [activeField, setActiveField] = React.useState(null);
  const stageRef = React.useRef(null);

  React.useEffect(() => {
    const onScroll = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      // stage is a 380vh container; sticky child takes 100vh
      const total = stage.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, -rect.top / total));
      setProgress(p);
      if (scrollHook) scrollHook(p);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  // close popovers on outside click
  React.useEffect(() => {
    const onDown = () => setActiveField(null);
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  // ---------- animation derived values ----------
  const lerp = (a,b,t) => a + (b-a) * t;
  const clamp = (v,a=0,b=1) => Math.max(a, Math.min(b, v));
  const ease = (t) => t<0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;

  // Plane zoom (0..0.65) — exponential-ish scale
  const zoomT = clamp(progress / 0.65);
  const planeScale = lerp(0.55, 4.4, ease(zoomT));
  const planeY = lerp(0, -40, ease(zoomT)); // slight rise

  // Plane fade out (0.55..0.78)
  const planeFade = 1 - clamp((progress - 0.55) / 0.23);

  // Headline / sub fade (0..0.25)
  const headlineFade = 1 - clamp(progress / 0.25);

  // Clouds drift outward
  const cloudOut = ease(zoomT);

  // Search overlay (0.58..0.82)
  const searchT = clamp((progress - 0.58) / 0.24);
  const searchOpacity = ease(searchT);
  const searchScale = lerp(0.92, 1.0, ease(searchT));

  // Search CTA (slightly later)
  const ctaT = clamp((progress - 0.72) / 0.18);
  const ctaOpacity = ease(ctaT);
  const ctaY = lerp(20, 0, ease(ctaT));

  // Sky gradient warms toward white as we get close
  const skyDarken = 1 - 0.4 * ease(zoomT);

  const fieldsInteractive = progress > 0.85;

  return (
    <div className="hero-scroll" ref={stageRef}>
      <div className="hero-stage" style={{
        background: `linear-gradient(180deg, rgba(134,181,255,${skyDarken}) 0%, rgba(186,212,251,${skyDarken*.85+.15}) 55%, #F1F5FF 100%)`,
      }}>
        {/* clouds drift outward as we zoom in */}
        <Cloud className="cloud--a" style={{ transform:`translate(${-cloudOut*250}px, ${-cloudOut*60}px) scale(${1+cloudOut*0.6})` }} />
        <Cloud className="cloud--b" style={{ transform:`translate(${cloudOut*260}px, ${-cloudOut*40}px) scale(${1+cloudOut*0.6})` }} />
        <Cloud className="cloud--c" style={{ transform:`translate(${-cloudOut*300}px, ${cloudOut*80}px) scale(${1+cloudOut*0.8})` }} />
        <Cloud className="cloud--d" style={{ transform:`translate(${cloudOut*300}px, ${cloudOut*100}px) scale(${1+cloudOut*0.8})` }} />
        <Cloud className="cloud--e" style={{ transform:`translate(${cloudOut*180}px, ${-cloudOut*120}px) scale(${1+cloudOut*0.5})`, opacity: 1 - cloudOut*0.8 }} />
        <Cloud className="cloud--f" style={{ transform:`translate(${-cloudOut*180}px, ${cloudOut*120}px) scale(${1+cloudOut*0.5})`, opacity: 1 - cloudOut*0.8 }} />

        <h1 className="hero-headline" style={{ opacity: headlineFade, transform:`translateX(-50%) translateY(${(1-headlineFade)*-20}px)` }}>
          Experience the true richness of travel.
        </h1>
        <p className="hero-sub" style={{ opacity: headlineFade }}>
          Soft service. Reliable fares. From the blue skies of the Gulf to wherever you call home.
        </p>

        {/* Plane (fades out as windows expand into search bar) */}
        <div className="plane-wrap" style={{
          transform:`translate(-50%, calc(-50% + ${planeY}px)) scale(${planeScale})`,
          opacity: planeFade,
        }}>
          <PlaneIllustration />
        </div>

        {/* AI prompt panel — shown when tripType==='ai' */}
        {tripType === 'ai' && (
          <div className="ai-panel" style={{
            opacity: searchOpacity,
            transform:`translate(-50%, -50%) scale(${searchScale})`,
            pointerEvents: fieldsInteractive ? 'auto' : 'none',
          }}>
            <div className="ai-panel__card" onMouseDown={e=>e.stopPropagation()}>
              <div className="ai-panel__head">
                <span className="ai-panel__badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/></svg>
                  Trip Planner AI
                </span>
                <span className="ai-panel__title">Describe your dream trip in your own words</span>
              </div>
              <div className="ai-panel__input">
                <textarea
                  value={aiPrompt}
                  onChange={e=>setAiPrompt(e.target.value)}
                  onKeyDown={e=>{ if (e.key==='Enter' && (e.metaKey||e.ctrlKey)) { onAiPlan(aiPrompt); }}}
                  placeholder="e.g. A 5-day family trip to Bali in July, $2500 budget for two adults and a kid, beach hotel, easy activities, vegetarian food."
                />
                <button className="ai-panel__send" disabled={!aiPrompt.trim()} onClick={()=>onAiPlan(aiPrompt)} title="Plan trip">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
              <div className="ai-panel__chips">
                {[
                  { ico:'☀', t:'Beach getaway, $1500, 5 days' },
                  { ico:'⛰', t:'Nepal trek, March, solo, mid-budget' },
                  { ico:'🍦', t:'Foodie weekend in Istanbul' },
                  { ico:'👨‍👩‍👧', t:'Family of 4 to Dubai, kid-friendly' },
                  { ico:'🎨', t:'Cultural trip to Kyoto, 10 days, $4k' },
                ].map((c,i) => (
                  <button key={i} className="ai-chip" onClick={()=>setAiPrompt(c.t)}>
                    <span className="ico">{c.ico}</span> {c.t}
                  </button>
                ))}
              </div>
              <div className="ai-panel__meta">
                <span>Powered by <strong>Al Rais AI</strong> — itineraries with flights, hotels, day-by-day plan & budget.</span>
                <span style={{opacity:.7}}>⌘ + Enter to send</span>
              </div>
            </div>
          </div>
        )}

        {/* Search overlay (windows -> fields) */}
        <div className="search-overlay" style={{
          opacity: tripType==='ai' ? 0 : searchOpacity,
          transform:`translate(-50%, -50%) scale(${searchScale})`,
          pointerEvents: tripType==='ai' ? 'none' : (fieldsInteractive ? 'auto' : 'none'),
        }}>
          {/* From */}
          <div className={`field ${activeField==='from'?'is-active':''}`}
               onMouseDown={e=>{ e.stopPropagation(); setActiveField(a => a==='from'?null:'from'); }}>
            <div className="field__label"><Icon.Plane className="field__icon"/> From</div>
            <div className="field__value">{from.code}</div>
            <div className="field__sub">{from.name}</div>
            {activeField==='from' && (
              <AirportPopover value={from} exclude={to}
                              onChange={setFrom}
                              onClose={()=>setActiveField(null)} />
            )}
          </div>
          {/* To */}
          <div className={`field ${activeField==='to'?'is-active':''}`}
               onMouseDown={e=>{ e.stopPropagation(); setActiveField(a => a==='to'?null:'to'); }}>
            <div className="field__label"><Icon.PlaneArrival className="field__icon"/> To</div>
            <div className="field__value">{to.code}</div>
            <div className="field__sub">{to.name}</div>
            {activeField==='to' && (
              <AirportPopover value={to} exclude={from}
                              onChange={setTo}
                              onClose={()=>setActiveField(null)} />
            )}
          </div>
          {/* Depart */}
          <div className={`field ${activeField==='depart'?'is-active':''}`}
               onMouseDown={e=>{ e.stopPropagation(); setActiveField(a => a==='depart'?null:'depart'); }}>
            <div className="field__label"><Icon.Calendar className="field__icon"/> Departure</div>
            <div className="field__value">{fmtDate(depart)}</div>
            <div className="field__sub">{fmtDayName(depart)}</div>
            {activeField==='depart' && (
              <Calendar value={depart} onChange={setDepart} onClose={()=>setActiveField(null)} />
            )}
          </div>
          {/* Passengers (or Return when round-trip) */}
          {tripType === 'round' ? (
            <div className={`field ${activeField==='return'?'is-active':''}`}
                 onMouseDown={e=>{ e.stopPropagation(); setActiveField(a => a==='return'?null:'return'); }}>
              <div className="field__label"><Icon.Calendar className="field__icon"/> Return</div>
              <div className="field__value">{fmtDate(returnD)}</div>
              <div className="field__sub">{fmtDayName(returnD)}</div>
              {activeField==='return' && (
                <Calendar value={returnD} onChange={setReturnD} onClose={()=>setActiveField(null)} />
              )}
            </div>
          ) : (
            <div className={`field ${activeField==='pax'?'is-active':''}`}
                 onMouseDown={e=>{ e.stopPropagation(); setActiveField(a => a==='pax'?null:'pax'); }}>
              <div className="field__label"><Icon.Users className="field__icon"/> Passengers</div>
              <div className="field__value">{pax.adults + pax.children + pax.infants}</div>
              <div className="field__sub">
                {pax.adults} Adult{pax.adults>1?'s':''}
                {pax.children>0 ? `, ${pax.children} Child${pax.children>1?'ren':''}`:''}
                {pax.infants>0 ? `, ${pax.infants} Infant${pax.infants>1?'s':''}`:''}
              </div>
              {activeField==='pax' && (
                <Passengers value={pax} onChange={setPax} onClose={()=>setActiveField(null)} />
              )}
            </div>
          )}
        </div>

        {/* Search controls (trip type, cabin, search button) */}
        <div className="search-bar-cta" style={{
          opacity: ctaOpacity,
          transform:`translateX(-50%) translateY(${ctaY}px)`,
          pointerEvents: fieldsInteractive ? 'auto' : 'none',
        }}>
          <button className={`pill toggle ${tripType==='oneway'?'active':''}`} onClick={()=>setTripType('oneway')}>
            <Icon.ArrowRight className="icon"/> One way
          </button>
          <button className={`pill toggle ${tripType==='round'?'active':''}`} onClick={()=>setTripType('round')}>
            <Icon.Swap className="icon"/> Round trip
          </button>
          <button className={`pill toggle ai-pill ${tripType==='ai'?'active':''}`} onClick={()=>setTripType('ai')}>
            <svg className="icon sparkle" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/></svg>
            Plan with AI
          </button>
          {tripType !== 'ai' && (
            <div className="pill">
              <Icon.Users className="icon"/> {cabin}
              <select value={cabin} onChange={e=>setCabin(e.target.value)}
                      style={{position:'absolute',inset:0,opacity:0,cursor:'pointer'}}>
                <option>Economy</option><option>Business</option><option>First</option>
              </select>
            </div>
          )}
          {tripType === 'ai' ? (
            <button className="search-btn" onClick={()=>onAiPlan(aiPrompt || 'A relaxing 5-day trip somewhere warm with great food, around $2000 per person.')}
                    style={{background:'linear-gradient(135deg,#6E45E2 0%, #2351A3 100%)'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/></svg>
              Plan my trip
            </button>
          ) : (
            <button className="search-btn" onClick={()=>onSearch({ from, to, depart, returnD, pax, cabin, tripType })}>
              <Icon.Search className="icon" style={{color:'#fff'}}/> Search flights
            </button>
          )}
        </div>

        {progress < 0.05 && (
          <div className="scroll-hint">SCROLL TO BOARD ↓</div>
        )}
      </div>
    </div>
  );
}

window.Hero = Hero;
window.Icon = Icon;
window.AIRPORTS = AIRPORTS;
window.fmtDate = fmtDate;
window.fmtDayName = fmtDayName;
