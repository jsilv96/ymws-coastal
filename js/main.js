// Oliva & Mare — main.js (a11y-hardened)

(function () {
  'use strict';

  // -----------------------------------------
  // Header scroll state
  // -----------------------------------------
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 60) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // -----------------------------------------
  // Mobile menu toggle
  // -----------------------------------------
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    links.id = links.id || 'nav-links';
    toggle.setAttribute('aria-controls', links.id);
    toggle.addEventListener('click', () => {
      const expanded = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // -----------------------------------------
  // Review slider — accessible carousel with userPaused toggle
  // -----------------------------------------
  const slider = document.querySelector('.review-slider');
  const slides = slider ? slider.querySelectorAll('.review-slide') : [];
  const dots = document.querySelectorAll('.review-nav button');
  const pauseBtn = document.querySelector('.slider-pause');
  let current = 0;
  let slideTimer = null;
  let userPaused = false;
  const SLIDE_INTERVAL = 6000;

  function showSlide(idx) {
    slides.forEach((s, i) => {
      const active = i === idx;
      s.classList.toggle('active', active);
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    dots.forEach((d, i) => {
      const active = i === idx;
      d.classList.toggle('active', active);
      d.setAttribute('aria-selected', active ? 'true' : 'false');
      d.setAttribute('tabindex', active ? '0' : '-1');
    });
    current = idx;
  }

  function nextSlide() {
    if (!slides.length) return;
    showSlide((current + 1) % slides.length);
  }

  function startTimer() {
    stopTimer();
    if (userPaused) return;
    slideTimer = setInterval(nextSlide, SLIDE_INTERVAL);
  }

  function stopTimer() {
    if (slideTimer) {
      clearInterval(slideTimer);
      slideTimer = null;
    }
  }

  function setPauseState(paused) {
    userPaused = paused;
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      const label = pauseBtn.querySelector('.slider-pause-label');
      const icon = pauseBtn.querySelector('i');
      if (label) label.textContent = paused ? 'Play reviews' : 'Pause reviews';
      if (icon) {
        icon.classList.toggle('fa-play', paused);
        icon.classList.toggle('fa-pause', !paused);
      }
    }
    if (paused) stopTimer(); else startTimer();
  }

  if (slides.length) {
    // Initial ARIA state
    slides.forEach((s, i) => s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true'));

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        showSlide(i);
        if (!userPaused) startTimer();
      });
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const n = (i + 1) % dots.length;
          showSlide(n);
          dots[n].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const p = (i - 1 + dots.length) % dots.length;
          showSlide(p);
          dots[p].focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          showSlide(0);
          dots[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          showSlide(dots.length - 1);
          dots[dots.length - 1].focus();
        }
      });
    });

    // Pause on hover/focus inside the slider
    if (slider) {
      slider.addEventListener('mouseenter', stopTimer);
      slider.addEventListener('mouseleave', () => { if (!userPaused) startTimer(); });
      slider.addEventListener('focusin', stopTimer);
      slider.addEventListener('focusout', () => { if (!userPaused) startTimer(); });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => setPauseState(!userPaused));
    }

    startTimer();
  }

  // -----------------------------------------
  // Lightbox — focus-trapped image viewer
  // -----------------------------------------
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    let lastFocused = null;

    const focusableInLightbox = () => [lightboxClose, lightboxImg].filter(Boolean);

    function openLightbox(src, alt) {
      lastFocused = document.activeElement;
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
      // Move focus into the dialog
      requestAnimationFrame(() => lightboxClose.focus());
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      lightboxImg.src = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    // Trigger opens
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const img = item.querySelector('img');
        if (img) openLightbox(img.src, img.alt);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const img = item.querySelector('img');
          if (img) openLightbox(img.src, img.alt);
        }
      });
    });

    // Close button
    lightboxClose.addEventListener('click', closeLightbox);

    // Backdrop click closes
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Keyboard handling — Escape to close, Tab traps inside dialog
    lightbox.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = focusableInLightbox();
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Make image programmatically focusable when open
    if (lightboxImg) lightboxImg.setAttribute('tabindex', '-1');
  }

  // -----------------------------------------
  // Cookie banner
  // -----------------------------------------
  const banner = document.getElementById('cookieBanner');
  if (banner) {
    try {
      if (!localStorage.getItem('oliva_cookie_choice')) {
        setTimeout(() => banner.classList.add('show'), 1200);
      }
    } catch (e) { /* ignore */ }
    const accept = banner.querySelector('[data-accept]');
    const decline = banner.querySelector('[data-decline]');
    const dismiss = (choice) => {
      try { localStorage.setItem('oliva_cookie_choice', choice); } catch (e) {}
      banner.classList.remove('show');
    };
    if (accept) accept.addEventListener('click', () => dismiss('accepted'));
    if (decline) decline.addEventListener('click', () => dismiss('declined'));
  }

  // -----------------------------------------
  // Subscribe form — aria-invalid + aria-describedby with live clearing
  // -----------------------------------------
  const subForms = document.querySelectorAll('.sub-form');
  subForms.forEach(form => {
    const fields = form.querySelectorAll('input[required], input[aria-required="true"]');

    function setFieldError(input, message) {
      input.classList.add('input-error');
      input.setAttribute('aria-invalid', 'true');
      const errorId = (input.id || 'field') + '-error';
      let errEl = document.getElementById(errorId);
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = errorId;
        errEl.className = 'field-error-msg';
        errEl.setAttribute('role', 'alert');
        input.insertAdjacentElement('afterend', errEl);
      }
      errEl.textContent = message;
      // Combine with any existing aria-describedby (e.g. label)
      const existing = input.getAttribute('aria-describedby');
      const ids = existing ? existing.split(/\s+/) : [];
      if (!ids.includes(errorId)) ids.push(errorId);
      input.setAttribute('aria-describedby', ids.join(' '));
    }

    function clearFieldError(input) {
      input.classList.remove('input-error');
      input.removeAttribute('aria-invalid');
      const errorId = (input.id || 'field') + '-error';
      const errEl = document.getElementById(errorId);
      if (errEl) errEl.remove();
      const existing = input.getAttribute('aria-describedby');
      if (existing) {
        const ids = existing.split(/\s+/).filter(id => id !== errorId);
        if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
        else input.removeAttribute('aria-describedby');
      }
    }

    // Clear errors as user types
    fields.forEach(input => {
      input.addEventListener('input', () => clearFieldError(input));
      input.addEventListener('change', () => clearFieldError(input));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstInvalid = null;

      fields.forEach(input => {
        const valid = input.checkValidity();
        if (!valid) {
          let msg = 'This field is required.';
          if (input.type === 'email' && input.value) msg = 'Please enter a valid email address.';
          if (input.type === 'tel' && input.value) msg = 'Please enter a valid phone number.';
          setFieldError(input, msg);
          if (!firstInvalid) firstInvalid = input;
        } else {
          clearFieldError(input);
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      // Success — replace any previous form-msg
      const prev = form.parentNode.querySelector('.form-msg');
      if (prev) prev.remove();
      const msg = document.createElement('div');
      msg.className = 'form-msg';
      msg.setAttribute('role', 'status');
      msg.setAttribute('aria-live', 'polite');
      msg.textContent = 'Thank you. Your seat at our table is saved.';
      form.insertAdjacentElement('afterend', msg);
      form.reset();
    });
  });
})();
