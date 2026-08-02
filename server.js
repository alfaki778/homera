const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { createPool, ensureProjectColumns } = require('./scripts/init-db');

const app = express();
const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);

let dbPool;
let dbReady;
// يصبح false فقط لو تعذّرت ترقية المخطط على الاستضافة، فنتخطّى العمود بدل تعطيل الحفظ
let hasLicenseColumn = true;

function json(res, data, status = 200) {
  res.status(status).json(data);
}

function getAction(req) {
  return req.query.action || 'bootstrap';
}

async function getDb() {
  if (!dbReady) {
    dbPool = createPool();
    // ترقية صامتة للقواعد القديمة (عمود الترخيص) — مرة واحدة عند إقلاع الخادم
    dbReady = ensureProjectColumns(dbPool)
      .then(() => { hasLicenseColumn = true; return dbPool; })
      .catch(() => { hasLicenseColumn = false; return dbPool; });
  }
  return dbReady;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  const salt = parts[2];
  const expected = Buffer.from(parts[3], 'base64');
  const actual = crypto.pbkdf2Sync(String(password || ''), salt, iterations, expected.length, 'sha256');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function hashPassword(password) {
  const iterations = 120000;
  const salt = crypto.randomBytes(16).toString('base64');
  const hash = crypto.pbkdf2Sync(String(password || ''), salt, iterations, 32, 'sha256').toString('base64');
  return ['pbkdf2', iterations, salt, hash].join('$');
}

function publicUser(row) {
  return { id: Number(row.id), email: row.email, name: row.name || '', role: row.role, active: Number(row.active) === 1 };
}

async function loginUser(db, data) {
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  const [rows] = await db.query('SELECT * FROM users WHERE email=? AND active=1 LIMIT 1', [email]);
  if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
    const error = new Error('بيانات الدخول غير صحيحة');
    error.status = 401;
    throw error;
  }
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 12);
  await db.query('INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [hashToken(token), rows[0].id, expires]);
  return { token, user: publicUser(rows[0]) };
}

async function currentUser(db, req) {
  const token = req.get('X-Homera-Session') || (req.body && req.body.sessionToken) || '';
  if (!token) return null;
  const [rows] = await db.query(
    'SELECT u.* FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > NOW() AND u.active=1 LIMIT 1',
    [hashToken(token)]
  );
  return rows[0] || null;
}

async function requireUser(db, req, roles) {
  const user = await currentUser(db, req);
  if (!user || (roles && !roles.includes(user.role))) {
    const error = new Error('ليست لديك صلاحية تنفيذ هذا الإجراء');
    error.status = user ? 403 : 401;
    throw error;
  }
  return user;
}

async function listUsers(db) {
  const [rows] = await db.query('SELECT id, email, name, role, active FROM users ORDER BY id ASC');
  return rows.map(publicUser);
}

async function createUser(db, data) {
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  const role = data.role === 'admin' ? 'admin' : 'editor';
  const name = String(data.name || '').trim();
  if (!email || !password) {
    const error = new Error('البريد وكلمة المرور مطلوبة');
    error.status = 422;
    throw error;
  }
  await db.query('INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)', [email, name, role, hashPassword(password)]);
}

async function changePassword(db, user, data) {
  const currentPassword = String(data.currentPassword || '');
  const newPassword = String(data.newPassword || '');
  if (newPassword.length < 8) {
    const error = new Error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
    error.status = 422;
    throw error;
  }
  const [rows] = await db.query('SELECT password_hash FROM users WHERE id=? LIMIT 1', [user.id]);
  if (!rows.length || !verifyPassword(currentPassword, rows[0].password_hash)) {
    const error = new Error('كلمة المرور الحالية غير صحيحة');
    error.status = 422;
    throw error;
  }
  await db.query('UPDATE users SET password_hash=? WHERE id=?', [hashPassword(newPassword), user.id]);
  await db.query('DELETE FROM user_sessions WHERE user_id=?', [user.id]);
}

function parseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value || '');
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

/* ==========================================================================
   الصور مخزّنة في القاعدة كـ data:URL (base64). إرسالها داخل JSON المشاريع
   يجعل الرد بعدة ميجابايت فتتأخر البطاقات ثم تظهر كلها دفعة واحدة.
   الحل: الردود العامة تحمل رابطاً خفيفاً لكل صورة (?action=img&...) ويحمّلها
   المتصفح كصورة عادية — تحميل كسول، تخزين مؤقت طويل، وظهور تدريجي.
   ========================================================================== */
