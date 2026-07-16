/* HOMERA — render public project cards from API when available */
(function () {
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function projectHref(project) { return 'project/' + encodeURIComponent(project.id || project.name || ''); }
  function urgency(project, index) {
    var avail = Number(project && project.avail);
    if (avail <= 1) return '🔥 باقي وحدة فقط!';
    if (avail === 2) return '🔥 باقي وحدتين!';
    if (index === 0) return '🔥 فرصتك الأخيرة!';
    return '';
  }
  function homeCard(project, index) {
    var cover = project.cover || 'uploads/3.jpg';
    var badge = urgency(project, index);
    return '<a class="proj-card" href="' + projectHref(project) + '">' +
      '<div class="thumb"><span class="pill">' + project.type + '</span>' +
      (badge ? '<span class="urgency-pill">' + badge + '</span>' : '') +
      '<image-slot src="' + cover + '" placeholder="' + project.name + '"></image-slot><div class="ov"></div></div>' +
      '<div class="bar"><span class="nm">' + project.name + '</span><span class="pr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg> ' + fmt(project.price) + '</span></div>' +
      '</a>';
  }
  function card(project, index) {
    var cover = project.cover || 'uploads/3.jpg';
    return '<article class="proj-card" data-cat="' + (project.type === 'فيلا' ? 'villa' : 'apart') + '" data-loc="' + project.dist + '" data-area="' + project.area + '" data-price="' + project.price + '" data-rooms="4" data-facade="' + project.facade + '">' +
      '<div class="thumb"><span class="pill">' + project.type + '</span><image-slot src="' + cover + '" placeholder="' + project.name + '"></image-slot><div class="ov"></div></div>' +
      '<div class="bar"><span class="nm">' + project.name + '</span><span class="pr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg> ' + fmt(project.price) + '</span></div>' +
      '<div class="meta"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 21h18M4 21V10l8-6 8 6v11"/></svg> ' + project.area + ' م²</span><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg> ' + project.dist + '، ' + project.city + '</span></div>' +
      '<div class="card-actions"><a class="details-btn" href="' + projectHref(project) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>التفاصيل</a></div>' +
      '</article>';
  }
  function renderHome(projects) {
    var track = document.getElementById('cTrack');
    if (!track) return;
    track.innerHTML = projects.length ? projects.slice(0, 3).map(homeCard).join('') : '';
  }
  function renderProjects(projects) {
    var grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = projects.length ? projects.map(card).join('') : '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:36px">لا توجد مشاريع متاحة حالياً.</div>';
    if (typeof window.HOMERA_initProjectFilters === 'function') window.HOMERA_initProjectFilters();
  }
  function init() {
    if (!window.HOMERA_API) return;
    window.HOMERA_API.getProjects().then(function (projects) {
      renderHome(projects || []);
      renderProjects(projects || []);
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
