/* HOMERA — MySQL API bridge with localStorage fallback */
(function () {
  var API_URL = '/api/homera';
  var SESSION_KEY = 'homera_admin_session';
  var bootstrapPromise = null;
  var projectsPromise = null;

  /* الردود العامة ترجع الصور كمراجع خفيفة تبدأ بـ "?action=img..." بدل base64.
     هنا نحوّلها إلى روابط كاملة ليحمّلها المتصفح كصور عادية (كسول + مخزّن مؤقتاً). */
  function resolveImg(value) {
    var v = String(value == null ? '' : value);
    return v.charAt(0) === '?' ? API_URL + v : v;
  }

  function resolveProject(project) {
    if (!project) return project;
    project.cover = resolveImg(project.cover);
    if (project.videoPoster) project.videoPoster = resolveImg(project.videoPoster);
    if (Array.isArray(project.gallery)) project.gallery = project.gallery.map(resolveImg);
    return project;
  }

  function resolveProjects(projects) {
    return (projects || []).map(resolveProject);
  }

  function readSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
  }

  function writeSession(session) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session || null)); } catch (e) {}
  }

  function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function isJsonResponse(res) {
    return (res.headers.get('content-type') || '').indexOf('application/json') > -1;
  }

  function request(action, payload, params) {
    var url = API_URL + (action ? '?action=' + encodeURIComponent(action) : '');
    if (params) Object.keys(params).forEach(function (k, i) {
      url += (action || i ? '&' : '?') + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    });
    var session = readSession();
    var headers = {};
    if (session && session.token) headers['X-Homera-Session'] = session.token;
    var opts = payload == null ? { method: 'GET', headers: headers } : {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      body: JSON.stringify(payload)
    };
    return fetch(url, opts).then(function (res) {
      if (!isJsonResponse(res)) throw new Error('API لا يعمل. شغّل المشروع عبر Node أو Apache/PHP.');
      return res.json().then(function (data) {
        if (!res.ok || !data.ok) throw new Error(data.error || 'تعذر الاتصال بقاعدة البيانات');
        return data;
      });
    });
  }

  function readLocalSettings() {
    try { return JSON.parse(localStorage.getItem('homera_tweaks') || '{}') || {}; } catch (e) { return {}; }
  }

  function writeLocalSettings(settings) {
    try { localStorage.setItem('homera_tweaks', JSON.stringify(settings || {})); } catch (e) {}
  }

  function syncFeaturedProjects(settings, projects) {
    settings = Object.assign({}, settings || {});
    return settings;
  }

  function bootstrap() {
    if (bootstrapPromise) return bootstrapPromise;
    bootstrapPromise = request('', null).then(function (data) {
      var settings = syncFeaturedProjects(data.settings || {}, data.projects || []);
      writeLocalSettings(settings);
      return { settings: settings, projects: resolveProjects(data.projects) };
    });
    return bootstrapPromise;
  }

  window.HOMERA_API = {
    bootstrap: bootstrap,
    login: function (email, password) { return request('login', { email: email, password: password }).then(function (data) { writeSession({ token: data.token, user: data.user }); return data.user; }); },
    logout: function () { clearSession(); },
    currentSession: readSession,
    getUsers: function () { return request('users', null).then(function (data) { return data.users || []; }); },
    createUser: function (user) { return request('user', { user: user }).then(function (data) { return data.users || []; }); },
    changePassword: function (currentPassword, newPassword) { return request('password', { currentPassword: currentPassword, newPassword: newPassword }).then(function () { clearSession(); }); },
    getSettings: function () { return request('settings', null).then(function (data) { writeLocalSettings(data.settings || {}); return data.settings || {}; }); },
    saveSettings: function (settings) { writeLocalSettings(settings || {}); return request('settings', { settings: settings || {} }); },
    /* قائمة خفيفة للبطاقات — طلب مستقل لا ينتظر bootstrap (الذي يحمل أيضاً الإعدادات وصورها) */
    getProjects: function () {
      if (projectsPromise) return projectsPromise;
      projectsPromise = request('projects', null).then(function (data) { return resolveProjects(data.projects); });
      projectsPromise.catch(function () { projectsPromise = null; });
      return projectsPromise;
    },
    /* بيانات خام كاملة (صور base64) — للوحة التحكم فقط، تتطلب جلسة */
    getProjectsFull: function () { return request('projects', null, { full: 1 }).then(function (data) { return data.projects || []; }); },
    /* مشروع واحد بمعرضه — لصفحة التفاصيل، بدل تنزيل كل المشاريع */
    getProject: function (id) { return request('project', null, { id: id }).then(function (data) { return resolveProject(data.project); }); },
    saveProject: function (project) { return request('project', { project: project }); },
    /* نموذج «سجّل اهتمامك» — عام بلا جلسة */
    submitLead: function (lead) { return request('lead', { lead: lead }); },
    getLeads: function () { return request('leads', null).then(function (data) { return data.leads || []; }); },
    setLeadStatus: function (id, status) { return request('leadStatus', { id: id, status: status }).then(function (data) { return data.leads || []; }); },
    /* تنزيل الطلبات كملف إكسل — يمرّ عبر fetch لأن التصدير يتطلب ترويسة الجلسة */
    downloadLeadsCsv: function () {
      var session = readSession();
      var headers = session && session.token ? { 'X-Homera-Session': session.token } : {};
      return fetch(API_URL + '?action=leads&format=csv', { headers: headers }).then(function (res) {
        if (!res.ok) throw new Error('تعذّر تصدير الطلبات');
        return res.blob();
      }).then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'homera-leads.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      });
    },
    sellProject: function (project) { return request('sell', { id: project.id || 0, name: project.name || '' }); },
    /* حذف نهائي — يتطلب صلاحية أدمن، ويبطل ذاكرة قائمة البطاقات */
    deleteProject: function (project) {
      return request('deleteProject', { id: project.id || 0, name: project.name || '' }).then(function (data) {
        projectsPromise = null;
        return data;
      });
    },
    readLocalSettings: readLocalSettings,
    writeLocalSettings: writeLocalSettings,
    syncFeaturedProjects: syncFeaturedProjects
  };
})();
