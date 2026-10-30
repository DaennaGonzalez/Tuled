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

  const homeStorePreview = document.querySelector('.home-shop-preview');
  const homeKnowledge = document.querySelector('.home-knowledge');
  const contactSection = document.querySelector('#contacto');
  if (homeStorePreview && contactSection) contactSection.before(homeStorePreview);
  if (homeKnowledge && contactSection) contactSection.before(homeKnowledge);

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
    const showVideo = () => video.classList.add('is-ready');
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) showVideo();
    else video.addEventListener('loadeddata', showVideo, { once: true });
    video.play().catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    });
  }

  const aboutGallery = document.querySelector('[data-about-gallery]');
  if (aboutGallery) {
    const frames = [...aboutGallery.querySelectorAll('img')];
    let activeFrame = 0;
    let galleryTimer = null;
    const showNextFrame = () => {
      frames[activeFrame]?.classList.remove('is-active');
      activeFrame = (activeFrame + 1) % frames.length;
      frames[activeFrame]?.classList.add('is-active');
    };
    const startGallery = () => {
      if (galleryTimer || reduceMotion || frames.length < 2) return;
      galleryTimer = setInterval(showNextFrame, 1800);
    };
    const stopGallery = () => {
      clearInterval(galleryTimer);
      galleryTimer = null;
    };
    new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting ? startGallery() : stopGallery()), { threshold: .2 }).observe(aboutGallery);
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
    let pieceTimer = null;
    const setPieceState = painted => {
      pieceReveal.classList.toggle('is-painted', painted);
      pieceReveal.setAttribute('aria-pressed', String(painted));
    };
    pieceReveal.addEventListener('click', () => {
      setPieceState(!pieceReveal.classList.contains('is-painted'));
    });
    const startPieceCycle = () => {
      if (pieceTimer || reduceMotion) return;
      pieceTimer = setInterval(() => setPieceState(!pieceReveal.classList.contains('is-painted')), 2200);
    };
    const stopPieceCycle = () => { clearInterval(pieceTimer); pieceTimer = null; };
    new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting ? startPieceCycle() : stopPieceCycle()), { threshold: .35 }).observe(pieceReveal);
  }

  const finishImage = document.querySelector('[data-finish-image]');
  const finishTabs = [...document.querySelectorAll('.finish-tab')];
  let finishIndex = 0;
  let finishTimer = null;
  let finishSwapTimer = null;
  const activateFinish = tab => {
    finishTabs.forEach(item => item.classList.toggle('active', item === tab));
    finishIndex = Math.max(0, finishTabs.indexOf(tab));
    if (!finishImage) return;
    const frame = finishImage.parentElement;
    frame.classList.add('is-changing');
    clearTimeout(finishSwapTimer);
    finishSwapTimer = setTimeout(() => {
      finishImage.src = tab.dataset.image;
      finishImage.alt = tab.dataset.alt || '';
      frame.classList.remove('is-changing');
    }, reduceMotion ? 0 : 180);
  };
  finishTabs.forEach(tab => tab.addEventListener('click', () => activateFinish(tab)));
  const startFinishCycle = () => {
    if (finishTimer || reduceMotion || finishTabs.length < 2) return;
    finishTimer = setInterval(() => activateFinish(finishTabs[(finishIndex + 1) % finishTabs.length]), 2800);
  };
  const stopFinishCycle = () => { clearInterval(finishTimer); finishTimer = null; };
  const finishLayout = document.querySelector('.finish-layout');
  if (finishLayout) new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting ? startFinishCycle() : stopFinishCycle()), { threshold: .25 }).observe(finishLayout);

  document.querySelectorAll('[data-auto-clone]').forEach(track => {
    [...track.children].forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.tabIndex = -1;
      clone.querySelectorAll('img').forEach(image => image.alt = '');
      track.appendChild(clone);
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
      const direction = Number(control.dataset.carouselDir || 1);
      const step = Math.max(260, scroller.clientWidth * .72);
      if (scroller.matches('[data-looping-marquee]')) {
        const loopWidth = scroller.scrollWidth / 2;
        if (direction < 0 && scroller.scrollLeft < step * .35) scroller.scrollLeft += loopWidth;
        if (direction > 0 && scroller.scrollLeft > loopWidth - step * .35) scroller.scrollLeft -= loopWidth;
      }
      const amount = step * direction;
      scroller.scrollBy({ left: amount, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (scroller.matches('[data-looping-marquee]')) {
        clearTimeout(scroller._loopTimer);
        scroller._loopTimer = setTimeout(() => {
          const loopWidth = scroller.scrollWidth / 2;
          if (scroller.scrollLeft >= loopWidth) scroller.scrollLeft -= loopWidth;
        }, reduceMotion ? 50 : 650);
      }
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

  const shopProducts = document.querySelectorAll('[data-shop-product]');
  const cartItems = document.querySelector('[data-cart-items]');
  const cartKilos = document.querySelector('[data-cart-kilos]');
  const cartTotalKilos = document.querySelector('[data-cart-total-kilos]');
  const cartTotalPrice = document.querySelector('[data-cart-total-price]');
  const openOrderButton = document.querySelector('[data-open-order]');
  const orderModal = document.querySelector('[data-order-modal]');
  const orderSummary = document.querySelector('[data-order-summary]');
  const sendOrderLink = document.querySelector('[data-send-order]');
  const shopCart = new Map();
  const money = value => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);

  const getShopTotals = () => {
    let kilos = 0;
    let price = 0;
    shopCart.forEach(item => {
      kilos += item.kilos;
      price += item.kilos * item.price;
    });
    return { kilos, price };
  };

  const buildOrderMessage = () => {
    const { kilos, price } = getShopTotals();
    const lines = ['Hola Tuled, quiero hacer un pedido de pintura en polvo:', ''];
    shopCart.forEach(item => {
      lines.push(`• ${item.code} ${item.name} · ${item.finish}: ${item.kilos} kg × ${money(item.price)} = ${money(item.kilos * item.price)}`);
    });
    lines.push('', `Total: ${kilos} kg`, `Total estimado: ${money(price)}`, '', '¿Me confirman disponibilidad y que estará listo para recoger en la sucursal Tuled en un plazo máximo de 24 horas?');
    return lines.join('\n');
  };

  const renderOrderSummary = () => {
    if (!orderSummary || !sendOrderLink) return;
    const { kilos, price } = getShopTotals();
    orderSummary.innerHTML = '';
    shopCart.forEach(item => {
      const line = document.createElement('div');
      line.className = 'order-summary-line';
      const name = document.createElement('span');
      name.textContent = `${item.code} ${item.name} · ${item.finish}`;
      const amount = document.createElement('span');
      amount.textContent = `${item.kilos} kg · ${money(item.kilos * item.price)}`;
      line.append(name, amount);
      orderSummary.append(line);
    });
    const total = document.createElement('div');
    total.className = 'order-summary-total';
    total.innerHTML = `<span>Total · ${kilos} kg</span><strong>${money(price)}</strong>`;
    orderSummary.append(total);
    sendOrderLink.href = `https://wa.me/5218112303901?text=${encodeURIComponent(buildOrderMessage())}`;
  };

  const renderShopCart = () => {
    if (!cartItems) return;
    cartItems.innerHTML = '';
    if (!shopCart.size) {
      const empty = document.createElement('p');
      empty.className = 'shop-cart-empty';
      empty.textContent = 'Aún no agregas colores.';
      cartItems.append(empty);
    } else {
      shopCart.forEach(item => {
        const line = document.createElement('div');
        line.className = 'cart-line';
        line.innerHTML = `<div class="cart-line-name"><strong>${item.code} ${item.name}</strong><small>${item.finish} · ${money(item.price)}/kg</small></div><span class="cart-line-price">${money(item.kilos * item.price)}</span><div class="cart-line-controls"><button type="button" data-cart-action="minus" data-product-id="${item.id}" aria-label="Quitar un kilo">−</button><span>${item.kilos} kg</span><button type="button" data-cart-action="plus" data-product-id="${item.id}" aria-label="Agregar un kilo">+</button><button type="button" class="cart-remove" data-cart-action="remove" data-product-id="${item.id}">Quitar</button></div>`;
        cartItems.append(line);
      });
    }
    const { kilos, price } = getShopTotals();
    if (cartKilos) cartKilos.textContent = `${kilos} kg`;
    if (cartTotalKilos) cartTotalKilos.textContent = `${kilos} kg`;
    if (cartTotalPrice) cartTotalPrice.textContent = money(price);
    if (openOrderButton) openOrderButton.disabled = kilos === 0;
  };

  shopProducts.forEach(card => {
    const input = card.querySelector('input[type="number"]');
    const button = card.querySelector('[data-add-product]');
    if (input && !input.closest('.quantity-stepper')) {
      input.value = String(Math.max(1, Math.round(Number(input.value) || 1)));
      const stepper = document.createElement('div');
      stepper.className = 'quantity-stepper';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.className = 'quantity-step quantity-step-minus';
      minus.setAttribute('aria-label', 'Disminuir kilos');
      minus.textContent = '−';
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.className = 'quantity-step quantity-step-plus';
      plus.setAttribute('aria-label', 'Aumentar kilos');
      plus.textContent = '+';
      input.before(stepper);
      stepper.append(minus, input, plus);
      const changeQuantity = amount => {
        const next = Math.max(1, Math.min(999, Math.round(Number(input.value) || 1) + amount));
        input.value = String(next);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      minus.addEventListener('click', () => changeQuantity(-1));
      plus.addEventListener('click', () => changeQuantity(1));
      input.addEventListener('change', () => {
        input.value = String(Math.max(1, Math.min(999, Math.round(Number(input.value) || 1))));
      });
    }
    button?.addEventListener('click', () => {
      const kilos = Math.max(1, Math.min(999, Math.round(Number(input?.value) || 1)));
      if (input) input.value = String(kilos);
      const item = {
        id: card.dataset.productId,
        code: card.dataset.productCode,
        name: card.dataset.productName,
        finish: card.dataset.productFinish,
        price: Number(card.dataset.productPrice) || 109,
        kilos
      };
      const current = shopCart.get(item.id);
      if (current) current.kilos += kilos;
      else shopCart.set(item.id, item);
      renderShopCart();
      button.classList.remove('is-added');
      void button.offsetWidth;
      button.classList.add('is-added');
      button.textContent = 'Agregado';
      setTimeout(() => {
        button.classList.remove('is-added');
        button.textContent = 'Agregar';
      }, 700);
    });
  });

  cartItems?.addEventListener('click', event => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;
    const item = shopCart.get(button.dataset.productId);
    if (!item) return;
    if (button.dataset.cartAction === 'plus') item.kilos += 1;
    if (button.dataset.cartAction === 'minus') item.kilos -= 1;
    if (button.dataset.cartAction === 'remove' || item.kilos <= 0) shopCart.delete(item.id);
    renderShopCart();
  });

  const closeOrder = () => {
    if (!orderModal) return;
    orderModal.hidden = true;
    document.body.classList.remove('modal-open');
    openOrderButton?.focus();
  };

  openOrderButton?.addEventListener('click', () => {
    if (!shopCart.size || !orderModal) return;
    renderOrderSummary();
    orderModal.hidden = false;
    document.body.classList.add('modal-open');
    orderModal.querySelector('[data-close-order]')?.focus();
  });
  orderModal?.querySelectorAll('[data-close-order]').forEach(button => button.addEventListener('click', closeOrder));
  orderModal?.addEventListener('click', event => {
    if (event.target === orderModal) closeOrder();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && orderModal && !orderModal.hidden) closeOrder();
  });
  sendOrderLink?.addEventListener('click', () => {
    setTimeout(closeOrder, 250);
  });
  renderShopCart();

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
    open(`https://wa.me/5218112303901?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
  });

  document.querySelectorAll('[data-piece-quote]').forEach(link => {
    const name = link.dataset.pieceQuote;
    link.href = `https://wa.me/5218112303901?text=${encodeURIComponent(`Hola, quiero cotizar pintura electrostática para: ${name}.`)}`;
  });

  // Estela ligera de humo blanco para dispositivos con cursor preciso.
  const finePointer = matchMedia('(pointer:fine)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (finePointer && !reducedMotion) {
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.className = 'cursor-smoke';
    smokeCanvas.setAttribute('aria-hidden', 'true');
    document.body.append(smokeCanvas);
    const context = smokeCanvas.getContext('2d', { alpha: true });
    const particles = [];
    let frame = 0;
    let lastSpawn = 0;
    let lastX = -100;
    let lastY = -100;
    let pixelRatio = 1;

    const resizeSmoke = () => {
      pixelRatio = Math.min(devicePixelRatio || 1, 1.35);
      smokeCanvas.width = Math.round(innerWidth * pixelRatio);
      smokeCanvas.height = Math.round(innerHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const drawSmoke = now => {
      context.clearRect(0, 0, innerWidth, innerHeight);
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        const progress = (now - particle.born) / particle.duration;
        if (progress >= 1) {
          particles.splice(index, 1);
          continue;
        }
        const ease = 1 - Math.pow(1 - progress, 2);
        const x = particle.x + particle.vx * ease;
        const y = particle.y + particle.vy * ease;
        const radius = particle.size * (.72 + ease * .85);
        const opacity = Math.sin(Math.PI * progress) * particle.opacity;
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
        gradient.addColorStop(.42, `rgba(248,253,250,${opacity * .58})`);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      frame = particles.length ? requestAnimationFrame(drawSmoke) : 0;
    };

    document.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const now = performance.now();
      const distance = Math.hypot(event.clientX - lastX, event.clientY - lastY);
      if (now - lastSpawn < 30 || distance < 7) return;
      lastSpawn = now;
      lastX = event.clientX;
      lastY = event.clientY;
      const amount = distance > 34 ? 2 : 1;
      for (let index = 0; index < amount; index += 1) {
        particles.push({
          x: event.clientX + (Math.random() - .5) * 7,
          y: event.clientY + (Math.random() - .5) * 7,
          vx: (Math.random() - .5) * 22,
          vy: -22 - Math.random() * 26,
          size: 7 + Math.random() * 8,
          opacity: .16 + Math.random() * .13,
          born: now - index * 18,
          duration: 650 + Math.random() * 260
        });
      }
      if (particles.length > 28) particles.splice(0, particles.length - 28);
      if (!frame) frame = requestAnimationFrame(drawSmoke);
    }, { passive: true });

    addEventListener('resize', resizeSmoke, { passive: true });
    resizeSmoke();
  }
})();
