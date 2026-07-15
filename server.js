const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);

const dbConfig = {
  host: process.env.HOMERA_DB_HOST || process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.HOMERA_DB_PORT || process.env.DB_PORT || 3306),
  database: process.env.HOMERA_DB_NAME || process.env.DB_NAME || 'homera',
  user: process.env.HOMERA_DB_USER || process.env.DB_USER || 'root',
  password: process.env.HOMERA_DB_PASS || process.env.DB_PASS || '',
  charset: 'utf8mb4_unicode_ci',
  connectTimeout: Number(process.env.HOMERA_DB_TIMEOUT || process.env.DB_TIMEOUT || 5000),
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false
};

let pool;
let migrationPromise;

const defaultProjects = [
  ['مشروع النعيم 120', 'حي النعيم', 'جدة', 175, 'جنوبية', 'شقق', 750000, 16, 13, 'sale', 'uploads/7.jpg'],
  ['مشروع الفضيلة 117', 'حي الفضيلة', 'جدة', 200, 'شمالية', 'فيلا', 1100000, 12, 7, 'sale', 'uploads/3.jpg'],
  ['مشروع الروضة 116', 'حي الروضة', 'جدة', 165, 'شرقية', 'شقق', 690000, 20, 12, 'sale', 'uploads/4.jpg'],
  ['مشروع أبحر 122', 'أبحر الشمالية', 'جدة', 185, 'غربية', 'شقق', 820000, 24, 10, 'sale', ''],
  ['مشروع الصفا 121', 'حي الصفا', 'جدة', 210, 'شمالية', 'فيلا', 1050000, 10, 10, 'done', ''],
  ['مشروع السلامة 118', 'حي السلامة', 'جدة', 240, 'غربية', 'فيلا', 1250000, 8, 0, 'new', 'uploads/6.jpg']
];

function json(res, data, status = 200) {
  res.status(status).json(data);
}

function getAction(req) {
  return req.query.action || 'bootstrap';
}

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

