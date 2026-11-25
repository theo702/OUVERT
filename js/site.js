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
/* --------------------------------------------------------- */

(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* Paiement, année, téléphone */
  $$('[data-pay]').forEach(el => { const u = CONFIG.pay[el.dataset.pay]; if (u) el.href = u; });
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  if (CONFIG.phone) {
    $$('[data-phone]').forEach(el => {
      el.href = 'tel:' + CONFIG.phone;
      el.textContent = CONFIG.phoneDisplay || CONFIG.phone;
      el.hidden = false;
    });
    $$('[data-phone-row]').forEach(el => { el.hidden = false; });
  }

  /* Menu mobile */
  const burger = $('.burger');
  const menu = $('#menu-mobile');
  if (burger && menu) {
    const set = open => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      menu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { set(false); burger.focus(); } });
    window.addEventListener('resize', () => { if (window.innerWidth > 834) set(false); });
  }

  /* Navigation locale : section en cours */
  const lnavLinks = $$('.lnav-right a[href^="#"]');
  if (lnavLinks.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      lnavLinks.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + en.target.id)));
    }), { rootMargin: '-45% 0px -50% 0px' });
    lnavLinks.forEach(a => { const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) io.observe(t); });
  }

  /* Galerie : boutons précédent / suivant */
  $$('[data-gallery]').forEach(wrap => {
    const track = wrap.querySelector('.gallery');
    const prev = wrap.querySelector('[data-prev]');
    const next = wrap.querySelector('[data-next]');
    if (!track || !prev || !next) return;
    const step = () => (track.querySelector('figure') || track).getBoundingClientRect().width + 20;
    const update = () => {
      prev.disabled = track.scrollLeft < 8;
      next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* FAQ : une seule ouverte à la fois */
  const faqs = $$('.faq-list details');
  faqs.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
  }));

  /* Formulaire de contact */
  const form = $('[data-contact-form]');
  if (form) {
    const sel = form.querySelector('#offre');
    const want = new URLSearchParams(location.search).get('offre');
    if (sel && want && Array.from(sel.options).some(o => o.value === want)) sel.value = want;
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

  if (reduce || !window.gsap || !window.ScrollTrigger) { root.classList.add('intro-ready'); return; }

  /* =======================================================
     Animations (GSAP + ScrollTrigger), sobres
     ======================================================= */
  gsap.registerPlugin(ScrollTrigger);
  const EASE = 'power2.out';

  /* Entrée du haut de page */
  root.classList.add('intro-ready');
  if ($('[data-hero]')) gsap.from('[data-hero] > *', { opacity: 0, y: 28, duration: 1, ease: EASE, stagger: .1, delay: .08 });

  /* Rendu produit : la fenêtre monte légèrement, le téléphone glisse */
  $$('.media').forEach(m => {
    const win = m.querySelector('.window');
    const ph = m.querySelector('.phone');
    if (win) gsap.fromTo(win, { y: 48, opacity: .55 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: m, start: 'top 98%', end: 'top 35%', scrub: .55 } });
    if (ph) gsap.fromTo(ph, { y: 56, rotate: 2 }, { y: 0, rotate: 0, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom 55%', scrub: .55 } });
  });

  /* Apparitions */
  $$('[data-reveal]').forEach(el => gsap.from(el, { opacity: 0, y: 32, duration: 1, ease: EASE, scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('[data-stagger]').forEach(list => gsap.from(list.children, { opacity: 0, y: 32, duration: 1, ease: EASE, stagger: .1, scrollTrigger: { trigger: list, start: 'top 85%' } }));

  /* Texte qui s'allume mot à mot */
  $$('[data-lit]').forEach(p => {
    const walk = node => Array.from(node.childNodes).forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const s = document.createElement('span'); s.className = 'lw'; s.textContent = part; frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(p);
    gsap.fromTo(p.querySelectorAll('.lw'), { opacity: .18 }, { opacity: 1, ease: 'none', stagger: .1, scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 50%', scrub: true } });
  });

  /* Tuiles : la maquette monte */
  $$('.tile-mock > *').forEach(m => gsap.fromTo(m, { y: 90 }, { y: 28, ease: 'none', scrollTrigger: { trigger: m.closest('.tile'), start: 'top bottom', end: 'center 55%', scrub: .6 } }));

  /* Galerie : glisse à l'entrée */
  $$('.gallery').forEach(g => gsap.from(g.children, { x: 120, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: g, start: 'top 85%' } }));

  /* FAQ : ouverture animée */
  faqs.forEach(d => {
    const s = d.querySelector('summary'), a = d.querySelector('.faq-a');
    s.addEventListener('click', e => {
      e.preventDefault();
      if (d.open) {
        gsap.to(a, { height: 0, opacity: 0, duration: .4, ease: 'power2.inOut', onComplete: () => { d.open = false; gsap.set(a, { clearProps: 'height,opacity' }); } });
      } else {
        d.open = true;
        gsap.from(a, { height: 0, opacity: 0, duration: .5, ease: 'power2.inOut', clearProps: 'height,opacity' });
      }
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
