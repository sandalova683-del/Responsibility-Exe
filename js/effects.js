(() => {
  'use strict';

  const SELECTORS = {
    reveal: '[data-reveal], .reveal',
    ripple: '[data-ripple]',
    tilt: '[data-tilt]',
    parallax: '[data-parallax]',
    counter: '[data-counter-to]'
  };

  const state = {
    initialized: false,
    handlers: [],
    observers: [],
    rafId: null
  };

  const qsAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const prefersReducedMotion = () => {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  const on = (element, eventName, handler, options) => {
    if (!element) return;
    element.addEventListener(eventName, handler, options);
    state.handlers.push({ element, eventName, handler, options });
  };

  const injectStyles = () => {
    if (document.getElementById('app-effects-style')) return;

    const style = document.createElement('style');
    style.id = 'app-effects-style';
    style.textContent = `
      [data-reveal], .reveal {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 600ms ease, transform 600ms ease;
      }

      [data-reveal].is-visible, .reveal.is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      [data-ripple] {
        position: relative;
        overflow: hidden;
      }

      .app-ripple {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        transform: scale(0);
        background: currentColor;
        opacity: 0.22;
        animation: app-ripple-animation 650ms ease-out forwards;
      }

      @keyframes app-ripple-animation {
        to {
          transform: scale(2.6);
          opacity: 0;
        }
      }

      [data-tilt] {
        transform-style: preserve-3d;
        will-change: transform;
      }

      [data-parallax] {
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
  };

  const initReveal = () => {
    const elements = qsAll(SELECTORS.reveal);
    if (!elements.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.14,
      rootMargin: '0px 0px -8% 0px'
    });

    elements.forEach((element) => observer.observe(element));
    state.observers.push(observer);
  };

  const initRipple = () => {
    qsAll(SELECTORS.ripple).forEach((element) => {
      on(element, 'pointerdown', (event) => {
        if (prefersReducedMotion()) return;

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');

        ripple.className = 'app-ripple';
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

        element.querySelectorAll('.app-ripple').forEach((item) => item.remove());
        element.appendChild(ripple);

        window.setTimeout(() => ripple.remove(), 700);
      });
    });
  };

  const initTilt = () => {
    if (prefersReducedMotion()) return;

    qsAll(SELECTORS.tilt).forEach((element) => {
      const maxTilt = Number(element.dataset.tilt) || 8;

      on(element, 'pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * maxTilt * 2;
        const rotateX = -((y / rect.height) - 0.5) * maxTilt * 2;

        element.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      });

      on(element, 'pointerleave', () => {
        element.style.transform = '';
      });
    });
  };

  const initParallax = () => {
    const elements = qsAll(SELECTORS.parallax);
    if (!elements.length || prefersReducedMotion()) return;

    const update = () => {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      elements.forEach((element) => {
        const speed = Number(element.dataset.parallax) || 0.12;
        const rect = element.getBoundingClientRect();
        const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
        const translateY = -centerOffset * speed;

        element.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
      });

      state.rafId = null;
    };

    const requestUpdate = () => {
      if (state.rafId) return;
      state.rafId = window.requestAnimationFrame(update);
    };

    on(window, 'scroll', requestUpdate, { passive: true });
    on(window, 'resize', requestUpdate);
    requestUpdate();
  };

  const formatCounterValue = (value, decimals) => {
    return Number(value).toLocaleString('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const animateCounter = (element) => {
    const target = Number(element.dataset.counterTo);
    if (!Number.isFinite(target)) return;

    const from = Number(element.dataset.counterFrom) || 0;
    const duration = Number(element.dataset.counterDuration) || 1200;
    const decimals = Number(element.dataset.counterDecimals) || 0;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;

      element.textContent = formatCounterValue(current, decimals);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        element.textContent = formatCounterValue(target, decimals);
      }
    };

    window.requestAnimationFrame(tick);
  };

  const initCounters = () => {
    const elements = qsAll(SELECTORS.counter);
    if (!elements.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      elements.forEach((element) => animateCounter(element));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });

    elements.forEach((element) => observer.observe(element));
    state.observers.push(observer);
  };

  const initSmoothAnchors = () => {
    on(document, 'click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href === '#' || !href.startsWith('#')) return;

      const target = document.getElementById(href.slice(1));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  };

  const init = () => {
    if (state.initialized) return;
    state.initialized = true;

    injectStyles();
    initReveal();
    initRipple();
    initTilt();
    initParallax();
    initCounters();
    initSmoothAnchors();

    document.documentElement.classList.add('effects-ready');
  };

  const destroy = () => {
    state.handlers.forEach(({ element, eventName, handler, options }) => {
      element.removeEventListener(eventName, handler, options);
    });

    state.observers.forEach((observer) => observer.disconnect());

    if (state.rafId) {
      window.cancelAnimationFrame(state.rafId);
    }

    state.handlers = [];
    state.observers = [];
    state.rafId = null;
    state.initialized = false;
  };

  window.AppEffects = {
    init,
    destroy,
    revealNow: () => qsAll(SELECTORS.reveal).forEach((element) => element.classList.add('is-visible')),
    animateCounter
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