async function migrate() {
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    try {
      const server = await mysql.createConnection({ ...dbConfig, database: undefined });
      const dbName = dbConfig.database.replace(/`/g, '``');
      await server.query('CREATE DATABASE IF NOT EXISTS `' + dbName + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      await server.end();
    } catch (error) {
      console.warn('Skipping database creation:', error.message);
    }

    const db = await getPool();
    await db.query(`CREATE TABLE IF NOT EXISTS settings (
      name VARCHAR(64) PRIMARY KEY,
      payload LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await db.query(`CREATE TABLE IF NOT EXISTS projects (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(190) NOT NULL UNIQUE,
      dist VARCHAR(190) NOT NULL DEFAULT '',
      city VARCHAR(120) NOT NULL DEFAULT 'جدة',
      area INT UNSIGNED NOT NULL DEFAULT 0,
      facade VARCHAR(80) NOT NULL DEFAULT '',
      type VARCHAR(80) NOT NULL DEFAULT '',
      price INT UNSIGNED NOT NULL DEFAULT 0,
      total INT UNSIGNED NOT NULL DEFAULT 1,
      sold INT UNSIGNED NOT NULL DEFAULT 0,
      status VARCHAR(40) NOT NULL DEFAULT 'new',
      cover LONGTEXT NULL,
      gallery LONGTEXT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await seedProjects(db);
    await repairSeedProjects(db);
    return db;
  })();
  return migrationPromise;
}

async function seedProjects(db) {
  const [rows] = await db.query('SELECT COUNT(*) AS count FROM projects');
  if (Number(rows[0].count) > 0) return;

  for (const [index, project] of defaultProjects.entries()) {
    await db.query(
      'INSERT INTO projects (name, dist, city, area, facade, type, price, total, sold, status, cover, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [...project, index]
    );
  }
}

function hasBrokenArabic(value) {
  return /[ÃÂØÙ�]/.test(String(value || ''));
}

async function repairSeedProjects(db) {
  const [rows] = await db.query('SELECT id, name, dist, city, facade, type, sort_order FROM projects ORDER BY sort_order ASC, id ASC LIMIT ?', [defaultProjects.length]);
  for (const row of rows) {
    const index = Number(row.sort_order);
    if (index < 0 || index >= defaultProjects.length) continue;
    const needsRepair = [row.name, row.dist, row.city, row.facade, row.type].some(hasBrokenArabic);
    if (!needsRepair) continue;
    const project = defaultProjects[index];
    await db.query(
      'UPDATE projects SET name=?, dist=?, city=?, area=?, facade=?, type=?, price=?, total=?, sold=?, status=?, cover=? WHERE id=?',
      [...project, row.id]
    );
  }
}

function parseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value || '');
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function projectRow(row) {
  const total = Math.max(1, Number(row.total || 0));
  const sold = Math.min(Math.max(0, Number(row.sold || 0)), total);
  const gallery = parseJson(row.gallery || '[]', []);
  return {
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
    pct: total ? Math.round((sold / total) * 100) : 0,
    cover: row.cover || '',
    gallery: Array.isArray(gallery) ? gallery : []
  };
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

async function getProjects(db) {
  const [rows] = await db.query('SELECT * FROM projects ORDER BY sort_order ASC, id ASC');
  return rows.map(projectRow);
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
  const gallery = JSON.stringify(project.gallery || []);
  const id = Number(project.id || 0);

  if (id > 0) {
    await db.query(
      'UPDATE projects SET name=?, dist=?, city=?, area=?, facade=?, type=?, price=?, total=?, sold=?, status=?, cover=?, gallery=? WHERE id=?',
      [name, project.dist || '', project.city || 'جدة', Number(project.area || 0), project.facade || '', project.type || '', Number(project.price || 0), total, sold, status, project.cover || '', gallery, id]
    );
    return id;
  }

  const [orderRows] = await db.query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextOrder FROM projects');
  await db.query(
    'INSERT INTO projects (name, dist, city, area, facade, type, price, total, sold, status, cover, gallery, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE dist=VALUES(dist), city=VALUES(city), area=VALUES(area), facade=VALUES(facade), type=VALUES(type), price=VALUES(price), total=VALUES(total), sold=VALUES(sold), status=VALUES(status), cover=VALUES(cover), gallery=VALUES(gallery)',
    [name, project.dist || '', project.city || 'جدة', Number(project.area || 0), project.facade || '', project.type || '', Number(project.price || 0), total, sold, status, project.cover || '', gallery, Number(orderRows[0].nextOrder || 0)]
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
    ['/هوميرا - مشروع الفضيلة 117.html', './fadilah-117'],
    ['/هوية هوميرا.html', './identity'],
    ['/hom555.html', './dashboard']
  ]);
  const target = redirects.get(decodedPath);
  if (target) return res.redirect(301, target);
  next();
});

app.get(['/api/homera', '/api/homera.php'], async (req, res) => {
  try {
    const db = await migrate();
    const action = getAction(req);
    if (action === 'settings') return json(res, { ok: true, settings: await getSettings(db) });
    if (action === 'projects') return json(res, { ok: true, projects: await getProjects(db) });
    return json(res, { ok: true, settings: await getSettings(db), projects: await getProjects(db) });
  } catch (error) {
    json(res, { ok: false, error: error.message }, error.status || 500);
  }
});

app.post(['/api/homera', '/api/homera.php'], async (req, res) => {
  try {
    const db = await migrate();
    const action = getAction(req);

    if (action === 'settings') {
      await saveSettings(db, req.body.settings || {});
      return json(res, { ok: true, settings: await getSettings(db) });
    }

    if (action === 'project') {
      await saveProject(db, req.body.project || {});
      return json(res, { ok: true, projects: await getProjects(db) });
    }

    if (action === 'sell') {
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
app.get('/fadilah-117', (req, res) => sendPage(res, 'هوميرا - مشروع الفضيلة 117.html'));
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