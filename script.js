(() => {
  const video = document.querySelector('#scroll-video');
  const loading = document.querySelector('#loading');
  const header = document.querySelector('#site-header');
  const heroBrand = document.querySelector('#hero-brand');
  const menuButton = document.querySelector('#menu-toggle');
  const nav = document.querySelector('#main-nav');
  const hideLoader = () => loading.classList.add('done');

  const startVideo = async () => {
    try {
      video.muted = true;
      await video.play();
    } catch (_) {
      // Muted autoplay is allowed by modern browsers; a first touch retries it on stricter devices.
    }
  };

  const updateInterface = () => {
    header.classList.toggle('compact', window.scrollY > 60);
    header.classList.toggle('brand-visible', window.scrollY > window.innerHeight * .82);

    const heroProgress = Math.min(1, window.scrollY / Math.max(1, window.innerHeight * .7));
    heroBrand.style.opacity = String(1 - heroProgress);
    heroBrand.style.transform = `translateX(-50%) translateY(${-heroProgress * 55}px) scale(${1 - heroProgress * .12})`;
  };

  video.addEventListener('loadedmetadata', () => {
    startVideo();
    updateInterface();
    hideLoader();
  }, { once: true });
  video.addEventListener('canplay', hideLoader, { once: true });
  video.addEventListener('error', hideLoader, { once: true });
  window.setTimeout(hideLoader, 5000);

  window.addEventListener('scroll', updateInterface, { passive: true });
  window.addEventListener('resize', updateInterface, { passive: true });
  document.addEventListener('touchstart', startVideo, { once: true, passive: true });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: .14, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.classList.toggle('active', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.classList.remove('active');
    menuButton.setAttribute('aria-expanded', 'false');
  }));

  document.querySelector('#quote-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      'Hola, deseo cotizar un servicio de pintura electrostática.',
      `Nombre: ${data.get('name')}`,
      `Empresa: ${data.get('company') || 'No indicada'}`,
      `Teléfono: ${data.get('phone')}`,
      `Proyecto: ${data.get('project')}`
    ].join('\n');
    window.open(`https://wa.me/528180641624?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  });

  document.querySelector('#year').textContent = new Date().getFullYear();

  document.querySelectorAll([
    'h1 em',
    '.statement h2',
    '.section-heading h2',
    '.service-card h3',
    '.quality-copy h2',
    '.materials-panel h2',
    '.material-row strong',
    '.contact-copy h2',
    '.text-link'
  ].join(',')).forEach((element) => element.classList.add('smoke-trigger'));

  updateInterface();
})();