function rowVersion(row) {
  return crypto.createHash('md5').update(String(row.updated_at || '') + '|' + String(row.id || '')).digest('hex').slice(0, 10);
}

function imageRef(value, id, key, ver) {
  const raw = String(value || '');
  if (!raw) return '';
  if (!raw.startsWith('data:')) return raw; // مسار ملف عادي — يُترك كما هو
  return '?action=img&id=' + Number(id) + '&k=' + key + '&v=' + ver;
}

/* mode: full = بيانات خام للوحة التحكم | card = بطاقات بدون معرض | detail = صفحة المشروع */
function projectRow(row, mode = 'full') {
  const total = Math.max(1, Number(row.total || 0));
  const sold = Math.min(Math.max(0, Number(row.sold || 0)), total);
  const parsed = parseJson(row.gallery || '[]', []);
  const gallery = Array.isArray(parsed) ? parsed : [];
  const ver = rowVersion(row);
  const out = {
    id: Number(row.id),
    name: row.name,
    dist: row.dist,
    city: row.city,
    area: Number(row.area || 0),
    facade: row.facade,
    type: row.type,
    price: Number(row.price || 0),
    total,
    sold,
    avail: Math.max(0, total - sold),
    status: row.status,
    license: row.license || '',
    pct: total ? Math.round((sold / total) * 100) : 0,
    cover: mode === 'full' ? (row.cover || '') : imageRef(row.cover, row.id, 'cover', ver)
  };
  if (mode === 'card') return out;
  out.gallery = mode === 'full' ? gallery : gallery.map((img, i) => imageRef(img, row.id, 'g' + i, ver));
  return out;
}

const CARD_COLUMNS =
  'SELECT id, name, dist, city, area, facade, type, price, total, sold, status, license, updated_at,' +
  " CASE WHEN cover LIKE 'data:%' THEN 'data:' ELSE COALESCE(cover, '') END AS cover" +
  ' FROM projects ORDER BY sort_order ASC, id ASC';

/* يخدم صورة مشروع واحدة كملف ثنائي مع تخزين مؤقت طويل (الرابط يحمل بصمة التحديث) */
async function sendProjectImage(db, req, res, id, key) {
  const [rows] = await db.query('SELECT id, cover, gallery FROM projects WHERE id=? LIMIT 1', [Number(id) || 0]);
  if (!rows.length) return res.status(404).type('text/plain').send('');

  let data = '';
  if (key === 'cover') {
    data = String(rows[0].cover || '');
  } else {
    const match = /^g(\d+)$/.exec(String(key || ''));
    if (match) {
      const parsed = parseJson(rows[0].gallery || '[]', []);
      if (Array.isArray(parsed) && parsed[Number(match[1])]) data = String(parsed[Number(match[1])]);
    }
  }
  if (!data) return res.status(404).type('text/plain').send('');
  if (!data.startsWith('data:')) return res.redirect(302, data);

  const head = /^data:([\w.+/-]+);base64,/.exec(data);
  if (!head) return res.status(404).type('text/plain').send('');
  const bin = Buffer.from(data.slice(head[0].length), 'base64');
  if (!bin.length) return res.status(404).type('text/plain').send('');

  res.setHeader('Content-Type', head[1]);
  const etag = '"' + crypto.createHash('md5').update(data).digest('hex') + '"';
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('ETag', etag);
  if (String(req.get('If-None-Match') || '').trim() === etag) return res.status(304).end();
  return res.send(bin);
}

/* رد JSON عام مع ETag: زيارة متكرّرة = 304 بدون إعادة تنزيل */
function jsonCached(req, res, data) {
  const body = JSON.stringify(data);
  const etag = '"' + crypto.createHash('md5').update(body).digest('hex') + '"';
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('ETag', etag);
  if (String(req.get('If-None-Match') || '').trim() === etag) return res.status(304).end();
  return res.type('application/json').send(body);
}

async function getSettings(db) {
  const [rows] = await db.query("SELECT payload FROM settings WHERE name = 'site' LIMIT 1");
  return parseJson(rows[0] && rows[0].payload, {});
}

async function saveSettings(db, settings) {
  await db.query(
    "INSERT INTO settings (name, payload) VALUES ('site', ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)",
    [JSON.stringify(settings || {})]
  );
}

