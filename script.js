(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateHeader = () => header?.classList.toggle('scrolled', scrollY > 42);
  updateHeader();
  addEventListener('scroll', updateHeader, { passive: true });

  const closeMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };
  const openMenu = () => {
    menuButton.setAttribute('aria-expanded', 'true');
    nav.classList.add('is-open');
    document.body.classList.add('menu-open');
    nav.querySelector('a')?.focus();
  };
  menuButton?.addEventListener('click', () => nav.classList.contains('is-open') ? closeMenu() : openMenu());
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('pointerdown', event => {
    if (nav?.classList.contains('is-open') && !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });

  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  const visibleObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      visibleObserver.unobserve(entry.target);
    });
  }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal, .metric').forEach(el => visibleObserver.observe(el));

  const video = document.querySelector('.site-video-bg video, .hero-video');
  if (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.play().catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    });
  }

  document.querySelectorAll('[data-roll-start][data-roll-end]').forEach(metric => {
    const output = metric.querySelector('[data-roll-value]');
    const start = Number(metric.dataset.rollStart);
    const end = Number(metric.dataset.rollEnd);
    const duration = Number(metric.dataset.rollDuration) || 1400;
    const prefix = metric.dataset.rollPrefix || '';
    const suffix = metric.dataset.rollSuffix || '';
    let hasRun = false;
    const startRoll = () => {
      if (hasRun || !output) return;
      hasRun = true;
      if (reduceMotion) {
        output.textContent = `${prefix}${end}${suffix}`;
        return;
      }
      const startedAt = performance.now();
      const difference = end - start;
      const tick = now => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const value = start + Math.round(difference * progress);
        output.textContent = `${prefix}${value}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
        else output.textContent = `${prefix}${end}${suffix}`;
      };
      requestAnimationFrame(tick);
    };
    const rollObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      startRoll();
      rollObserver.unobserve(entry.target);
    }), { threshold: .35 });
    rollObserver.observe(metric);
  });

  const pieceReveal = document.querySelector('.piece-reveal');
  if (pieceReveal) {
    pieceReveal.addEventListener('click', () => {
      const painted = pieceReveal.classList.toggle('is-painted');
      pieceReveal.setAttribute('aria-pressed', String(painted));
    });
    if (matchMedia('(hover: none)').matches) {
      new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-painted');
      }), { threshold: .55 }).observe(pieceReveal);
    }
  }

  const finishImage = document.querySelector('[data-finish-image]');
  document.querySelectorAll('.finish-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.finish-tab').forEach(item => item.classList.remove('active'));
      tab.classList.add('active');
      if (!finishImage) return;
      const frame = finishImage.parentElement;
      frame.classList.add('is-changing');
      setTimeout(() => {
        finishImage.src = tab.dataset.image;
        finishImage.alt = tab.dataset.alt || '';
        frame.classList.remove('is-changing');
      }, reduceMotion ? 0 : 180);
    });
  });

  document.querySelectorAll('.marquee').forEach(scroller => {
    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    scroller.addEventListener('pointerdown', event => {
      dragging = true;
      startX = event.clientX;
      startScroll = scroller.scrollLeft;
      scroller.classList.add('is-dragging');
      scroller.setPointerCapture?.(event.pointerId);
    });
    scroller.addEventListener('pointermove', event => {
      if (!dragging) return;
      scroller.scrollLeft = startScroll - (event.clientX - startX);
    });
    const endDrag = () => { dragging = false; scroller.classList.remove('is-dragging'); };
    scroller.addEventListener('pointerup', endDrag);
    scroller.addEventListener('pointercancel', endDrag);
  });

  document.querySelectorAll('[data-carousel-dir]').forEach(control => {
    control.addEventListener('click', () => {
      const shell = control.closest('.carousel-shell');
      const scroller = shell?.querySelector('.marquee, .material-rail, .pieces-preview');
      if (!scroller) return;
      shell.classList.add('is-controlled');
      const amount = Math.max(260, scroller.clientWidth * .72) * Number(control.dataset.carouselDir || 1);
      scroller.scrollBy({ left: amount, behavior: reduceMotion ? 'auto' : 'smooth' });
      clearTimeout(shell._resumeTimer);
      shell._resumeTimer = setTimeout(() => shell.classList.remove('is-controlled'), 2400);
    });
  });

  document.querySelectorAll('.flip-card').forEach(card => {
    const toggle = () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
    };
    card.addEventListener('click', event => {
      if (event.target.closest('a')) return;
      toggle();
    });
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  });

  const quoteForm = document.querySelector('[data-quote-form]');
  quoteForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!quoteForm.reportValidity()) return;
    const labels = {
      nombre: 'Nombre', empresa: 'Empresa', telefono: 'Teléfono', email: 'Correo',
      proyecto: 'Pieza o proyecto', cantidad: 'Cantidad aproximada', material: 'Material',
      acabado: 'Color o acabado', fecha: 'Fecha deseada', detalles: 'Descripción'
    };
    const data = new FormData(quoteForm);
    const lines = ['Hola, quiero solicitar una cotización de pintura electrostática.'];
    for (const [key, value] of data.entries()) {
      const clean = String(value).trim();
      if (clean) lines.push(`${labels[key] || key}: ${clean}`);
    }
    open(`https://wa.me/528180641624?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
  });

  document.querySelectorAll('[data-piece-quote]').forEach(link => {
    const name = link.dataset.pieceQuote;
    link.href = `https://wa.me/528180641624?text=${encodeURIComponent(`Hola, quiero cotizar pintura electrostática para: ${name}.`)}`;
  });
})();
