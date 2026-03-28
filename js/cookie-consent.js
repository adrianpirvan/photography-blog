(function () {
  const CONSENT_KEY = 'adrianpirvan_cookie_consent';

  function getConsent() {
    return localStorage.getItem(CONSENT_KEY);
  }

  function setConsent(value) {
    localStorage.setItem(CONSENT_KEY, value);
  }

  function enableAnalytics() {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  }

  function hideBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.remove();
  }

  function showBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      requestAnimationFrame(() => banner.classList.add('visible'));
    }
  }

  window.cookieAccept = function () {
    setConsent('accepted');
    enableAnalytics();
    hideBanner();
  };

  window.cookieDecline = function () {
    setConsent('declined');
    hideBanner();
  };

  const existing = getConsent();
  if (existing === 'accepted') {
    enableAnalytics();
  } else if (!existing) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