async function getProjects(db, mode = 'full') {
  /* البطاقات لا تحتاج المعرض ولا محتوى الغلاف — فقط إشارة أنه صورة مضمّنة */
  const [rows] = await db.query(mode === 'card' ? CARD_COLUMNS : 'SELECT * FROM projects ORDER BY sort_order ASC, id ASC');
  return rows.map((row) => projectRow(row, mode));
}

async function findProject(db, id, name) {
  const [rows] = Number(id) > 0
    ? await db.query('SELECT * FROM projects WHERE id=? LIMIT 1', [Number(id)])
    : await db.query('SELECT * FROM projects WHERE name=? LIMIT 1', [String(name || '')]);
  return rows[0] || null;
}

function isImageRef(value) {
  return String(value || '').startsWith('?action=img');
}

/* حماية: لو أُرسل مرجع صورة (?action=img...) بدل الصورة نفسها نُبقي المخزَّن كما هو
   حتى لا يُمحى المحتوى الأصلي بالخطأ */
async function keepStoredImages(db, id, cover, gallery) {
  const needsCover = isImageRef(cover);
  const needsGallery = gallery.some(isImageRef);
  if (id <= 0 || (!needsCover && !needsGallery)) return [cover, gallery];

  const [rows] = await db.query('SELECT cover, gallery FROM projects WHERE id=? LIMIT 1', [id]);
  if (!rows.length) return [cover, gallery];
  const parsed = parseJson(rows[0].gallery || '[]', []);
  const stored = Array.isArray(parsed) ? parsed : [];

  const nextCover = needsCover ? String(rows[0].cover || '') : cover;
  const nextGallery = gallery.map((img, i) => {
    if (!isImageRef(img)) return img;
    const match = /&k=g(\d+)/.exec(img);
    const key = match ? Number(match[1]) : i;
    return stored[key] ? String(stored[key]) : '';
  }).filter(Boolean);
  return [nextCover, nextGallery];
}

async function saveProject(db, project) {
  const name = String((project && project.name) || '').trim();
  if (!name) {
    const error = new Error('اسم المشروع مطلوب');
    error.status = 422;
    throw error;
  }

  const total = Math.max(1, Number(project.total || 1));
  const sold = Math.min(Math.max(0, Number(project.sold || 0)), total);
  const status = total - sold <= 0 ? 'done' : (project.status || 'new');
  const id = Number(project.id || 0);
  const rawGallery = Array.isArray(project.gallery) ? project.gallery : [];
  const [coverValue, galleryValue] = await keepStoredImages(db, id, String(project.cover || ''), rawGallery);
  const gallery = JSON.stringify(galleryValue);

  const columns = [
    ['name', name],
    ['dist', project.dist || ''],
    ['city', project.city || 'جدة'],
    ['area', Number(project.area || 0)],
    ['facade', project.facade || ''],
    ['type', project.type || ''],
    ['price', Number(project.price || 0)],
    ['total', total],
    ['sold', sold],
    ['status', status],
    ['cover', coverValue],
    ['gallery', gallery]
  ];
  if (hasLicenseColumn) columns.push(['license', String(project.license || '').trim().slice(0, 120)]);

  if (id > 0) {
    await db.query(
      'UPDATE projects SET ' + columns.map((c) => c[0] + '=?').join(', ') + ' WHERE id=?',
      columns.map((c) => c[1]).concat([id])
    );
    return id;
  }

  const [orderRows] = await db.query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextOrder FROM projects');
  const insertColumns = columns.concat([['sort_order', Number(orderRows[0].nextOrder || 0)]]);
  await db.query(
    'INSERT INTO projects (' + insertColumns.map((c) => c[0]).join(', ') + ') VALUES (' + insertColumns.map(() => '?').join(', ') + ')' +
      ' ON DUPLICATE KEY UPDATE ' + insertColumns.filter((c) => c[0] !== 'name' && c[0] !== 'sort_order').map((c) => c[0] + '=VALUES(' + c[0] + ')').join(', '),
    insertColumns.map((c) => c[1])
  );
}

async function sellProject(db, data) {
  const id = Number(data.id || 0);
  const name = String(data.name || '').trim();
  const [rows] = id > 0
    ? await db.query('SELECT * FROM projects WHERE id=?', [id])
    : await db.query('SELECT * FROM projects WHERE name=?', [name]);

  if (!rows.length) {
    const error = new Error('المشروع غير موجود');
    error.status = 404;
    throw error;
  }

  const row = rows[0];
  const total = Math.max(1, Number(row.total || 0));
  const sold = Math.min(total, Number(row.sold || 0) + 1);
  const status = sold >= total ? 'done' : row.status;
  await db.query('UPDATE projects SET sold=?, status=? WHERE id=?', [sold, status, Number(row.id)]);
}

