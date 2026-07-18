/* HOMERA — MySQL API bridge with localStorage fallback */
(function () {
  var API_URL = '/api/homera';
  var SESSION_KEY = 'homera_admin_session';

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

  function request(action, payload) {
    var url = API_URL + (action ? '?action=' + encodeURIComponent(action) : '');
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
    return request('', null).then(function (data) {
      var settings = syncFeaturedProjects(data.settings || {}, data.projects || []);
      writeLocalSettings(settings);
      return { settings: settings, projects: data.projects || [] };
    });
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
    getProjects: function () { return request('projects', null).then(function (data) { return data.projects || []; }); },
    saveProject: function (project) { return request('project', { project: project }); },
    sellProject: function (project) { return request('sell', { id: project.id || 0, name: project.name || '' }); },
    readLocalSettings: readLocalSettings,
    writeLocalSettings: writeLocalSettings,
    syncFeaturedProjects: syncFeaturedProjects
  };
})();
