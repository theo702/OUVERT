/* =========================================================
   Ouvert · scripts du site (toutes les pages)
   ========================================================= */

/* ---- À compléter ---------------------------------------- */
const CONFIG = {
  phone: '',        // ex. '+33600000000' (format international, sans espaces)
  phoneDisplay: ''  // ex. '06 00 00 00 00'
};

/* Clé Web3Forms (https://web3forms.com). Vide = le formulaire ouvre
   un mail pré-rempli vers contact@studio-ouvert.fr. */
const KEY = '';
const CONTACT_EMAIL = 'contact@studio-ouvert.fr';

/* Vrais avis clients : ils s'affichent dans les rails "Réalisation",
   avant la carte "Votre site ici".
   Exemple : { texte: "…", nom: "Prénom N.", metier: "Plombier", ville: "Annecy" } */
const AVIS = [];
/* --------------------------------------------------------- */

(function () {
  const root = document.documentElement;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const editMode = new URLSearchParams(location.search).has('edit') && window.self !== window.top;
  if (editMode) {
    root.classList.add('intro-ready', 'is-editing');
    const sc = document.createElement('script');
    sc.src = 'js/editor.js';
    document.body.appendChild(sc);
  }

  /* Année, téléphone */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  if (CONFIG.phone) {
    $$('[data-phone]').forEach(el => {
      el.href = 'tel:' + CONFIG.phone;
      el.textContent = CONFIG.phoneDisplay || CONFIG.phone;
      el.hidden = false;
      const wrap = el.closest('[data-phone-wrap]');
      if (wrap) wrap.hidden = false;
    });
  }

  /* Avis */
  $$('[data-avis-anchor]').forEach(anchor => {
    AVIS.forEach(a => {
      const fig = document.createElement('figure');
      fig.className = 'pcard pcard-avis';
      const q = document.createElement('blockquote');
      q.textContent = '« ' + a.texte + ' »';
      const cap = document.createElement('figcaption');
      const b = document.createElement('b');
      b.textContent = a.nom;
      cap.append(b, [a.metier, a.ville].filter(Boolean).join(' · '));
      fig.append(q, cap);
      anchor.before(fig);
    });
  });

  /* Menu mobile */
  const burger = $('.burger');
  const menu = $('#menu-mobile');
  if (burger && menu) {
    const set = open => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      menu.hidden = !open;
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { set(false); burger.focus(); } });
    window.addEventListener('resize', () => { if (window.innerWidth > 860) set(false); });
  }

  /* Nav : filet au scroll */
  const nav = $('.nav');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* FAQ : une seule ouverte à la fois */
  const faqs = $$('.faq-list details');
  faqs.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
  }));

  /* ---------- Formulaire de contact ---------- */
  const form = $('#contact-form');
  if (form) {
    const params = new URLSearchParams(location.search);
    const offre = params.get('offre');
    if (offre && form.offre) form.offre.value = offre;
    if (params.get('profil') === 'loueur' && form.activite) form.activite.value = 'Loueur courte durée';
    const status = $('#form-status');
    const say = (msg, cls) => { status.textContent = msg; status.className = 'form-status ' + (cls || ''); };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.botcheck && form.botcheck.checked) return;
      const data = Object.fromEntries(new FormData(form).entries());
      delete data.botcheck;
      const btn = form.querySelector('[type="submit"]');

      // 1) Enregistrement dans l'admin du site (/admin/)
      let saved = false;
      btn.disabled = true;
      say('Envoi en cours…');
      try {
        const r = await fetch('/api/devis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json();
        saved = r.ok && j.ok;
        if (!saved && r.status === 400 && j.message) { say(j.message, 'err'); btn.disabled = false; return; }
      } catch (err) { saved = false; }
      btn.disabled = false;

      // 2) Copie par mail via Web3Forms (si une clé est renseignée)
      if (KEY) {
        try {
          await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(Object.assign({ access_key: KEY, subject: 'Demande de devis · ' + data.nom, from_name: 'Site Ouvert' }, data))
          }).then(r => r.json()).then(j => { if (j.success) saved = true; });
        } catch (err) { /* l'enregistrement suffit */ }
      }
      if (saved) { form.reset(); say('Merci, votre demande est bien partie. Je vous réponds rapidement.', 'ok'); return; }

      if (!KEY) {
        const body = [
          'Nom : ' + data.nom,
          'Email : ' + data.email,
          data.telephone ? 'Téléphone : ' + data.telephone : '',
          'Activité : ' + data.activite,
          'Offre : ' + data.offre,
          '',
          data.message
        ].filter(l => l !== '').join('\n');
        location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Demande de devis · ' + data.nom) + '&body=' + encodeURIComponent(body);
        say('Votre messagerie s\'ouvre avec le message pré-rempli. Il ne reste qu\'à l\'envoyer.', 'ok');
        return;
      }

      say('L\'envoi n\'a pas marché. Écrivez-moi directement à ' + CONTACT_EMAIL + '.', 'err');
    });
  }

  /* ---------- Loueurs : bloc actif ---------- */
  const hostsGrid = $('.hosts-grid');
  const feats = $$('.feat');
  const slides = $$('.hp-slide');
  const bars = $$('.hp-progress i');
  const setFeat = i => {
    feats.forEach((f, k) => f.classList.toggle('is-active', k === i));
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    bars.forEach((b, k) => b.classList.toggle('is-done', k <= i));
  };

  const shelf = $('.shelf');
  const showAll = () => {
    root.classList.add('intro-ready');
    if (shelf) shelf.classList.add('is-running');
  };

  if (editMode) return;
  if (reduce || !window.gsap || !window.ScrollTrigger) { showAll(); return; }

  /* =======================================================
     Animations (GSAP + ScrollTrigger)
     ======================================================= */
  gsap.registerPlugin(ScrollTrigger);
  const EASE = 'power1.inOut';   // = cubic-bezier(0.455, 0.03, 0.515, 0.955)
  const mm = gsap.matchMedia();
  const has = s => !!$(s);

  function split(el) {
    const txt = el.textContent.trim();
    el.setAttribute('aria-label', txt);
    el.innerHTML = txt.split(/\s+/).map(w => '<span class="w" aria-hidden="true"><span class="w-in">' + w + '</span></span>').join(' ');
    return el.querySelectorAll('.w-in');
  }

  if (shelf) {
    const set = $('.shelf-set', shelf);
    const clone = set.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach(i => { i.alt = ''; i.loading = 'lazy'; });
    set.after(clone);
  }

  /* ---------- Intro ---------- */
  const title = $('.hero-title');
  const titleWords = title ? split(title) : [];
  const lights = $$('.brand-voyant, .eyebrow[data-intro] .voyant');
  const q = s => $$(s);
  gsap.set(titleWords, { yPercent: 110, scale: 1.2, transformOrigin: '0% 100%' });
  gsap.set(q('[data-intro="announce"]'), { yPercent: -100 });
  gsap.set(q('[data-intro="nav"]'), { opacity: 0 });
  gsap.set(q('[data-intro="eyebrow"], [data-intro="lead"]'), { opacity: 0, y: 16 });
  const ctas = q('[data-intro="ctas"] > *');
  if (ctas.length) gsap.set(ctas, { opacity: 0, y: 20 });
  if (shelf) gsap.set(shelf, { x: () => window.innerWidth * 0.6, opacity: 0 });
  gsap.set(lights, { scale: 0, backgroundColor: '#1a3a2c' });
  root.classList.add('intro-ready');

  const intro = gsap.timeline({ defaults: { ease: EASE } });
  intro
    .to(q('[data-intro="announce"]'), { yPercent: 0, duration: .6, ease: 'power3.out' }, 0)
    .to(q('[data-intro="nav"]'), { opacity: 1, duration: .5 }, .1)
    .to(lights, { scale: 1, duration: .45, ease: 'back.out(3)' }, .2)
    .to(lights, { backgroundColor: '#2BD38A', boxShadow: '0 0 0 6px rgba(43,211,138,.18), 0 0 18px rgba(43,211,138,.8)', duration: .35, ease: 'power2.out' }, .45)
    .to(lights, { boxShadow: '0 0 0 0 rgba(43,211,138,0), 0 0 0 rgba(43,211,138,0)', duration: .8 }, .8)
    .to(q('[data-intro="eyebrow"]'), { opacity: 1, y: 0, duration: .7 }, .4)
    .to(titleWords, { yPercent: 0, scale: 1, duration: 1.2, stagger: .06 }, .5)
    .to(q('[data-intro="lead"]'), { opacity: 1, y: 0, duration: .9 }, 1.05)
    ;
  if (ctas.length) intro.to(ctas, { opacity: 1, y: 0, duration: .8, stagger: .1 }, 1.2);
  if (shelf) intro.to(shelf, { x: 0, opacity: 1, duration: 1.6, ease: 'power3.out', onStart: () => shelf.classList.add('is-running') }, 1.3);

  const heroSel = has('.hero') ? '.hero' : (has('.page-hero') ? '.page-hero' : null);
  if (heroSel) {
    gsap.to(heroSel + ' .hero-grid', { y: -60, opacity: .35, ease: 'none', scrollTrigger: { trigger: heroSel, start: 'top top', end: 'bottom top', scrub: true } });
    if (shelf) gsap.to(shelf, { y: -30, ease: 'none', scrollTrigger: { trigger: heroSel, start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- Révélations génériques ---------- */
  $$('[data-split]').forEach(h => {
    const w = split(h);
    gsap.from(w, { yPercent: 110, scale: 1.2, transformOrigin: '0% 100%', duration: 1.2, ease: EASE, stagger: .06, scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  $$('.kicker').forEach(k => gsap.from(k, { opacity: 0, y: 12, duration: .8, ease: EASE, scrollTrigger: { trigger: k, start: 'top 90%' } }));
  $$('[data-reveal]').forEach(el => gsap.from(el, { opacity: 0, y: 28, duration: 1, ease: EASE, delay: .15, scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('[data-stagger]').forEach(list => gsap.from(list.children, { opacity: 0, y: 40, duration: 1, ease: EASE, stagger: .12, scrollTrigger: { trigger: list, start: 'top 85%' } }));
  $$('[data-media]').forEach(m => {
    gsap.fromTo(m, { clipPath: 'inset(12% 8% 12% 8% round 12px)' }, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: m, start: 'top 85%' } });
    const img = $('img', m);
    if (img) gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('[data-float]').forEach(f => gsap.fromTo(f, { y: 60 }, { y: -40, ease: 'none', scrollTrigger: { trigger: f.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  /* ---------- Product theatre ---------- */
  if (has('.stage')) {
    mm.add({ desk: '(min-width: 861px)', mob: '(max-width: 860px)' }, ctx => {
      const { desk } = ctx.conditions;
      gsap.fromTo('.stage .window', { rotateX: desk ? 24 : 12, scale: .86, y: 60 }, { rotateX: 0, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: '.stage', start: 'top 95%', end: 'center 55%', scrub: .6 } });
      gsap.fromTo('.blueprint', { backgroundPositionY: '0px' }, { backgroundPositionY: '-120px', ease: 'none', scrollTrigger: { trigger: '.stage', start: 'top bottom', end: 'bottom top', scrub: true } });
      if (has('.stage .float-phone')) gsap.fromTo('.stage .float-phone', { y: desk ? 140 : 60 }, { y: desk ? -40 : 0, ease: 'none', scrollTrigger: { trigger: '.stage', start: 'top bottom', end: 'bottom top', scrub: true } });
      if (has('.float-chip')) gsap.fromTo('.float-chip', { y: desk ? 100 : 40 }, { y: desk ? -60 : 0, ease: 'none', scrollTrigger: { trigger: '.stage', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    if (has('.float-chip')) gsap.from('.float-chip', { opacity: 0, x: -30, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: '.stage', start: 'top 55%' } });
  }

  /* ---------- Loueurs : défilement des écrans ---------- */
  if (hostsGrid && feats.length) {
    mm.add('(min-width: 1101px)', () => {
      hostsGrid.classList.add('is-live');
      setFeat(0);
      feats.forEach((f, i) => ScrollTrigger.create({
        trigger: f, start: 'top 60%', end: 'bottom 60%',
        onToggle: self => { if (self.isActive) setFeat(i); }
      }));
      gsap.from('.hp-stage', { opacity: 0, y: 40, scale: .96, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: hostsGrid, start: 'top 75%' } });
      return () => hostsGrid.classList.remove('is-live');
    });
    gsap.utils.toArray('.feat').forEach(f => gsap.from(f.children, { opacity: 0, y: 24, duration: .9, ease: EASE, stagger: .08, scrollTrigger: { trigger: f, start: 'top 85%' } }));
  }

  /* ---------- Pourquoi ---------- */
  $$('.why-list li').forEach(li => {
    gsap.from(li, { opacity: 0, y: 36, duration: 1, ease: EASE, scrollTrigger: { trigger: li, start: 'top 85%' } });
    gsap.from($('.num', li), { opacity: 0, scale: .6, duration: .8, ease: 'back.out(2)', delay: .2, scrollTrigger: { trigger: li, start: 'top 85%' } });
  });

  /* ---------- Rail ---------- */
  $$('.rail').forEach(rail => {
    gsap.from(rail.children, { x: 160, opacity: 0, duration: 1.3, ease: 'power3.out', stagger: .14, scrollTrigger: { trigger: rail, start: 'top 85%' } });
    const img = $('.pcard-lba .pcard-img img', rail);
    if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: rail, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- Offres ---------- */
  if (has('.plans .plan-featured')) gsap.from('.plans .plan-featured', { scale: .94, duration: 1.2, ease: EASE, scrollTrigger: { trigger: '.plans', start: 'top 85%' } });
  $$('.amount').forEach(a => gsap.from(a, { yPercent: 40, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: a, start: 'top 90%' } }));
  $$('.host-row, .opts div, .bento li, .trio li, .compare tbody tr').forEach((r, i) => gsap.from(r, { opacity: 0, y: 16, duration: .7, ease: EASE, delay: (i % 6) * .05, scrollTrigger: { trigger: r, start: 'top 92%' } }));

  /* ---------- Méthode ---------- */
  const steps = $$('.steps li');
  if (steps.length) {
    mm.add({ desk: '(min-width: 861px)', mob: '(max-width: 860px)' }, ctx => {
      const { desk } = ctx.conditions;
      gsap.fromTo('.steps-line span', desk ? { scaleX: 0, scaleY: 1 } : { scaleY: 0, scaleX: 1 }, {
        [desk ? 'scaleX' : 'scaleY']: 1, ease: 'none',
        scrollTrigger: {
          trigger: '.steps-wrap', start: desk ? 'top 75%' : 'top 70%', end: desk ? 'bottom 55%' : 'bottom 60%', scrub: .5,
          onUpdate: self => steps.forEach((s, i) => s.classList.toggle('is-on', self.progress >= (desk ? i / steps.length : i / (steps.length - 1)) - .001))
        }
      });
    });
    gsap.from(steps, { opacity: 0, y: 30, duration: 1, ease: EASE, stagger: .12, scrollTrigger: { trigger: '.steps', start: 'top 85%' } });
  }

  /* ---------- FAQ animée ---------- */
  faqs.forEach(d => {
    const s = $('summary', d), a = $('.faq-a', d);
    s.addEventListener('click', e => {
      e.preventDefault();
      if (d.open) {
        gsap.to(a, { height: 0, opacity: 0, duration: .45, ease: EASE, onComplete: () => { d.open = false; gsap.set(a, { clearProps: 'height,opacity' }); } });
      } else {
        d.open = true;
        gsap.from(a, { height: 0, opacity: 0, duration: .55, ease: EASE, clearProps: 'height,opacity' });
      }
    });
  });

  /* ---------- Contact ---------- */
  if (has('.form-panel')) gsap.from('.form-panel', { opacity: 0, y: 40, duration: 1.1, ease: 'power3.out', delay: .9 });
  if (has('.contact-side .window')) gsap.from('.contact-side .window', { opacity: 0, x: 60, rotateY: -8, duration: 1.4, ease: 'power3.out', delay: 1.1 });

  /* ---------- Clôture ---------- */
  if (has('.closing')) {
    gsap.fromTo('.flutes', { xPercent: -3 }, { xPercent: 3, ease: 'none', scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'bottom top', scrub: true } });
    if (has('.stack')) {
      gsap.timeline({ scrollTrigger: { trigger: '.closing', start: 'top 80%', end: 'center 50%', scrub: .7 } })
        .from('.sk-1', { rotate: 0, x: 60, y: 120, ease: 'none' }, 0)
        .from('.sk-2', { rotate: 0, x: -60, y: 60, ease: 'none' }, 0)
        .from('.sk-3', { rotate: 0, y: -40, scale: .9, ease: 'none' }, 0)
        .from('.stack', { opacity: 0, ease: 'none', duration: .3 }, 0);
      $$('.sk').forEach(img => {
        img.addEventListener('pointerenter', () => gsap.to(img, { y: -14, duration: .5, ease: 'power2.out' }));
        img.addEventListener('pointerleave', () => gsap.to(img, { y: 0, duration: .6, ease: 'power2.out' }));
      });
    }
  }

  /* ---------- Footer ---------- */
  if (has('.emblem')) {
    gsap.fromTo('.emblem', { yPercent: 25, rotate: -24 }, { yPercent: 0, rotate: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: .8 } });
    gsap.from('.emblem-dot', { scale: 0, transformOrigin: '50% 50%', duration: .8, ease: 'back.out(3)', scrollTrigger: { trigger: '.footer', start: 'top 40%' } });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
