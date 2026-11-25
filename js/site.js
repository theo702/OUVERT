/* =========================================================
   Ouvert · scripts du site
   ========================================================= */

/* ---- À compléter ---------------------------------------- */
const CONFIG = {
  phone: '',        // ex. '+33600000000' (format international, sans espaces)
  phoneDisplay: '', // ex. '06 00 00 00 00'
  email: 'contact@studio-ouvert.fr',
  // Clé Web3Forms (gratuite sur https://web3forms.com) pour recevoir le
  // formulaire de contact par mail. Vide = le formulaire ouvre la messagerie.
  web3formsKey: '',
  // Liens de paiement Stripe (Payment Links), un par offre payable en ligne.
  // Tant qu'un lien est vide, le bouton renvoie vers la page contact.
  pay: {
    'une-page': '',   // ex. 'https://buy.stripe.com/xxxx'
    'vitrine': ''
  }
};

/* Vrais avis clients : ajoutez-en ici, ils s'affichent dans le rail
   de la page d'accueil, avant la carte "Votre site ici".
   Exemple :
   { texte: "…", nom: "Prénom N.", metier: "Plombier", ville: "Annecy" } */
const AVIS = [];
/* --------------------------------------------------------- */

(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Boutons de paiement Stripe */
  document.querySelectorAll('[data-pay]').forEach(el => {
    const url = CONFIG.pay[el.dataset.pay];
    if (url) el.href = url;
  });

  /* Année, téléphone */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  if (CONFIG.phone) {
    document.querySelectorAll('[data-phone]').forEach(el => {
      el.href = 'tel:' + CONFIG.phone;
      el.textContent = CONFIG.phoneDisplay || CONFIG.phone;
      el.hidden = false;
    });
    document.querySelectorAll('[data-phone-row]').forEach(el => { el.hidden = false; });
  }

  /* Formulaire de contact */
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const sel = form.querySelector('#offre');
    const want = new URLSearchParams(location.search).get('offre');
    if (sel && want && [...sel.options].some(o => o.value === want)) sel.value = want;
    const status = form.querySelector('.form-status');
    const btn = form.querySelector('[type="submit"]');
    const say = (msg, ok) => { status.textContent = msg; status.dataset.state = ok ? 'ok' : 'err'; status.hidden = false; };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.botcheck && form.botcheck.checked) return;
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      if (CONFIG.web3formsKey) {
        data.append('access_key', CONFIG.web3formsKey);
        data.append('subject', 'Nouvelle demande · Ouvert');
        data.append('from_name', 'Site Ouvert');
        btn.disabled = true;
        try {
          const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          const j = await r.json();
          if (!j.success) throw new Error(j.message);
          form.reset();
          say("Merci, c'est bien reçu. Je reviens vers vous très vite.", true);
        } catch (err) {
          say("L'envoi n'a pas marché. Écrivez-moi directement à " + CONFIG.email + '.', false);
        }
        btn.disabled = false;
      } else {
        const o = sel && sel.value ? sel.options[sel.selectedIndex].text : '';
        const body = [
          'Nom : ' + (data.get('nom') || ''),
          'Activité : ' + (data.get('activite') || ''),
          'Téléphone : ' + (data.get('telephone') || ''),
          'Offre : ' + o,
          '',
          data.get('message') || ''
        ].join('\n');
        location.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent('Demande de site · ' + (data.get('nom') || '')) + '&body=' + encodeURIComponent(body);
        say("Votre messagerie s'ouvre avec le message prêt. Il ne reste qu'à l'envoyer.", true);
      }
    });
  }

  /* Avis */
  const anchor = document.querySelector('[data-avis-anchor]');
  if (anchor && AVIS.length) {
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
  }

  /* Menu mobile */
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('menu-mobile');
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
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* FAQ : une seule ouverte à la fois */
  const faqs = document.querySelectorAll('.faq-list details');
  faqs.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
  }));

  const shelf = document.querySelector('.shelf');
  const showAll = () => {
    root.classList.add('intro-ready');
    if (shelf) shelf.classList.add('is-running');
  };

  if (reduce || !window.gsap || !window.ScrollTrigger) { showAll(); return; }

  /* =======================================================
     Animations (GSAP + ScrollTrigger)
     ======================================================= */
  gsap.registerPlugin(ScrollTrigger);
  const EASE = 'power1.inOut';   // = cubic-bezier(0.455, 0.03, 0.515, 0.955)
  const mm = gsap.matchMedia();

  /* Découpe en mots, masqués */
  function split(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(w => '<span class="w" aria-hidden="true"><span class="w-in">' + w + '</span></span>').join(' ');
    return el.querySelectorAll('.w-in');
  }

  /* Étagère : on duplique le contenu pour la boucle */
  if (shelf) {
    const set = shelf.querySelector('.shelf-set');
    const clone = set.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach(i => { i.alt = ''; i.loading = 'lazy'; });
    set.after(clone);
  }

  /* ---------- Intro ---------- */
  const title = document.querySelector('.hero-title');
  if (!title) root.classList.add('intro-ready');
  else {
  const titleWords = split(title);
  gsap.set(titleWords, { yPercent: 110, scale: 1.2, transformOrigin: '0% 100%' });
  gsap.set('[data-intro="announce"]', { yPercent: -100 });
  gsap.set('[data-intro="nav"]', { opacity: 0 });
  gsap.set(['[data-intro="eyebrow"]', '[data-intro="lead"]'], { opacity: 0, y: 16 });
  gsap.set('[data-intro="ctas"] > *', { opacity: 0, y: 20 });
  gsap.set('[data-intro="shelf"]', { x: () => window.innerWidth * 0.6, opacity: 0 });
  gsap.set('.brand-voyant, .eyebrow .voyant', { scale: 0, backgroundColor: '#1a3a2c' });
  root.classList.add('intro-ready');

  const intro = gsap.timeline({ defaults: { ease: EASE } });
  intro
    .to('[data-intro="announce"]', { yPercent: 0, duration: .6, ease: 'power3.out' }, 0)
    .to('[data-intro="nav"]', { opacity: 1, duration: .5 }, .1)
    // le voyant s'allume
    .to('.brand-voyant, .eyebrow .voyant', { scale: 1, duration: .45, ease: 'back.out(3)' }, .2)
    .to('.brand-voyant, .eyebrow .voyant', { backgroundColor: '#2BD38A', boxShadow: '0 0 0 6px rgba(43,211,138,.18), 0 0 18px rgba(43,211,138,.8)', duration: .35, ease: 'power2.out' }, .45)
    .to('.brand-voyant, .eyebrow .voyant', { boxShadow: '0 0 0 0 rgba(43,211,138,0), 0 0 0 rgba(43,211,138,0)', duration: .8 }, .8)
    .to('[data-intro="eyebrow"]', { opacity: 1, y: 0, duration: .7 }, .4)
    // titre : scale reveal
    .to(titleWords, { yPercent: 0, scale: 1, duration: 1.2, stagger: .06 }, .5)
    .to('[data-intro="lead"]', { opacity: 1, y: 0, duration: .9 }, 1.05)
    .to('[data-intro="ctas"] > *', { opacity: 1, y: 0, duration: .8, stagger: .1 }, 1.2)
    // l'étagère glisse puis défile
    .to('[data-intro="shelf"]', { x: 0, opacity: 1, duration: 1.6, ease: 'power3.out', onStart: () => shelf.classList.add('is-running') }, 1.3);

  /* Hero au scroll : profondeur légère */
  gsap.to('.hero-grid', { y: -60, opacity: .35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.shelf', { y: -30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
  const has = sel => document.querySelector(sel);

  /* ---------- Titres de section ---------- */
  document.querySelectorAll('[data-split]').forEach(h => {
    const w = split(h);
    gsap.from(w, { yPercent: 110, scale: 1.2, transformOrigin: '0% 100%', duration: 1.2, ease: EASE, stagger: .06,
      scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  gsap.utils.toArray('.kicker').forEach(k => gsap.from(k, { opacity: 0, y: 12, duration: .8, ease: EASE, scrollTrigger: { trigger: k, start: 'top 90%' } }));
  gsap.utils.toArray('[data-reveal]').forEach(el => gsap.from(el, { opacity: 0, y: 28, duration: 1, ease: EASE, delay: .15, scrollTrigger: { trigger: el, start: 'top 88%' } }));
  gsap.utils.toArray('[data-stagger]').forEach(list => gsap.from(list.children, { opacity: 0, y: 40, duration: 1, ease: EASE, stagger: .12, scrollTrigger: { trigger: list, start: 'top 85%' } }));

  /* ---------- Product theatre ---------- */
  if (has('.stage')) mm.add({ desk: '(min-width: 861px)', mob: '(max-width: 860px)' }, ctx => {
    const { desk } = ctx.conditions;
    gsap.fromTo('.window', { rotateX: desk ? 24 : 12, scale: .86, y: 60 }, {
      rotateX: 0, scale: 1, y: 0, ease: 'none',
      scrollTrigger: { trigger: '.stage', start: 'top 95%', end: 'center 55%', scrub: .6 }
    });
    gsap.fromTo('.blueprint', { backgroundPositionY: '0px' }, { backgroundPositionY: '-120px', ease: 'none', scrollTrigger: { trigger: '.stage', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.float-phone', { y: desk ? 140 : 60 }, { y: desk ? -40 : 0, ease: 'none', scrollTrigger: { trigger: '.stage', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.float-chip', { y: desk ? 100 : 40 }, { y: desk ? -60 : 0, ease: 'none', scrollTrigger: { trigger: '.stage', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.float-chip', { opacity: 0, x: -30, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: '.stage', start: 'top 55%' } });
  });

  /* ---------- Pourquoi : filets + lignes ---------- */
  gsap.utils.toArray('.why-list li').forEach(li => {
    gsap.from(li, { opacity: 0, y: 36, duration: 1, ease: EASE, scrollTrigger: { trigger: li, start: 'top 85%' } });
    gsap.from(li.querySelector('.num'), { opacity: 0, scale: .6, duration: .8, ease: 'back.out(2)', delay: .2, scrollTrigger: { trigger: li, start: 'top 85%' } });
  });

  /* ---------- Rail ---------- */
  if (has('.rail')) gsap.from('.rail > *', { x: 160, opacity: 0, duration: 1.3, ease: 'power3.out', stagger: .14, scrollTrigger: { trigger: '.rail', start: 'top 85%' } });
  if (has('.rail .pcard-lba')) gsap.fromTo('.pcard-lba .pcard-img img', { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.rail', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Offres ---------- */
  if (has('.plans .plan-featured')) gsap.from('.plans .plan-featured', { scale: .94, duration: 1.2, ease: EASE, scrollTrigger: { trigger: '.plans', start: 'top 85%' } });
  gsap.utils.toArray('.amount').forEach(a => gsap.from(a, { yPercent: 40, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: a, start: 'top 90%' } }));
  gsap.utils.toArray('.host-row, .opts div').forEach((r, i) => gsap.from(r, { opacity: 0, y: 16, duration: .7, ease: EASE, delay: (i % 6) * .05, scrollTrigger: { trigger: r, start: 'top 92%' } }));

  /* ---------- Méthode : la ligne se remplit ---------- */
  const steps = gsap.utils.toArray('.steps li');
  if (steps.length) mm.add({ desk: '(min-width: 861px)', mob: '(max-width: 860px)' }, ctx => {
    const { desk } = ctx.conditions;
    gsap.fromTo('.steps-line span', desk ? { scaleX: 0, scaleY: 1 } : { scaleY: 0, scaleX: 1 }, {
      [desk ? 'scaleX' : 'scaleY']: 1, ease: 'none',
      scrollTrigger: {
        trigger: '.steps-wrap', start: desk ? 'top 75%' : 'top 70%', end: desk ? 'bottom 55%' : 'bottom 60%', scrub: .5,
        onUpdate: self => steps.forEach((s, i) => s.classList.toggle('is-on', self.progress >= (desk ? i / steps.length : i / (steps.length - 1)) - .001))
      }
    });
  });
  if (steps.length) gsap.from(steps, { opacity: 0, y: 30, duration: 1, ease: EASE, stagger: .12, scrollTrigger: { trigger: '.steps', start: 'top 85%' } });

  /* ---------- FAQ : ouverture animée ---------- */
  faqs.forEach(d => {
    const s = d.querySelector('summary'), a = d.querySelector('.faq-a');
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

  /* ---------- Clôture ---------- */
  if (has('.closing')) gsap.fromTo('.flutes', { xPercent: -3 }, { xPercent: 3, ease: 'none', scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'bottom top', scrub: true } });
  if (has('.stack')) {
  const stackTl = gsap.timeline({ scrollTrigger: { trigger: '.closing', start: 'top 80%', end: 'center 50%', scrub: .7 } });
  stackTl
    .from('.sk-1', { rotate: 0, x: 60, y: 120, ease: 'none' }, 0)
    .from('.sk-2', { rotate: 0, x: -60, y: 60, ease: 'none' }, 0)
    .from('.sk-3', { rotate: 0, y: -40, scale: .9, ease: 'none' }, 0)
    .from('.stack', { opacity: 0, ease: 'none', duration: .3 }, 0);
  }
  gsap.utils.toArray('.sk').forEach((img, i) => {
    img.addEventListener('pointerenter', () => gsap.to(img, { y: -14, duration: .5, ease: 'power2.out' }));
    img.addEventListener('pointerleave', () => gsap.to(img, { y: 0, duration: .6, ease: 'power2.out' }));
  });

  /* ---------- Footer : emblème ---------- */
  if (has('.emblem')) {
  gsap.fromTo('.emblem', { yPercent: 25, rotate: -24 }, { yPercent: 0, rotate: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: .8 } });
  gsap.from('.emblem-dot', { scale: 0, transformOrigin: '50% 50%', duration: .8, ease: 'back.out(3)', scrollTrigger: { trigger: '.footer', start: 'top 40%' } });
  }

  /* Galerie des réalisations */
  gsap.utils.toArray('[data-parallax] img').forEach(img => gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  /* Recalcul après chargement des images */
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
