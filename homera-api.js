/* HOMERA — MySQL API bridge with localStorage fallback */
(function () {
  var API_URL = '/api/homera';

  function isJsonResponse(res) {
    return (res.headers.get('content-type') || '').indexOf('application/json') > -1;
  }

  function request(action, payload) {
    var url = API_URL + (action ? '?action=' + encodeURIComponent(action) : '');
    var opts = payload == null ? { method: 'GET' } : {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    var slots = {
      'مشروع الفضيلة 117': ['projFadilaImg', 'pgPFadila', 'pgFadilaMain'],
      'مشروع الروضة 116': ['projRoudahImg', 'pgPRoudah'],
      'مشروع السلامة 118': ['projSalamahImg', 'pgPSalamah'],
      'مشروع النعيم 120': ['projNaeemImg', 'pgPNaeem'],
      'مشروع الصفا 121': ['pgPSafa'],
      'مشروع أبحر 122': ['pgPAbhur']
    };
    (projects || []).forEach(function (project) {
      var keys = slots[project.name];
      if (!keys) return;
      var image = project.cover || (project.gallery && project.gallery[0]) || '';
      keys.forEach(function (key) { settings[key] = image; });
    });
    return settings;
  }

  function bootstrap() {
    return request('', null).then(function (data) {
      var settings = syncFeaturedProjects(data.settings || {}, data.projects || []);
      writeLocalSettings(settings);
      return { settings: settings, projects: data.projects || [] };
    });
  }

  window.HOMERA_API = {
    bootstrap: bootstrap,
    getSettings: function () { return request('settings', null).then(function (data) { writeLocalSettings(data.settings || {}); return data.settings || {}; }); },
    saveSettings: function (settings) { writeLocalSettings(settings || {}); return request('settings', { settings: settings || {} }); },
    getProjects: function () { return request('projects', null).then(function (data) { return data.projects || []; }); },
    saveProject: function (project) { return request('project', { project: project }); },
    sellProject: function (project) { return request('sell', { id: project.id || 0, name: project.name || '' }); },
    readLocalSettings: readLocalSettings,
    writeLocalSettings: writeLocalSettings,
    syncFeaturedProjects: syncFeaturedProjects
  };
})();
