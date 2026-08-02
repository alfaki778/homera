/* HOMERA — render public project cards from API when available */
(function () {
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function projectHref(project) { return 'project/' + encodeURIComponent(project.id || project.name || ''); }
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
  function empty() {
    return '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:36px">لا توجد مشاريع متاحة حالياً.</div>';
  }
  // شريط رقم الترخيص أسفل الصورة — يظهر فقط عند إدخال الرقم من لوحة التحكم
  function licenseBar(project) {
    var license = String(project.license || '').trim();
    if (!license) return '';
    return '<div class="lic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.4-2.9 8.2-7 10-4.1-1.8-7-5.6-7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>' +
      '<span class="k">الترخيص:</span><b class="v">' + esc(license) + '</b></div>';
  }
  function homeCard(project, index) {
    var cover = project.cover || 'uploads/3.jpg';
    return '<a class="proj-card" href="' + projectHref(project) + '">' +
      '<div class="thumb"><span class="pill">' + project.type + '</span>' +
      '<img class="project-cover" src="' + esc(cover) + '" alt="' + esc(project.name) + '"' + imgAttrs(index, 3) + '><div class="ov"></div></div>' +
      licenseBar(project) +
      '<div class="bar"><span class="nm">' + project.name + '</span><span class="pr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg> ' + fmt(project.price) + '</span></div>' +
      '</a>';
  }
  function card(project, index) {
    var cover = project.cover || 'uploads/3.jpg';
    return '<article class="proj-card" data-cat="' + (project.type === 'فيلا' ? 'villa' : 'apart') + '" data-loc="' + project.dist + '" data-area="' + project.area + '" data-price="' + project.price + '" data-rooms="4" data-facade="' + project.facade + '">' +
      '<div class="thumb"><span class="pill">' + project.type + '</span><img class="project-cover" src="' + esc(cover) + '" alt="' + esc(project.name) + '"' + imgAttrs(index, 2) + '><div class="ov"></div></div>' + licenseBar(project) +
      '<div class="bar"><span class="nm">' + project.name + '</span><span class="pr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg> ' + fmt(project.price) + '</span></div>' +
      '<div class="meta"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 21h18M4 21V10l8-6 8 6v11"/></svg> ' + project.area + ' م²</span><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg> ' + project.dist + '، ' + project.city + '</span></div>' +
      '<div class="card-actions"><a class="details-btn" href="' + projectHref(project) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>التفاصيل</a></div>' +
      '</article>';
  }
  function renderHome(projects) {
    var track = document.getElementById('cTrack');
    if (!track) return;
    track.innerHTML = projects.length ? projects.slice(0, 3).map(homeCard).join('') : empty();
  }
  function renderProjects(projects) {
    var grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = projects.length ? projects.map(card).join('') : empty();
    if (typeof window.HOMERA_initProjectFilters === 'function') window.HOMERA_initProjectFilters();
  }
  function showSkeletons() {
    var track = document.getElementById('cTrack');
    if (track && !track.children.length) track.innerHTML = skeleton(3, false);
    var grid = document.getElementById('grid');
    if (grid && !grid.children.length) grid.innerHTML = skeleton(6, true);
  }
  function init() {
    showSkeletons();
    if (!window.HOMERA_API) {
      renderHome([]);
      renderProjects([]);
      return;
    }
    window.HOMERA_API.getProjects().then(function (projects) {
      renderHome(projects || []);
      renderProjects(projects || []);
    }).catch(function () {
      renderHome([]);
      renderProjects([]);
    });
  }
  // نبدأ الطلب فوراً دون انتظار DOMContentLoaded حتى لا يتأخر ظهور المشاريع
  if (window.HOMERA_API) window.HOMERA_API.getProjects().catch(function () {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
