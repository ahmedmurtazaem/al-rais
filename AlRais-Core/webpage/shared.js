/* =========================================================
   Al Rais Middleware Demo — shared animation + interaction primitives
   ========================================================= */

(function(){
  'use strict';

  // ---------- Reveal on scroll ----------
  // Use rAF scroll polling rather than IntersectionObserver (which
  // misbehaves in some iframe sandboxes — silent no-fire callbacks).
  const revealList = [];
  function checkReveals(){
    const vh = window.innerHeight;
    for (const el of revealList){
      if (el.classList.contains('in')) continue;
      const r = el.getBoundingClientRect();
      // Trigger when element top is within viewport (with a 80px nudge from bottom)
      if (r.top < vh - 80 && r.bottom > 0){
        el.classList.add('in');
        // Step-by-step children
        const steps = el.querySelectorAll('[data-step]');
        steps.forEach((s, i) => setTimeout(() => s.classList.add('on'), i * 120));
      }
    }
  }
  function bindReveal(){
    document.querySelectorAll('.reveal').forEach(el => revealList.push(el));
    checkReveals();
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { checkReveals(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', checkReveals);
  }

  // Once-per-element trigger when section enters viewport (replaces IO usage).
  // Callback fires once when 30%+ of `el` is in viewport.
  function onEnter(el, cb){
    if (!el) return;
    let fired = false;
    function check(){
      if (fired) return;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      const ratio = r.height > 0 ? visible / Math.min(r.height, vh) : 0;
      if (ratio > 0.3){
        fired = true;
        cb();
        window.removeEventListener('scroll', check);
      }
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    // Initial check (e.g. element already in viewport on load)
    setTimeout(check, 50);
  }

  // ---------- Topbar scroll state ----------
  function bindTopbar(){
    const bar = document.querySelector('.topbar');
    if (!bar) return;
    const handler = () => bar.classList.toggle('scrolled', window.scrollY > 12);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
  }

  // ---------- Particle field ----------
  function spawnParticles(container, count = 14){
    if (!container) return;
    const w = container.offsetWidth;
    for (let i = 0; i < count; i++){
      const s = document.createElement('span');
      const size = 3 + Math.random() * 5;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = (Math.random() * w) + 'px';
      s.style.bottom = (-20 - Math.random() * 60) + 'px';
      s.style.animationDuration = (10 + Math.random() * 12) + 's';
      s.style.animationDelay = (Math.random() * 8) + 's';
      s.style.opacity = (0.3 + Math.random() * 0.6);
      container.appendChild(s);
    }
  }
  function bindParticles(){
    document.querySelectorAll('[data-particles]').forEach(el => {
      const count = parseInt(el.dataset.particles || '14', 10);
      spawnParticles(el, count);
    });
  }

  // ---------- Connect SVG between two elements ----------
  // Draws a quadratic Bezier path between two anchor elements inside a parent.
  function drawConnector(svg, fromEl, toEl, opts = {}){
    if (!svg || !fromEl || !toEl) return null;
    const svgRect = svg.getBoundingClientRect();
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const x1 = a.left + a.width/2 - svgRect.left;
    const y1 = a.top + a.height/2 - svgRect.top;
    const x2 = b.left + b.width/2 - svgRect.left;
    const y2 = b.top + b.height/2 - svgRect.top;
    const cx = (x1 + x2) / 2;
    const dxAbs = Math.abs(x2 - x1);
    const cy1 = y1 + (opts.bow || 0);
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    const d = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', opts.stroke || 'rgba(30,64,160,0.32)');
    path.setAttribute('stroke-width', opts.width || 1.5);
    if (opts.dashed) path.setAttribute('stroke-dasharray', '4 6');
    if (opts.cls) path.setAttribute('class', opts.cls);
    svg.appendChild(path);
    return path;
  }

  // ---------- Auto-fit hero connectors on resize ----------
  // Pattern: declare data-connector pairs in HTML, this re-renders them on layout changes.
  function renderHeroConnectors(stage){
    const svg = stage.querySelector('svg.lines');
    if (!svg) return;
    // Clear
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const hub = stage.querySelector('[data-hub]');
    if (!hub) return;
    const nodes = stage.querySelectorAll('[data-spoke]');
    nodes.forEach((node, i) => {
      const side = node.dataset.spoke;  // 'left' or 'right'
      const path = drawConnector(svg, side === 'left' ? node : hub, side === 'left' ? hub : node, {
        stroke: 'rgba(30,64,160,0.22)', width: 1.4
      });
      if (path){
        // Add a pulse layer on top
        const pulse = path.cloneNode();
        pulse.setAttribute('stroke', 'rgba(30,64,160,0.7)');
        pulse.setAttribute('stroke-width', '2');
        pulse.setAttribute('stroke-linecap', 'round');
        pulse.setAttribute('class', 'pulse-path');
        pulse.style.animationDelay = (i * 0.16) + 's';
        svg.appendChild(pulse);
      }
    });
  }

  function bindHero(){
    document.querySelectorAll('[data-hero-stage]').forEach(stage => {
      // small delay so fonts/layout settle
      requestAnimationFrame(() => renderHeroConnectors(stage));
      // re-render on resize
      const ro = new ResizeObserver(() => renderHeroConnectors(stage));
      ro.observe(stage);
    });
  }

  // ---------- Section index badge (auto-numbers .scene[id]) ----------
  function bindSecIdx(){
    const scenes = document.querySelectorAll('.scene[data-idx]');
    scenes.forEach(s => {
      const idx = s.dataset.idx;
      const total = s.dataset.total || scenes.length;
      const badge = document.createElement('div');
      badge.className = 'sec-idx';
      badge.textContent = idx + ' / ' + total;
      s.appendChild(badge);
    });
  }

  // ---------- Smooth-scroll for in-page anchors ----------
  function bindAnchors(){
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target){
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#'+id);
      }
    });
  }

  // ---------- Public API ----------
  window.AlRais = {
    drawConnector,
    renderHeroConnectors,
    spawnParticles,
    onEnter,
    init(){
      bindReveal();
      bindTopbar();
      bindParticles();
      bindSecIdx();
      bindAnchors();
      bindHero();
    }
  };

  document.addEventListener('DOMContentLoaded', () => window.AlRais.init());
  // If DOM already loaded (script ran with defer after DCL), init immediately.
  if (document.readyState !== 'loading') window.AlRais.init();
})();
