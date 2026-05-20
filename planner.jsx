// planner.jsx — Empty-state-first agentic AI Planner with chat sidebar

const CHATS_KEY = 'alrais.chats';

function loadChats() {
  try {return JSON.parse(localStorage.getItem(CHATS_KEY)) || [];} catch {return [];}
}
function saveChats(chats) {
  try {localStorage.setItem(CHATS_KEY, JSON.stringify(chats));} catch {}
}

function deriveTitle(prompt) {
  if (!prompt) return 'New trip';
  const t = prompt.trim();
  if (t.length <= 48) return t;
  return t.slice(0, 46).replace(/[,. ]+$/, '') + '…';
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

// --- Suggestion chips for empty state ---
const SUGGESTIONS = [
{ ico: '🇮🇹', t: 'Plan a 7-day trip from DXB to Italy — food, art, $4k' },
{ ico: '🌸', t: 'AUH → Tokyo for cherry blossoms, 10 days, mid-budget' },
{ ico: '🏝', t: 'DXB → Maldives, honeymoon, 5 days, overwater villa' },
{ ico: '👨‍👩‍👧', t: 'Family of 4 to Bali — beach, $2500, easy activities' },
{ ico: '⛰', t: 'Solo trek in Nepal, March, mid-budget, vegetarian food' },
{ ico: '🎨', t: 'Cultural week in Istanbul, foodie, no flights — already there' }];


// --- Icons (kept tiny — most use SVG inline below) ---
const PIcon = {
  Sparkle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z" /></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>,
  ArrowUp: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" /></svg>,
  Globe: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" /></svg>,
  Chat: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.2a8.4 8.4 0 1 1 16.1-4.3z" /></svg>,
  Pin: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>
};

// =========================================================================
// Sidebar — chat history
// =========================================================================
function Sidebar({ chats, activeId, onNew, onSelect, onDelete }) {
  return (
    <aside className="pl-sidebar">
      <div className="pl-sidebar__head">
        <div className="pl-sidebar__brand">
          <span className="pl-sidebar__orb"><PIcon.Sparkle /></span>
          <div>
            <div className="t">AI Trip Planner</div>
            <div className="s">by Al Rais Travels</div>
          </div>
        </div>
        <button className="pl-new" onClick={onNew} style={{ color: "rgb(255, 255, 255)" }} data-comment-anchor="0f8ddeda6c-button-62-9">
          <PIcon.Plus /> New plan
        </button>
      </div>

      <div className="pl-sidebar__section-label">Recent plans</div>
      <div className="pl-chats">
        {chats.length === 0 &&
        <div className="pl-chats__empty">
            <PIcon.Chat />
            <span>Your trip conversations will appear here.</span>
          </div>
        }
        {chats.map((c) =>
        <button
          key={c.id}
          className={`pl-chat ${c.id === activeId ? 'is-active' : ''}`}
          onClick={() => onSelect(c.id)}>
          
            <div className="pl-chat__row">
              <span className="pl-chat__title">{c.title}</span>
              <span
              className="pl-chat__trash"
              onClick={(e) => {e.stopPropagation();onDelete(c.id);}}
              title="Delete">
              
                <PIcon.Trash />
              </span>
            </div>
            <div className="pl-chat__meta">
              {c.itinerary ?
            <>
                  <PIcon.Pin />
                  <span>{(c.itinerary.destination || '').split(',')[0] || '—'}</span>
                  <span className="dot">·</span>
                  <span>{c.messages.length} msg</span>
                </> :

            <>
                  <span className="pulse-dot" />
                  <span>Planning…</span>
                </>
            }
              <span className="dot">·</span>
              <span>{timeAgo(c.createdAt)}</span>
            </div>
          </button>
        )}
      </div>

      <div className="pl-sidebar__foot">
        <div className="pl-tip">
          <strong>Tip ·</strong> Be specific: origin, dates, budget, who's coming, what you love.
        </div>
      </div>
    </aside>);

}

// =========================================================================
// Composer — used in both empty state and active state
// =========================================================================
function Composer({ value, onChange, onSubmit, placeholder, big, disabled }) {
  const ref = React.useRef();
  React.useEffect(() => {if (big && ref.current) ref.current.focus();}, [big]);
  return (
    <div className={`pl-composer ${big ? 'pl-composer--big' : ''}`}>
      <div className="pl-composer__icon">
        <PIcon.Sparkle />
      </div>
      <textarea
        ref={ref}
        rows={big ? 3 : 1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !disabled) onSubmit();
          }
        }} />
      
      <button
        className="pl-composer__send"
        disabled={!value.trim() || disabled}
        onClick={onSubmit}
        title="Send">
        
        <PIcon.ArrowUp />
      </button>
    </div>);

}

