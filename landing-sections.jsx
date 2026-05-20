// landing-sections.jsx — sections below the hero
const I = window.Icon;

function Navbar({ scrolled }) {
  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav__brand">
        <img className="nav__logo" src="assets/logo.png" alt="Al Rais Travel"/>
        <div className="nav__divider"/>
      </div>
      <nav className="nav__links">
        <a className="nav__link is-active">Home</a>
        <a className="nav__link">Travel</a>
        <a className="nav__link">Packages</a>
        <a className="nav__link" href="itinerary.html" style={{display:'inline-flex',alignItems:'center',gap:6}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{color:'#6E45E2'}}><path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/></svg>
          AI Planner
        </a>
        <a className="nav__link">About</a>
      </nav>
      <div className="nav__right">
        <a className="nav__signup">Sign Up</a>
        <button className="btn-primary" style={{padding:'12px 28px',borderRadius:12}}>Sign In</button>
      </div>
    </header>
  );
}

const DESTINATIONS = {
  Beach: [
    { city: 'Bali', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=900&auto=format&fit=crop' },
    { city: 'Maldives', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=900&auto=format&fit=crop' },
    { city: 'Phuket', img: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?q=80&w=900&auto=format&fit=crop' },
  ],
  Ski: [
    { city: 'Zermatt', img: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?q=80&w=900&auto=format&fit=crop' },
    { city: 'Aspen', img: 'https://images.unsplash.com/photo-1551524612-2057f7ddc4ec?q=80&w=900&auto=format&fit=crop' },
    { city: 'Hokkaido', img: 'https://images.unsplash.com/photo-1610824352934-c10d87b700cc?q=80&w=900&auto=format&fit=crop' },
  ],
  Treks: [
    { city: 'Patagonia', img: 'https://images.unsplash.com/photo-1531176175280-33e81d4b1c81?q=80&w=900&auto=format&fit=crop' },
    { city: 'Nepal', img: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=900&auto=format&fit=crop' },
    { city: 'Iceland', img: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?q=80&w=900&auto=format&fit=crop' },
  ],
  Culture: [
    { city: 'Bali', img: 'assets/dest-1.png' },
    { city: 'Kyoto', img: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=900&auto=format&fit=crop' },
    { city: 'Thailand', img: 'assets/dest-3.png' },
  ],
  Food: [
    { city: 'Tokyo', img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=900&auto=format&fit=crop' },
    { city: 'Istanbul', img: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=900&auto=format&fit=crop' },
    { city: 'Lisbon', img: 'https://images.unsplash.com/photo-1588535834892-1a16f0c08c54?q=80&w=900&auto=format&fit=crop' },
  ],
  Family: [
    { city: 'Dubai', img: 'assets/dest-2.png' },
    { city: 'Singapore', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=900&auto=format&fit=crop' },
    { city: 'Sydney', img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=900&auto=format&fit=crop' },
  ],
};

function Destinations() {
  const cats = Object.keys(DESTINATIONS);
  const [cat, setCat] = React.useState('Beach');
  return (
    <section className="section" style={{position:'relative'}}>
      <div className="dotted-map"/>
      <div style={{position:'relative'}}>
        <div className="eyebrow">Popular Destinations</div>
        <h2 className="h2">Find your adventure.</h2>
        <div className="tabs">
          {cats.map(c => (
            <button key={c} className={c===cat?'active':''} onClick={()=>setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="dest-grid">
          {DESTINATIONS[cat].map(d => (
            <div className="dest" key={d.city}>
              <div className="img" style={{backgroundImage:`url(${d.img})`}}/>
              <div className="label">{d.city}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const DEALS = {
  'Below $199': [
    { city:'Oman',    price:129, img:'assets/oman.png' },
    { city:'Qatar',   price:149, img:'https://images.unsplash.com/photo-1592294735346-3a0c9e30c54a?q=80&w=900&auto=format&fit=crop' },
    { city:'Bahrain', price:189, img:'assets/bahrain.png' },
  ],
  'Below $399': [
    { city:'Cairo',     price:249, img:'https://images.unsplash.com/photo-1539768942893-daf53e448371?q=80&w=900&auto=format&fit=crop' },
    { city:'Istanbul',  price:329, img:'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=900&auto=format&fit=crop' },
    { city:'Athens',    price:389, img:'https://images.unsplash.com/photo-1555993539-1732b0258235?q=80&w=900&auto=format&fit=crop' },
  ],
  'Below $699': [
    { city:'Bali',      price:529, img:'assets/dest-1.png' },
    { city:'Singapore', price:589, img:'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=900&auto=format&fit=crop' },
    { city:'Bangkok',   price:649, img:'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=900&auto=format&fit=crop' },
  ],
  'Below $999': [
    { city:'Tokyo',     price:849, img:'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=900&auto=format&fit=crop' },
    { city:'London',    price:899, img:'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=900&auto=format&fit=crop' },
    { city:'Sydney',    price:989, img:'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=900&auto=format&fit=crop' },
  ],
};
function Deals() {
  const tiers = Object.keys(DEALS);
  const [tier, setTier] = React.useState(tiers[0]);
  return (
    <section className="section" style={{paddingTop:0,position:'relative'}}>
      <div style={{position:'relative'}}>
        <div className="eyebrow">Best Deals</div>
        <h2 className="h2">No one can beat these prices.</h2>
        <div className="tabs">
          {tiers.map(t => (
            <button key={t} className={t===tier?'active':''} onClick={()=>setTier(t)}>{t}</button>
          ))}
        </div>
        <div className="deals-grid">
          {DEALS[tier].map(d => (
            <div className="deal" key={d.city}>
              <div className="img" style={{backgroundImage:`url(${d.img})`}}/>
              <div className="body">
                <div className="row">
                  <span className="city">{d.city}</span>
                  <span className="price">${d.price}</span>
                </div>
                <div className="desc">Round-trip flights<br/>4 nights hotel</div>
                <button className="book">Book now</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Partners() {
  return (
    <section className="partners">
      <div className="partners__title">Partnered with the world's best.</div>
      <div className="partners__row">
        <span className="p gold">Emirates</span>
        <span className="p orange">flydubai</span>
        <span className="p red">AirArabia</span>
        <span className="p" style={{color:'#F5C518'}}>Singapore Airlines</span>
        <span className="p red">Turkish Airlines</span>
      </div>
    </section>
  );
}

function WhyUs() {
  const items = [
    { t:'Convenience and Efficiency', b:'Book in minutes with our intuitive interface. Compare hundreds of flights side-by-side, save your favourite searches, and finish payment with a single tap.' },
    { t:'Competitive Prices',         b:'We negotiate directly with airlines and pass the savings on. If you find a lower price within 24 hours we will refund the difference, no questions asked.' },
    { t:'Customer Support',           b:'Real humans, 24/7. Average response time under 90 seconds across chat, phone and email.' },
  ];
  const [open, setOpen] = React.useState(0);
  return (
    <section className="section">
      <div className="why">
        <div className="img"/>
        <div>
          <div className="eyebrow">Why Choose Us?</div>
          <h2 className="h2" style={{maxWidth:520}}>98% travelers satisfied with our service</h2>
          <div className="acc">
            {items.map((it,i) => (
              <div key={i} className={`acc-item ${open===i?'open':''}`} onClick={()=>setOpen(open===i?-1:i)}>
                <div className="acc-item__hd">
                  <span className="acc-item__num">{String(i+1).padStart(2,'0')}</span>
                  <span className="acc-item__title">{it.t}</span>
                  <I.ChevDown className="acc-item__chev icon"/>
                </div>
                <div className="acc-item__body">{it.b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="section" style={{paddingTop:0}}>
      <div className="testi">
        <div>
          <div className="eyebrow">Testimonials</div>
          <h2 className="h2">What they say about<br/>our services</h2>
          <p className="quote">"The experience of booking airfare through Al Rais Travels was amazing! The intuitive interface, wide selection of routes, and fast transaction process made my trip more enjoyable."</p>
          <div className="who">
            <div className="av"/>
            <div>
              <div className="name">Daniel Ricciardo</div>
              <div className="role">Businessman</div>
            </div>
          </div>
        </div>
        <div className="img"/>
      </div>
    </section>
  );
}

function CtaStrip() {
  return (
    <section className="cta-strip">
      <div className="dotted-map"/>
      <div style={{position:'relative'}}>
        <h2>Ready to take a trip around<br/>the world with us?</h2>
        <p>Book airfare with our reliable, transparent platform that is committed to customer satisfaction.</p>
        <button className="go" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>Get Started</button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="foot__grid">
        <div className="foot__brand">
          <img className="logo" src="assets/logo.png" alt="Al Rais Travel" style={{filter:'brightness(0) invert(1)',height:48}}/>
          <p>Take you to the blue skies with an easy and enjoyable flight booking experience.</p>
          <a className="mail" href="mailto:info@alraistravels.com">info@alraistravels.com</a>
        </div>
        <div>
          <h4>About</h4>
          <ul><li><a>About Us</a></li><li><a>Features</a></li><li><a>Trendings</a></li></ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul><li><a>Partnerships</a></li><li><a>Employee</a></li><li><a>Security</a></li></ul>
        </div>
        <div>
          <h4>Support</h4>
          <ul><li><a>FAQs</a></li><li><a>Support Center</a></li><li><a>Contact Us</a></li></ul>
        </div>
        <div>
          <h4>Movement</h4>
          <ul><li><a>Why Al Rais?</a></li><li><a>Support Us</a></li><li><a>Movement</a></li></ul>
        </div>
      </div>
      <div className="foot__bottom">
        <div>© 2026 — All Rights Reserved Al-Rais Travels</div>
        <div className="foot__social">
          <a>𝕏</a><a>f</a><a>in</a><a>@</a>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Navbar, Destinations, Deals, Partners, WhyUs, Testimonials, CtaStrip, Footer });
