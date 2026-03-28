/* ============================================
   NAV.JS — Active links & mobile hamburger menu
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ===== RO-ONLY OVERLAY =====
  const ucOverlay = document.getElementById('uc-overlay');
  if (ucOverlay) {
    const updateOverlay = (lang) => {
      ucOverlay.classList.toggle('hidden', lang !== 'ro');
    };
    updateOverlay(window.currentLang);
    document.addEventListener('langchange', (e) => updateOverlay(e.detail.lang));
  }

  // ===== ACTIVE NAV LINK =====
  const filename = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    const isHome = (filename === '' || filename === 'index.html');
    if ((isHome && href === 'index.html') || (!isHome && href === filename)) {
      link.classList.add('active');
    }
  });

  // ===== HAMBURGER TOGGLE =====
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a link is tapped
  menu.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

});
