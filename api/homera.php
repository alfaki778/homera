<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$config = require __DIR__ . '/config.php';

function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function input_json() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function connect_server($config) {
    $dsn = 'mysql:host=' . $config['host'] . ';port=' . $config['port'] . ';charset=' . $config['charset'];
    return new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function connect_db($config) {
    $dsn = 'mysql:host=' . $config['host'] . ';port=' . $config['port'] . ';dbname=' . $config['database'] . ';charset=' . $config['charset'];
    return new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function migrate($config) {
    $server = connect_server($config);
    $db = str_replace('`', '``', $config['database']);
    $server->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo = connect_db($config);
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        name VARCHAR(64) PRIMARY KEY,
        payload LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS projects (
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
        license VARCHAR(120) NOT NULL DEFAULT '',
        cover LONGTEXT NULL,
        gallery LONGTEXT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    ensure_project_columns($pdo);
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(190) NOT NULL UNIQUE,
        name VARCHAR(190) NOT NULL DEFAULT '',
        role ENUM('admin','editor') NOT NULL DEFAULT 'editor',
        password_hash VARCHAR(255) NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_sessions (
        token_hash CHAR(64) PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id),
        CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    seed_settings($pdo);
    seed_users($pdo);
    seed_projects($pdo);
    return $pdo;
}

function hash_password_pbkdf2($password, $salt = null) {
    $salt = $salt ?: base64_encode(random_bytes(16));
    $iterations = 120000;
    $hash = base64_encode(hash_pbkdf2('sha256', (string)$password, $salt, $iterations, 32, true));
    return 'pbkdf2$' . $iterations . '$' . $salt . '$' . $hash;
}

function verify_password_pbkdf2($password, $stored) {
    $parts = explode('$', (string)$stored);
    if (count($parts) !== 4 || $parts[0] !== 'pbkdf2') return false;
    $hash = base64_encode(hash_pbkdf2('sha256', (string)$password, $parts[2], (int)$parts[1], 32, true));
    return hash_equals($parts[3], $hash);
}

function default_settings() {
    return [
        'heroVariant' => 'centered',
        'heroEyebrow' => '',
        'heroTitle' => 'حياة عنوانها الرقي والراحة',
        'heroText' => 'منصة عقارية متكاملة تجمع لك أفضل الفرص العقارية، والحلول التمويلية، والاستشارات الاحترافية؛ لتشتري، تستثمر، أو تبيع بكل ثقة وسهولة.',
        'fontFamily' => 'Alexandria',
        'headingWeight' => 800,
        'accent' => 'gold',
        'buttonShape' => 'rounded',
        'cornerRadius' => 16,
        'logo' => '',
        'logoSize' => 46,
        'heroImage' => '',
        'aboutImage' => '',
        'aboutEyebrow' => 'من نحن',
        'aboutTitle' => 'نبني الثقة قبل أن نبني العقار',
        'aboutText' => 'هوميرا هي منصة عقارية متخصصة تربط العملاء بأفضل الفرص العقارية والاستثمارية، وتوفّر تجربة متكاملة لشراء وبيع وإعادة بيع العقارات، من خلال عرض المشاريع والوحدات السكنية، وتقديم الاستشارات العقارية، وربط العملاء بالحلول التمويلية المناسبة، لمساعدتهم على اتخاذ القرار الاستثماري الصحيح وإتمام الصفقات بكل احترافية.',
        'aboutP1' => 'خبرة راسخة في التطوير والتسويق والاستثمار العقاري.',
        'aboutP2' => 'حلول عقارية متكاملة تلبّي احتياجات السوق المحلي.',
        'aboutP3' => 'التزام بالجودة والمواعيد وضمان على الإنشاءات.',
        'contactEyebrow' => 'تواصل معنا',
        'contactTitle' => 'لنبدأ رحلتك نحو منزلك',
        'contactText' => 'تواصل مع فريق هوميرا مباشرةً - نجيب على استفساراتك ونساعدك في اختيار عقارك المناسب.',
        'contactPhone' => '+966 53 042 5505',
        'contactAddress' => 'حي الفيصلية، جدة، السعودية',
        'contactEmail' => 'info@homera.sa',
        'stat1Num' => '+12', 'stat1Label' => 'سنة خبرة',
        'stat2Num' => '+40', 'stat2Label' => 'مشروع منجز',
        'stat3Num' => '+1500', 'stat3Label' => 'عميل سعيد',
        'stat4Num' => '6', 'stat4Label' => 'مدن نخدمها',
        'projFadilaImg' => '',
        'projRoudahImg' => '',
        'projSalamahImg' => '',
        'projNaeemImg' => '',
        'banners' => [],
        'pgProjectsBanner' => '', 'pgPFadila' => '', 'pgPRoudah' => '', 'pgPSalamah' => '', 'pgPNaeem' => '', 'pgPSafa' => '', 'pgPAbhur' => '',
        'pgFadilaBanner' => '', 'pgFadilaMain' => '', 'pgFadilaT1' => '', 'pgFadilaT2' => '', 'pgFadilaT3' => '', 'pgFadilaT4' => '', 'pgFadilaMap' => ''
    ];
}

function seed_settings($pdo) {
    $stmt = $pdo->prepare("INSERT IGNORE INTO settings (name, payload) VALUES ('site', ?)");
    $stmt->execute([json_encode(default_settings(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    repair_default_settings($pdo);
}

function seed_users($pdo) {
    $count = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    if ($count > 0) return;
    $stmt = $pdo->prepare('INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)');
    $stmt->execute(['sami@seem.sa', 'Sami', 'admin', hash_password_pbkdf2('Sami@123456', 'homera-default-sami-2026')]);
}

function repair_default_settings($pdo) {
    $stmt = $pdo->prepare("SELECT payload FROM settings WHERE name = 'site' LIMIT 1");
    $stmt->execute();
    $payload = $stmt->fetchColumn();
    $settings = $payload ? json_decode($payload, true) : [];
    if (!is_array($settings)) $settings = [];
    if (!empty($settings['contactPhone']) && $settings['contactPhone'] !== '+966 12 000 0000') return;
    $settings['contactPhone'] = default_settings()['contactPhone'];
    $up = $pdo->prepare("UPDATE settings SET payload=? WHERE name = 'site'");
    $up->execute([json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
}

function seed_projects($pdo) {
    return;
}

function get_settings($pdo) {
    $stmt = $pdo->prepare("SELECT payload FROM settings WHERE name = 'site' LIMIT 1");
    $stmt->execute();
    $payload = $stmt->fetchColumn();
    $decoded = $payload ? json_decode($payload, true) : [];
    return is_array($decoded) ? $decoded : [];
}

function save_settings($pdo, $settings) {
    $payload = json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $pdo->prepare("INSERT INTO settings (name, payload) VALUES ('site', ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)");
    $stmt->execute([$payload]);
}

/* الأعمدة المستجدة على جدول المشاريع */
function project_extra_columns() {
    return [
        'license' => "VARCHAR(120) NOT NULL DEFAULT ''",
        'category' => "VARCHAR(30) NOT NULL DEFAULT 'residential'",
        'stage' => "VARCHAR(30) NOT NULL DEFAULT 'ready'",
        'rooms' => 'INT UNSIGNED NOT NULL DEFAULT 0',
        'payment' => "VARCHAR(20) NOT NULL DEFAULT 'both'",
        'old_price' => 'INT UNSIGNED NOT NULL DEFAULT 0',
        'limited_offer' => 'TINYINT(1) NOT NULL DEFAULT 0',
        'no_commission' => 'TINYINT(1) NOT NULL DEFAULT 0',
        'progress' => 'TINYINT UNSIGNED NOT NULL DEFAULT 0',
        'delivery_date' => "VARCHAR(80) NOT NULL DEFAULT ''",
        'payment_plan' => 'TEXT NULL',
        'build_updates' => 'TEXT NULL',
        'video_url' => "VARCHAR(600) NOT NULL DEFAULT ''",
        'video_poster' => 'LONGTEXT NULL',
        'summary' => 'TEXT NULL',
        'models' => 'LONGTEXT NULL',
    ];
}

/* ترقية تلقائية بعد الرفع/الديبلوي: تضيف الأعمدة المستجدة وجدول الطلبات إن لم تكن موجودة.
   تُستدعى مع كل طلب (استعلام واحد خفيف) حتى لا تحتاج لتشغيل أي SQL يدوياً على الاستضافة. */
function ensure_project_columns($pdo) {
    static $ready = null;
    if ($ready !== null) return $ready;
    $ready = false;
    try {
        $stmt = $pdo->prepare("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects'");
        $stmt->execute();
        $existing = $stmt->fetchAll(PDO::FETCH_COLUMN);
        foreach (project_extra_columns() as $name => $definition) {
            if (in_array($name, $existing, true)) continue;
            $pdo->exec('ALTER TABLE projects ADD COLUMN ' . $name . ' ' . $definition);
        }
        $pdo->exec("CREATE TABLE IF NOT EXISTS leads (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(190) NOT NULL DEFAULT '',
            phone VARCHAR(60) NOT NULL DEFAULT '',
            project_id INT UNSIGNED NOT NULL DEFAULT 0,
            project_name VARCHAR(190) NOT NULL DEFAULT '',
            property_type VARCHAR(80) NOT NULL DEFAULT '',
            purchase_method VARCHAR(30) NOT NULL DEFAULT '',
            needs_finance VARCHAR(10) NOT NULL DEFAULT '',
            has_default VARCHAR(10) NOT NULL DEFAULT '',
            budget VARCHAR(80) NOT NULL DEFAULT '',
            city VARCHAR(120) NOT NULL DEFAULT '',
            notes TEXT NULL,
            details TEXT NULL,
            source VARCHAR(255) NOT NULL DEFAULT '',
            status VARCHAR(30) NOT NULL DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (created_at),
            INDEX (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $ready = true;
    } catch (Throwable $e) {
        /* لو تعذّرت الترقية (صلاحيات ALTER مثلاً) نكمل بدون الأعمدة بدل تعطيل الحفظ */
    }
    return $ready;
}

/* ==========================================================================
   الصور: تُخزَّن في قاعدة البيانات كـ data:URL (base64). إرسالها داخل الـ JSON
   يجعل رد المشاريع بحجم عدة ميجابايت، فيبقى القسم فارغاً حتى يكتمل التحميل
   ثم تظهر البطاقات دفعة واحدة. الحل: يرجع الـ JSON رابطاً خفيفاً لكل صورة،
   ويقوم المتصفح بتحميلها كصورة عادية (تحميل كسول + تخزين مؤقت + تدرّج).
   الرابط نسبي لمسار الـ API (يبدأ بـ ?) ويكمله homera-api.js في المتصفح.
   ========================================================================== */
function row_version($row) {
    return substr(md5((string)($row['updated_at'] ?? '') . '|' . (string)($row['id'] ?? '')), 0, 10);
}

function image_ref($value, $id, $key, $ver) {
    $value = (string)$value;
    if ($value === '') return '';
    if (strncmp($value, 'data:', 5) !== 0) return $value; // مسار ملف عادي — يُترك كما هو
    return '?action=img&id=' . (int)$id . '&k=' . $key . '&v=' . $ver;
}

/* نماذج المشروع (نموذج A / B / C) — مخزّنة JSON داخل عمود models */
function normalize_model($item) {
    if (!is_array($item)) $item = [];
    $price = max(0, (int)($item['price'] ?? 0));
    $oldPrice = max(0, (int)($item['oldPrice'] ?? 0));
    $mode = $item['priceMode'] ?? 'total';
    return [
        'name' => mb_substr((string)($item['name'] ?? ''), 0, 120),
        'unit' => mb_substr((string)($item['unit'] ?? ''), 0, 120),
        'area' => max(0, (int)($item['area'] ?? 0)),
        'rooms' => max(0, (int)($item['rooms'] ?? 0)),
        'price' => $price,
        'oldPrice' => $oldPrice > $price ? $oldPrice : 0,
        'priceMode' => in_array($mode, ['total', 'from', 'meter', 'ask'], true) ? $mode : 'total',
        'status' => mb_substr((string)($item['status'] ?? ''), 0, 60),
        'note' => mb_substr((string)($item['note'] ?? ''), 0, 400),
    ];
}

function read_models($value) {
    $parsed = is_array($value) ? $value : json_decode((string)($value ?: '[]'), true);
    if (!is_array($parsed)) return [];
    $out = [];
    foreach ($parsed as $item) {
        $model = normalize_model($item);
        if ($model['name'] !== '' || $model['price'] > 0 || $model['area'] > 0) $out[] = $model;
    }
    return $out;
}

/* أقل سعر متاح داخل المشروع — يظهر على البطاقة «تبدأ الأسعار من …» */
function starting_price($models, $basePrice) {
    $prices = [];
    foreach ($models as $model) if ((int)$model['price'] > 0) $prices[] = (int)$model['price'];
    $base = (int)$basePrice;
    if (!count($prices)) return $base;
    $min = min($prices);
    return $base > 0 ? min($min, $base) : $min;
}

function split_lines($value) {
    $lines = preg_split('/\r?\n/', (string)$value);
    $out = [];
    foreach ($lines as $line) { $line = trim($line); if ($line !== '') $out[] = $line; }
    return $out;
}

/* $mode: full = بيانات خام للوحة التحكم | card = بطاقات بدون معرض | detail = صفحة المشروع */
function project_row($row, $mode = 'full') {
    $total = max(1, (int)$row['total']);
    $sold = min(max(0, (int)$row['sold']), $total);
    $gallery = json_decode($row['gallery'] ?: '[]', true);
    if (!is_array($gallery)) $gallery = [];
    $ver = row_version($row);
    $models = read_models($row['models'] ?? '[]');
    $price = (int)$row['price'];
    $priceFrom = starting_price($models, $price);
    $oldPrice = (int)($row['old_price'] ?? 0);
    $out = [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'dist' => $row['dist'],
        'city' => $row['city'],
        'area' => (int)$row['area'],
        'facade' => $row['facade'],
        'type' => $row['type'],
        'price' => $price,
        'priceFrom' => $priceFrom,
        'oldPrice' => $oldPrice > $priceFrom ? $oldPrice : 0,
        'discountPct' => ($oldPrice > $priceFrom && $oldPrice > 0) ? (int)round(($oldPrice - $priceFrom) / $oldPrice * 100) : 0,
        'total' => $total,
        'sold' => $sold,
        'avail' => max(0, $total - $sold),
        'status' => $row['status'],
        'license' => $row['license'] ?? '',
        'category' => $row['category'] ?? 'residential',
        'stage' => $row['stage'] ?? 'ready',
        'rooms' => (int)($row['rooms'] ?? 0),
        'payment' => $row['payment'] ?? 'both',
        'limitedOffer' => (int)($row['limited_offer'] ?? 0) === 1,
        'noCommission' => (int)($row['no_commission'] ?? 0) === 1,
        'progress' => min(100, max(0, (int)($row['progress'] ?? 0))),
        'deliveryDate' => $row['delivery_date'] ?? '',
        'modelsCount' => count($models),
        'pct' => $total ? (int)round($sold / $total * 100) : 0,
        'cover' => $mode === 'full' ? ($row['cover'] ?: '') : image_ref($row['cover'], $row['id'], 'cover', $ver),
    ];
    if ($mode === 'card') return $out;
    $out['models'] = $models;
    $out['summary'] = $row['summary'] ?? '';
    $out['videoUrl'] = $row['video_url'] ?? '';
    $out['paymentPlan'] = $row['payment_plan'] ?? '';
    if ($mode === 'full') {
        $out['gallery'] = $gallery;
        $out['videoPoster'] = $row['video_poster'] ?: '';
        $out['buildUpdates'] = $row['build_updates'] ?? '';
        return $out;
    }
    $out['gallery'] = [];
    foreach ($gallery as $i => $img) $out['gallery'][] = image_ref($img, $row['id'], 'g' . (int)$i, $ver);
    $out['videoPoster'] = image_ref($row['video_poster'] ?? '', $row['id'], 'vp', $ver);
    $out['buildUpdates'] = split_lines($row['build_updates'] ?? '');
    return $out;
}

function get_projects($pdo, $mode = 'full') {
    if ($mode === 'card') {
        /* البطاقات لا تحتاج المعرض إطلاقاً، ولا محتوى الغلاف — فقط إشارة أنه صورة مضمّنة.
           بهذا لا نسحب ميجابايتات من القاعدة ولا نرسلها في الرد. */
        $sql = 'SELECT id, name, dist, city, area, facade, type, price, total, sold, status, license, updated_at,'
            . ' category, stage, rooms, payment, old_price, limited_offer, no_commission, progress, delivery_date, models,'
            . " CASE WHEN cover LIKE 'data:%' THEN 'data:' ELSE COALESCE(cover, '') END AS cover,"
            . " '[]' AS gallery"
            . ' FROM projects ORDER BY sort_order ASC, id ASC';
        $rows = $pdo->query($sql)->fetchAll();
    } else {
        $rows = $pdo->query('SELECT * FROM projects ORDER BY sort_order ASC, id ASC')->fetchAll();
    }
    return array_map(function ($row) use ($mode) { return project_row($row, $mode); }, $rows);
}

function find_project($pdo, $id, $name) {
    $stmt = $id > 0 ? $pdo->prepare('SELECT * FROM projects WHERE id=? LIMIT 1') : $pdo->prepare('SELECT * FROM projects WHERE name=? LIMIT 1');
    $stmt->execute([$id > 0 ? $id : $name]);
    return $stmt->fetch();
}

/* يخدم صورة مشروع واحدة كملف ثنائي مع تخزين مؤقت طويل (الرابط يحمل بصمة التحديث) */
function send_project_image($pdo, $id, $key) {
    $stmt = $pdo->prepare('SELECT id, cover, gallery, video_poster FROM projects WHERE id=? LIMIT 1');
    $stmt->execute([(int)$id]);
    $row = $stmt->fetch();
    if (!$row) { http_response_code(404); header('Content-Type: text/plain; charset=utf-8'); exit; }

    $data = '';
    if ($key === 'cover') {
        $data = (string)$row['cover'];
    } elseif ($key === 'vp') {
        $data = (string)($row['video_poster'] ?? '');
    } elseif (preg_match('/^g(\d+)$/', $key, $m)) {
        $gallery = json_decode($row['gallery'] ?: '[]', true);
        if (is_array($gallery) && isset($gallery[(int)$m[1]])) $data = (string)$gallery[(int)$m[1]];
    }
    if ($data === '') { http_response_code(404); header('Content-Type: text/plain; charset=utf-8'); exit; }
    if (strncmp($data, 'data:', 5) !== 0) { header('Location: ' . $data, true, 302); exit; }
    if (!preg_match('#^data:([\w.+/-]+);base64,#', $data, $m)) { http_response_code(404); header('Content-Type: text/plain; charset=utf-8'); exit; }

    $bin = base64_decode(substr($data, strlen($m[0])), true);
    if ($bin === false) { http_response_code(404); header('Content-Type: text/plain; charset=utf-8'); exit; }

    $etag = '"' . md5($data) . '"';
    header('Content-Type: ' . $m[1]);
    header('Cache-Control: public, max-age=31536000, immutable');
    header('ETag: ' . $etag);
    if (trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
    header('Content-Length: ' . strlen($bin));
    echo $bin;
    exit;
}

/* رد JSON عام مع ETag: زيارة متكرّرة = 304 بدون إعادة تنزيل */
function respond_cached($data) {
    $body = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $etag = '"' . md5($body) . '"';
    header('Cache-Control: public, max-age=0, must-revalidate');
    header('ETag: ' . $etag);
    if (trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
    echo $body;
    exit;
}

function is_image_ref($value) {
    return strncmp((string)$value, '?action=img', 11) === 0;
}

/* حماية: لو أُرسل مرجع صورة (?action=img...) بدل الصورة نفسها نُبقي المخزَّن كما هو
   حتى لا يُمحى المحتوى الأصلي بالخطأ */
function keep_stored_images($pdo, $id, $cover, $gallery, $poster = '') {
    $needsCover = is_image_ref($cover);
    $needsPoster = is_image_ref($poster);
    $needsGallery = false;
    foreach ($gallery as $img) if (is_image_ref($img)) { $needsGallery = true; break; }
    if ($id <= 0 || (!$needsCover && !$needsGallery && !$needsPoster)) return [$cover, $gallery, $poster];

    $stmt = $pdo->prepare('SELECT cover, gallery, video_poster FROM projects WHERE id=? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) return [$cover, $gallery, $poster];

    $stored = json_decode($row['gallery'] ?: '[]', true);
    if (!is_array($stored)) $stored = [];
    if ($needsCover) $cover = (string)($row['cover'] ?? '');
    if ($needsPoster) $poster = (string)($row['video_poster'] ?? '');
    foreach ($gallery as $i => $img) {
        if (!is_image_ref($img)) continue;
        preg_match('/&k=g(\d+)/', $img, $m);
        $key = isset($m[1]) ? (int)$m[1] : $i;
        $gallery[$i] = isset($stored[$key]) ? (string)$stored[$key] : '';
    }
    return [$cover, array_values(array_filter($gallery, function ($v) { return $v !== ''; })), $poster];
}

function save_project($pdo, $project) {
    $name = trim($project['name'] ?? '');
    if ($name === '') respond(['ok' => false, 'error' => 'اسم المشروع مطلوب'], 422);
    $hasExtras = ensure_project_columns($pdo);
    $total = max(1, (int)($project['total'] ?? 1));
    $sold = min(max(0, (int)($project['sold'] ?? 0)), $total);
    $status = $project['status'] ?? 'new';
    if ($total - $sold <= 0) $status = 'done';
    $id = (int)($project['id'] ?? 0);
    $rawGallery = $project['gallery'] ?? [];
    if (!is_array($rawGallery)) $rawGallery = [];
    list($coverValue, $galleryValue, $posterValue) =
        keep_stored_images($pdo, $id, (string)($project['cover'] ?? ''), $rawGallery, (string)($project['videoPoster'] ?? ''));
    $gallery = json_encode($galleryValue, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $models = read_models($project['models'] ?? []);

    $columns = [
        'name' => $name,
        'dist' => $project['dist'] ?? '',
        'city' => $project['city'] ?? 'جدة',
        'area' => (int)($project['area'] ?? 0),
        'facade' => $project['facade'] ?? '',
        'type' => $project['type'] ?? '',
        'price' => (int)($project['price'] ?? 0),
        'total' => $total,
        'sold' => $sold,
        'status' => $status,
        'cover' => $coverValue,
        'gallery' => $gallery,
    ];
    if ($hasExtras) {
        $category = (string)($project['category'] ?? '');
        $stage = (string)($project['stage'] ?? '');
        $payment = (string)($project['payment'] ?? '');
        $columns['license'] = mb_substr(trim((string)($project['license'] ?? '')), 0, 120);
        $columns['category'] = in_array($category, ['residential', 'commercial', 'investment'], true) ? $category : 'residential';
        $columns['stage'] = in_array($stage, ['ready', 'under_construction', 'resale'], true) ? $stage : 'ready';
        $columns['rooms'] = max(0, (int)($project['rooms'] ?? 0));
        $columns['payment'] = in_array($payment, ['cash', 'bank', 'both'], true) ? $payment : 'both';
        $columns['old_price'] = max(0, (int)($project['oldPrice'] ?? 0));
        $columns['limited_offer'] = !empty($project['limitedOffer']) ? 1 : 0;
        $columns['no_commission'] = !empty($project['noCommission']) ? 1 : 0;
        $columns['progress'] = min(100, max(0, (int)($project['progress'] ?? 0)));
        $columns['delivery_date'] = mb_substr(trim((string)($project['deliveryDate'] ?? '')), 0, 80);
        $columns['payment_plan'] = mb_substr((string)($project['paymentPlan'] ?? ''), 0, 4000);
        $columns['build_updates'] = mb_substr((string)($project['buildUpdates'] ?? ''), 0, 4000);
        $columns['video_url'] = mb_substr(trim((string)($project['videoUrl'] ?? '')), 0, 600);
        $columns['video_poster'] = $posterValue;
        $columns['summary'] = mb_substr((string)($project['summary'] ?? ''), 0, 4000);
        $columns['models'] = json_encode($models, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    if ($id > 0) {
        $set = implode(', ', array_map(function ($c) { return $c . '=?'; }, array_keys($columns)));
        $stmt = $pdo->prepare('UPDATE projects SET ' . $set . ' WHERE id=?');
        $stmt->execute(array_merge(array_values($columns), [$id]));
        return $id;
    }
    $columns['sort_order'] = (int)$pdo->query('SELECT COALESCE(MAX(sort_order), -1) + 1 FROM projects')->fetchColumn();
    $names = array_keys($columns);
    $updatable = array_filter($names, function ($c) { return $c !== 'name' && $c !== 'sort_order'; });
    $stmt = $pdo->prepare('INSERT INTO projects (' . implode(', ', $names) . ') VALUES (' . implode(', ', array_fill(0, count($names), '?')) . ')'
        . ' ON DUPLICATE KEY UPDATE ' . implode(', ', array_map(function ($c) { return $c . '=VALUES(' . $c . ')'; }, $updatable)));
    $stmt->execute(array_values($columns));
    return (int)$pdo->lastInsertId();
}

/* ==========================================================================
   طلبات تسجيل الاهتمام (Leads)
   ========================================================================== */
function lead_labels() {
    return ['cash' => 'كاش', 'bank' => 'تمويل بنكي', 'undecided' => 'غير محدد', 'yes' => 'نعم', 'no' => 'لا'];
}

function lead_row($row) {
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'phone' => $row['phone'],
        'projectId' => (int)$row['project_id'],
        'projectName' => $row['project_name'],
        'propertyType' => $row['property_type'],
        'purchaseMethod' => $row['purchase_method'],
        'needsFinance' => $row['needs_finance'],
        'hasDefault' => $row['has_default'],
        'budget' => $row['budget'],
        'city' => $row['city'],
        'notes' => $row['notes'] ?? '',
        'details' => $row['details'] ?? '',
        'source' => $row['source'],
        'status' => $row['status'],
        'createdAt' => $row['created_at'],
    ];
}

function save_lead($pdo, $data) {
    $name = mb_substr(trim((string)($data['name'] ?? '')), 0, 190);
    $phone = mb_substr(trim((string)($data['phone'] ?? '')), 0, 60);
    if ($name === '' || $phone === '') respond(['ok' => false, 'error' => 'الاسم ورقم الجوال مطلوبان'], 422);
    $method = (string)($data['purchaseMethod'] ?? '');
    $finance = (string)($data['needsFinance'] ?? '');
    $default = (string)($data['hasDefault'] ?? '');
    $stmt = $pdo->prepare('INSERT INTO leads (name, phone, project_id, project_name, property_type, purchase_method,'
        . ' needs_finance, has_default, budget, city, notes, details, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $name,
        $phone,
        max(0, (int)($data['projectId'] ?? 0)),
        mb_substr(trim((string)($data['projectName'] ?? '')), 0, 190),
        mb_substr(trim((string)($data['propertyType'] ?? '')), 0, 80),
        in_array($method, ['cash', 'bank', 'undecided'], true) ? $method : 'undecided',
        in_array($finance, ['yes', 'no'], true) ? $finance : '',
        in_array($default, ['yes', 'no'], true) ? $default : '',
        mb_substr(trim((string)($data['budget'] ?? '')), 0, 80),
        mb_substr(trim((string)($data['city'] ?? '')), 0, 120),
        mb_substr((string)($data['notes'] ?? ''), 0, 2000),
        mb_substr((string)($data['details'] ?? ''), 0, 4000),
        mb_substr(trim((string)($data['source'] ?? '')), 0, 255),
    ]);
}

function list_leads($pdo) {
    return array_map('lead_row', $pdo->query('SELECT * FROM leads ORDER BY id DESC LIMIT 1000')->fetchAll());
}

function csv_cell($value) {
    return '"' . str_replace('"', '""', (string)$value) . '"';
}

/* تصدير إلى إكسل: BOM في المقدمة ليقرأ إكسل العربية بشكل صحيح */
function leads_csv($leads) {
    $labels = lead_labels();
    $head = ['المعرف', 'التاريخ', 'الاسم', 'الجوال', 'المشروع', 'نوع العقار', 'طريقة الشراء',
        'يحتاج تمويل', 'لديه تعثرات', 'الميزانية', 'المدينة', 'ملاحظات', 'وصف إضافي', 'مصدر العميل', 'الحالة'];
    $lines = [implode(',', array_map('csv_cell', $head))];
    foreach ($leads as $lead) {
        $lines[] = implode(',', array_map('csv_cell', [
            $lead['id'], $lead['createdAt'], $lead['name'], $lead['phone'], $lead['projectName'], $lead['propertyType'],
            $labels[$lead['purchaseMethod']] ?? $lead['purchaseMethod'],
            $labels[$lead['needsFinance']] ?? '',
            $labels[$lead['hasDefault']] ?? '',
            $lead['budget'], $lead['city'], $lead['notes'], $lead['details'], $lead['source'], $lead['status'],
        ]));
    }
    return "\xEF\xBB\xBF" . implode("\r\n", $lines);
}

function public_user($row) {
    return ['id' => (int)$row['id'], 'email' => $row['email'], 'name' => $row['name'] ?: '', 'role' => $row['role'], 'active' => (int)$row['active'] === 1];
}

function token_hash($token) { return hash('sha256', (string)$token); }

function login_user($pdo, $data) {
    $email = strtolower(trim($data['email'] ?? ''));
    $password = (string)($data['password'] ?? '');
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email=? AND active=1 LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user || !verify_password_pbkdf2($password, $user['password_hash'])) respond(['ok' => false, 'error' => 'بيانات الدخول غير صحيحة'], 401);
    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    $expires = date('Y-m-d H:i:s', time() + 60 * 60 * 12);
    $ins = $pdo->prepare('INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)');
    $ins->execute([token_hash($token), (int)$user['id'], $expires]);
    return ['token' => $token, 'user' => public_user($user)];
}

function current_user($pdo, $data) {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $token = $headers['X-Homera-Session'] ?? $headers['x-homera-session'] ?? ($data['sessionToken'] ?? '');
    if (!$token) return null;
    $stmt = $pdo->prepare('SELECT u.* FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > NOW() AND u.active=1 LIMIT 1');
    $stmt->execute([token_hash($token)]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function require_user($pdo, $data, $roles) {
    $user = current_user($pdo, $data);
    if (!$user || ($roles && !in_array($user['role'], $roles, true))) respond(['ok' => false, 'error' => 'ليست لديك صلاحية تنفيذ هذا الإجراء'], $user ? 403 : 401);
    return $user;
}

function list_users($pdo) {
    return array_map('public_user', $pdo->query('SELECT id, email, name, role, active FROM users ORDER BY id ASC')->fetchAll());
}

function create_user($pdo, $user) {
    $email = strtolower(trim($user['email'] ?? ''));
    $password = (string)($user['password'] ?? '');
    if (!$email || !$password) respond(['ok' => false, 'error' => 'البريد وكلمة المرور مطلوبة'], 422);
    $role = ($user['role'] ?? '') === 'admin' ? 'admin' : 'editor';
    $stmt = $pdo->prepare('INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)');
    $stmt->execute([$email, trim($user['name'] ?? ''), $role, hash_password_pbkdf2($password)]);
}

function change_password($pdo, $user, $data) {
    $new = (string)($data['newPassword'] ?? '');
    if (strlen($new) < 8) respond(['ok' => false, 'error' => 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'], 422);
    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id=? LIMIT 1');
    $stmt->execute([(int)$user['id']]);
    $hash = $stmt->fetchColumn();
    if (!$hash || !verify_password_pbkdf2((string)($data['currentPassword'] ?? ''), $hash)) respond(['ok' => false, 'error' => 'كلمة المرور الحالية غير صحيحة'], 422);
    $up = $pdo->prepare('UPDATE users SET password_hash=? WHERE id=?');
    $up->execute([hash_password_pbkdf2($new), (int)$user['id']]);
    $pdo->prepare('DELETE FROM user_sessions WHERE user_id=?')->execute([(int)$user['id']]);
}

try {
    $pdo = connect_db($config);
    ensure_project_columns($pdo);
    $action = $_GET['action'] ?? 'bootstrap';
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $data = [];
        if ($action === 'img') send_project_image($pdo, (int)($_GET['id'] ?? 0), (string)($_GET['k'] ?? 'cover'));
        if ($action === 'users') { require_user($pdo, $data, ['admin']); respond(['ok' => true, 'users' => list_users($pdo)]); }
        if ($action === 'leads') {
            require_user($pdo, $data, ['admin', 'editor']);
            $leads = list_leads($pdo);
            if (($_GET['format'] ?? '') === 'csv') {
                header('Content-Type: text/csv; charset=utf-8');
                header('Content-Disposition: attachment; filename="homera-leads.csv"');
                echo leads_csv($leads);
                exit;
            }
            respond(['ok' => true, 'leads' => $leads]);
        }
        if ($action === 'settings') respond(['ok' => true, 'settings' => get_settings($pdo)]);
        if ($action === 'project') {
            $row = find_project($pdo, (int)($_GET['id'] ?? 0), trim((string)($_GET['name'] ?? $_GET['id'] ?? '')));
            if (!$row) respond(['ok' => false, 'error' => 'المشروع غير موجود'], 404);
            respond_cached(['ok' => true, 'project' => project_row($row, 'detail')]);
        }
        if ($action === 'projects') {
            /* full=1 للوحة التحكم فقط (بيانات الصور الخام)، والعام يحصل على قائمة خفيفة */
            if (!empty($_GET['full'])) { require_user($pdo, $data, ['admin', 'editor']); respond(['ok' => true, 'projects' => get_projects($pdo, 'full')]); }
            respond_cached(['ok' => true, 'projects' => get_projects($pdo, 'card')]);
        }
        respond_cached(['ok' => true, 'settings' => get_settings($pdo), 'projects' => get_projects($pdo, 'card')]);
    }
    $data = input_json();
    if ($action === 'login') respond(['ok' => true] + login_user($pdo, $data));
    /* عام بلا جلسة — نموذج «سجّل اهتمامك» في الواجهة */
    if ($action === 'lead') { save_lead($pdo, $data['lead'] ?? []); respond(['ok' => true]); }
    if ($action === 'leadStatus') {
        require_user($pdo, $data, ['admin', 'editor']);
        $status = (string)($data['status'] ?? 'new');
        if (!in_array($status, ['new', 'contacted', 'closed'], true)) $status = 'new';
        $pdo->prepare('UPDATE leads SET status=? WHERE id=?')->execute([$status, (int)($data['id'] ?? 0)]);
        respond(['ok' => true, 'leads' => list_leads($pdo)]);
    }
    if ($action === 'user') { require_user($pdo, $data, ['admin']); create_user($pdo, $data['user'] ?? []); respond(['ok' => true, 'users' => list_users($pdo)]); }
    if ($action === 'password') { $user = require_user($pdo, $data, ['admin', 'editor']); change_password($pdo, $user, $data); respond(['ok' => true]); }
    if ($action === 'settings') {
        require_user($pdo, $data, ['admin', 'editor']);
        save_settings($pdo, $data['settings'] ?? []);
        respond(['ok' => true, 'settings' => get_settings($pdo)]);
    }
    if ($action === 'project') {
        require_user($pdo, $data, ['admin', 'editor']);
        save_project($pdo, $data['project'] ?? []);
        respond(['ok' => true, 'projects' => get_projects($pdo)]);
    }
    if ($action === 'sell') {
        require_user($pdo, $data, ['admin', 'editor']);
        $id = (int)($data['id'] ?? 0);
        $name = trim($data['name'] ?? '');
        $stmt = $id > 0 ? $pdo->prepare('SELECT * FROM projects WHERE id=?') : $pdo->prepare('SELECT * FROM projects WHERE name=?');
        $stmt->execute([$id > 0 ? $id : $name]);
        $row = $stmt->fetch();
        if (!$row) respond(['ok' => false, 'error' => 'المشروع غير موجود'], 404);
        $total = max(1, (int)$row['total']);
        $sold = min($total, (int)$row['sold'] + 1);
        $status = $sold >= $total ? 'done' : $row['status'];
        $up = $pdo->prepare('UPDATE projects SET sold=?, status=? WHERE id=?');
        $up->execute([$sold, $status, (int)$row['id']]);
        respond(['ok' => true, 'projects' => get_projects($pdo)]);
    }
    /* حذف مشروع نهائياً — للأدمن فقط، وطلبات الاهتمام تبقى محفوظة */
    if ($action === 'deleteProject') {
        require_user($pdo, $data, ['admin']);
        $id = (int)($data['id'] ?? 0);
        $name = trim((string)($data['name'] ?? ''));
        $stmt = $id > 0 ? $pdo->prepare('SELECT id FROM projects WHERE id=?') : $pdo->prepare('SELECT id FROM projects WHERE name=?');
        $stmt->execute([$id > 0 ? $id : $name]);
        $row = $stmt->fetch();
        if (!$row) respond(['ok' => false, 'error' => 'المشروع غير موجود'], 404);
        $pdo->prepare('DELETE FROM projects WHERE id=?')->execute([(int)$row['id']]);
        respond(['ok' => true, 'projects' => get_projects($pdo)]);
    }
    respond(['ok' => false, 'error' => 'إجراء غير معروف'], 400);
} catch (Throwable $e) {
    respond(['ok' => false, 'error' => $e->getMessage()], 500);
}
