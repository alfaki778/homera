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
        cover LONGTEXT NULL,
        gallery LONGTEXT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
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
    clean_projects_once($pdo);
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
        'heroEyebrow' => 'بيتك في جدة',
        'heroTitle' => 'حياة عنوانها الرقي والراحة',
        'heroText' => 'هوميرا شركة سعودية راسخة تتمتع بخبرة واسعة في مجالات التطوير العقاري والتسويق والاستثمار، تأسست على أسس قوية، وتقدّم حلولاً عقارية متكاملة تلبّي احتياجات السوق المحلي وتواكب تطلعات العملاء.',
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

function clean_projects_once($pdo) {
    $stmt = $pdo->prepare("SELECT name FROM settings WHERE name = 'projects_cleaned_20260715' LIMIT 1");
    $stmt->execute();
    if ($stmt->fetch()) return;
    $pdo->exec('DELETE FROM projects');
    $pdo->exec("INSERT INTO settings (name, payload) VALUES ('projects_cleaned_20260715', '{}') ON DUPLICATE KEY UPDATE payload = VALUES(payload)");
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

function project_row($row) {
    $total = max(1, (int)$row['total']);
    $sold = min(max(0, (int)$row['sold']), $total);
    $gallery = json_decode($row['gallery'] ?: '[]', true);
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'dist' => $row['dist'],
        'city' => $row['city'],
        'area' => (int)$row['area'],
        'facade' => $row['facade'],
        'type' => $row['type'],
        'price' => (int)$row['price'],
        'total' => $total,
        'sold' => $sold,
        'avail' => max(0, $total - $sold),
        'status' => $row['status'],
        'pct' => $total ? (int)round($sold / $total * 100) : 0,
        'cover' => $row['cover'] ?: '',
        'gallery' => is_array($gallery) ? $gallery : [],
    ];
}

function get_projects($pdo) {
    $rows = $pdo->query('SELECT * FROM projects ORDER BY sort_order ASC, id ASC')->fetchAll();
    return array_map('project_row', $rows);
}

function save_project($pdo, $project) {
    $name = trim($project['name'] ?? '');
    if ($name === '') respond(['ok' => false, 'error' => 'اسم المشروع مطلوب'], 422);
    $total = max(1, (int)($project['total'] ?? 1));
    $sold = min(max(0, (int)($project['sold'] ?? 0)), $total);
    $status = $project['status'] ?? 'new';
    if ($total - $sold <= 0) $status = 'done';
    $gallery = json_encode($project['gallery'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $id = (int)($project['id'] ?? 0);
    if ($id > 0) {
        $stmt = $pdo->prepare('UPDATE projects SET name=?, dist=?, city=?, area=?, facade=?, type=?, price=?, total=?, sold=?, status=?, cover=?, gallery=? WHERE id=?');
        $stmt->execute([$name, $project['dist'] ?? '', $project['city'] ?? 'جدة', (int)($project['area'] ?? 0), $project['facade'] ?? '', $project['type'] ?? '', (int)($project['price'] ?? 0), $total, $sold, $status, $project['cover'] ?? '', $gallery, $id]);
        return $id;
    }
    $nextOrder = (int)$pdo->query('SELECT COALESCE(MAX(sort_order), -1) + 1 FROM projects')->fetchColumn();
    $stmt = $pdo->prepare('INSERT INTO projects (name, dist, city, area, facade, type, price, total, sold, status, cover, gallery, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE dist=VALUES(dist), city=VALUES(city), area=VALUES(area), facade=VALUES(facade), type=VALUES(type), price=VALUES(price), total=VALUES(total), sold=VALUES(sold), status=VALUES(status), cover=VALUES(cover), gallery=VALUES(gallery)');
    $stmt->execute([$name, $project['dist'] ?? '', $project['city'] ?? 'جدة', (int)($project['area'] ?? 0), $project['facade'] ?? '', $project['type'] ?? '', (int)($project['price'] ?? 0), $total, $sold, $status, $project['cover'] ?? '', $gallery, $nextOrder]);
    return (int)$pdo->lastInsertId();
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
    $pdo = migrate($config);
    $action = $_GET['action'] ?? 'bootstrap';
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $data = [];
        if ($action === 'users') { require_user($pdo, $data, ['admin']); respond(['ok' => true, 'users' => list_users($pdo)]); }
        if ($action === 'settings') respond(['ok' => true, 'settings' => get_settings($pdo)]);
        if ($action === 'projects') respond(['ok' => true, 'projects' => get_projects($pdo)]);
        respond(['ok' => true, 'settings' => get_settings($pdo), 'projects' => get_projects($pdo)]);
    }
    $data = input_json();
    if ($action === 'login') respond(['ok' => true] + login_user($pdo, $data));
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
    respond(['ok' => false, 'error' => 'إجراء غير معروف'], 400);
} catch (Throwable $e) {
    respond(['ok' => false, 'error' => $e->getMessage()], 500);
}
