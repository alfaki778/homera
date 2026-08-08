/* HOMERA — عرض الصور بالحجم الكامل + تضمين فيديو المشروع داخل الصفحة */
(function () {
  /* ===== معرض الصور (Lightbox) ===== */
  var box = null;
  var images = [];
  var index = 0;

  function ensureBox() {
    if (box) return box;
    box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML =
      '<button type="button" class="lightbox-btn lightbox-close" aria-label="إغلاق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '<button type="button" class="lightbox-btn lightbox-prev" aria-label="السابق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg></button>' +
      '<img alt="صورة المشروع"/>' +
      '<button type="button" class="lightbox-btn lightbox-next" aria-label="التالي"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></button>' +
      '<span class="lightbox-count"></span>';
    document.body.appendChild(box);

    box.querySelector('.lightbox-close').addEventListener('click', close);
    box.querySelector('.lightbox-prev').addEventListener('click', function () { step(-1); });
    box.querySelector('.lightbox-next').addEventListener('click', function () { step(1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(-1);
      if (e.key === 'ArrowLeft') step(1);
    });
    return box;
  }

  function show() {
    var img = box.querySelector('img');
    img.src = images[index];
    box.querySelector('.lightbox-count').textContent = (index + 1) + ' / ' + images.length;
    var many = images.length > 1;
    box.querySelector('.lightbox-prev').hidden = !many;
    box.querySelector('.lightbox-next').hidden = !many;
  }

  function step(delta) {
    if (!images.length) return;
    index = (index + delta + images.length) % images.length;
    show();
  }

  function close() {
    if (!box) return;
    box.classList.remove('open');
    document.body.style.overflow = '';
  }

  function open(list, start) {
    images = (list || []).filter(Boolean);
    if (!images.length) return;
    index = Math.min(Math.max(0, Number(start || 0)), images.length - 1);
    ensureBox().classList.add('open');
    document.body.style.overflow = 'hidden';
    show();
  }

  /* ===== الفيديو: يوتيوب · Vimeo · جوجل درايف · رابط مباشر ===== */
  function videoEmbed(url) {
    var raw = String(url || '').trim();
    if (!raw) return null;

    var youtube = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/.exec(raw);
    if (youtube) return { kind: 'iframe', src: 'https://www.youtube.com/embed/' + youtube[1] + '?rel=0' };

    var vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(raw);
    if (vimeo) return { kind: 'iframe', src: 'https://player.vimeo.com/video/' + vimeo[1] };

    var drive = /drive\.google\.com\/(?:file\/d\/([\w-]+)|open\?id=([\w-]+)|uc\?(?:.*&)?id=([\w-]+))/.exec(raw);
    if (drive) return { kind: 'iframe', src: 'https://drive.google.com/file/d/' + (drive[1] || drive[2] || drive[3]) + '/preview' };

    if (/\.(mp4|webm|ogv|ogg|m4v|mov)(\?|#|$)/i.test(raw)) return { kind: 'video', src: raw };

    // رابط غير معروف — يُفتح في نافذة جديدة عبر زر «شاهد فيديو المشروع»
    return { kind: 'link', src: raw };
  }

  window.HOMERA_MEDIA = { openGallery: open, videoEmbed: videoEmbed };
})();
