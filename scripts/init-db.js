const crypto = require('crypto');
const mysql = require('mysql2/promise');

const DEFAULT_ADMIN_EMAIL = 'sami@seem.sa';
const DEFAULT_ADMIN_PASSWORD = 'Sami@123456';

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

const defaultSettings = {
  heroVariant: 'centered',
  heroEyebrow: 'بيتك في جدة',
  heroTitle: 'حياة عنوانها الرقي والراحة',
  heroText: 'هوميرا شركة سعودية راسخة تتمتع بخبرة واسعة في مجالات التطوير العقاري والتسويق والاستثمار، تأسست على أسس قوية، وتقدّم حلولاً عقارية متكاملة تلبّي احتياجات السوق المحلي وتواكب تطلعات العملاء.',
  fontFamily: 'Alexandria',
  headingWeight: 800,
  accent: 'gold',
  buttonShape: 'rounded',
  cornerRadius: 16,
  logo: '',
  logoSize: 46,
  heroImage: '',
  aboutImage: '',
  aboutEyebrow: 'من نحن',
  aboutTitle: 'نبني الثقة قبل أن نبني العقار',
  aboutText: 'هوميرا هي منصة عقارية متخصصة تربط العملاء بأفضل الفرص العقارية والاستثمارية، وتوفّر تجربة متكاملة لشراء وبيع وإعادة بيع العقارات، من خلال عرض المشاريع والوحدات السكنية، وتقديم الاستشارات العقارية، وربط العملاء بالحلول التمويلية المناسبة، لمساعدتهم على اتخاذ القرار الاستثماري الصحيح وإتمام الصفقات بكل احترافية.',
  aboutP1: 'خبرة راسخة في التطوير والتسويق والاستثمار العقاري.',
  aboutP2: 'حلول عقارية متكاملة تلبّي احتياجات السوق المحلي.',
  aboutP3: 'التزام بالجودة والمواعيد وضمان على الإنشاءات.',
  contactEyebrow: 'تواصل معنا',
  contactTitle: 'لنبدأ رحلتك نحو منزلك',
  contactText: 'تواصل مع فريق هوميرا مباشرةً - نجيب على استفساراتك ونساعدك في اختيار عقارك المناسب.',
  contactPhone: '+966 53 042 5505',
  contactAddress: 'حي الفيصلية، جدة، السعودية',
  contactEmail: 'info@homera.sa',
  stat1Num: '+12',
  stat1Label: 'سنة خبرة',
  stat2Num: '+40',
  stat2Label: 'مشروع منجز',
  stat3Num: '+1500',
  stat3Label: 'عميل سعيد',
  stat4Num: '6',
  stat4Label: 'مدن نخدمها',
  projFadilaImg: '',
  projRoudahImg: '',
  projSalamahImg: '',
  projNaeemImg: '',
  banners: [],
  pgProjectsBanner: '',
  pgPFadila: '',
  pgPRoudah: '',
  pgPSalamah: '',
  pgPNaeem: '',
  pgPSafa: '',
  pgPAbhur: '',
  pgFadilaBanner: '',
  pgFadilaMain: '',
  pgFadilaT1: '',
  pgFadilaT2: '',
  pgFadilaT3: '',
  pgFadilaT4: '',
  pgFadilaMap: ''
};

const defaultProjects = [];

function hashPassword(password, salt = crypto.randomBytes(16).toString('base64')) {
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(String(password || ''), salt, iterations, 32, 'sha256').toString('base64');
  return ['pbkdf2', iterations, salt, hash].join('$');
}

function createPool() {
  return mysql.createPool(dbConfig);
}

async function ensureDatabase() {
  const server = await mysql.createConnection({ ...dbConfig, database: undefined });
  const dbName = dbConfig.database.replace(/`/g, '``');
  await server.query('CREATE DATABASE IF NOT EXISTS `' + dbName + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await server.end();
}

async function createTables(db) {
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

  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    name VARCHAR(190) NOT NULL DEFAULT '',
    role ENUM('admin','editor') NOT NULL DEFAULT 'editor',
    password_hash VARCHAR(255) NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await db.query(`CREATE TABLE IF NOT EXISTS user_sessions (
    token_hash CHAR(64) PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id),
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

async function seedSettings(db) {
  await db.query(
    "INSERT IGNORE INTO settings (name, payload) VALUES ('site', ?)",
    [JSON.stringify(defaultSettings)]
  );
}

async function repairDefaultSettings(db) {
  const [rows] = await db.query("SELECT payload FROM settings WHERE name = 'site' LIMIT 1");
  if (!rows.length) return;
  let settings;
  try {
    settings = JSON.parse(rows[0].payload || '{}');
  } catch (error) {
    settings = {};
  }
  if (settings.contactPhone && settings.contactPhone !== '+966 12 000 0000') return;
  settings.contactPhone = defaultSettings.contactPhone;
  await db.query("UPDATE settings SET payload=? WHERE name = 'site'", [JSON.stringify(settings)]);
}

async function seedUsers(db) {
  const [rows] = await db.query('SELECT COUNT(*) AS count FROM users');
  if (Number(rows[0].count) > 0) return;
  await db.query(
    'INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)',
    [DEFAULT_ADMIN_EMAIL, 'Sami', 'admin', hashPassword(DEFAULT_ADMIN_PASSWORD, 'homera-default-sami-2026')]
  );
}

async function cleanProjectsOnce(db) {
  const [rows] = await db.query("SELECT name FROM settings WHERE name = 'projects_cleaned_20260715' LIMIT 1");
  if (rows.length) return;
  await db.query('DELETE FROM projects');
  await db.query("INSERT INTO settings (name, payload) VALUES ('projects_cleaned_20260715', '{}') ON DUPLICATE KEY UPDATE payload=VALUES(payload)");
}

async function seedProjects(db) {
  if (!defaultProjects.length) return;
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
  if (!defaultProjects.length) return;
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

async function migrate() {
  await ensureDatabase();
  const db = createPool();
  await createTables(db);
  await seedSettings(db);
  await repairDefaultSettings(db);
  await seedUsers(db);
  await cleanProjectsOnce(db);
  await seedProjects(db);
  await repairSeedProjects(db);
  return db;
}

async function runCli() {
  const db = await migrate();
  await db.end();
  console.log('Homera database is ready: ' + dbConfig.database);
}

if (require.main === module) {
  runCli().catch((error) => {
    console.error('Failed to initialize Homera database:', error.message);
    process.exit(1);
  });
}

module.exports = {
  createPool,
  dbConfig,
  defaultProjects,
  defaultSettings,
  migrate
};