/* ============================================
   CAROUSEL.JS — Horizontal scroll + lightbox
   ============================================ */

document.addEventListener('posts:loaded', () => {

  // ============================================================
  // LIGHTBOX — built dynamically, shared across all carousels
  // ============================================================

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lb-close" aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <button class="lb-prev" aria-label="Previous photo">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <img class="lb-img" src="" alt="">
    <button class="lb-next" aria-label="Next photo">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
    <div class="lb-counter"></div>
  `;
  document.body.appendChild(lightbox);

  const lbImg     = lightbox.querySelector('.lb-img');
  const lbPrev    = lightbox.querySelector('.lb-prev');
  const lbNext    = lightbox.querySelector('.lb-next');
  const lbClose   = lightbox.querySelector('.lb-close');
  const lbCounter = lightbox.querySelector('.lb-counter');

  let lbImages = [];  // array of {src, alt}
  let lbIndex  = 0;

  function openLightbox(images, index) {
    lbImages = images;
    lbIndex  = index;
    renderLbImage();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderLbImage() {
    lbImg.src = lbImages[lbIndex].src;
    lbImg.alt = lbImages[lbIndex].alt;
    lbCounter.textContent = `${lbIndex + 1} / ${lbImages.length}`;
    lbPrev.classList.toggle('hidden', lbIndex === 0);
    lbNext.classList.toggle('hidden', lbIndex === lbImages.length - 1);
  }

  function lbGoTo(index) {
    lbIndex = index;
    renderLbImage();
  }

  // Button events
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => { if (lbIndex > 0) lbGoTo(lbIndex - 1); });
  lbNext.addEventListener('click', () => { if (lbIndex < lbImages.length - 1) lbGoTo(lbIndex + 1); });

  // Click backdrop (not image) to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lbImg) closeLightbox();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    e.preventDefault();
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft'  && lbIndex > 0)                   lbGoTo(lbIndex - 1);
    if (e.key === 'ArrowRight' && lbIndex < lbImages.length - 1) lbGoTo(lbIndex + 1);
  });

  // Touch swipe inside lightbox
  let lbTouchX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    lbTouchX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - lbTouchX;
    if (Math.abs(delta) < 40) return; // too short — treat as tap to close
    if (delta < 0 && lbIndex < lbImages.length - 1) lbGoTo(lbIndex + 1);
    if (delta > 0 && lbIndex > 0)                   lbGoTo(lbIndex - 1);
  }, { passive: true });

  // ============================================================
  // CAROUSELS — wheel scroll + drag + click-to-open
  // ============================================================

  const carousels = document.querySelectorAll('.photo-carousel');

  carousels.forEach(carousel => {
    let isDragging   = false;
    let dragStartX   = 0;
    let dragDistance = 0;
    let scrollAtDragStart = 0;
    let cachedOffsetLeft  = 0;
    let cachedMaxScroll   = 0;

    // Smooth scroll state
    let targetScroll = 0;
    let rafId = null;

    function animateScroll() {
      const diff = targetScroll - carousel.scrollLeft;
      if (Math.abs(diff) < 0.5) {
        carousel.scrollLeft = targetScroll;
        rafId = null;
        return;
      }
      carousel.scrollLeft += diff * 0.1;
      rafId = requestAnimationFrame(animateScroll);
    }

    // ===== MOUSE WHEEL =====
    // Sync target position when user hovers (in case content scrolled externally)
    carousel.addEventListener('mouseenter', () => {
      targetScroll = carousel.scrollLeft;
    });

    // Listener on the carousel itself — no need to check isHovering, no window-level overhead
    carousel.addEventListener('wheel', (e) => {
      const atStart = targetScroll <= 0;
      const atEnd   = targetScroll + carousel.clientWidth >= carousel.scrollWidth - 1;
      if (atStart && e.deltaY < 0) return;
      if (atEnd   && e.deltaY > 0) return;
      e.preventDefault();
      targetScroll += e.deltaY * 1.4;
      targetScroll = Math.max(0, Math.min(targetScroll, carousel.scrollWidth - carousel.clientWidth));
      if (!rafId) rafId = requestAnimationFrame(animateScroll);
    }, { passive: false });

    // ===== MOUSE DRAG =====
    carousel.addEventListener('mousedown', (e) => {
      isDragging   = true;
      dragDistance = 0;
      // Cache layout reads once at drag start — avoids per-frame layout queries
      cachedOffsetLeft = carousel.offsetLeft;
      cachedMaxScroll  = carousel.scrollWidth - carousel.clientWidth;
      dragStartX        = e.pageX - cachedOffsetLeft;
      scrollAtDragStart = carousel.scrollLeft;
      targetScroll      = carousel.scrollLeft;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      carousel.classList.add('is-dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - cachedOffsetLeft;  // no layout read
      dragDistance = Math.abs(x - dragStartX);
      const newScroll = Math.max(0, Math.min(
        scrollAtDragStart - (x - dragStartX) * 1.6,
        cachedMaxScroll
      ));
      carousel.scrollLeft = newScroll;
      targetScroll        = newScroll;  // no read-after-write
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      targetScroll = carousel.scrollLeft;
      carousel.classList.remove('is-dragging');
    });

    // ===== TOUCH — native browser scroll handles scrollLeft on mobile =====
    // We only track movement distance here to distinguish tap vs. scroll for lightbox.
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDistance = 0;

    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchDistance = 0;
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      touchDistance = Math.sqrt(dx * dx + dy * dy);
      // Scroll is handled natively via overflow-x: scroll + touch-action: pan-x
    }, { passive: true });

    // ===== CLICK TO OPEN LIGHTBOX =====
    const imgs = Array.from(carousel.querySelectorAll('.carousel-img'));
    const lbData = imgs.map(img => ({ src: img.src, alt: img.alt }));

    imgs.forEach((img, index) => {
      // Mouse click — only if not a drag
      img.addEventListener('click', () => {
        if (dragDistance > 6) return;
        openLightbox(lbData, index);
      });

      // Touch tap — only if finger barely moved
      img.addEventListener('touchend', (e) => {
        if (touchDistance > 10) return;
        e.preventDefault(); // prevent ghost click
        openLightbox(lbData, index);
      });
    });
  });

});