// =========================================================================
// Empty state — landing view, no plan yet
// =========================================================================
function EmptyState({ onSubmit }) {
  const [val, setVal] = React.useState('');
  const submit = () => {if (val.trim()) onSubmit(val.trim());};

  return (
    <div className="pl-empty">
      <div className="pl-clouds" aria-hidden="true">
        <span className="pl-cloud pl-cloud--1"/>
        <span className="pl-cloud pl-cloud--2"/>
        <span className="pl-cloud pl-cloud--3"/>
        <span className="pl-cloud pl-cloud--4"/>
        <span className="pl-cloud pl-cloud--5"/>
        <span className="pl-cloud pl-cloud--6"/>
      </div>
      <div className="pl-empty__inner" data-comment-anchor="a55fa76f2a-div-166-7">
        <div className="pl-empty__orb">
          <span className="ring" />
          <span className="ring ring--2" />
          <span className="core"><PIcon.Sparkle /></span>
        </div>
        <div className="pl-empty__badge">
          <PIcon.Globe /> Al Rais Trip Planner AI
        </div>
        <h1 className="pl-empty__title">Where to next?</h1>
        <p className="pl-empty__sub">
          Tell me where you're going and I'll build a complete plan — flights, hotel,
          day-by-day, and a budget you can actually book.
        </p>

        <div className="pl-empty__composer">
          <Composer
            value={val}
            onChange={setVal}
            onSubmit={submit}
            placeholder="Try: Plan a 7-day trip from DXB to Italy — food, art, ~$4k for two"
            big />
          
          <div className="pl-empty__hint" data-comment-anchor="3010d6eff4-div-190-11">
            <span><kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for new line</span>
            <span>Powered by Al Rais AI</span>
          </div>
        </div>

        <div className="pl-empty__sugg-label">Or start from an idea</div>
        <div className="pl-empty__sugg">
          {SUGGESTIONS.map((s, i) =>
          <button key={i} className="pl-sugg" onClick={() => onSubmit(s.t)}>
              <span className="ico">{s.ico}</span>
              <span className="t">{s.t}</span>
            </button>
          )}
        </div>
      </div>
    </div>);

}

// =========================================================================
// Active chat — shows thread + itinerary + refine composer
// =========================================================================
function MessageBubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="pl-msg pl-msg--user">
        <div className="pl-msg__bubble">{msg.text}</div>
      </div>);

  }
  return (
    <div className="pl-msg pl-msg--ai">
      <div className="pl-msg__avatar"><PIcon.Sparkle /></div>
      <div className="pl-msg__bubble">{msg.text}</div>
    </div>);

}

function PlanningCard({ step }) {
  const steps = [
  'Understanding your request',
  'Searching flights',
  'Matching hotels in your budget',
  'Designing your day-by-day plan',
  'Polishing the itinerary'];

  return (
    <div className="pl-planning">
      <div className="pl-planning__head">
        <div className="pl-planning__orb" />
        <div>
          <div className="t">Crafting your itinerary…</div>
          <div className="s">Working on flights, hotels, and a day-by-day plan.</div>
        </div>
      </div>
      <div className="pl-planning__steps">
        {steps.map((s, i) => {
          const idx = steps.indexOf(step);
          const state = i < idx ? 'done' : i === idx ? 'active' : 'wait';
          return (
            <div key={s} className={`pl-planning__step is-${state}`}>
              <span className="bullet">
                {state === 'done' ? '✓' : state === 'active' ? <span className="ring-spin" /> : ''}
              </span>
              <span>{s}</span>
            </div>);

        })}
      </div>
    </div>);

}

