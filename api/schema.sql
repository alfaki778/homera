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

INSERT IGNORE INTO settings (name, payload) VALUES
('site', '{"heroVariant":"centered","heroEyebrow":"بيتك في جدة","heroTitle":"حياة عنوانها الرقي والراحة","heroText":"هوميرا شركة سعودية راسخة تتمتع بخبرة واسعة في مجالات التطوير العقاري والتسويق والاستثمار، تأسست على أسس قوية، وتقدّم حلولاً عقارية متكاملة تلبّي احتياجات السوق المحلي وتواكب تطلعات العملاء.","fontFamily":"Alexandria","headingWeight":800,"accent":"gold","buttonShape":"rounded","cornerRadius":16,"logo":"","logoSize":46,"heroImage":"","aboutImage":"","aboutEyebrow":"من نحن","aboutTitle":"نبني الثقة قبل أن نبني العقار","aboutText":"هوميرا هي منصة عقارية متخصصة تربط العملاء بأفضل الفرص العقارية والاستثمارية، وتوفّر تجربة متكاملة لشراء وبيع وإعادة بيع العقارات، من خلال عرض المشاريع والوحدات السكنية، وتقديم الاستشارات العقارية، وربط العملاء بالحلول التمويلية المناسبة، لمساعدتهم على اتخاذ القرار الاستثماري الصحيح وإتمام الصفقات بكل احترافية.","aboutP1":"خبرة راسخة في التطوير والتسويق والاستثمار العقاري.","aboutP2":"حلول عقارية متكاملة تلبّي احتياجات السوق المحلي.","aboutP3":"التزام بالجودة والمواعيد وضمان على الإنشاءات.","contactEyebrow":"تواصل معنا","contactTitle":"لنبدأ رحلتك نحو منزلك","contactText":"تواصل مع فريق هوميرا مباشرةً - نجيب على استفساراتك ونساعدك في اختيار عقارك المناسب.","contactPhone":"+966 53 042 5505","contactAddress":"حي الفيصلية، جدة، السعودية","contactEmail":"info@homera.sa","stat1Num":"+12","stat1Label":"سنة خبرة","stat2Num":"+40","stat2Label":"مشروع منجز","stat3Num":"+1500","stat3Label":"عميل سعيد","stat4Num":"6","stat4Label":"مدن نخدمها","projFadilaImg":"","projRoudahImg":"","projSalamahImg":"","projNaeemImg":"","banners":[],"pgProjectsBanner":"","pgPFadila":"","pgPRoudah":"","pgPSalamah":"","pgPNaeem":"","pgPSafa":"","pgPAbhur":"","pgFadilaBanner":"","pgFadilaMain":"","pgFadilaT1":"","pgFadilaT2":"","pgFadilaT3":"","pgFadilaT4":"","pgFadilaMap":""}');

INSERT INTO projects (name, dist, city, area, facade, type, price, total, sold, status, cover, sort_order) VALUES
('مشروع النعيم 120','حي النعيم','جدة',175,'جنوبية','شقق',750000,16,13,'sale','uploads/7.jpg',0),
('مشروع الفضيلة 117','حي الفضيلة','جدة',200,'شمالية','فيلا',1100000,12,7,'sale','uploads/3.jpg',1),
('مشروع الروضة 116','حي الروضة','جدة',165,'شرقية','شقق',690000,20,12,'sale','uploads/4.jpg',2),
('مشروع أبحر 122','أبحر الشمالية','جدة',185,'غربية','شقق',820000,24,10,'sale','',3),
('مشروع الصفا 121','حي الصفا','جدة',210,'شمالية','فيلا',1050000,10,10,'done','',4),
('مشروع السلامة 118','حي السلامة','جدة',240,'غربية','فيلا',1250000,8,0,'new','uploads/6.jpg',5)
ON DUPLICATE KEY UPDATE name = VALUES(name);
