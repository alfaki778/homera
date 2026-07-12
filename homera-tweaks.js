/* ============================================================
   HOMERA — تطبيق التعديلات (Tweaks) على كامل الموقع
   يُقرأ من localStorage ويُطبّق كمتغيرات CSS + نصوص الهيرو.
   يعمل على كل الصفحات؛ لوحة التعديل (React) تعيش في الصفحة الرئيسية.
   ============================================================ */
(function () {
  window.HOMERA_TWEAK_DEFAULTS = {
    heroVariant: 'centered',
    heroEyebrow: 'بيتك في جدة',
    heroTitle: 'حياة عنوانها الرقي والراحة',
    heroText: 'هوميرا شركة سعودية راسخة تتمتع بخبرة واسعة في مجالات التطوير العقاري والتسويق والاستثمار، تأسست على أسس قوية، وتقدّم حلولاً عقارية متكاملة تلبّي احتياجات السوق المحلي وتواكب تطلعات العملاء.',
    fontFamily: 'Alexandria',
    headingWeight: 800,
    accent: 'gold',
    buttonShape: 'rounded',
    cornerRadius: 16,
    logo: '',
    heroImage: '',
    aboutImage: '',
    aboutEyebrow: 'من نحن',
    aboutTitle: 'نبني الثقة قبل أن نبني العقار',
    aboutText: 'هوميرا للتطوير العقاري تقدّم مشاريع سكنية واستثمارية في جدة بمعايير جودة عالية وشفافية كاملة، من التصميم إلى التسليم.',
    aboutP1: 'خبرة راسخة في التطوير والتسويق والاستثمار العقاري.',
    aboutP2: 'حلول عقارية متكاملة تلبّي احتياجات السوق المحلي.',
    aboutP3: 'التزام بالجودة والمواعيد وضمان على الإنشاءات.',
    contactEyebrow: 'تواصل معنا',
    contactTitle: 'لنبدأ رحلتك نحو منزلك',
    contactText: 'تواصل مع فريق هوميرا مباشرةً — نجيب على استفساراتك ونساعدك في اختيار عقارك المناسب.',
    contactPhone: '+966 12 000 0000',
    contactAddress: 'حي الفيصلية، جدة، السعودية',
    contactEmail: 'info@homera.sa',
    projFadilaImg: '',
    projRoudahImg: '',
    projSalamahImg: '',
    projNaeemImg: '',
    banners: [],
    pgProjectsBanner: '', pgPFadila: '', pgPRoudah: '', pgPSalamah: '', pgPNaeem: '', pgPSafa: '', pgPAbhur: '',
    pgFadilaBanner: '', pgFadilaMain: '', pgFadilaT1: '', pgFadilaT2: '', pgFadilaT3: '', pgFadilaT4: '', pgFadilaMap: ''
  };

  var FONT_STACK = {
    'Alexandria': "'Alexandria',system-ui,sans-serif",
    'Cairo': "'Cairo',system-ui,sans-serif",
    'Tajawal': "'Tajawal',system-ui,sans-serif",
    'IBM Plex Sans Arabic': "'IBM Plex Sans Arabic',system-ui,sans-serif"
  };

  function readTweaks() {
    var t = {};
    try { t = JSON.parse(localStorage.getItem('homera_tweaks') || '{}'); } catch (e) {}
    return Object.assign({}, window.HOMERA_TWEAK_DEFAULTS, t);
  }

  function applyTweaks(t) {
    t = Object.assign({}, window.HOMERA_TWEAK_DEFAULTS, t || {});
    var r = document.documentElement.style;

    // الخط
    r.setProperty('--font', FONT_STACK[t.fontFamily] || FONT_STACK.Alexandria);
    // وزن العناوين
    r.setProperty('--heading-weight', String(t.headingWeight));
    // لون التمييز
    if (t.accent === 'petrol') {
      r.setProperty('--accent', '#15495B');
      r.setProperty('--accent-d', '#0E3340');
    } else {
      r.setProperty('--accent', '#C7A36B');
      r.setProperty('--accent-d', '#9A7637');
    }
    // استدارة الحواف
    var rad = Number(t.cornerRadius);
    r.setProperty('--radius', rad + 'px');
    r.setProperty('--radius-sm', Math.round(rad * 0.6) + 'px');
    // شكل الأزرار
    document.documentElement.setAttribute('data-btn-shape', t.buttonShape || 'hex');
    var chamfer = Math.max(8, Math.round(rad * 0.7));
    switch (t.buttonShape) {
      case 'rect':
        r.setProperty('--btn-clip', 'none');
        r.setProperty('--btn-radius', Math.round(rad * 0.6) + 'px');
        break;
      case 'rounded':
        r.setProperty('--btn-clip', 'none');
        r.setProperty('--btn-radius', '14px');
        break;
      case 'pill':
        r.setProperty('--btn-clip', 'none');
        r.setProperty('--btn-radius', '999px');
        break;
      case 'bevel':
        r.setProperty('--btn-clip',
          'polygon(' + chamfer + 'px 0,calc(100% - ' + chamfer + 'px) 0,100% ' + chamfer + 'px,' +
          '100% calc(100% - ' + chamfer + 'px),calc(100% - ' + chamfer + 'px) 100%,' +
          chamfer + 'px 100%,0 calc(100% - ' + chamfer + 'px),0 ' + chamfer + 'px)');
        r.setProperty('--btn-radius', '0px');
        break;
      default: // hex
        r.setProperty('--btn-clip', 'polygon(7% 0,93% 0,100% 50%,93% 100%,7% 100%,0 50%)');
        r.setProperty('--btn-radius', '0px');
    }

    // نصوص الهيرو (إن وُجدت في الصفحة)
    setText('[data-tw="heroEyebrow"]', t.heroEyebrow);
    setText('[data-tw="heroTitle"]', t.heroTitle);
    setText('[data-tw="heroText"]', t.heroText);

    // متغيّر الهيرو
    var home = document.querySelector('[data-hero-root]');
    if (home) home.setAttribute('data-hero-variant', t.heroVariant);

    // نصوص قسم "من نحن"
    setText('[data-tw="aboutEyebrow"]', t.aboutEyebrow);
    setText('[data-tw="aboutTitle"]', t.aboutTitle);
    setText('[data-tw="aboutText"]', t.aboutText);
    setText('[data-tw="aboutP1"]', t.aboutP1);
    setText('[data-tw="aboutP2"]', t.aboutP2);
    setText('[data-tw="aboutP3"]', t.aboutP3);

    // نصوص قسم "التواصل"
    setText('[data-tw="contactEyebrow"]', t.contactEyebrow);
    setText('[data-tw="contactTitle"]', t.contactTitle);
    setText('[data-tw="contactText"]', t.contactText);
    setText('[data-tw="contactPhone"]', t.contactPhone);
    setText('[data-tw="contactAddress"]', t.contactAddress);
    setText('[data-tw="contactEmail"]', t.contactEmail);

    // الصور (عبر خاصية src في عنصر image-slot)
    setSlotImg('home-hero', t.heroImage);
    setSlotImg('home-hero-split', t.heroImage);
    setSlotImg('about-img', t.aboutImage);
    setSlotImg('home-proj-fadila', t.projFadilaImg);
    setSlotImg('home-proj-roudah', t.projRoudahImg);
    setSlotImg('home-proj-salamah', t.projSalamahImg);
    setSlotImg('home-proj-naeem', t.projNaeemImg);
    // صفحة المشاريع
    setSlotImg('projects-banner', t.pgProjectsBanner);
    setSlotImg('p-fadila', t.pgPFadila);
    setSlotImg('p-roudah', t.pgPRoudah);
    setSlotImg('p-salamah', t.pgPSalamah);
    setSlotImg('p-naeem', t.pgPNaeem);
    setSlotImg('p-safa', t.pgPSafa);
    setSlotImg('p-abhur', t.pgPAbhur);
    // صفحة تفاصيل المشروع
    setSlotImg('fadila-banner', t.pgFadilaBanner);
    setSlotImg('fadila-main', t.pgFadilaMain);
    setSlotImg('fadila-t1', t.pgFadilaT1);
    setSlotImg('fadila-t2', t.pgFadilaT2);
    setSlotImg('fadila-t3', t.pgFadilaT3);
    setSlotImg('fadila-t4', t.pgFadilaT4);
    setSlotImg('fadila-map', t.pgFadilaMap);

    // بنرات الصفحة الرئيسية
    renderBanners(t.banners);

    // الشعار (يظهر في الترويسة والفوتر بكل الصفحات)
    applyLogo(t.logo);

    window.__HOMERA_TWEAKS = t;
  }

  function applyLogo(url) {
    ['.brandmark', '.foot-brand'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (host) {
        var img = host.querySelector('img.brand-logo');
        if (url) {
          if (!img) { img = document.createElement('img'); img.className = 'brand-logo'; img.alt = 'هوميرا'; host.insertBefore(img, host.firstChild); }
          if (img.getAttribute('src') !== url) img.src = url;
          host.classList.add('has-logo');
        } else {
          if (img) img.remove();
          host.classList.remove('has-logo');
        }
      });
    });
  }

  function renderBanners(list) {
    var sec = document.getElementById('home-banners');
    var track = document.getElementById('bannersTrack');
    if (!sec || !track) return;
    list = Array.isArray(list) ? list : [];
    if (!list.length) { sec.setAttribute('hidden', ''); track.innerHTML = ''; return; }
    sec.removeAttribute('hidden');
    track.innerHTML = list.map(function (src) {
      return '<div class="banner-item"><img src="' + src + '" alt="بنر"/></div>';
    }).join('');
  }

  function setText(sel, val) {
    if (val == null) return;
    document.querySelectorAll(sel).forEach(function (el) { el.textContent = val; });
  }

  function setSlotImg(id, url) {
    var el = document.getElementById(id);
    if (!el) return;
    if (url) { el.setAttribute('src', url); }
    else { el.removeAttribute('src'); }
  }

  // تطبيق فوري لتفادي الوميض
  applyTweaks(readTweaks());
  document.addEventListener('DOMContentLoaded', function () { applyTweaks(readTweaks()); });

  window.HOMERA_applyTweaks = applyTweaks;
  window.HOMERA_readTweaks = readTweaks;
})();
