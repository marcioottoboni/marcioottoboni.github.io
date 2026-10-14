/* Funções compartilhadas por todas as páginas do site */
(function(){
  'use strict';

  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['54,226,196', '91,140,255'];

  // ===== Tema claro/escuro (a escolha fica salva no navegador) =====
  const root = document.body;
  const themeBtn = document.getElementById('themeToggle');
  function setTheme(t){
    root.setAttribute('data-theme', t);
    if(themeBtn) themeBtn.textContent = t === 'dark' ? '🌙' : '☀️';
    try{ localStorage.setItem('theme', t); }catch(err){}
  }
  let current = 'dark';
  try{ if(localStorage.getItem('theme') === 'light') current = 'light'; }catch(err){}
  root.setAttribute('data-theme', current);
  if(themeBtn){
    themeBtn.textContent = current === 'dark' ? '🌙' : '☀️';
    themeBtn.addEventListener('click', () => {
      current = current === 'dark' ? 'light' : 'dark';
      setTheme(current);
    });
  }

  // ===== Menu mobile =====
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  if(burger && mobileMenu){
    burger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));
  }

  // ===== Entrada escalonada dos elementos =====
  const revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--d', (sibs.indexOf(el) % 6) * 0.08 + 's');
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // ===== Rede de pontos animada =====
  function makeNetwork(host, canvas, cfg){
    const ctx = canvas.getContext && canvas.getContext('2d');
    if(!ctx) return null;
    let w = 0, h = 0, nodes = [], running = false, raf = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    function draw(){
      ctx.clearRect(0, 0, w, h);
      const k = document.body.getAttribute('data-theme') === 'light' ? 1.6 : 1;
      const a = cfg.alpha * k;
      const L = cfg.link, M = cfg.mouseRadius;

      for(let i = 0; i < nodes.length; i++){
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if(n.x < 0 || n.x > w){ n.vx *= -1; n.x = Math.max(0, Math.min(w, n.x)); }
        if(n.y < 0 || n.y > h){ n.vy *= -1; n.y = Math.max(0, Math.min(h, n.y)); }

        if(mouse.active){
          const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
          if(d < M && d > 1){
            n.x += (dx / d) * 0.35;
            n.y += (dy / d) * 0.35;
            ctx.strokeStyle = 'rgba(' + n.c + ',' + ((1 - d / M) * 0.55 * a) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }

        for(let j = i + 1; j < nodes.length; j++){
          const m = nodes[j];
          const d = Math.hypot(n.x - m.x, n.y - m.y);
          if(d < L){
            ctx.strokeStyle = 'rgba(' + n.c + ',' + ((1 - d / L) * 0.28 * a) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
          }
        }

        ctx.fillStyle = 'rgba(' + n.c + ',' + (0.75 * Math.min(a, 1.2)) + ')';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    function resize(){
      const r = host.getBoundingClientRect();
      if(r.width < 2 || r.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(cfg.max, Math.max(cfg.min, (w * h) / cfg.density)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * cfg.speed,
        vy: (Math.random() - 0.5) * cfg.speed,
        r: Math.random() * 1.5 + 0.7,
        c: COLORS[Math.random() < 0.5 ? 0 : 1]
      }));
      if(REDUCE) draw();
    }

    function loop(){
      if(!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    }

    // Só anima enquanto a seção está visível na tela
    if(!REDUCE){
      new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if(en.isIntersecting){
            if(!running){ running = true; loop(); }
          } else {
            running = false; cancelAnimationFrame(raf);
          }
        });
      }, { threshold: 0 }).observe(host);
    }

    if('ResizeObserver' in window){
      let t = 0;
      new ResizeObserver(() => { cancelAnimationFrame(t); t = requestAnimationFrame(resize); }).observe(host);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    host.addEventListener('pointermove', (e) => {
      if(e.pointerType && e.pointerType !== 'mouse') return;
      const r = host.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    });
    host.addEventListener('pointerleave', () => {
      mouse.active = false; mouse.x = mouse.y = -9999;
    });

    return { resize };
  }

  // Rede mais leve ao fundo de cada seção (o topo da página inicial usa a sua própria)
  document.querySelectorAll('section:not(.hero)').forEach((sec) => {
    const cv = document.createElement('canvas');
    cv.className = 'net-canvas';
    cv.setAttribute('aria-hidden', 'true');
    sec.insertBefore(cv, sec.firstChild);
    makeNetwork(sec, cv, { min: 14, max: 46, density: 26000, link: 120, mouseRadius: 150, speed: 0.25, alpha: 0.55 });
  });

  // ===== Brilho que segue o mouse dentro dos cards =====
  const CARD_SEL = '.about-point,.dominio,.habilidade-card,.tl-card,.proj-card,.cert-card,.stat-card,.test-card,.blog-card,.contact-card,.pipe-step,.info-card,.proj-nav-card,.result-banner';
  let lastCard = null;
  document.addEventListener('pointermove', (e) => {
    if(e.pointerType && e.pointerType !== 'mouse') return;
    const c = e.target.closest ? e.target.closest(CARD_SEL) : null;
    if(lastCard && lastCard !== c){
      lastCard.style.removeProperty('--cx');
      lastCard.style.removeProperty('--cy');
    }
    lastCard = c || null;
    if(c){
      const r = c.getBoundingClientRect();
      c.style.setProperty('--cx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--cy', (e.clientY - r.top) + 'px');
    }
  }, { passive: true });

  // ===== Barra de progresso de leitura e botão de voltar ao topo =====
  const prog = document.getElementById('scrollProgress');
  const backTop = document.getElementById('backTop');
  function onScroll(){
    if(prog){
      const max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + '%';
    }
    if(backTop){
      if(window.scrollY > 500) backTop.classList.add('show');
      else backTop.classList.remove('show');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if(backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ===== Menu: destaca a seção que está na tela (páginas com âncoras internas) =====
  const navLinks = document.querySelectorAll('.nav-links a');
  const linkByHash = {};
  navLinks.forEach(a => { linkByHash[a.getAttribute('href')] = a; });
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(en.isIntersecting){
        const l = linkByHash['#' + en.target.id];
        if(l){
          navLinks.forEach(x => x.classList.remove('active'));
          l.classList.add('active');
        }
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach(sec => spy.observe(sec));

  window.Site = { makeNetwork: makeNetwork, REDUCE: REDUCE };
})();
