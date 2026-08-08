/* HOMERA — تصنيف وفلترة المشاريع في صفحة المشاريع.
   يبني الفلاتر من بيانات البطاقات المعروضة، فتبقى الخيارات مطابقة للمشاريع الفعلية.
   الترتيب الافتراضي: من الأقل سعراً إلى الأعلى. */
(function () {
  var grid = document.getElementById('grid');
  var filtersRoot = document.getElementById('filters');
  if (!grid || !filtersRoot) return;
  /* شرائح الحالة خارج #filters، فنحتفظ بمرجعها بدل البحث داخل شريط الفلاتر */
  var stageHost = document.querySelector('.quick-filters');

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }

  /* شرائح الحالة — اختيار واحد */
  var STAGES = [
    { value: 'all', label: 'كل المشاريع' },
    { value: 'deals', label: 'المشاريع المخفّضة' },
    { value: 'under_construction', label: 'مشاريع تحت الإنشاء' },
    { value: 'ready', label: 'مشاريع جاهزة' },
    { value: 'resale', label: 'إعادة البيع' }
  ];

  /* الفلاتر متعددة الاختيار: value = مطابقة نصية | range = مدى رقمي */
  var FACETS = [
    { key: 'category', label: 'التصنيف', kind: 'value', options: [
      { value: 'residential', label: 'سكني' },
      { value: 'commercial', label: 'تجاري' },
      { value: 'investment', label: 'استثماري' }
    ] },
    { key: 'type', label: 'نوع العقار', kind: 'value', dynamic: true },
    { key: 'city', label: 'المدينة', kind: 'value', dynamic: true },
    { key: 'loc', label: 'الحي', kind: 'value', dynamic: true },
    { key: 'price', label: 'السعر', kind: 'range', options: [
      { min: 0, max: 500000, label: 'أقل من 500,000' },
      { min: 500000, max: 800000, label: '500,000 – 800,000' },
      { min: 800001, max: 1200000, label: '800,000 – 1,200,000' },
      { min: 1200001, max: 99999999, label: 'أكثر من 1,200,000' }
    ] },
    { key: 'area', label: 'المساحة', kind: 'range', options: [
      { min: 0, max: 180, label: 'حتى 180 م²' },
      { min: 181, max: 250, label: '181 – 250 م²' },
      { min: 251, max: 99999, label: 'أكثر من 250 م²' }
    ] },
    { key: 'rooms', label: 'الغرف', kind: 'range', chips: true, options: [
      { min: 3, max: 3, label: '3' },
      { min: 4, max: 4, label: '4' },
      { min: 5, max: 5, label: '5' },
      { min: 6, max: 99, label: '+6' }
    ] },
    { key: 'payment', label: 'طريقة الدفع', kind: 'value', options: [
      { value: 'cash', label: 'كاش' },
      { value: 'bank', label: 'تمويل بنكي' },
      { value: 'both', label: 'كاش أو تمويل' }
    ] },
    { key: 'facade', label: 'الواجهة', kind: 'value', dynamic: true, chips: true }
  ];

  var CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

  var cards = [];
  var order = [];

  function cardValues(key) {
    var seen = {};
    var out = [];
    cards.forEach(function (card) {
      var value = String(card.dataset[key] || '').trim();
      if (!value || seen[value]) return;
      seen[value] = 1;
      out.push(value);
    });
    return out.sort(function (a, b) { return a.localeCompare(b, 'ar'); });
  }

  function facetOptions(facet) {
    if (!facet.dynamic) return facet.options;
    return cardValues(facet.key).map(function (value) { return { value: value, label: value }; });
  }

  function optionHtml(facet, option) {
    if (facet.kind === 'range') {
      var data = ' data-group="' + facet.key + '" data-min="' + option.min + '" data-max="' + option.max + '"';
      return facet.chips
        ? '<button type="button" class="fchip"' + data + '>' + esc(option.label) + '</button>'
        : '<label class="fopt"><input type="checkbox"' + data + '/><span>' + esc(option.label) + '</span></label>';
    }
    var attrs = ' data-group="' + facet.key + '" data-value="' + esc(option.value) + '"';
    return facet.chips
      ? '<button type="button" class="fchip"' + attrs + '>' + esc(option.label) + '</button>'
      : '<label class="fopt"><input type="checkbox"' + attrs + ' value="' + esc(option.value) + '"/><span>' + esc(option.label) + '</span></label>';
  }

  /* يعيد بناء القوائم المنسدلة مع الحفاظ على ما اختاره الزائر */
  function buildFacets() {
    var host = filtersRoot.querySelector('.tf-facets');
    if (!host) return;
    var selected = activeSelections();
    host.innerHTML = FACETS.map(function (facet) {
      var options = facetOptions(facet);
      if (!options.length) return '';
      var body = facet.chips
        ? '<div class="fchips-g">' + options.map(function (o) { return optionHtml(facet, o); }).join('') + '</div>'
        : options.map(function (o) { return optionHtml(facet, o); }).join('');
      return '<div class="tf-drop">' +
        '<button type="button" class="tf-btn" data-pop="pop-' + facet.key + '">' + esc(facet.label) + ' ' + CHEV +
          ' <span class="tf-badge" hidden>0</span></button>' +
        '<div class="tf-pop" id="pop-' + facet.key + '">' + body + '</div>' +
      '</div>';
    }).join('');
    restoreSelections(selected);
  }

  function selectionKey(el) {
    return (el.dataset.group || '') + '|' + (el.dataset.value || '') + '|' + (el.dataset.min || '') + '|' + (el.dataset.max || '');
  }

  function activeSelections() {
    var keys = {};
    filtersRoot.querySelectorAll('input[type=checkbox]:checked, .fchip.on').forEach(function (el) { keys[selectionKey(el)] = 1; });
    return keys;
  }

  function restoreSelections(keys) {
    filtersRoot.querySelectorAll('input[type=checkbox], .fchip').forEach(function (el) {
      if (!keys[selectionKey(el)]) return;
      if (el.tagName === 'INPUT') el.checked = true; else el.classList.add('on');
    });
  }

  function activeByGroup() {
    var groups = {};
    filtersRoot.querySelectorAll('input[type=checkbox]:checked, .fchip.on').forEach(function (el) {
      (groups[el.dataset.group] = groups[el.dataset.group] || []).push(el);
    });
    return groups;
  }

  function matchGroup(card, group, elements) {
    return elements.some(function (el) {
      if (el.dataset.value != null) return String(card.dataset[group] || '') === el.dataset.value;
      var num = Number(card.dataset[group] || 0);
      return num >= Number(el.dataset.min) && num <= Number(el.dataset.max);
    });
  }

  function currentStage() {
    var chip = stageHost && stageHost.querySelector('.qf.on');
    return chip ? chip.dataset.stage : 'all';
  }

  function matchStage(card, stage) {
    if (stage === 'all') return true;
    if (stage === 'deals') return card.dataset.discount === '1';
    return card.dataset.stage === stage;
  }

  function updateBadges() {
    filtersRoot.querySelectorAll('.tf-btn').forEach(function (btn) {
      var pop = document.getElementById(btn.dataset.pop);
      if (!pop) return;
      var count = pop.querySelectorAll('input:checked, .fchip.on').length;
      var badge = btn.querySelector('.tf-badge');
      btn.classList.toggle('active', count > 0);
      badge.hidden = count === 0;
      badge.textContent = count;
    });
  }

  function apply() {
    var groups = activeByGroup();
    var keyword = (document.getElementById('q').value || '').trim();
    var stage = currentStage();
    var shown = 0;

    cards.forEach(function (card) {
      var ok = matchStage(card, stage);
      if (ok) {
        for (var group in groups) { if (!matchGroup(card, group, groups[group])) { ok = false; break; } }
      }
      if (ok && keyword) ok = String(card.dataset.name || '').indexOf(keyword) > -1;
      card.classList.toggle('hide', !ok);
      if (ok) shown++;
    });

    var count = document.getElementById('fcount');
    count.innerHTML = !cards.length
      ? 'لا توجد مشاريع <small>(0 مشروع)</small>'
      : (shown === cards.length
        ? 'جميع المشاريع <small>(' + cards.length + ' مشروع)</small>'
        : shown + ' <small>من ' + cards.length + ' مشروع</small>');
    document.getElementById('noRes').hidden = shown > 0 || !cards.length;
    updateBadges();
  }

  function sortCards() {
    var value = document.getElementById('sortSel').value;
    var list = order.slice();
    var num = function (card, key) { return Number(card.dataset[key] || 0); };
    if (value === 'price-desc') list.sort(function (a, b) { return num(b, 'price') - num(a, 'price'); });
    else if (value === 'area-desc') list.sort(function (a, b) { return num(b, 'area') - num(a, 'area'); });
    else if (value === 'newest') list = order.slice();
    else list.sort(function (a, b) { return (num(a, 'price') || Infinity) - (num(b, 'price') || Infinity); });
    list.forEach(function (card) { grid.appendChild(card); });
  }

  /* الفلاتر السريعة (شرائح الحالة) */
  (function buildStages() {
    if (!stageHost) return;
    stageHost.innerHTML = STAGES.map(function (stage, i) {
      return '<button type="button" class="qf' + (i === 0 ? ' on' : '') + '" data-stage="' + stage.value + '">' + esc(stage.label) + '</button>';
    }).join('');
    stageHost.addEventListener('click', function (e) {
      var chip = e.target.closest('.qf');
      if (!chip) return;
      stageHost.querySelectorAll('.qf').forEach(function (c) { c.classList.remove('on'); });
      chip.classList.add('on');
      apply();
    });
  })();

  /* فتح/إغلاق القوائم — مفوَّض حتى يعمل بعد إعادة البناء */
  filtersRoot.addEventListener('click', function (e) {
    var btn = e.target.closest('.tf-btn');
    if (btn) {
      e.stopPropagation();
      var drop = btn.parentElement;
      var isOpen = drop.classList.contains('open');
      filtersRoot.querySelectorAll('.tf-drop.open').forEach(function (d) { d.classList.remove('open'); });
      if (!isOpen) drop.classList.add('open');
      return;
    }
    if (e.target.closest('.tf-pop')) e.stopPropagation();
    var chip = e.target.closest('.fchip');
    if (chip) { chip.classList.toggle('on'); apply(); }
  });
  filtersRoot.addEventListener('change', function (e) {
    if (e.target.matches('input[type=checkbox]')) apply();
  });
  document.addEventListener('click', function () {
    filtersRoot.querySelectorAll('.tf-drop.open').forEach(function (d) { d.classList.remove('open'); });
  });

  document.getElementById('q').addEventListener('input', apply);
  document.getElementById('sortSel').addEventListener('change', sortCards);
  document.getElementById('clearBtn').addEventListener('click', function () {
    filtersRoot.querySelectorAll('input[type=checkbox]').forEach(function (i) { i.checked = false; });
    filtersRoot.querySelectorAll('.fchip.on').forEach(function (b) { b.classList.remove('on'); });
    var stages = stageHost ? stageHost.querySelectorAll('.qf') : [];
    stages.forEach(function (c, i) { c.classList.toggle('on', i === 0); });
    document.getElementById('q').value = '';
    document.getElementById('sortSel').value = 'price-asc';
    sortCards();
    apply();
  });

  /* الوصول من الرئيسية عبر ?filter=deals أو ?filter=under_construction */
  function applyUrlFilter() {
    var match = /[?&]filter=([^&]+)/.exec(location.search);
    if (!match) return;
    var wanted = decodeURIComponent(match[1]);
    var chip = stageHost && stageHost.querySelector('.qf[data-stage="' + wanted + '"]');
    if (!chip) return;
    stageHost.querySelectorAll('.qf').forEach(function (c) { c.classList.remove('on'); });
    chip.classList.add('on');
  }

  window.HOMERA_initProjectFilters = function () {
    cards = [].slice.call(grid.querySelectorAll('.proj-card:not(.is-skeleton)'));
    order = cards.slice();
    buildFacets();
    applyUrlFilter();
    sortCards();
    apply();
  };

  window.HOMERA_initProjectFilters();
})();
