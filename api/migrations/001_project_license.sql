-- ترقية: إضافة عمود «الترخيص» لجدول المشاريع
-- تُطبَّق تلقائياً عند أول طلب على API بعد الرفع، وهذا الملف احتياطي
-- لتشغيله يدوياً من phpMyAdmin على هوستنجر إن لزم. آمن للتكرار.

SET @has_license := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'license');
SET @add_license := IF(@has_license = 0,
  "ALTER TABLE projects ADD COLUMN license VARCHAR(120) NOT NULL DEFAULT '' AFTER status",
  'SELECT 1');
PREPARE add_license_stmt FROM @add_license;
EXECUTE add_license_stmt;
DEALLOCATE PREPARE add_license_stmt;
