const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { createPool, ensureProjectColumns } = require('./scripts/init-db');

const app = express();
const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);

let dbPool;
// أعمدة جدول المشاريع كما هي فعلياً في القاعدة (null = لم تُعرف بعد)
let projectColumns = null;
let migrationDone = false;
// يصبح false لو تعذّرت ترقية المخطط على الاستضافة، فنتخطّى الأعمدة الجديدة بدل تعطيل الحفظ
let hasExtraColumns = true;
function hasColumn(name) { return projectColumns ? projectColumns.has(name) : false; }

function json(res, data, status = 200) {
  res.status(status).json(data);
}

function getAction(req) {
  return req.query.action || 'bootstrap';
}

async function getDb() {
  if (!dbPool) dbPool = createPool();
  if (!migrationDone) {
    migrationDone = true;
    // ترقية صامتة للقواعد القديمة (الأعمدة المستجدة + جدول الطلبات) عند أول اتصال
    try {
      projectColumns = await ensureProjectColumns(dbPool);
      hasExtraColumns = true;
    } catch (error) {
      // لا نُثبّت الفشل: نعيد المحاولة مع الطلب التالي، ونعمل مؤقتاً بالأعمدة الأساسية فقط
      migrationDone = false;
      projectColumns = null;
      hasExtraColumns = false;
    }
  }
  return dbPool;
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

/* نماذج المشروع (نموذج A / B / C) — مخزّنة JSON داخل عمود models */
function normalizeModel(item) {
  const model = item && typeof item === 'object' ? item : {};
  const price = Math.max(0, Number(model.price || 0));
  const oldPrice = Math.max(0, Number(model.oldPrice || 0));
  return {
    name: String(model.name || '').slice(0, 120),
    unit: String(model.unit || '').slice(0, 120),
    area: Math.max(0, Number(model.area || 0)),
    rooms: Math.max(0, Number(model.rooms || 0)),
    price,
    oldPrice: oldPrice > price ? oldPrice : 0,
    priceMode: ['total', 'from', 'meter', 'ask'].indexOf(model.priceMode) > -1 ? model.priceMode : 'total',
    status: String(model.status || '').slice(0, 60),
    note: String(model.note || '').slice(0, 400)
  };
}

function readModels(value) {
  const parsed = parseJson(value || '[]', []);
  return Array.isArray(parsed) ? parsed.map(normalizeModel).filter((m) => m.name || m.price || m.area) : [];
}

/* أقل سعر متاح داخل المشروع — يظهر على البطاقة «تبدأ الأسعار من …» */
function startingPrice(models, basePrice) {
  const prices = models.map((m) => Number(m.price || 0)).filter((p) => p > 0);
  const base = Number(basePrice || 0);
  if (!prices.length) return base;
  const min = Math.min.apply(null, prices);
  return base > 0 ? Math.min(min, base) : min;
}

function splitLines(value) {
  return String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
}

/* mode: full = بيانات خام للوحة التحكم | card = بطاقات بدون معرض | detail = صفحة المشروع */
function projectRow(row, mode = 'full') {
  const total = Math.max(1, Number(row.total || 0));
  const sold = Math.min(Math.max(0, Number(row.sold || 0)), total);
  const parsed = parseJson(row.gallery || '[]', []);
  const gallery = Array.isArray(parsed) ? parsed : [];
  const ver = rowVersion(row);
  const models = readModels(row.models);
  const price = Number(row.price || 0);
  const priceFrom = startingPrice(models, price);
  const oldPrice = Number(row.old_price || 0);
  const out = {
    id: Number(row.id),
    name: row.name,
    dist: row.dist,
    city: row.city,
    area: Number(row.area || 0),
    facade: row.facade,
    type: row.type,
    price,
    priceFrom,
    oldPrice: oldPrice > priceFrom ? oldPrice : 0,
    discountPct: oldPrice > priceFrom && oldPrice > 0 ? Math.round(((oldPrice - priceFrom) / oldPrice) * 100) : 0,
    total,
    sold,
    avail: Math.max(0, total - sold),
    status: row.status,
    license: row.license || '',
    category: row.category || 'residential',
    stage: row.stage || 'ready',
    rooms: Number(row.rooms || 0),
    payment: row.payment || 'both',
    limitedOffer: Number(row.limited_offer || 0) === 1,
    noCommission: Number(row.no_commission || 0) === 1,
    progress: Math.min(100, Math.max(0, Number(row.progress || 0))),
    deliveryDate: row.delivery_date || '',
    modelsCount: models.length,
    pct: total ? Math.round((sold / total) * 100) : 0,
    cover: mode === 'full' ? (row.cover || '') : imageRef(row.cover, row.id, 'cover', ver)
  };
  if (mode === 'card') return out;
  out.gallery = mode === 'full' ? gallery : gallery.map((img, i) => imageRef(img, row.id, 'g' + i, ver));
  out.models = models;
  out.summary = row.summary || '';
  out.videoUrl = row.video_url || '';
  out.videoPoster = mode === 'full' ? (row.video_poster || '') : imageRef(row.video_poster, row.id, 'vp', ver);
  out.paymentPlan = row.payment_plan || '';
  out.buildUpdates = mode === 'full' ? (row.build_updates || '') : splitLines(row.build_updates);
  return out;
}

const CARD_BASE_COLUMNS = ['id', 'name', 'dist', 'city', 'area', 'facade', 'type', 'price', 'total', 'sold', 'status', 'updated_at'];
const CARD_OPTIONAL_COLUMNS = ['license', 'category', 'stage', 'rooms', 'payment', 'old_price', 'limited_offer', 'no_commission', 'progress', 'delivery_date', 'models'];
function cardColumnsSql() {
  const cols = CARD_BASE_COLUMNS.concat(CARD_OPTIONAL_COLUMNS.filter(hasColumn));
  return 'SELECT ' + cols.join(', ') +
    ", CASE WHEN cover LIKE 'data:%' THEN 'data:' ELSE COALESCE(cover, '') END AS cover" +
    ' FROM projects ORDER BY sort_order ASC, id ASC';
}

/* يخدم صورة مشروع واحدة كملف ثنائي مع تخزين مؤقت طويل (الرابط يحمل بصمة التحديث) */
async function sendProjectImage(db, req, res, id, key) {
  const [rows] = await db.query('SELECT * FROM projects WHERE id=? LIMIT 1', [Number(id) || 0]);
  if (!rows.length) return res.status(404).type('text/plain').send('');

  let data = '';
  if (key === 'cover') {
    data = String(rows[0].cover || '');
  } else if (key === 'vp') {
    data = String(rows[0].video_poster || '');
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
  const [rows] = await db.query(mode === 'card' ? cardColumnsSql() : 'SELECT * FROM projects ORDER BY sort_order ASC, id ASC');
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
async function keepStoredImages(db, id, cover, gallery, poster) {
  const needsCover = isImageRef(cover);
  const needsPoster = isImageRef(poster);
  const needsGallery = gallery.some(isImageRef);
  if (id <= 0 || (!needsCover && !needsGallery && !needsPoster)) return [cover, gallery, poster];

  const [rows] = await db.query('SELECT * FROM projects WHERE id=? LIMIT 1', [id]);
  if (!rows.length) return [cover, gallery, poster];
  const parsed = parseJson(rows[0].gallery || '[]', []);
  const stored = Array.isArray(parsed) ? parsed : [];

  const nextCover = needsCover ? String(rows[0].cover || '') : cover;
  const nextPoster = needsPoster ? String(rows[0].video_poster || '') : poster;
  const nextGallery = gallery.map((img, i) => {
    if (!isImageRef(img)) return img;
    const match = /&k=g(\d+)/.exec(img);
    const key = match ? Number(match[1]) : i;
    return stored[key] ? String(stored[key]) : '';
  }).filter(Boolean);
  return [nextCover, nextGallery, nextPoster];
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
  const [coverValue, galleryValue, posterValue] =
    await keepStoredImages(db, id, String(project.cover || ''), rawGallery, String(project.videoPoster || ''));
  const gallery = JSON.stringify(galleryValue);
  const models = readModels(Array.isArray(project.models) ? JSON.stringify(project.models) : project.models);

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
  if (hasExtraColumns) {
    const categories = ['residential', 'commercial', 'investment'];
    const stages = ['ready', 'under_construction', 'resale'];
    const payments = ['cash', 'bank', 'both'];
    columns.push(['license', String(project.license || '').trim().slice(0, 120)]);
    columns.push(['category', categories.indexOf(project.category) > -1 ? project.category : 'residential']);
    columns.push(['stage', stages.indexOf(project.stage) > -1 ? project.stage : 'ready']);
    columns.push(['rooms', Math.max(0, Number(project.rooms || 0))]);
    columns.push(['payment', payments.indexOf(project.payment) > -1 ? project.payment : 'both']);
    columns.push(['old_price', Math.max(0, Number(project.oldPrice || 0))]);
    columns.push(['limited_offer', project.limitedOffer ? 1 : 0]);
    columns.push(['no_commission', project.noCommission ? 1 : 0]);
    columns.push(['progress', Math.min(100, Math.max(0, Number(project.progress || 0)))]);
    columns.push(['delivery_date', String(project.deliveryDate || '').trim().slice(0, 80)]);
    columns.push(['payment_plan', String(project.paymentPlan || '').slice(0, 4000)]);
    columns.push(['build_updates', String(project.buildUpdates || '').slice(0, 4000)]);
    columns.push(['video_url', String(project.videoUrl || '').trim().slice(0, 600)]);
    columns.push(['video_poster', posterValue]);
    columns.push(['summary', String(project.summary || '').slice(0, 4000)]);
    columns.push(['models', JSON.stringify(models)]);
  }

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

/* حذف مشروع نهائياً — طلبات الاهتمام تبقى محفوظة (تحمل اسم المشروع في صفّها) */
async function deleteProject(db, data) {
  const id = Number(data.id || 0);
  const name = String(data.name || '').trim();
  const [rows] = id > 0
    ? await db.query('SELECT id FROM projects WHERE id=?', [id])
    : await db.query('SELECT id FROM projects WHERE name=?', [name]);

  if (!rows.length) {
    const error = new Error('المشروع غير موجود');
    error.status = 404;
    throw error;
  }

  await db.query('DELETE FROM projects WHERE id=?', [Number(rows[0].id)]);
}

/* ==========================================================================
   طلبات تسجيل الاهتمام (Leads) — تُستقبل من الصفحة الرئيسية وصفحات المشاريع
   ========================================================================== */
const LEAD_LABELS = {
  cash: 'كاش',
  bank: 'تمويل بنكي',
  undecided: 'غير محدد',
  yes: 'نعم',
  no: 'لا'
};

function leadRow(row) {
  return {
    id: Number(row.id),
    name: row.name || '',
    phone: row.phone || '',
    projectId: Number(row.project_id || 0),
    projectName: row.project_name || '',
    propertyType: row.property_type || '',
    purchaseMethod: row.purchase_method || '',
    needsFinance: row.needs_finance || '',
    hasDefault: row.has_default || '',
    budget: row.budget || '',
    city: row.city || '',
    notes: row.notes || '',
    details: row.details || '',
    source: row.source || '',
    status: row.status || 'new',
    createdAt: row.created_at
  };
}

async function saveLead(db, data) {
  const name = String(data.name || '').trim().slice(0, 190);
  const phone = String(data.phone || '').trim().slice(0, 60);
  if (!name || !phone) {
    const error = new Error('الاسم ورقم الجوال مطلوبان');
    error.status = 422;
    throw error;
  }
  const methods = ['cash', 'bank', 'undecided'];
  const yesNo = ['yes', 'no'];
  const values = [
    name,
    phone,
    Math.max(0, Number(data.projectId || 0)),
    String(data.projectName || '').trim().slice(0, 190),
    String(data.propertyType || '').trim().slice(0, 80),
    methods.indexOf(data.purchaseMethod) > -1 ? data.purchaseMethod : 'undecided',
    yesNo.indexOf(data.needsFinance) > -1 ? data.needsFinance : '',
    yesNo.indexOf(data.hasDefault) > -1 ? data.hasDefault : '',
    String(data.budget || '').trim().slice(0, 80),
    String(data.city || '').trim().slice(0, 120),
    String(data.notes || '').slice(0, 2000),
    String(data.details || '').slice(0, 4000),
    String(data.source || '').trim().slice(0, 255)
  ];
  await db.query(
    'INSERT INTO leads (name, phone, project_id, project_name, property_type, purchase_method, needs_finance,' +
      ' has_default, budget, city, notes, details, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    values
  );
}

async function listLeads(db) {
  const [rows] = await db.query('SELECT * FROM leads ORDER BY id DESC LIMIT 1000');
  return rows.map(leadRow);
}

async function setLeadStatus(db, data) {
  const statuses = ['new', 'contacted', 'closed'];
  const status = statuses.indexOf(data.status) > -1 ? data.status : 'new';
  await db.query('UPDATE leads SET status=? WHERE id=?', [status, Number(data.id || 0)]);
}

function csvCell(value) {
  return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
}

/* تصدير إلى إكسل: BOM في المقدمة ليقرأ إكسل العربية بشكل صحيح */
function leadsCsv(leads) {
  const head = ['المعرف', 'التاريخ', 'الاسم', 'الجوال', 'المشروع', 'نوع العقار', 'طريقة الشراء',
    'يحتاج تمويل', 'لديه تعثرات', 'الميزانية', 'المدينة', 'ملاحظات', 'وصف إضافي', 'مصدر العميل', 'الحالة'];
  const lines = leads.map((lead) => [
    lead.id,
    lead.createdAt ? new Date(lead.createdAt).toISOString().slice(0, 19).replace('T', ' ') : '',
    lead.name,
    lead.phone,
    lead.projectName,
    lead.propertyType,
    LEAD_LABELS[lead.purchaseMethod] || lead.purchaseMethod,
    LEAD_LABELS[lead.needsFinance] || '',
    LEAD_LABELS[lead.hasDefault] || '',
    lead.budget,
    lead.city,
    lead.notes,
    lead.details,
    lead.source,
    lead.status
  ].map(csvCell).join(','));
  return '﻿' + [head.map(csvCell).join(',')].concat(lines).join('\r\n');
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
    if (action === 'leads') {
      await requireUser(db, req, ['admin', 'editor']);
      const leads = await listLeads(db);
      if (String(req.query.format || '') === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="homera-leads.csv"');
        return res.send(leadsCsv(leads));
      }
      return json(res, { ok: true, leads });
    }
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

    /* عام بلا جلسة — نموذج «سجّل اهتمامك» في الواجهة */
    if (action === 'lead') {
      await saveLead(db, req.body.lead || {});
      return json(res, { ok: true });
    }

    if (action === 'leadStatus') {
      await requireUser(db, req, ['admin', 'editor']);
      await setLeadStatus(db, req.body || {});
      return json(res, { ok: true, leads: await listLeads(db) });
    }

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

    /* الحذف نهائي — للأدمن فقط */
    if (action === 'deleteProject') {
      await requireUser(db, req, ['admin']);
      await deleteProject(db, req.body || {});
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
app.get(['/homera', '/links'], (req, res) => sendPage(res, 'homera-links.html')); // صفحة الروابط (نمط linktree)

app.use(express.static(rootDir, { index: false, extensions: false }));

app.use((req, res) => {
  res.status(404);
  sendPage(res, '404.html');
});

app.listen(port, () => {
  console.log('Homera Node app is running on port ' + port);
});