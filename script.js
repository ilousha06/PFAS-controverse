/* ================================================================
   PFAS : Scandale ou Surmédia — Script principal
   ESIEE Paris · Les Totally Spies · 2024–2025
   ================================================================ */

'use strict';

/* ────────────────────────────────────────────────────────────────
   1. LOADER — se masque dès que le DOM est prêt (pas les fonts CDN)
   ──────────────────────────────────────────────────────────────── */
function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.classList.add('hidden');
  triggerVisibleReveals();
}

// Masquer le loader dès que le DOM est chargé (n'attend pas les CDN)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(hideLoader, 900));
} else {
  // DOM déjà prêt
  setTimeout(hideLoader, 900);
}

// Filet de sécurité absolu : tout afficher après 3s quoi qu'il arrive
setTimeout(() => {
  hideLoader();
  document.querySelectorAll('.reveal-up').forEach(el => el.classList.add('visible'));
}, 3000);

/* ────────────────────────────────────────────────────────────────
   2. PARTICLE CANVAS — fond dynamique discret
   ──────────────────────────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], animId;

  // Couleurs inspirées de la photo : ambre industriel, bleu eau, blanc brume
  const CONFIG = {
    count: 60,
    maxRadius: 1.8,
    speed: 0.22,
    lineLen: 110,
    color:    '201,132,26', // ambre/or  — fumée industrielle
    colorAlt: '60,110,150', // bleu-eau  — reflet rivière
    colorAlt2:'200,210,220' // blanc-brume atmosphérique
  };

  class Particle {
    constructor() { this.reset(true) }
    reset(init = false) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : (Math.random() < .5 ? -10 : H + 10);
      this.r = Math.random() * CONFIG.maxRadius + .5;
      const a = Math.random() * Math.PI * 2;
      const s = CONFIG.speed * (.5 + Math.random());
      this.vx = Math.cos(a) * s;
      this.vy = Math.sin(a) * s;
      this.alpha = .10 + Math.random() * .25;
      const r = Math.random();
      this.c = r < .5 ? CONFIG.color : r < .75 ? CONFIG.colorAlt : CONFIG.colorAlt2;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.c},${this.alpha})`;
      ctx.fill();
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < CONFIG.lineLen) {
          const a = (1 - dist / CONFIG.lineLen) * .12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${CONFIG.color},${a})`;
          ctx.lineWidth = .5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    animId = requestAnimationFrame(loop);
  }

  function init() {
    resize();
    particles = Array.from({ length: CONFIG.count }, () => new Particle());
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  window.addEventListener('resize', debounce(init, 200));
  init();
})();

/* ────────────────────────────────────────────────────────────────
   3. NAVBAR — scroll style + burger
   ──────────────────────────────────────────────────────────────── */
(function initNavbar() {
  const nav    = document.getElementById('navbar');
  const burger = document.getElementById('navBurger');
  const links  = document.getElementById('navLinks');
  if (!nav) return;

  // Scroll style
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    updateActiveLink();
    toggleBackToTop();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Burger toggle
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Sous-menu Arguments — toggle au clic sur mobile
    links.querySelectorAll('.has-sub > a').forEach(a => {
      a.addEventListener('click', e => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          a.closest('.has-sub').classList.toggle('sub-open');
        }
      });
    });

    // Fermer menu au clic sur un lien (sauf parent sous-menu)
    links.querySelectorAll('a:not(.has-sub > a)').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        links.querySelectorAll('.has-sub').forEach(li => li.classList.remove('sub-open'));
      });
    });
  }

  // Active link au scroll
  function updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    document.querySelectorAll('.nl').forEach(a => {
      const href = a.getAttribute('href');
      a.classList.toggle('active', href === '#' + current);
    });
  }
})();

/* ────────────────────────────────────────────────────────────────
   4. SMOOTH SCROLL
   ──────────────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ────────────────────────────────────────────────────────────────
   5. SCROLL REVEAL (Intersection Observer)
   ──────────────────────────────────────────────────────────────── */
