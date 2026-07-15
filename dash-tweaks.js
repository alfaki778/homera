/* تطبيق تعديلات لوحة التحكم (Tweaks) — يُقرأ من localStorage ويُطبّق فوراً */
(function () {
  var DASH_FALLBACK_LOGO = 'uploads/1-logo.png';
  window.DASH_TWEAK_DEFAULTS = {
    theme: 'light',      // light | dark
    accent: 'gold',      // gold | petrol
    cardRadius: 16,
    density: 'comfy'     // comfy | compact
  };
  function readSiteTweaks() {
    try { return JSON.parse(localStorage.getItem('homera_tweaks') || '{}') || {}; } catch (e) { return {}; }
  }
  function read() {
    var t = {};
    try { t = JSON.parse(localStorage.getItem('homera_dash_tweaks') || '{}'); } catch (e) {}
    return Object.assign({}, window.DASH_TWEAK_DEFAULTS, t);
  }
  function applyLogo(url) {
    if (!url) return;
    document.querySelectorAll('.side .brand, .auth-brand').forEach(function (host) {
      var img = host.querySelector('img.brand-logo');
      if (!img) {
        img = document.createElement('img');
        img.className = 'brand-logo';
        img.alt = 'هوميرا';
        host.insertBefore(img, host.firstChild);
      }
      if (img.getAttribute('src') !== url) img.src = url;
      host.classList.add('has-logo');
    });
    document.documentElement.classList.add('tw-has-logo');
  }
  function apply(t) {
    t = Object.assign({}, window.DASH_TWEAK_DEFAULTS, t || {});
    var el = document.documentElement, r = el.style;
    var siteTweaks = readSiteTweaks();
    // الوضع
    if (t.theme === 'dark') el.setAttribute('data-theme', 'dark');
    else el.removeAttribute('data-theme');
    // الكثافة
    if (t.density === 'compact') el.setAttribute('data-density', 'compact');
    else el.removeAttribute('data-density');
    // اللون المميّز
    if (t.accent === 'petrol') { r.setProperty('--accent', '#1C5C70'); r.setProperty('--accent-d', '#0E3340'); }
    else { r.setProperty('--accent', '#C7A36B'); r.setProperty('--accent-d', '#9A7637'); }
    // استدارة البطاقات
    r.setProperty('--dash-radius', Number(t.cardRadius) + 'px');
    r.setProperty('--brand-logo-h', (Number(siteTweaks.logoSize) || 46) + 'px');
    applyLogo(siteTweaks.logo || DASH_FALLBACK_LOGO);
    window.__DASH_TWEAKS = t;
  }
  apply(read());
  document.addEventListener('DOMContentLoaded', function () { apply(read()); });
  window.DASH_applyTweaks = apply;
  window.DASH_readTweaks = read;
})();
