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
    seed_projects($pdo);
    return $pdo;
}

function seed_projects($pdo) {
    $count = (int)$pdo->query('SELECT COUNT(*) FROM projects')->fetchColumn();
    if ($count > 0) return;
    $projects = [
        ['مشروع النعيم 120','حي النعيم','جدة',175,'جنوبية','شقق',750000,16,13,'sale','uploads/7.jpg'],
        ['مشروع الفضيلة 117','حي الفضيلة','جدة',200,'شمالية','فيلا',1100000,12,7,'sale','uploads/3.jpg'],
        ['مشروع الروضة 116','حي الروضة','جدة',165,'شرقية','شقق',690000,20,12,'sale','uploads/4.jpg'],
        ['مشروع أبحر 122','أبحر الشمالية','جدة',185,'غربية','شقق',820000,24,10,'sale',''],
        ['مشروع الصفا 121','حي الصفا','جدة',210,'شمالية','فيلا',1050000,10,10,'done',''],
        ['مشروع السلامة 118','حي السلامة','جدة',240,'غربية','فيلا',1250000,8,0,'new','uploads/6.jpg'],
    ];
    $stmt = $pdo->prepare('INSERT INTO projects (name, dist, city, area, facade, type, price, total, sold, status, cover, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    foreach ($projects as $i => $project) {
        $stmt->execute([$project[0], $project[1], $project[2], $project[3], $project[4], $project[5], $project[6], $project[7], $project[8], $project[9], $project[10], $i]);
    }
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

try {
    $pdo = migrate($config);
    $action = $_GET['action'] ?? 'bootstrap';
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'settings') respond(['ok' => true, 'settings' => get_settings($pdo)]);
        if ($action === 'projects') respond(['ok' => true, 'projects' => get_projects($pdo)]);
        respond(['ok' => true, 'settings' => get_settings($pdo), 'projects' => get_projects($pdo)]);
    }
    $data = input_json();
    if ($action === 'settings') {
        save_settings($pdo, $data['settings'] ?? []);
        respond(['ok' => true, 'settings' => get_settings($pdo)]);
    }
    if ($action === 'project') {
        save_project($pdo, $data['project'] ?? []);
        respond(['ok' => true, 'projects' => get_projects($pdo)]);
    }
    if ($action === 'sell') {
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
