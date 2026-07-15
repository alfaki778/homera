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

INSERT INTO projects (name, dist, city, area, facade, type, price, total, sold, status, cover, sort_order) VALUES
('مشروع النعيم 120','حي النعيم','جدة',175,'جنوبية','شقق',750000,16,13,'sale','uploads/7.jpg',0),
('مشروع الفضيلة 117','حي الفضيلة','جدة',200,'شمالية','فيلا',1100000,12,7,'sale','uploads/3.jpg',1),
('مشروع الروضة 116','حي الروضة','جدة',165,'شرقية','شقق',690000,20,12,'sale','uploads/4.jpg',2),
('مشروع أبحر 122','أبحر الشمالية','جدة',185,'غربية','شقق',820000,24,10,'sale','',3),
('مشروع الصفا 121','حي الصفا','جدة',210,'شمالية','فيلا',1050000,10,10,'done','',4),
('مشروع السلامة 118','حي السلامة','جدة',240,'غربية','فيلا',1250000,8,0,'new','uploads/6.jpg',5)
ON DUPLICATE KEY UPDATE name = VALUES(name);
