/* Comportamentos exclusivos da página inicial */
(function(){
  'use strict';
  const makeNetwork = window.Site.makeNetwork;
  const REDUCE = window.Site.REDUCE;

  // ===== Efeito de digitação =====
  const phrases = [
    'Profissional de Tecnologia especializado em Dados.',
    'Cloud Computing, AWS & Soluções Escaláveis.',
    'Engenharia de Dados: Python, SQL, dbt, Airflow.',
    'Transformando sistemas críticos em insights confiáveis.'
  ];
  const typedEl = document.getElementById('typed');
  if(typedEl){
    let pIdx = 0, cIdx = 0, deleting = false;
    (function typeLoop(){
      const phrase = phrases[pIdx];
      if(!deleting){
        cIdx++;
        typedEl.textContent = phrase.slice(0, cIdx);
        if(cIdx === phrase.length){ deleting = true; setTimeout(typeLoop, 1800); return; }
      } else {
        cIdx--;
        typedEl.textContent = phrase.slice(0, cIdx);
        if(cIdx === 0){ deleting = false; pIdx = (pIdx + 1) % phrases.length; }
      }
      setTimeout(typeLoop, deleting ? 30 : 55);
    })();
  }

  // ===== Barras de habilidades =====
  const habilidadeBars = document.querySelectorAll('.habilidade-bar i');
  const habilidadeIo = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.style.width = e.target.dataset.w + '%';
        habilidadeIo.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  habilidadeBars.forEach(b => habilidadeIo.observe(b));

  // ===== Contadores das estatísticas =====
  const statNums = document.querySelectorAll('.stat-num');
  const statIo = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        const el = e.target;
        const target = parseInt(el.dataset.target, 10);
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 50));
        const t = setInterval(() => {
          cur += step;
          if(cur >= target){ cur = target; clearInterval(t); }
          el.textContent = cur;
        }, 30);
        statIo.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statNums.forEach(s => statIo.observe(s));

  // ===== Topo: rede mais densa, holofote, inclinação 3D da foto e parallax dos selos =====
  const hero = document.getElementById('home');
  const canvas = document.getElementById('heroCanvas');
  if(hero && canvas){
    makeNetwork(hero, canvas, { min: 30, max: 90, density: 16000, link: 130, mouseRadius: 170, speed: 0.35, alpha: 1 });

    const frameEl = document.getElementById('photoFrame');
    const badges = hero.querySelectorAll('.float-badge');
    hero.addEventListener('pointermove', (e) => {
      if(e.pointerType && e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      hero.style.setProperty('--mx', x + 'px');
      hero.style.setProperty('--my', y + 'px');
      if(REDUCE) return;
      const nx = (x / r.width - 0.5) * 2, ny = (y / r.height - 0.5) * 2;
      if(frameEl) frameEl.style.transform = 'perspective(900px) rotateY(' + (nx * 7) + 'deg) rotateX(' + (-ny * 7) + 'deg)';
      badges.forEach((b, i) => {
        const d = (i % 2 ? -1 : 1) * 14;
        b.style.translate = (nx * d) + 'px ' + (ny * d) + 'px';
      });
    });
    hero.addEventListener('pointerleave', () => {
      if(frameEl) frameEl.style.transform = '';
      badges.forEach(b => { b.style.translate = ''; });
    });
  }

  // ===== Formulário de contato (Web3Forms) =====
  const form = document.getElementById('contactForm');
  const formMsg = document.getElementById('formMsg');
  if(form && formMsg){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Enviando...';
      formMsg.classList.remove('success', 'error');
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        });
        const data = await res.json();
        if (data.success) {
          formMsg.textContent = '✓ Mensagem enviada com sucesso! Entrarei em contato em breve.';
          formMsg.classList.add('success');
          form.reset();
        } else {
          formMsg.textContent = '✗ Não foi possível enviar. Tente novamente ou me escreva diretamente por e-mail.';
          formMsg.classList.add('error');
        }
      } catch (err) {
        formMsg.textContent = '✗ Erro de conexão. Tente novamente em instantes.';
        formMsg.classList.add('error');
      }
      formMsg.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'Enviar mensagem';
      setTimeout(() => formMsg.classList.remove('show'), 6000);
    });
  }
})();
