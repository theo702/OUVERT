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
     Animations
     ======================================================= */
  gsap.registerPlugin(ScrollTrigger);
  const EASE = 'power3.out';

  const prog = document.createElement('div');
  prog.className = 'scroll-progress';
  document.body.append(prog);
  gsap.to(prog, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: 0.3 } });

  /* Pastille qui glisse sous le lien du menu */
  const nav = $('.gnav-links');
  const glow = $('.nav-glow');
  if (nav && glow) {
    const links = $$('.gnav-links a');
    const current = nav.querySelector('[aria-current="page"]');
    const place = (a, anim) => {
      const nr = nav.getBoundingClientRect();
      const r = a.getBoundingClientRect();
      gsap.to(glow, { x: r.left - nr.left, width: r.width, opacity: 1, duration: anim ? .4 : 0, ease: 'power3.out' });
    };
    gsap.set(glow, { opacity: 0 });
    if (current) place(current, false);
    links.forEach(a => a.addEventListener('mouseenter', () => place(a, true)));
    nav.addEventListener('mouseleave', () => current ? place(current, true) : gsap.to(glow, { opacity: 0, duration: .3 }));
    window.addEventListener('resize', () => { if (current) place(current, false); });
  }

  /* Titres : les mots montent */
  const splitRise = el => {
    const walk = node => Array.from(node.childNodes).forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const o = document.createElement('span'); o.className = 'rise';
          const w = document.createElement('span'); w.className = 'rise-w'; w.textContent = part;
          o.append(w); frag.append(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('rise')) walk(n);
    });
    walk(el);
    return el.querySelectorAll('.rise-w');
  };
  $$('[data-hero] h1').forEach(h => {
    const words = splitRise(h);
    gsap.set(words, { yPercent: 120 });
    gsap.to(words, { yPercent: 0, duration: 1.15, ease: 'power4.out', stagger: .045, delay: .05 });
  });

  root.classList.add('intro-ready');
  if ($('[data-hero]')) gsap.from('[data-hero] > *:not(h1)', { opacity: 0, y: 36, duration: 1, ease: EASE, stagger: .08, delay: .15 });

  /* Boutons aimantés */
  $$('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .35, y: (e.clientY - r.top - r.height / 2) * .5, duration: .35, ease: 'power3.out' });
    });
    btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.5)' }));
  });

  /* Cartes qui s'inclinent */
  $$('.tile, .col, .facts li, .features li').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      gsap.to(card, { rotateY: px * 7, rotateX: py * -7, transformPerspective: 900, duration: .4, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: .6, ease: 'power3.out' }));
  });

  /* Pictos dessinés au trait */
  $$('.ico svg').forEach(svg => {
    const shapes = svg.querySelectorAll('path, circle, rect');
    shapes.forEach(s => {
      let len = 80;
      try { len = s.getTotalLength(); } catch (e) {}
      s.style.strokeDasharray = len;
      s.style.strokeDashoffset = len;
    });
    gsap.to(shapes, { strokeDashoffset: 0, duration: 1.3, stagger: .08, ease: 'power2.out', scrollTrigger: { trigger: svg, start: 'top 92%' } });
  });

  $$('.media').forEach(m => {
    const win = m.querySelector('.window');
    if (win) gsap.fromTo(win, { scale: .86, y: 70, rotate: -1.5 }, { scale: 1, y: 0, rotate: 0, ease: 'none', scrollTrigger: { trigger: m, start: 'top 95%', end: 'top 35%', scrub: .6 } });
  });

  $$('[data-reveal]').forEach(el => gsap.from(el, { opacity: 0, y: 64, scale: .96, duration: 1.1, ease: EASE, scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('[data-stagger]').forEach(list => gsap.from(list.children, { opacity: 0, y: 56, scale: .94, duration: 1, ease: EASE, stagger: .08, scrollTrigger: { trigger: list, start: 'top 86%' } }));

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
    gsap.fromTo(p.querySelectorAll('.lw'), { opacity: .18, y: 8 }, { opacity: 1, y: 0, ease: 'none', stagger: .08, scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 45%', scrub: true } });
  });

  $$('.mosaic .shot').forEach((shot, i) => {
    gsap.from(shot, { opacity: 0, scale: .9, duration: 1.15, ease: 'power3.out', delay: .15 + i * .08 });
    gsap.to(shot, { yPercent: i % 2 ? -10 : -18, ease: 'none', scrollTrigger: { trigger: '.mosaic', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });

  $$('.tile-mock > *').forEach(m => gsap.fromTo(m, { y: 140, rotate: 2 }, { y: 18, rotate: 0, ease: 'none', scrollTrigger: { trigger: m.closest('.tile'), start: 'top bottom', end: 'center 50%', scrub: .5 } }));

  $$('.gallery').forEach(g => gsap.from(g.children, { x: 160, opacity: 0, rotate: 2, duration: 1.2, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: g, start: 'top 88%' } }));

  const line = $('.steps-line span');
  if (line) gsap.to(line, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 60%', scrub: .4 } });

  $$('.exemple .window, .duo img').forEach(el => {
    gsap.from(el, { clipPath: 'inset(14% 14% 14% 14% round 32px)', scale: 1.12, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  faqs.forEach(d => {
    const s = d.querySelector('summary'), a = d.querySelector('.faq-a');
    if (!s || !a) return;
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
