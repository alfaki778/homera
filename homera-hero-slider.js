/* ============================================================
   HOMERA — سلايدر صور غلاف الصفحة الرئيسية
   يبدّل صور الهيرو تلقائياً بتلاشٍ ناعم، مع سهمين على طرفي
   الصورة وسحب باللمس على الجوال. الصور والمدّة تأتي من إعدادات
   لوحة التحكم (heroImages / heroSpeed) عبر homera-tweaks.js.
   ============================================================ */
(function () {
  var MIN_SECONDS = 2;
  var MAX_SECONDS = 12;
  var SWIPE_PX = 40;

  var root = null;
  var slides = [];
  var index = 0;
  var timer = null;
  var delay = 5000;
  var signature = '';
  var paused = false;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* بصمة خفيفة للقائمة — الصور base64 طويلة، فلا نقارنها كاملة.
     applyTweaks تُستدعى أكثر من مرة، فلا نعيد البناء إلا إذا تغيّرت الصور */
  function signatureOf(list) {
    return list.map(function (url) {
      return url.length + ':' + url.slice(0, 48) + url.slice(-48);
    }).join('|');
  }

  function show(next) {
    if (!slides.length) return;
    index = (next + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      var active = i === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function start() {
    stop();
    if (slides.length < 2 || paused || reduceMotion || document.hidden) return;
    timer = setInterval(function () { show(index + 1); }, delay);
  }

  /* التنقّل اليدوي يعيد ضبط العدّاد كي لا تتبدّل الصورة فور الضغط */
  function go(step) {
    show(index + step);
    start();
  }

  function bind() {
    var hero = root.closest('.hero-centered') || root.parentNode;

    hero.querySelector('.hero-arrow.prev').addEventListener('click', function () { go(-1); });
    hero.querySelector('.hero-arrow.next').addEventListener('click', function () { go(1); });

    /* الإيقاف عند المرور للأجهزة ذات المؤشّر فقط: اللمس يُطلق mouseenter
       بلا mouseleave لاحقاً، فكان السلايدر سيتوقف نهائياً بعد أول لمسة */
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      hero.addEventListener('mouseenter', function () { paused = true; stop(); });
      hero.addEventListener('mouseleave', function () { paused = false; start(); });
    }
    document.addEventListener('visibilitychange', start);

    /* السحب باللمس: في واجهة عربية السحب لليسار يعني «التالي» */
    var startX = null;
    hero.addEventListener('touchstart', function (e) {
      startX = e.touches.length === 1 ? e.touches[0].clientX : null;
    }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (startX == null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* يُرجع رابط الصورة الأولى المعروضة فعلاً (لضبط نسبة القسم) */
  function render(list, seconds) {
    if (!root) {
      root = document.getElementById('heroSlides');
      if (!root) return '';
      bind();
    }

    var secs = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Number(seconds) || 5));
    delay = secs * 1000;

    var images = (Array.isArray(list) ? list : []).map(String).filter(Boolean);
    /* بلا صور في الإعدادات نُبقي الصورة الافتراضية المكتوبة في HTML */
    if (images.length) {
      var sig = signatureOf(images);
      if (sig !== signature) {
        signature = sig;
        root.innerHTML = images.map(function (url, i) {
          return '<div class="hero-slide' + (i === 0 ? ' is-active' : '') + '" aria-hidden="' + (i === 0 ? 'false' : 'true') + '">' +
            '<img src="' + esc(url) + '" alt="" decoding="async"' + (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + '/>' +
            '</div>';
        }).join('');
        index = 0;
      }
    }

    slides = Array.prototype.slice.call(root.querySelectorAll('.hero-slide'));
    var multi = slides.length > 1;
    var hero = root.closest('.hero-centered') || root.parentNode;
    hero.classList.toggle('has-slides', multi);
    hero.querySelectorAll('.hero-arrow').forEach(function (btn) { btn.hidden = !multi; });

    start();
    var first = root.querySelector('.hero-slide img');
    return first ? first.getAttribute('src') : '';
  }

  window.HOMERA_renderHeroSlider = render;
})();