function ActiveChat({ chat, pending, loadingStep, onRefine }) {
  const [val, setVal] = React.useState('');
  const scrollRef = React.useRef();

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages.length, pending]);

  const submit = () => {
    if (!val.trim() || pending) return;
    onRefine(val.trim());
    setVal('');
  };

  return (
    <div className="pl-active">
      <div className="pl-active__scroll" ref={scrollRef}>
        <div className="pl-active__thread">
          {chat.messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
          {pending && <PlanningCard step={loadingStep} />}
        </div>

        {chat.itinerary && !pending &&
        <div className="pl-active__itin">
            {/* Reuse the existing ItineraryView */}
            <ItineraryView data={chat.itinerary} prompt={chat.messages[0]?.text} />
          </div>
        }
      </div>

      <div className="pl-active__composer-wrap">
        <Composer
          value={val}
          onChange={setVal}
          onSubmit={submit}
          placeholder={
          chat.itinerary ?
          "Refine — e.g. 'make it cheaper', 'add a snorkel day', 'swap hotel for boutique'" :
          "Add detail to your request…"
          }
          disabled={pending} />
        
        <div className="pl-active__quick">
          {[
          'Make it cheaper',
          'Add 2 more days',
          'Upgrade to business class',
          'Swap to a boutique hotel',
          'More cultural activities'].
          map((q) =>
          <button key={q} className="pl-quick" disabled={pending}
          onClick={() => {if (!pending) {onRefine(q);}}}>
              {q}
            </button>
          )}
        </div>
      </div>
    </div>);

}

// =========================================================================
// Shell — wires it all together
// =========================================================================
function PlannerShell() {
  const [chats, setChats] = React.useState(loadChats);
  const [activeId, setActiveId] = React.useState(null);
  const [pending, setPending] = React.useState(false);
  const [loadingStep, setLoadingStep] = React.useState('Understanding your request');

  React.useEffect(() => {saveChats(chats);}, [chats]);

  // Pick up a pending prompt from the home hero — auto-starts a new chat
  React.useEffect(() => {
    const pending = sessionStorage.getItem('alrais.aiPrompt');
    sessionStorage.removeItem('alrais.aiPrompt');
    sessionStorage.removeItem('alrais.itinerary');
    if (pending && pending.trim()) {
      handleNewPrompt(pending.trim());
    }
    // eslint-disable-next-line
  }, []);

  const active = chats.find((c) => c.id === activeId) || null;

  async function generateAndAttach(chatId, fullPrompt) {
    setPending(true);
    setLoadingStep('Understanding your request');
    const steps = [
    'Understanding your request',
    'Searching flights',
    'Matching hotels in your budget',
    'Designing your day-by-day plan',
    'Polishing the itinerary'];

    let i = 0;
    const tick = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1);
      setLoadingStep(steps[i]);
    }, 1400);
    try {
      const data = await generateItinerary(fullPrompt);
      setChats((cs) => cs.map((c) => c.id === chatId ? {
        ...c,
        itinerary: data,
        title: data.destination ?
        `${c.firstOrigin || 'Trip'} → ${data.destination.split(',')[0]}` :
        c.title,
        messages: [...c.messages, {
          role: 'assistant',
          text: data.summary || `Here's a ${data.durationDays}-day plan for ${data.destination}.`,
          ts: Date.now()
        }]
      } : c));
    } finally {
      clearInterval(tick);
      setPending(false);
    }
  }

  async function handleNewPrompt(prompt) {
    const id = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
    const newChat = {
      id,
      title: deriveTitle(prompt),
      createdAt: Date.now(),
      messages: [{ role: 'user', text: prompt, ts: Date.now() }],
      itinerary: null
    };
    setChats((cs) => [newChat, ...cs]);
    setActiveId(id);
    await generateAndAttach(id, prompt);
  }

  async function handleRefine(prompt) {
    if (!active || pending) return;
    const chatId = active.id;
    setChats((cs) => cs.map((c) => c.id === chatId ? {
      ...c,
      messages: [...c.messages, { role: 'user', text: prompt, ts: Date.now() }]
    } : c));
    // Build a context-aware prompt
    const ctx = active.messages.map((m) => m.text).join(' / ');
    const fullPrompt = `Previous request: ${ctx}\nRefinement: ${prompt}\nReturn a fully updated itinerary JSON reflecting the refinement.`;
    await generateAndAttach(chatId, fullPrompt);
  }

  function deleteChat(id) {
    setChats((cs) => cs.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="planner-app">
      <Sidebar
        chats={chats}
        activeId={activeId}
        onNew={() => setActiveId(null)}
        onSelect={setActiveId}
        onDelete={deleteChat} />
      
      <main className="planner-main">
        {!active ?
        <EmptyState onSubmit={handleNewPrompt} /> :
        <ActiveChat
          chat={active}
          pending={pending}
          loadingStep={loadingStep}
          onRefine={handleRefine} />

        }
      </main>
    </div>);

}

Object.assign(window, { PlannerShell });