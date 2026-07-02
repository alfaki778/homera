/* تطبيق تعديلات لوحة التحكم (Tweaks) — يُقرأ من localStorage ويُطبّق فوراً */
(function () {
  window.DASH_TWEAK_DEFAULTS = {
    theme: 'light',      // light | dark
    accent: 'gold',      // gold | petrol
    cardRadius: 16,
    density: 'comfy'     // comfy | compact
  };
  function read() {
    var t = {};
    try { t = JSON.parse(localStorage.getItem('homera_dash_tweaks') || '{}'); } catch (e) {}
    return Object.assign({}, window.DASH_TWEAK_DEFAULTS, t);
  }
  function apply(t) {
    t = Object.assign({}, window.DASH_TWEAK_DEFAULTS, t || {});
    var el = document.documentElement, r = el.style;
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
    window.__DASH_TWEAKS = t;
  }
  apply(read());
  document.addEventListener('DOMContentLoaded', function () { apply(read()); });
  window.DASH_applyTweaks = apply;
  window.DASH_readTweaks = read;
})();
