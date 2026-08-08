/* HOMERA — عرض المشاريع كبطاقة واحدة لكل مشروع + أقسام الفرص وتحت الإنشاء */
(function () {
  var PLACEHOLDER = 'uploads/3.jpg';

  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function projectHref(project) { return 'project/' + encodeURIComponent(project.id || project.name || ''); }

  var STAGE_LABEL = { ready: 'جاهز', under_construction: 'تحت الإنشاء', resale: 'إعادة بيع' };
  var CATEGORY_LABEL = { residential: 'سكني', commercial: 'تجاري', investment: 'استثماري' };
  var PAYMENT_LABEL = { cash: 'كاش', bank: 'تمويل بنكي', both: 'كاش أو تمويل' };

  // أول بطاقتين/ثلاث فوق الطية: تحميل فوري بأولوية عالية، والباقي كسول
  function imgAttrs(index, eagerCount) {
    return index < eagerCount
      ? ' loading="eager" fetchpriority="high" decoding="async"'
      : ' loading="lazy" fetchpriority="low" decoding="async"';
  }

  // هيكل مؤقت يحجز مساحة البطاقات فور تحميل الصفحة بدل ترك القسم فارغاً
  function skeleton(count, withMeta) {
    var one = '<div class="proj-card is-skeleton" aria-hidden="true">' +
      '<div class="thumb sk"></div>' +
      '<div class="bar"><span class="sk-line"></span><span class="sk-line sm"></span></div>' +
      (withMeta ? '<div class="meta"><span class="sk-line sm"></span><span class="sk-line sm"></span></div>' : '') +
      '</div>';
    return new Array(count + 1).join(one);
  }

  function empty(message) {
    return '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:36px">' +
      esc(message || 'لا توجد مشاريع متاحة حالياً.') + '</div>';
  }

  /* شريط رقم الترخيص أسفل الصورة — يظهر فقط عند إدخال الرقم من لوحة التحكم */
  function licenseBar(project) {
    var license = String(project.license || '').trim();
    if (!license) return '';
    return '<div class="lic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.4-2.9 8.2-7 10-4.1-1.8-7-5.6-7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>' +
      '<span class="k">الترخيص:</span><b class="v">' + esc(license) + '</b></div>';
  }

  /* الشارات فوق الصورة: نسبة الخصم · فرصة محدودة · حالة المشروع */
  function badges(project) {
    var items = [];
    if (project.discountPct > 0) items.push('<span class="badge off">خصم ' + project.discountPct + '%</span>');
    if (project.limitedOffer) items.push('<span class="badge limited">فرصة محدودة</span>');
    if (project.stage && project.stage !== 'ready') items.push('<span class="badge stage">' + esc(STAGE_LABEL[project.stage] || '') + '</span>');
    if (project.noCommission) items.push('<span class="badge free">بدون عمولة</span>');
    return items.length ? '<div class="badges">' + items.join('') + '</div>' : '';
  }

  /* «تبدأ الأسعار من 550,000 ريال» — أقل سعر بين نماذج المشروع */
  function priceRow(project) {
    var price = Number(project.priceFrom || project.price || 0);
    if (!price) return '<div class="price-row"><span class="ask">السعر عند الطلب</span></div>';
    var old = Number(project.oldPrice || 0);
    return '<div class="price-row">' +
      '<span class="from">تبدأ الأسعار من</span>' +
      '<b class="val">' + fmt(price) + ' ريال</b>' +
      (old > price ? '<s class="old">' + fmt(old) + '</s>' : '') +
      '</div>';
  }

  /* شريط نسبة الإنجاز + تاريخ التسليم المتوقع */
  function buildBar(project) {
    if (project.stage !== 'under_construction') return '';
    var pct = Math.min(100, Math.max(0, Number(project.progress || 0)));
    return '<div class="build">' +
      '<div class="build-bar"><span class="track"><i style="width:' + pct + '%"></i></span><span class="pct">' + pct + '%</span></div>' +
      (project.deliveryDate
        ? '<div class="build-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>التسليم المتوقع: ' + esc(project.deliveryDate) + '</div>'
        : '') +
      '</div>';
  }

  function noFeeNote(project) {
    if (!project.noCommission) return '';
    return '<div class="no-fee"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 16 8-8"/><circle cx="9.5" cy="9.5" r="1.2"/><circle cx="14.5" cy="14.5" r="1.2"/></svg>' +
      'امتلك عقارك دون دفع عمولة تسويق أو وساطة عقارية.</div>';
  }

  function modelsTag(project) {
    if (!project.modelsCount) return '';
    return '<span class="tag-bottom"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>' +
      project.modelsCount + ' نماذج متاحة</span>';
  }

  function thumb(project, index, eager) {
    var cover = project.cover || PLACEHOLDER;
    return '<div class="thumb"><span class="pill">' + esc(project.type || CATEGORY_LABEL[project.category] || 'عقار') + '</span>' +
      badges(project) +
      '<img class="project-cover" src="' + esc(cover) + '" alt="' + esc(project.name) + '"' + imgAttrs(index, eager) + '>' +
      '<div class="ov"></div>' + modelsTag(project) + '</div>';
  }

  function titleBar(project) {
    return '<div class="bar"><span class="nm">' + esc(project.name) + '</span>' +
      '<span class="units"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> ' +
      project.avail + ' متاح</span></div>';
  }

  function metaRow(project) {
    return '<div class="meta">' +
      '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg> ' + esc(project.dist) + '، ' + esc(project.city) + '</span>' +
      (project.area ? '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 21h18M4 21V10l8-6 8 6v11"/></svg> ' + fmt(project.area) + ' م²</span>' : '') +
      '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg> ' + esc(PAYMENT_LABEL[project.payment] || '') + '</span>' +
      '</div>';
  }

  function detailsBtn(project) {
    return '<div class="card-actions"><a class="details-btn" href="' + projectHref(project) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>عرض النماذج والتفاصيل</a></div>';
  }

  /* بطاقة مختصرة للصفحة الرئيسية — المشروع كله في بطاقة واحدة */
  function homeCard(project, index) {
    return '<a class="proj-card" href="' + projectHref(project) + '">' +
      thumb(project, index, 3) + licenseBar(project) + titleBar(project) +
      priceRow(project) + metaRow(project) + buildBar(project) + noFeeNote(project) +
      '</a>';
  }

  /* بطاقة كاملة لصفحة المشاريع — تحمل سمات الفلترة */
  function card(project, index) {
    return '<article class="proj-card" data-name="' + esc(project.name) + '"' +
      ' data-type="' + esc(project.type || '') + '"' +
      ' data-category="' + esc(project.category || '') + '"' +
      ' data-stage="' + esc(project.stage || '') + '"' +
      ' data-payment="' + esc(project.payment || '') + '"' +
      ' data-city="' + esc(project.city || '') + '"' +
      ' data-loc="' + esc(project.dist || '') + '"' +
      ' data-area="' + Number(project.area || 0) + '"' +
      ' data-price="' + Number(project.priceFrom || project.price || 0) + '"' +
      ' data-rooms="' + Number(project.rooms || 0) + '"' +
      ' data-facade="' + esc(project.facade || '') + '"' +
      ' data-discount="' + (project.discountPct > 0 ? 1 : 0) + '">' +
      thumb(project, index, 2) + licenseBar(project) + titleBar(project) +
      priceRow(project) + metaRow(project) + buildBar(project) + noFeeNote(project) + detailsBtn(project) +
      '</article>';
  }

  /* يخفي القسم كاملاً إذا لم توجد مشاريع تطابقه */
  function renderSection(trackId, list, builder, limit) {
    var track = document.getElementById(trackId);
    if (!track) return;
    var section = track.closest('[data-section]');
    if (!list.length) {
      if (section) { section.hidden = true; return; }
      track.innerHTML = empty();
      return;
    }
    if (section) section.hidden = false;
    track.innerHTML = (limit ? list.slice(0, limit) : list).map(builder).join('');
  }

  function byPriceAsc(a, b) {
    var pa = Number(a.priceFrom || a.price || 0) || Infinity;
    var pb = Number(b.priceFrom || b.price || 0) || Infinity;
    return pa - pb;
  }

  function render(projects) {
    // الترتيب الافتراضي: من الأقل سعراً إلى الأعلى
    var sorted = (projects || []).slice().sort(byPriceAsc);
    window.HOMERA_PROJECTS = sorted;

    renderSection('cTrack', sorted, homeCard, 3);
    renderSection('dealsTrack', sorted.filter(function (p) { return p.discountPct > 0 || p.limitedOffer; }), homeCard, 3);
    renderSection('buildTrack', sorted.filter(function (p) { return p.stage === 'under_construction'; }), homeCard, 3);

    var grid = document.getElementById('grid');
    if (grid) {
      grid.innerHTML = sorted.length ? sorted.map(card).join('') : empty();
      if (typeof window.HOMERA_initProjectFilters === 'function') window.HOMERA_initProjectFilters();
    }
    document.dispatchEvent(new CustomEvent('homera:projects', { detail: sorted }));
  }

  function showSkeletons() {
    ['cTrack', 'dealsTrack', 'buildTrack'].forEach(function (id) {
      var track = document.getElementById(id);
      if (track && !track.children.length) track.innerHTML = skeleton(3, false);
    });
    var grid = document.getElementById('grid');
    if (grid && !grid.children.length) grid.innerHTML = skeleton(6, true);
  }

  function init() {
    showSkeletons();
    if (!window.HOMERA_API) return render([]);
    window.HOMERA_API.getProjects().then(render).catch(function () { render([]); });
  }

  // نبدأ الطلب فوراً دون انتظار DOMContentLoaded حتى لا يتأخر ظهور المشاريع
  if (window.HOMERA_API) window.HOMERA_API.getProjects().catch(function () {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
