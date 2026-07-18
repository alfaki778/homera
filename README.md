<div dir="rtl">

# هوميرا · Homera

منصة **التطوير والتسويق العقاري** — نموذج أولي (Prototype) لواجهات موقع هوميرا ولوحة التحكم، مبني كموقع ثابت يعتمد React عبر CDN مع Babel Standalone، مع خادم Node.js/Express لربط الواجهة بقاعدة MySQL وتشغيله على Hostinger Web Apps.

## المحتوى

### الصفحات (HTML)
- `هوميرا - الرئيسية.html` — الصفحة الرئيسية (الهيرو + الأقسام).
- `هوميرا - المشاريع.html` — قائمة المشاريع.
- `project-detail.html` — صفحة تفاصيل مشروع ديناميكية تعتمد على بيانات قاعدة البيانات.
- `index.html` — نسخة الجذر من الصفحة الرئيسية (للنشر).
- `hom555.html` — لوحة التحكم (صفحة غير مرتبطة، محميّة بتسجيل دخول بريد + كلمة مرور).
- `هوية هوميرا.html` — الهوية البصرية.

### الأنماط (CSS)
- `homera-site.css` — أنماط الموقع العام.
- `dash.css` — أنماط لوحة التحكم.
- `styles.css` — أنماط عامة إضافية.

### السكربتات والمكوّنات
- `app.jsx`, `ui.jsx`, `data.js` — التطبيق الرئيسي والمكوّنات والبيانات.
- `screens-*.jsx` — الشاشات (hub / sector / admin / support / vendor).
- `backoffice-ui.jsx` — واجهة الإدارة الخلفية.
- `image-slot.js` — عنصر `<image-slot>` لإدارة مواضع الصور.
- `homera-tweaks.js` / `homera-tweaks-app.jsx` — لوحة التعديلات المباشرة للموقع.
- `dash-tweaks.js` / `dash-tweaks-app.jsx` — لوحة التعديلات للوحة التحكم.
- `tweaks-panel.jsx` — واجهة لوحة التعديلات.

### الأصول
- `screenshots/` — لقطات شاشة للواجهات.
- `uploads/` — الصور المرفوعة المستخدمة في الواجهات.
- `homera_arch_ar.png`, `معمارية هوميرا.png`, `arch_check.png` — مخططات المعمارية.

## التشغيل محليًا

### تشغيل Node.js الموصى به

```bash
npm install
npm run db:init # مرة واحدة فقط عند تجهيز قاعدة جديدة أو تغيير المخطط
npm start
# ثم افتح:
# http://localhost:3000/
```

متغيرات قاعدة البيانات:

```bash
HOMERA_DB_HOST=127.0.0.1
HOMERA_DB_PORT=3306
HOMERA_DB_NAME=homera
HOMERA_DB_USER=root
HOMERA_DB_PASS=
```

على Hostinger Web Apps اجعل أمر التشغيل:

```bash
npm start
```

وأضف متغيرات قاعدة البيانات من لوحة Web Apps أو Environment Variables بنفس أسماء `.env.example`.

تهيئة قاعدة البيانات لا تعمل تلقائيًا مع `npm start` حتى لا تُنفّذ استعلامات MySQL مع كل deploy. شغّلها يدويًا فقط عند تجهيز قاعدة جديدة أو تعديل المخطط:

```bash
npm run db:init
```

وهذا ينشئ قاعدة البيانات إن كانت صلاحيات المستخدم تسمح، ثم ينشئ الجداول والإعدادات الأساسية عند الحاجة.

### تشغيل ثابت فقط

المشروع يعتمد React/Babel عبر CDN، لذا يمكن تشغيل خادم محلي بسيط للواجهة فقط، لكن API وقاعدة البيانات لن يعملا بهذا الوضع:

</div>

```bash
# من داخل مجلد المشروع
python3 -m http.server 8000
# ثم افتح في المتصفح:
# http://localhost:8000/
```

عند التشغيل عبر Node أو Apache أو Vercel تُستخدم روابط نظيفة مثل `/projects` و`/fadilah-117` بدلاً من إظهار أسماء ملفات `.html`.

<div dir="rtl">

> ملاحظة: الصفحات تحمّل React و ReactDOM و Babel من `unpkg.com`، لذا يلزم اتصال بالإنترنت عند أول تشغيل.

</div>
