/* HOMERA — نموذج «سجّل اهتمامك» المشترك بين الرئيسية وصفحات المشاريع.
   يُحقن داخل أي عنصر يحمل data-lead-form، ويقرأ المشروع المحدَّد من:
   data-project-id / data-project-name، أو من قائمة المشاريع المحمّلة. */
(function () {
  var PROPERTY_TYPES = ['فيلا', 'شقة', 'دور', 'أرض', 'عقار تجاري', 'وحدة استثمارية', 'أخرى'];
  var BUDGETS = ['أقل من 500,000', '500,000 – 800,000', '800,000 – 1,200,000', '1,200,000 – 2,000,000', 'أكثر من 2,000,000'];
  var seq = 0;

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function options(list, selected) {
    return list.map(function (item) {
      return '<option value="' + esc(item) + '"' + (item === selected ? ' selected' : '') + '>' + esc(item) + '</option>';
    }).join('');
  }

  function radios(name, items) {
    return '<div class="lead-radios">' + items.map(function (item, i) {
      return '<label><input type="radio" name="' + name + '" value="' + item[0] + '"' + (i === 0 ? ' checked' : '') + '>' + item[1] + '</label>';
    }).join('') + '</div>';
  }

  function formHtml(id, projectName) {
    return '<form class="lead-form" novalidate>' +
      '<div class="fld"><label for="ld-name-' + id + '">الاسم الكامل <span class="req">*</span></label>' +
        '<input id="ld-name-' + id + '" name="name" required placeholder="اكتب اسمك الكامل"></div>' +
      '<div class="fld"><label for="ld-phone-' + id + '">رقم الجوال <span class="req">*</span></label>' +
        '<input id="ld-phone-' + id + '" name="phone" type="tel" dir="ltr" required placeholder="05xxxxxxxx"></div>' +
      '<div class="fld"><label for="ld-project-' + id + '">المشروع المهتم به</label>' +
        '<select id="ld-project-' + id + '" name="projectName" data-projects><option value="">غير محدد</option>' +
        (projectName ? '<option value="' + esc(projectName) + '" selected>' + esc(projectName) + '</option>' : '') +
        '</select></div>' +
      '<div class="fld"><label for="ld-type-' + id + '">نوع العقار المطلوب</label>' +
        '<select id="ld-type-' + id + '" name="propertyType"><option value="">غير محدد</option>' + options(PROPERTY_TYPES) + '</select></div>' +
      '<div class="fld"><label>طريقة الشراء</label>' +
        radios('ld-method-' + id, [['undecided', 'غير محدد'], ['cash', 'كاش'], ['bank', 'تمويل بنكي']]) + '</div>' +
      '<div class="fld"><label>هل تحتاج إلى حلول تمويلية؟</label>' +
        radios('ld-finance-' + id, [['no', 'لا'], ['yes', 'نعم']]) + '</div>' +
      '<div class="fld"><label>هل لديك تعثرات مالية؟</label>' +
        radios('ld-default-' + id, [['no', 'لا'], ['yes', 'نعم']]) + '</div>' +
      '<div class="fld"><label for="ld-budget-' + id + '">الميزانية المتوقعة</label>' +
        '<select id="ld-budget-' + id + '" name="budget"><option value="">غير محدد</option>' + options(BUDGETS) + '</select></div>' +
      '<div class="fld"><label for="ld-city-' + id + '">المدينة المطلوبة</label>' +
        '<input id="ld-city-' + id + '" name="city" placeholder="جدة، الرياض، …"></div>' +
      '<div class="fld"><label for="ld-notes-' + id + '">ملاحظات إضافية</label>' +
        '<input id="ld-notes-' + id + '" name="notes" placeholder="أي تفاصيل تودّ إضافتها"></div>' +
      '<div class="fld full"><label for="ld-details-' + id + '">اكتب ما تبحث عنه بالتفصيل</label>' +
        '<textarea id="ld-details-' + id + '" name="details" rows="4" placeholder="عبّر عن احتياجك بحرية: الموقع المفضل، عدد الغرف، طريقة السداد، أي متطلبات خاصة…"></textarea></div>' +
      '<div class="lead-foot">' +
        '<button type="submit" class="btn gold">أرسل طلبك</button>' +
        '<span class="lead-msg" role="status" aria-live="polite"></span>' +
      '</div>' +
    '</form>' +
    '<div class="lead-done">' +
      '<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>' +
      '<h3>تم تسجيل اهتمامك بنجاح</h3>' +
      '<p>تم تسجيل اهتمامك بنجاح، وسيتواصل معك أحد مستشاري هوميرا قريبًا.</p>' +
    '</div>';
  }

  function radioValue(form, name) {
    var picked = form.querySelector('input[name="' + name + '"]:checked');
    return picked ? picked.value : '';
  }

  /* form.elements وليس form.name — لأن form.name يعيد اسم النموذج لا الحقل */
  function val(form, field) {
    var el = form.elements[field];
    return el ? String(el.value || '').trim() : '';
  }

  /* تعبئة قائمة المشاريع فور وصول البيانات من الـ API */
  function fillProjects(select, projects) {
    if (!select || !projects || !projects.length) return;
    var current = select.value;
    select.innerHTML = '<option value="">غير محدد</option>' + projects.map(function (project) {
      return '<option value="' + esc(project.name) + '" data-id="' + Number(project.id || 0) + '"' +
        (project.name === current ? ' selected' : '') + '>' + esc(project.name) + '</option>';
    }).join('');
    if (current && select.value !== current) {
      select.insertAdjacentHTML('beforeend', '<option value="' + esc(current) + '" selected>' + esc(current) + '</option>');
    }
  }

  function build(host) {
    var id = ++seq;
    var projectId = Number(host.getAttribute('data-project-id') || 0);
    var projectName = host.getAttribute('data-project-name') || '';
    host.innerHTML = formHtml(id, projectName);

    var form = host.querySelector('form');
    var done = host.querySelector('.lead-done');
    var msg = host.querySelector('.lead-msg');
    var select = host.querySelector('[data-projects]');

    if (!projectName) {
      fillProjects(select, window.HOMERA_PROJECTS);
      document.addEventListener('homera:projects', function (e) { fillProjects(select, e.detail); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.className = 'lead-msg';
      msg.textContent = '';
      var name = val(form, 'name');
      var phone = val(form, 'phone');
      if (!name || !phone) {
        msg.className = 'lead-msg err';
        msg.textContent = 'الرجاء إدخال الاسم ورقم الجوال.';
        return;
      }
      var picked = select && select.selectedOptions[0];
      var lead = {
        name: name,
        phone: phone,
        projectId: projectId || Number((picked && picked.dataset.id) || 0),
        projectName: select ? select.value : projectName,
        propertyType: val(form, 'propertyType'),
        purchaseMethod: radioValue(form, 'ld-method-' + id),
        needsFinance: radioValue(form, 'ld-finance-' + id),
        hasDefault: radioValue(form, 'ld-default-' + id),
        budget: val(form, 'budget'),
        city: val(form, 'city'),
        notes: val(form, 'notes'),
        details: val(form, 'details'),
        source: (host.getAttribute('data-source') || document.title) + ' — ' + location.pathname
      };
      if (!lead.projectName && projectName) lead.projectName = projectName;

      var submitBtn = form.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      msg.className = 'lead-msg';
      msg.textContent = 'جارٍ الإرسال…';

      if (!window.HOMERA_API) {
        submitBtn.disabled = false;
        msg.className = 'lead-msg err';
        msg.textContent = 'تعذّر الاتصال بالخادم، حاول لاحقاً أو راسلنا عبر واتساب.';
        return;
      }
      window.HOMERA_API.submitLead(lead).then(function () {
        form.style.display = 'none';
        done.classList.add('show');
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }).catch(function (err) {
        submitBtn.disabled = false;
        msg.className = 'lead-msg err';
        msg.textContent = err.message || 'تعذّر إرسال الطلب، حاول مرة أخرى.';
      });
    });
  }

  function init() {
    document.querySelectorAll('[data-lead-form]').forEach(build);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