function triggerVisibleReveals() {
  document.querySelectorAll('.reveal-up').forEach(el => {
    if (isInViewport(el)) el.classList.add('visible');
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

function isInViewport(el) {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}

/* ────────────────────────────────────────────────────────────────
   6. ANIMATED COUNTERS — setInterval polling, compatible file://
   ──────────────────────────────────────────────────────────────── */
var _cDone = {}; // map index → true quand animé

function _formatNum(n) {
  // Format ex: 10000 → "10 000" (espace insécable)
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function _startCounter(el, target) {
  var dur   = target > 999 ? 2000 : 1400;
  var t0    = Date.now();
  var timer = setInterval(function () {
    var p = Math.min((Date.now() - t0) / dur, 1);
    var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
    el.textContent = _formatNum(v);
    if (p >= 1) {
      clearInterval(timer);
      el.textContent = _formatNum(target);
      /* pop visuel sur le parent */
      var wrap = el.parentNode;
      if (wrap) { wrap.style.transform = 'scale(1.12)'; }
      setTimeout(function () {
        if (wrap) wrap.style.transform = '';
      }, 220);
    }
  }, 16);
}

function _checkCounters() {
  var items = document.querySelectorAll('.counter[data-to]');
  var remaining = 0;
  for (var i = 0; i < items.length; i++) {
    if (_cDone[i]) continue;
    var r = items[i].getBoundingClientRect();
    /* visible dès que le haut de l'élément passe sous le bas du viewport */
    if (r.top < window.innerHeight && r.bottom > 0) {
      _cDone[i] = true;
      var n = parseInt(items[i].getAttribute('data-to'), 10);
      if (!isNaN(n)) _startCounter(items[i], n);
    } else {
      remaining++;
    }
  }
  return remaining;
}

/* Polling toutes les 200ms — s'arrête quand tout est animé */
var _cTimer = setInterval(function () {
  if (_checkCounters() === 0) clearInterval(_cTimer);
}, 200);

/* Aussi sur chaque scroll pour réactivité */
window.addEventListener('scroll', _checkCounters, { passive: true });

/* ────────────────────────────────────────────────────────────────
   7. TABS (Acteurs) — version directe sans closest
   ──────────────────────────────────────────────────────────────── */
function switchTab(tabId) {
  // 1. Masquer tous les panneaux
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.remove('tab-visible');
    p.style.display = 'none';
  });

  // 2. Désactiver tous les boutons
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('tab-active');
    b.setAttribute('aria-selected', 'false');
  });

  // 3. Afficher le panneau cible
  const panel = document.getElementById('tab-' + tabId);
  if (panel) {
    panel.classList.add('tab-visible');
    panel.style.display = 'block';
    // Forcer la visibilité de tous les éléments reveal-up dans ce panneau
    panel.querySelectorAll('.reveal-up').forEach(el => {
      el.classList.add('visible');
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }

  // 4. Activer le bouton correspondant
  const activeBtn = document.querySelector('[data-tab="' + tabId + '"]');
  if (activeBtn) {
    activeBtn.classList.add('tab-active');
    activeBtn.setAttribute('aria-selected', 'true');
  }
}

// Initialisation : s'assurer que tous les panneaux sauf "for" sont masqués
document.querySelectorAll('.tab-panel').forEach(p => {
  if (!p.classList.contains('tab-visible')) {
    p.style.display = 'none';
  }
});

// Attacher les écouteurs de clic
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ────────────────────────────────────────────────────────────────
   8. BACK TO TOP
   ──────────────────────────────────────────────────────────────── */
var btt = document.getElementById('backToTop');
function toggleBackToTop() {
  if (!btt) return;
  btt.classList.toggle('visible', window.scrollY > 400);
}
if (btt) {
  btt.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );
}

/* ────────────────────────────────────────────────────────────────
   9. HERO TITLE — animation lettre par lettre
   ──────────────────────────────────────────────────────────────── */
(function heroParallax() {
  /* ── Hero : 4 couches de profondeur ── */
  var bgWrap = document.querySelector('.hero-bg-wrap');
  var fog    = document.querySelector('.hero-fog');
  var water  = document.querySelector('.hero-water');
  var body   = document.querySelector('.hero-body');

  /* ── Blobs globaux : flottent sur toute la page ── */
  var blobs = Array.from(document.querySelectorAll('.px-blob[data-px]'));

  var H       = window.innerHeight;
  var ticking = false;

  function update() {
    var y = window.scrollY;

    /* Blobs — actifs sur toute la hauteur de la page */
    blobs.forEach(function(b) {
      var speed = parseFloat(b.getAttribute('data-px')) || 0;
      b.style.transform = 'translateY(' + (y * speed) + 'px)';
    });

    /* Hero — seulement dans le premier écran */
    if (y <= H * 1.5) {
      /* bgWrap : zoom out progressif → effet profondeur */
      if (bgWrap) {
        var scale = 1 - y / (H * 8);
        bgWrap.style.transform = 'translateY(' + (y * 0.35) + 'px) scale(' + scale + ')';
      }
      if (fog)   fog.style.transform   = 'translateY(' + (y * 0.12) + 'px)';
      if (water) water.style.transform = 'translateY(' + (y * 0.6)  + 'px)';
      if (body) {
        body.style.transform = 'translateY(' + (y * 0.20) + 'px)';
        body.style.opacity   = String(Math.max(0, 1 - y / (H * 0.72)));
      }
    }
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', function() { H = window.innerHeight; });
  update(); /* état initial */
})();

/* ────────────────────────────────────────────────────────────────
   10. TIMELINE — animation séquentielle
   ──────────────────────────────────────────────────────────────── */
(function initTimeline() {
  const items = document.querySelectorAll('.tl-item');
  const tlObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelector('.tl-card').style.opacity = '1';
        entry.target.querySelector('.tl-card').style.transform = 'translateY(0)';
        tlObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  items.forEach((item, i) => {
    const card = item.querySelector('.tl-card');
    if (!card) return;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity .6s ease ${i * 0.05}s, transform .6s ease ${i * 0.05}s`;
    tlObserver.observe(item);
  });
})();

/* ────────────────────────────────────────────────────────────────
   11. CARD HOVER — effet magnétique léger
   ──────────────────────────────────────────────────────────────── */
document.querySelectorAll('.glass-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform = `translateY(-4px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.5s ease, background 0.35s, box-shadow 0.35s, border-color 0.35s';
  });
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.1s ease, background 0.35s, box-shadow 0.35s, border-color 0.35s';
  });
});

/* ────────────────────────────────────────────────────────────────
   12. STATS BAR — animation des nombres au premier scroll
   ──────────────────────────────────────────────────────────────── */
// Les .counter de la stats bar utilisent data-to (même observer que section 6)
// On ajoute aussi un attribut data-to sur les stats du hero pour le même effet
document.querySelectorAll('.stat-val .counter').forEach(el => {
  // Déjà géré par counterObserver ci-dessus
});

/* ────────────────────────────────────────────────────────────────
   13. NAVIGATION PROGRESS BAR
   ──────────────────────────────────────────────────────────────── */
(function progressBar() {
  const bar = document.createElement('div');
  bar.style.cssText = `
    position:fixed;top:0;left:0;height:2px;width:0%;z-index:1100;
    background:linear-gradient(90deg,#C9841A,#E8A520);
    transition:width .1s linear;pointer-events:none;
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct   = total > 0 ? (window.scrollY / total) * 100 : 0;
    bar.style.width = pct + '%';
  }, { passive: true });
})();

/* ────────────────────────────────────────────────────────────────
   14. SECTION ENTRANCES — effet de fond coloré discret
   ──────────────────────────────────────────────────────────────── */
(function sectionGlow() {
  const secObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        if (id === 'arguments-pour') {
          entry.target.style.boxShadow = 'inset 0 0 120px rgba(46,204,113,.04)';
        } else if (id === 'arguments-contre') {
          entry.target.style.boxShadow = 'inset 0 0 120px rgba(231,76,60,.04)';
        }
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.section').forEach(sec => secObserver.observe(sec));
})();

/* ────────────────────────────────────────────────────────────────
   15. UTILITAIRES
   ──────────────────────────────────────────────────────────────── */

/** Debounce — évite les appels répétés lors du redimensionnement */
function debounce(fn, wait) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

/* ────────────────────────────────────────────────────────────────
   16. ACCESSIBILITÉ — fermer le menu burger avec Echap
   ──────────────────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const links  = document.getElementById('navLinks');
    const burger = document.getElementById('navBurger');
    if (links && links.classList.contains('open')) {
      links.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }
});

/* ────────────────────────────────────────────────────────────────
   17. TOOLTIP discret sur les icônes d'acteur (hover info)
   ──────────────────────────────────────────────────────────────── */
(function tooltips() {
  const tip = document.createElement('div');
  tip.style.cssText = `
    position:fixed;z-index:2000;
    background:rgba(18,18,26,.95);border:1px solid rgba(201,132,26,.4);
    color:#F0F0F5;font-size:.78rem;padding:6px 12px;border-radius:8px;
    pointer-events:none;opacity:0;transition:opacity .2s;
    max-width:200px;text-align:center;line-height:1.4;
    backdrop-filter:blur(8px);
  `;
  document.body.appendChild(tip);

  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', e => {
      tip.textContent = el.dataset.tooltip;
      tip.style.opacity = '1';
    });
    el.addEventListener('mousemove', e => {
      tip.style.left = (e.clientX + 14) + 'px';
      tip.style.top  = (e.clientY - 10) + 'px';
    });
    el.addEventListener('mouseleave', () => { tip.style.opacity = '0'; });
  });
})();

/* ────────────────────────────────────────────────────────────────
   18. LAZY LOADING — images (si ajoutées ultérieurement)
   ──────────────────────────────────────────────────────────────── */
if ('IntersectionObserver' in window) {
  const imgObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imgObserver.unobserve(img);
        }
      }
    });
  });
  document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
}

/* ────────────────────────────────────────────────────────────────
   19. FOOTER — année dynamique
   ──────────────────────────────────────────────────────────────── */
document.querySelectorAll('.year-auto').forEach(el => {
  el.textContent = new Date().getFullYear();
});

/* ────────────────────────────────────────────────────────────────
   20. PRINT STYLES — préparer la page pour impression
   ──────────────────────────────────────────────────────────────── */
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('.reveal-up').forEach(el => el.classList.add('visible'));
});

/* ────────────────────────────────────────────────────────────────
   FIN DU SCRIPT
   Tous les systèmes initialisés :
   ✓ Loader  ✓ Particules  ✓ Navbar  ✓ Smooth scroll
   ✓ Reveal  ✓ Counters   ✓ Tabs    ✓ Back-to-top
   ✓ Hero parallax         ✓ Timeline  ✓ Progress bar
   ✓ Section glows         ✓ Card 3D hover
   ──────────────────────────────────────────────────────────────── */