function sendPage(res, fileName) {
  res.sendFile(path.join(rootDir, fileName));
}

app.disable('x-powered-by');
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use((req, res, next) => {
  const decodedPath = decodeURIComponent(req.path);
  const redirects = new Map([
    ['/index.html', './'],
    ['/هوميرا - الرئيسية.html', './'],
    ['/هوميرا - المشاريع.html', './projects'],
    ['/هوميرا - مشروع الفضيلة 117.html', './projects'],
    ['/هوية هوميرا.html', './identity'],
    ['/hom555.html', './dashboard']
  ]);
  const target = redirects.get(decodedPath);
  if (target) return res.redirect(301, target);
  next();
});

app.get(['/api/homera', '/api/homera.php'], async (req, res) => {
  try {
    const db = await getDb();
    const action = getAction(req);
    if (action === 'users') {
      await requireUser(db, req, ['admin']);
      return json(res, { ok: true, users: await listUsers(db) });
    }
    if (action === 'img') return sendProjectImage(db, req, res, req.query.id, req.query.k || 'cover');
    if (action === 'settings') return json(res, { ok: true, settings: await getSettings(db) });
    if (action === 'project') {
      const row = await findProject(db, req.query.id, String(req.query.name || req.query.id || '').trim());
      if (!row) return json(res, { ok: false, error: 'المشروع غير موجود' }, 404);
      return jsonCached(req, res, { ok: true, project: projectRow(row, 'detail') });
    }
    if (action === 'projects') {
      /* full=1 للوحة التحكم فقط (بيانات الصور الخام)، والعام يحصل على قائمة خفيفة */
      if (req.query.full) {
        await requireUser(db, req, ['admin', 'editor']);
        return json(res, { ok: true, projects: await getProjects(db, 'full') });
      }
      return jsonCached(req, res, { ok: true, projects: await getProjects(db, 'card') });
    }
    return jsonCached(req, res, { ok: true, settings: await getSettings(db), projects: await getProjects(db, 'card') });
  } catch (error) {
    json(res, { ok: false, error: error.message }, error.status || 500);
  }
});

app.post(['/api/homera', '/api/homera.php'], async (req, res) => {
  try {
    const db = await getDb();
    const action = getAction(req);

    if (action === 'login') return json(res, { ok: true, ...(await loginUser(db, req.body || {})) });

    if (action === 'user') {
      await requireUser(db, req, ['admin']);
      await createUser(db, req.body.user || {});
      return json(res, { ok: true, users: await listUsers(db) });
    }

    if (action === 'password') {
      const user = await requireUser(db, req, ['admin', 'editor']);
      await changePassword(db, user, req.body || {});
      return json(res, { ok: true });
    }

    if (action === 'settings') {
      await requireUser(db, req, ['admin', 'editor']);
      await saveSettings(db, req.body.settings || {});
      return json(res, { ok: true, settings: await getSettings(db) });
    }

    if (action === 'project') {
      await requireUser(db, req, ['admin', 'editor']);
      await saveProject(db, req.body.project || {});
      return json(res, { ok: true, projects: await getProjects(db) });
    }

    if (action === 'sell') {
      await requireUser(db, req, ['admin', 'editor']);
      await sellProject(db, req.body || {});
      return json(res, { ok: true, projects: await getProjects(db) });
    }

    return json(res, { ok: false, error: 'إجراء غير معروف' }, 400);
  } catch (error) {
    json(res, { ok: false, error: error.message }, error.status || 500);
  }
});

app.get('/', (req, res) => sendPage(res, 'index.html'));
app.get('/home', (req, res) => sendPage(res, 'index.html'));
app.get('/projects', (req, res) => sendPage(res, 'هوميرا - المشاريع.html'));
app.get('/project/:id', (req, res) => sendPage(res, 'project-detail.html'));
app.get('/fadilah-117', (req, res) => res.redirect(301, './projects'));
app.get('/identity', (req, res) => sendPage(res, 'هوية هوميرا.html'));
app.get('/dashboard', (req, res) => sendPage(res, 'hom555.html'));

app.use(express.static(rootDir, { index: false, extensions: false }));

app.use((req, res) => {
  res.status(404);
  sendPage(res, '404.html');
});

app.listen(port, () => {
  console.log('Homera Node app is running on port ' + port);
});