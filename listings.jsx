// listings.jsx
const { Icon: LI } = window;

const AIRLINES = [
  { code:'EK', name:'Emirates',          color:'#D71921', text:'#fff', logo:'EMIRATES' },
  { code:'EY', name:'Etihad',            color:'#BD8B13', text:'#fff', logo:'ETIHAD' },
  { code:'QR', name:'Qatar Airways',     color:'#5C0632', text:'#fff', logo:'QATAR' },
  { code:'LX', name:'SWISS',             color:'#D70F12', text:'#fff', logo:'SWISS' },
  { code:'LH', name:'Lufthansa',         color:'#05164D', text:'#FFCC00', logo:'Lufthansa' },
  { code:'UA', name:'United',            color:'#002244', text:'#fff', logo:'UNITED' },
  { code:'TK', name:'Turkish Airlines',  color:'#E81932', text:'#fff', logo:'TURKISH' },
  { code:'SQ', name:'Singapore Airlines',color:'#F89C1C', text:'#fff', logo:'SINGAPORE' },
  { code:'G9', name:'Air Arabia',        color:'#C8102E', text:'#fff', logo:'AirArabia' },
  { code:'FZ', name:'fly dubai',         color:'#FF7000', text:'#fff', logo:'flydubai' },
];

function pickAirline(seed){ return AIRLINES[seed % AIRLINES.length]; }

function generateFlights(from, to) {
  // deterministic-ish list
  const seed = (from.code.charCodeAt(0) + to.code.charCodeAt(0)) % 7;
  const base = 980 + seed * 35;
  const rows = [];
  for (let i = 0; i < 14; i++) {
    const air = pickAirline(seed + i);
    const depH = (5 + (i*2) % 18);
    const depM = (i*13) % 60;
    const dur = 700 + ((i*47) % 380); // minutes 700..1080
    const arrTotal = depH*60 + depM + dur;
    const arrH = Math.floor(arrTotal/60) % 24;
    const arrM = arrTotal % 60;
    const stops = i % 4 === 0 ? 0 : (i % 7 === 0 ? 2 : 1);
    const price = base + ((i*73) % 850) + stops*40;
    rows.push({
      id: i, air,
      from: from.code, to: to.code,
      depart: `${String(depH).padStart(2,'0')}:${String(depM).padStart(2,'0')}`,
      arrive: `${String(arrH).padStart(2,'0')}:${String(arrM).padStart(2,'0')}`,
      durMin: dur, stops, price,
    });
  }
  return rows;
}

const fmtDur = (m) => `${Math.floor(m/60)}h ${m%60}m`;

function AirlineBadge({ a }) {
  return (
    <div style={{
      width:60, height:36, borderRadius:6, background:a.color, color:a.text,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontFamily:'Montserrat',fontWeight:800,fontSize:11,letterSpacing:'.04em',
      flexShrink:0,
    }}>{a.logo.slice(0,8)}</div>
  );
}

function FlightCard({ f, compareList, toggleCompare }) {
  const inCompare = compareList.includes(f.id);
  const stopLabel = f.stops === 0 ? 'Direct' : f.stops === 1 ? '1 Stop' : `${f.stops} Stops`;
  return (
    <div className="flight">
      <AirlineBadge a={f.air}/>
      <div className="flight__route">
        <div>
          <div className="flight__city">{f.from}</div>
          <div className="flight__time">{f.depart}</div>
        </div>
        <div className="flight__pathwrap">
          <div className="flight__pathdur">{fmtDur(f.durMin)}</div>
          <div className="flight__path">
            <div className="flight__dot"/>
            <div className="flight__line"/>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'#A2A2A2'}}>
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.2.6-.6.5-1.1z"/>
            </svg>
            <div className="flight__line"/>
            <div className="flight__dot"/>
          </div>
          <div className="flight__pathstops">{stopLabel}</div>
        </div>
        <div>
          <div className="flight__city">{f.to}</div>
          <div className="flight__time">{f.arrive}</div>
        </div>
      </div>
      <button className={`flight__compare ${inCompare?'on':''}`} onClick={()=>toggleCompare(f.id)}>
        {inCompare ? '✓ Added' : '+ Compare'}
      </button>
      <div className="flight__price">
        <div className="flight__pfrom">from</div>
        <div className="flight__pval">{f.price.toLocaleString()}<span className="flight__pcur">AED</span></div>
      </div>
      <button className="flight__book">Book Now →</button>
    </div>
  );
}

