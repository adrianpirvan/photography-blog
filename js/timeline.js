/* ============================================
   TIMELINE.JS — Film reel vertical timeline
   ============================================ */

document.addEventListener('posts:loaded', () => {

  const timeline  = document.querySelector('.timeline');
  const indicator = document.querySelector('.tl-indicator');
  if (!timeline || !indicator) return;

  const fill           = timeline.querySelector('.tl-fill');
  const indicatorLabel = indicator.querySelector('.tl-indicator-label');

  const markerEls = Array.from(timeline.querySelectorAll('.tl-marker'));

  // Each marker is a boundary between two articles.
  // data-above / data-below identify the articles on each side.
  // data-label-up  = date to show / capture when crossing going UP   (returning to above article)
  // data-label-down = date to show / capture when crossing going DOWN (entering below article)
  const markers = markerEls.map(marker => {
    const aboveEl = document.getElementById(marker.dataset.above);
    if (!aboveEl) return null;
    const gallery = aboveEl.querySelector('.carousel-wrapper') || aboveEl;
    const belowEl = document.getElementById(marker.dataset.below) || null;
    return {
      marker,
      gallery,
      aboveEl,
      belowEl,
      labelUp:   marker.dataset.labelUp,
      labelDown: marker.dataset.labelDown || null,
      labelEl:   marker.querySelector('.tl-marker-label'),
      prevVpY:   null,
    };
  }).filter(Boolean);

  if (!markers.length) return;

  const navHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '92'
  );

  const GALLERY_GAP     = 20;   // px below the above article's carousel
  const MAX_LABEL_OPACITY = 0.55;
  const FADE_ZONE       = 90;
  const FADE_MS         = 180;

  let activeLabel  = '';
  let captureTimer = null;

  // Marker sits just below the carousel of the article above it
  function getDocY(m) {
    return m.gallery.offsetTop + m.gallery.offsetHeight + GALLERY_GAP;
  }

  function captureDate(label) {
    if (!label || label === activeLabel) return;
    activeLabel = label;
    indicatorLabel.style.opacity = '0';
    clearTimeout(captureTimer);
    captureTimer = setTimeout(() => {
      indicatorLabel.textContent   = label;
      indicatorLabel.style.opacity = '1';
    }, FADE_MS);
  }

  // On load: if the marker is already above center we've scrolled into the below article
  function initActiveDate() {
    const scrollY = window.scrollY;
    const center  = window.innerHeight / 2;
    let   active  = markers[0].labelUp; // default: first article's date

    for (const m of markers) {
      if (getDocY(m) - scrollY < center) active = m.labelDown || m.labelUp;
    }

    activeLabel                  = active;
    indicatorLabel.textContent   = active;
    indicatorLabel.style.opacity = '1';
  }

  initActiveDate();

  function update() {
    const scrollY = window.scrollY;
    const vH      = window.innerHeight;
    const center  = vH / 2;

    // === BATCH READS FIRST (prevents layout thrashing) ===
    const docYs     = markers.map(m => getDocY(m));
    const maxScroll = document.body.scrollHeight - vH;

    // === THEN ALL WRITES ===
    const progress = maxScroll > 0 ? Math.min(1, scrollY / maxScroll) : 0;
    if (fill) fill.style.height = `${progress * vH}px`;

    markers.forEach((m, i) => {
      const vpY = docYs[i] - scrollY;

      // Crossing: direction determines which date gets captured
      if (m.prevVpY !== null) {
        if (m.prevVpY > center && vpY <= center) captureDate(m.labelDown); // scrolled down past
        if (m.prevVpY < center && vpY >= center) captureDate(m.labelUp);   // scrolled up past
      }
      m.prevVpY = vpY;

      // Position the dot
      m.marker.style.top = `${vpY}px`;

      // Dot dims once it has been crossed going downward
      m.marker.classList.toggle('passed', vpY < center);

      // Label text: shows the date of whichever article you're heading toward
      const currentLabel = vpY >= center ? (m.labelDown || m.labelUp) : m.labelUp;
      if (m.labelEl) m.labelEl.textContent = currentLabel;

      // Hide the label if that date is already the active one in the indicator;
      // otherwise fade based on distance from viewport edges
      let opacity = 0;
      if (currentLabel !== activeLabel && vpY > 0 && vpY < vH) {
        const fromTop    = Math.min(vpY / FADE_ZONE, 1);
        const fromBottom = Math.min((vH - vpY) / FADE_ZONE, 1);
        opacity = Math.min(fromTop, fromBottom) * MAX_LABEL_OPACITY;
      }
      if (m.labelEl) m.labelEl.style.opacity = `${opacity}`;
    });
  }

  // Click: scroll toward whichever article is in your current direction
  markers.forEach(m => {
    m.marker.addEventListener('click', () => {
      const vpY   = getDocY(m) - window.scrollY;
      const center = window.innerHeight / 2;
      const target = vpY >= center ? m.belowEl : m.aboveEl;
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // RAF-throttled scroll: only run once per animation frame
  let scrollRafId = null;
  function onScroll() {
    if (scrollRafId) return;
    scrollRafId = requestAnimationFrame(() => {
      update();
      scrollRafId = null;
    });
  }

  // Debounced resize: avoid repeated recalculations during resize/orientation change
  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      markers.forEach(m => { m.prevVpY = null; });
      initActiveDate();
      update();
    }, 100);
  }

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

});
