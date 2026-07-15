CREATE DATABASE IF NOT EXISTS homera CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE homera;

CREATE TABLE IF NOT EXISTS settings (
  name VARCHAR(64) PRIMARY KEY,
  payload LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  name VARCHAR(190) NOT NULL DEFAULT '',
  role ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  password_hash VARCHAR(255) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO settings (name, payload) VALUES
('site', '{"heroVariant":"centered","heroEyebrow":"بيتك في جدة","heroTitle":"حياة عنوانها الرقي والراحة","heroText":"هوميرا شركة سعودية راسخة تتمتع بخبرة واسعة في مجالات التطوير العقاري والتسويق والاستثمار، تأسست على أسس قوية، وتقدّم حلولاً عقارية متكاملة تلبّي احتياجات السوق المحلي وتواكب تطلعات العملاء.","fontFamily":"Alexandria","headingWeight":800,"accent":"gold","buttonShape":"rounded","cornerRadius":16,"logo":"","logoSize":46,"heroImage":"","aboutImage":"","aboutEyebrow":"من نحن","aboutTitle":"نبني الثقة قبل أن نبني العقار","aboutText":"هوميرا هي منصة عقارية متخصصة تربط العملاء بأفضل الفرص العقارية والاستثمارية، وتوفّر تجربة متكاملة لشراء وبيع وإعادة بيع العقارات، من خلال عرض المشاريع والوحدات السكنية، وتقديم الاستشارات العقارية، وربط العملاء بالحلول التمويلية المناسبة، لمساعدتهم على اتخاذ القرار الاستثماري الصحيح وإتمام الصفقات بكل احترافية.","aboutP1":"خبرة راسخة في التطوير والتسويق والاستثمار العقاري.","aboutP2":"حلول عقارية متكاملة تلبّي احتياجات السوق المحلي.","aboutP3":"التزام بالجودة والمواعيد وضمان على الإنشاءات.","contactEyebrow":"تواصل معنا","contactTitle":"لنبدأ رحلتك نحو منزلك","contactText":"تواصل مع فريق هوميرا مباشرةً - نجيب على استفساراتك ونساعدك في اختيار عقارك المناسب.","contactPhone":"+966 53 042 5505","contactAddress":"حي الفيصلية، جدة، السعودية","contactEmail":"info@homera.sa","stat1Num":"+12","stat1Label":"سنة خبرة","stat2Num":"+40","stat2Label":"مشروع منجز","stat3Num":"+1500","stat3Label":"عميل سعيد","stat4Num":"6","stat4Label":"مدن نخدمها","projFadilaImg":"","projRoudahImg":"","projSalamahImg":"","projNaeemImg":"","banners":[],"pgProjectsBanner":"","pgPFadila":"","pgPRoudah":"","pgPSalamah":"","pgPNaeem":"","pgPSafa":"","pgPAbhur":"","pgFadilaBanner":"","pgFadilaMain":"","pgFadilaT1":"","pgFadilaT2":"","pgFadilaT3":"","pgFadilaT4":"","pgFadilaMap":""}');

INSERT IGNORE INTO users (email, name, role, password_hash) VALUES
('sami@seem.sa', 'Sami', 'admin', 'pbkdf2$120000$homera-default-sami-2026$GU1pHC1QqgIzAld0BUppg6xOcQ/WV7rU+0PYAfCghnQ=');

DELETE FROM projects WHERE NOT EXISTS (SELECT 1 FROM settings WHERE name = 'projects_cleaned_20260715');
INSERT INTO settings (name, payload) VALUES ('projects_cleaned_20260715', '{}') ON DUPLICATE KEY UPDATE payload = VALUES(payload);
