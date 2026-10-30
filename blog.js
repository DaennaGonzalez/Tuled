(() => {
  'use strict';
  const search = document.querySelector('[data-blog-search]');
  const cards = [...document.querySelectorAll('[data-article-card]')];
  const filters = [...document.querySelectorAll('[data-blog-filter]')];
  const result = document.querySelector('[data-blog-results]');
  const empty = document.querySelector('[data-blog-empty]');
  let category = 'Todos';
  const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filterCards = () => {
    const term = normalize(search?.value.trim() || '');
    let visible = 0;
    cards.forEach(card => {
      const matchesCategory = category === 'Todos' || card.dataset.category === category;
      const matchesTerm = !term || normalize(card.dataset.search || '').includes(term);
      const show = matchesCategory && matchesTerm;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (result) result.textContent = `Mostrando ${visible} ${visible === 1 ? 'artículo' : 'artículos'}`;
    if (empty) empty.hidden = visible !== 0;
  };
  search?.addEventListener('input', filterCards);
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.blogFilter;
    filters.forEach(item => item.classList.toggle('is-active', item === button));
    filterCards();
  }));

  const progress = document.querySelector('[data-reading-progress]');
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 0}%`;
  };
  updateProgress();
  addEventListener('scroll', updateProgress, { passive: true });

  const tocLinks = [...document.querySelectorAll('.article-toc a[href^="#"]')];
  const sections = tocLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (sections.length) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      tocLinks.forEach(link => link.classList.toggle('is-current', link.getAttribute('href') === `#${entry.target.id}`));
    }), { rootMargin: '-25% 0px -62% 0px' });
    sections.forEach(section => observer.observe(section));
  }

  const checklist = document.querySelector('[data-quote-checklist]');
  checklist?.addEventListener('submit', event => {
    event.preventDefault();
    const selected = [...checklist.querySelectorAll('input:checked')].map(input => `✓ ${input.value}`);
    const missing = [...checklist.querySelectorAll('input:not(:checked)')].map(input => `Pendiente: ${input.value}`);
    const message = ['Hola Tuled, quiero solicitar una cotización de pintura electrostática.', '', 'Datos que tengo:', ...(selected.length ? selected : ['Aún estoy reuniendo la información.']), '', ...missing].join('\n');
    const link = checklist.querySelector('[data-checklist-wa]');
    link.href = `https://wa.me/5218112303901?text=${encodeURIComponent(message)}`;
    link.hidden = false;
    link.textContent = 'Enviar mi lista por WhatsApp';
    link.focus();
  });

  document.querySelectorAll('[data-texture-choice]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-texture-choice]').forEach(item => item.classList.toggle('is-active', item === button));
  }));
})();