function Sidebar({ filters, setFilters }) {
  const set = (k, v) => setFilters(f => ({...f, [k]: v}));
  const toggle = (k, v) => setFilters(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x=>x!==v) : [...f[k], v]
  }));
  const timeBuckets = [
    { k:'morning',   label:'Morning',   range:'05:00 - 11:59' },
    { k:'afternoon', label:'Afternoon', range:'12:00 - 17:59' },
    { k:'evening',   label:'Evening',   range:'18:00 - 21:59' },
    { k:'night',     label:'Night',     range:'22:00 - 04:59' },
  ];
  return (
    <aside className="sidebar">
      <div className="sb-head">
        <h3>Filters</h3>
        <button onClick={()=>setFilters({
          depTimes:[], arrTimes:[], price:[150,2500], stops:['1stop'], airlines:[]
        })}>Reset</button>
      </div>

      <h4 className="sb-section">Departure Time</h4>
      <div className="sb-grid">
        {timeBuckets.map(b => (
          <button key={b.k}
                  className={`sb-tile ${filters.depTimes.includes(b.k)?'on':''}`}
                  onClick={()=>toggle('depTimes', b.k)}>
            <div className="sb-tile__icon">
              {b.k==='morning' && '☀'}
              {b.k==='afternoon' && '◐'}
              {b.k==='evening' && '☾'}
              {b.k==='night' && '☽'}
            </div>
            <div>
              <div className="sb-tile__t">{b.label}</div>
              <div className="sb-tile__r">{b.range}</div>
            </div>
          </button>
        ))}
      </div>

      <h4 className="sb-section">Arrival Time</h4>
      <div className="sb-grid">
        {timeBuckets.map(b => (
          <button key={b.k}
                  className={`sb-tile ${filters.arrTimes.includes(b.k)?'on':''}`}
                  onClick={()=>toggle('arrTimes', b.k)}>
            <div className="sb-tile__icon">
              {b.k==='morning' && '☀'}
              {b.k==='afternoon' && '◐'}
              {b.k==='evening' && '☾'}
              {b.k==='night' && '☽'}
            </div>
            <div>
              <div className="sb-tile__t">{b.label}</div>
              <div className="sb-tile__r">{b.range}</div>
            </div>
          </button>
        ))}
      </div>

      <h4 className="sb-section">Price</h4>
      <div style={{padding:'0 4px'}}>
        <input type="range" min="150" max="2500" step="10"
               value={filters.price[1]}
               onChange={e=>set('price',[filters.price[0], +e.target.value])}
               style={{width:'100%'}}/>
        <div className="sb-price-row">
          <div className="sb-price-box">
            <div className="sb-price-lbl">min price</div>
            <div className="sb-price-val">${filters.price[0]}</div>
          </div>
          <div className="sb-price-box">
            <div className="sb-price-lbl">max price</div>
            <div className="sb-price-val">${filters.price[1]}</div>
          </div>
        </div>
      </div>

      <h4 className="sb-section">Number of Stops</h4>
      <div className="sb-checks">
        {[
          {k:'nonstop', l:'Non Stop'},
          {k:'1stop', l:'1 Stop'},
          {k:'2stop', l:'2+ Stops'},
        ].map(s => (
          <label key={s.k} className="sb-check">
            <input type="checkbox"
                   checked={filters.stops.includes(s.k)}
                   onChange={()=>toggle('stops', s.k)}/>
            <span>{s.l}</span>
          </label>
        ))}
      </div>

      <h4 className="sb-section">Airlines</h4>
      <div className="sb-checks">
        {['Emirates','Etihad','Qatar Airways','SWISS','Lufthansa','Turkish Airlines','Singapore Airlines','Air Arabia','fly dubai'].map(a => (
          <label key={a} className="sb-check">
            <input type="checkbox"
                   checked={filters.airlines.includes(a)}
                   onChange={()=>toggle('airlines', a)}/>
            <span>{a}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}

function Listings() {
  const [q] = React.useState(() => {
    try {
      const raw = sessionStorage.getItem('alrais.search');
      if (!raw) return null;
      const v = JSON.parse(raw);
      return {
        ...v,
        depart: new Date(v.depart),
        returnD: v.returnD ? new Date(v.returnD) : null,
      };
    } catch { return null; }
  });

  // sensible default if no search
  const from = (q && q.from) || { code:'BOS', name:'Boston International Airport', city:'Boston' };
  const to   = (q && q.to)   || { code:'DXB', name:'Dubai International Airport', city:'Dubai' };
  const depart = (q && q.depart) || new Date(2026,4,24);
  const returnD = (q && q.returnD) || null;
  const pax = (q && q.pax) || { adults:1, children:0, infants:0 };
  const cabin = (q && q.cabin) || 'Economy';
  const tripType = (q && q.tripType) || 'oneway';
  const paxTotal = pax.adults + pax.children + pax.infants;

  const allFlights = React.useMemo(() => generateFlights(from, to), [from.code, to.code]);
  const [filters, setFilters] = React.useState({
    depTimes:[], arrTimes:[], price:[150,2500], stops:['1stop'], airlines:[]
  });
  const [sortBy, setSortBy] = React.useState('price');
  const [compareList, setCompareList] = React.useState([]);
  const toggleCompare = (id) => setCompareList(c => c.includes(id) ? c.filter(x=>x!==id) : [...c, id]);

  const bucket = (timeStr) => {
    const h = +timeStr.slice(0,2);
    if (h>=5 && h<12) return 'morning';
    if (h>=12 && h<18) return 'afternoon';
    if (h>=18 && h<22) return 'evening';
    return 'night';
  };

  const flights = React.useMemo(() => {
    let list = allFlights.filter(f => {
      if (f.price > filters.price[1]) return false;
      if (filters.depTimes.length && !filters.depTimes.includes(bucket(f.depart))) return false;
      if (filters.arrTimes.length && !filters.arrTimes.includes(bucket(f.arrive))) return false;
      if (filters.stops.length) {
        const sKey = f.stops===0?'nonstop':f.stops===1?'1stop':'2stop';
        if (!filters.stops.includes(sKey)) return false;
      }
      if (filters.airlines.length && !filters.airlines.includes(f.air.name)) return false;
      return true;
    });
    if (sortBy==='price') list = list.sort((a,b)=>a.price-b.price);
    if (sortBy==='duration') list = list.sort((a,b)=>a.durMin-b.durMin);
    if (sortBy==='departure') list = list.sort((a,b)=>a.depart.localeCompare(b.depart));
    return list;
  }, [allFlights, filters, sortBy]);

  return (
    <div className="listings">
      {/* Search summary header */}
      <div className="lsearch">
        <div className="lsearch__top">
          <div className="lsearch__trip">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            <span>{tripType === 'round' ? 'Round trip' : 'One way'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div className="lsearch__div"/>
          <div className="lsearch__trip">
            <span style={{display:'inline-flex',width:18,height:18,borderRadius:'50%',background:'var(--blue)',color:'#fff',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{paxTotal}</span>
            <span>Passenger{paxTotal>1?'s':''}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div className="lsearch__div"/>
          <div className="lsearch__trip"><span>{cabin}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div className="lsearch__fields">
          <div className="lsf">
            <div className="lsf__l">From</div>
            <div className="lsf__v">{from.city || from.code}</div>
            <div className="lsf__s">{from.name}</div>
          </div>
          <div className="lsf">
            <div className="lsf__l">To</div>
            <div className="lsf__v">{to.city || to.code}</div>
            <div className="lsf__s">{to.name}</div>
          </div>
          <div className="lsf">
            <div className="lsf__l">Departure</div>
            <div className="lsf__v">{window.fmtDate(depart)}</div>
            <div className="lsf__s">{window.fmtDayName(depart)}</div>
          </div>
          <div className="lsf">
            <div className="lsf__l">{returnD ? 'Return' : 'Passengers'}</div>
            <div className="lsf__v">{returnD ? window.fmtDate(returnD) : paxTotal}</div>
            <div className="lsf__s">{returnD ? window.fmtDayName(returnD) : `${pax.adults} Adult${pax.adults>1?'s':''}${pax.children?`, ${pax.children} Child${pax.children>1?'ren':''}`:''}${pax.infants?`, ${pax.infants} Infant${pax.infants>1?'s':''}`:''}`}</div>
          </div>
        </div>
      </div>

      {/* Pills row */}
      <div className="lpills">
        <button className="lpill on">≡ All Filters</button>
        <button className="lpill on">✈ {filters.stops.length === 1 && filters.stops[0]==='1stop' ? '1 Stop ✕' : 'Stops ⌄'}</button>
        <button className="lpill">🧳 Bags ⌄</button>
        <button className="lpill">✈ Connecting Airports ⌄</button>
        <button className="lpill">⏱ Duration ⌄</button>
        <div style={{flex:1}}/>
        {compareList.length>0 && (
          <button className="lpill on">View Compare List ({compareList.length})</button>
        )}
        <button className="lpill" onClick={()=>{
          const opts = ['price','duration','departure'];
          const i = opts.indexOf(sortBy);
          setSortBy(opts[(i+1)%opts.length]);
        }}>Sort by: {sortBy} ⇅</button>
      </div>

      <div className="lbody">
        <Sidebar filters={filters} setFilters={setFilters}/>
        <div className="lresults">
          {flights.length === 0 ? (
            <div style={{padding:'80px 40px',textAlign:'center',color:'var(--mute)',background:'#fff',borderRadius:14}}>
              <div style={{fontSize:22,marginBottom:8,color:'var(--ink)'}}>No flights match your filters</div>
              <div>Try removing some filters to see more results.</div>
            </div>
          ) : flights.map(f => (
            <FlightCard key={f.id} f={f} compareList={compareList} toggleCompare={toggleCompare}/>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Listings = Listings;
