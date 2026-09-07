/* ============================================================
   HOMERA — شريط «شركاء النجاح»
   يرسم شعارات الشركاء القادمة من إعدادات لوحة التحكم داخل شريط
   يتحرّك تلقائياً وبلا توقف. المجموعة تُكرّر مرّتين ليكون الالتفاف
   سلساً بلا قفزة، والمدّة تُحسب من العرض الفعلي كي تبقى السرعة
   ثابتة مهما تغيّر عدد الشعارات أو حجم الشاشة.
   ============================================================ */
(function () {
  var TRACK_ID = 'partnersTrack';
  /* بكسل/ثانية لكل درجة في مؤشّر السرعة (1 = هادئة … 5 = سريعة) */
  var SPEEDS = [22, 34, 48, 66, 90];
  /* أقل عرض تقريبي للمجموعة الواحدة — نكرّر الشعارات حتى نتجاوزه
     فلا تظهر فجوة على الشاشات العريضة */
  var MIN_GROUP_WIDTH = 1800;
  var CARD_SPAN = 208; // عرض البطاقة + الفجوة (تقدير للتكرار فقط)

  var currentSpeed = 3;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* روابط الشركاء تأتي من الإعدادات — نقبل بروتوكولات آمنة فقط */
  function safeHref(value) {
    var url = String(value || '').trim();
    return /^(https?:\/\/|\/)/i.test(url) ? url : '';
  }

  function normalize(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function (item) {
      if (typeof item === 'string') return { img: item, name: '', url: '' };
      item = item || {};
      return {
        img: String(item.img || ''),
        name: String(item.name || ''),
        url: String(item.url || '')
      };
    }).filter(function (item) { return !!item.img; });
  }

  function cardHtml(partner) {
    var href = safeHref(partner.url);
    var tag = href ? 'a' : 'div';
    var name = partner.name ? esc(partner.name) : '';
    return '<' + tag + ' class="partner-card"' +
      (href ? ' href="' + esc(href) + '" target="_blank" rel="noopener"' : '') +
      (name ? ' title="' + name + '"' : '') + '>' +
      '<img src="' + esc(partner.img) + '" alt="' + (name || 'شريك نجاح') + '" loading="lazy" decoding="async"/>' +
      '</' + tag + '>';
  }

  /* المدّة = عرض المجموعة ÷ السرعة — فالحركة تبدو واحدة في كل الأحوال */
  function syncDuration(track) {
    var group = track.firstElementChild;
    if (!group) return;
    var width = group.getBoundingClientRect().width;
    if (!width) return;
    var pxPerSecond = SPEEDS[Math.min(SPEEDS.length, Math.max(1, Number(currentSpeed) || 3)) - 1];
    track.style.setProperty('--partners-duration', Math.round(width / pxPerSecond) + 's');
  }

  function render(list, speed) {
    var track = document.getElementById(TRACK_ID);
    if (!track) return;
    var section = track.closest('[data-partners-section]');
    var partners = normalize(list);
    currentSpeed = Number(speed) || 3;

    if (!partners.length) {
      track.innerHTML = '';
      if (section) section.hidden = true;
      return;
    }
    if (section) section.hidden = false;

    var reps = Math.max(1, Math.ceil(MIN_GROUP_WIDTH / (partners.length * CARD_SPAN)));
    var items = '';
    for (var i = 0; i < reps; i++) items += partners.map(cardHtml).join('');

    /* النسخة الثانية مطابقة تماماً — الحركة تنتهي عند -50% فتعود بلا قفزة */
    track.innerHTML =
      '<div class="partners-group">' + items + '</div>' +
      '<div class="partners-group" aria-hidden="true">' + items + '</div>';

    syncDuration(track);
    /* الصور تصل لاحقاً وقد تُغيّر العرض — نعيد الحساب بعد أول رسم */
    requestAnimationFrame(function () { syncDuration(track); });
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var track = document.getElementById(TRACK_ID);
      if (track && track.firstElementChild) syncDuration(track);
    }, 180);
  });

  window.HOMERA_renderPartners = render;
})();
