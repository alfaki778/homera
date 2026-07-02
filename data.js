/* هوميرا — بيانات المنصة (وهمية واقعية) */
window.HOMERA = (function () {
  const sar = (n) => n.toLocaleString('en-US');

  const cities = ['الرياض', 'جدة', 'جازان', 'نجران', 'أبها', 'الدمام'];

  const sectors = [
    {
      id: 'rental',
      name: 'التأجير اليومي وقصير المدى',
      short: 'تأجير يومي',
      desc: 'شقق وغرف وشاليهات بالليلة — احجز إقامتك بسهولة',
      icon: 'bed',
      cta: 'احجز الآن',
      tint: '#15495B',
    },
    {
      id: 'sales',
      name: 'بيع العقارات',
      short: 'بيع عقارات',
      desc: 'شقق وفلل وعمائر وأراضٍ — بيع مباشر وموثّق',
      icon: 'building',
      cta: 'اطلب معاينة',
      tint: '#0E3340',
    },
    {
      id: 'services',
      name: 'الخدمات التشغيلية',
      short: 'خدمات تشغيلية',
      desc: 'نظافة وتكييف وألمنيوم ومقاولات — مزوّدون موثوقون',
      icon: 'tools',
      cta: 'اطلب الخدمة',
      tint: '#C7A36B',
    },
  ];

  const rentals = [
    { id: 'r1', slot: 'r1', title: 'شقة فاخرة بإطلالة على الكورنيش', city: 'جازان', area: 'الكورنيش الشمالي', rating: 4.8, reviews: 126, price: 320, beds: 2, guests: 4, tags: ['إطلالة بحرية', 'واي فاي', 'موقف خاص'] },
    { id: 'r2', slot: 'r2', title: 'شاليه خاص مع مسبح وجلسة خارجية', city: 'أبها', area: 'السودة', rating: 4.9, reviews: 88, price: 850, beds: 3, guests: 8, tags: ['مسبح خاص', 'شواء', 'إطلالة جبلية'] },
    { id: 'r3', slot: 'r3', title: 'استوديو عصري في قلب العليا', city: 'الرياض', area: 'العليا', rating: 4.6, reviews: 204, price: 240, beds: 1, guests: 2, tags: ['وسط المدينة', 'مطبخ مجهّز'] },
    { id: 'r4', slot: 'r4', title: 'غرفة فندقية مطلّة على البحر الأحمر', city: 'جدة', area: 'الحمراء', rating: 4.7, reviews: 152, price: 410, beds: 1, guests: 2, tags: ['فطور مشمول', 'جيم', 'مسبح'] },
    { id: 'r5', slot: 'r5', title: 'شقة عائلية واسعة قرب الخدمات', city: 'نجران', area: 'حي الفهد', rating: 4.5, reviews: 64, price: 280, beds: 3, guests: 6, tags: ['عائلي', 'موقفان', 'مدخل خاص'] },
    { id: 'r6', slot: 'r6', title: 'دور كامل مفروش بتشطيب راقٍ', city: 'الرياض', area: 'الملقا', rating: 4.8, reviews: 97, price: 520, beds: 4, guests: 8, tags: ['دور كامل', 'تكييف مركزي', 'حديقة'] },
  ];

  const properties = [
    { id: 'p1', slot: 'p1', title: 'فيلا دوبلكس مع حديقة وملحق', city: 'الرياض', area: 'حطين', price: 2450000, size: 420, rooms: 6, type: 'فيلا', badge: 'مميّز' },
    { id: 'p2', slot: 'p2', title: 'شقة تمليك بإطلالة على الواجهة', city: 'جدة', area: 'الشاطئ', price: 980000, size: 180, rooms: 3, type: 'شقة' },
    { id: 'p3', slot: 'p3', title: 'أرض سكنية على شارعين', city: 'جازان', area: 'الروضة', price: 1200000, size: 600, rooms: 0, type: 'أرض' },
    { id: 'p4', slot: 'p4', title: 'عمارة استثمارية مؤجّرة بالكامل', city: 'الدمام', area: 'الفيصلية', price: 5800000, size: 720, rooms: 12, type: 'عمارة', badge: 'دخل سنوي 8%' },
    { id: 'p5', slot: 'p5', title: 'فيلا مودرن جديدة لم تُسكن', city: 'أبها', area: 'الموظفين', price: 1750000, size: 350, rooms: 5, type: 'فيلا' },
    { id: 'p6', slot: 'p6', title: 'شقة اقتصادية جاهزة للسكن', city: 'نجران', area: 'الفيصلية', price: 540000, size: 140, rooms: 3, type: 'شقة' },
  ];

  const providers = [
    { id: 's1', slot: 's1', name: 'بريق للنظافة والتعقيم', cat: 'نظافة عامة', city: 'الرياض', rating: 4.9, jobs: 1240, from: 250, quote: false, icon: 'spark' },
    { id: 's2', slot: 's2', name: 'التكييف المثالي', cat: 'صيانة وتركيب مكيفات', city: 'جدة', rating: 4.7, jobs: 860, from: 180, quote: false, icon: 'snow' },
    { id: 's3', slot: 's3', name: 'ألمنيوم الخليج', cat: 'تفصيل وتركيب ألمنيوم', city: 'الدمام', rating: 4.6, jobs: 410, from: 0, quote: true, icon: 'frame' },
    { id: 's4', slot: 's4', name: 'مقاولات البنيان', cat: 'ترميم ومقاولات عامة', city: 'جازان', rating: 4.8, jobs: 320, from: 0, quote: true, icon: 'hammer' },
    { id: 's5', slot: 's5', name: 'نظافة المنازل برو', cat: 'تنظيف عميق', city: 'أبها', rating: 4.7, jobs: 590, from: 320, quote: false, icon: 'spark' },
    { id: 's6', slot: 's6', name: 'صيانة المنزل الذكي', cat: 'سباكة وكهرباء', city: 'نجران', rating: 4.5, jobs: 275, from: 150, quote: false, icon: 'wrench' },
  ];

  // ——— لوحة الأدمن
  const kpis = [
    { id: 'rev', label: 'إيرادات الشهر', value: '٤٨٢٬٦٠٠', unit: 'ر.س', delta: +12.4, icon: 'wallet' },
    { id: 'orders', label: 'طلبات اليوم', value: '٣١٤', unit: 'طلب', delta: +6.1, icon: 'cart' },
    { id: 'vendors', label: 'مزوّدون نشطون', value: '١٬٠٨٢', unit: 'مزوّد', delta: +3.7, icon: 'users' },
    { id: 'rate', label: 'نسبة الإنجاز', value: '٩٤٫٢٪', unit: '', delta: +1.5, icon: 'check' },
  ];

  // إيرادات شهرية حسب القطاع (بالألف ر.س) — لرسم بياني SVG
  const revenueSeries = {
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    rental: [120, 138, 152, 168, 175, 190],
    sales: [80, 96, 88, 130, 142, 168],
    services: [60, 72, 84, 96, 110, 124],
  };

  const recentOrders = [
    { id: '#HM-90412', customer: 'سارة الزهراني', sector: 'تأجير يومي', item: 'شقة — الكورنيش، جازان', amount: 960, status: 'مكتمل' },
    { id: '#HM-90411', customer: 'فيصل القحطاني', sector: 'خدمات', item: 'تنظيف عميق — الرياض', amount: 320, status: 'قيد التنفيذ' },
    { id: '#HM-90410', customer: 'نورة العتيبي', sector: 'بيع عقارات', item: 'معاينة فيلا — حطين', amount: 0, status: 'بانتظار' },
    { id: '#HM-90409', customer: 'عبدالله الشهري', sector: 'تأجير يومي', item: 'شاليه — السودة، أبها', amount: 1700, status: 'مكتمل' },
    { id: '#HM-90408', customer: 'ريم الدوسري', sector: 'خدمات', item: 'صيانة مكيف — جدة', amount: 180, status: 'ملغي' },
    { id: '#HM-90407', customer: 'ماجد الغامدي', sector: 'بيع عقارات', item: 'حجز أرض — جازان', amount: 0, status: 'قيد التنفيذ' },
  ];

  const alerts = [
    { id: 'a1', kind: 'warn', text: 'مزوّد «ألمنيوم الخليج» لم يردّ على ٣ طلبات خلال ٢٤ ساعة', time: 'قبل ١٢ دقيقة' },
    { id: 'a2', kind: 'info', text: 'ارتفاع الطلب على التأجير اليومي في جازان بنسبة ٢٢٪', time: 'قبل ساعة' },
    { id: 'a3', kind: 'ok', text: 'تمت تسوية ٤٨ مدفوعة للمزوّدين بنجاح', time: 'قبل ٣ ساعات' },
  ];

  // ——— الدعم
  const tickets = [
    { id: 't1', name: 'سارة الزهراني', sector: 'تأجير يومي', last: 'هل يمكن تعديل موعد الوصول؟', time: '٩:٤٢', unread: 2, status: 'مفتوح', order: '#HM-90412', orderState: 'مكتمل' },
    { id: 't2', name: 'فيصل القحطاني', sector: 'خدمات', last: 'فريق النظافة تأخّر نصف ساعة', time: '٩:١٥', unread: 0, status: 'مفتوح', order: '#HM-90411', orderState: 'قيد التنفيذ' },
    { id: 't3', name: 'نورة العتيبي', sector: 'بيع عقارات', last: 'متى يتم تأكيد موعد المعاينة؟', time: 'أمس', unread: 1, status: 'بانتظار', order: '#HM-90410', orderState: 'بانتظار' },
    { id: 't4', name: 'عبدالله الشهري', sector: 'تأجير يومي', last: 'شكراً، الإقامة كانت ممتازة 👏', time: 'أمس', unread: 0, status: 'مغلق', order: '#HM-90409', orderState: 'مكتمل' },
  ];

  const chat = [
    { from: 'them', text: 'السلام عليكم، حجزت شقة على الكورنيش لكن أحتاج تعديل موعد الوصول من ٤ عصراً إلى ٧ مساءً.', time: '٩:٣٨' },
    { from: 'me', text: 'وعليكم السلام أستاذة سارة، أهلاً بك في دعم هوميرا. تفضّلي، سأتحقق من إمكانية التعديل مع المضيف حالاً.', time: '٩:٣٩' },
    { from: 'them', text: 'تمام، بانتظارك 🙏', time: '٩:٤٠' },
    { from: 'me', text: 'تم التواصل مع المضيف ووافق على الوصول ٧ مساءً دون رسوم إضافية. حدّثت الحجز #HM-90412 ✅', time: '٩:٤٢' },
  ];

  const quickReplies = [
    'أهلاً بك في دعم هوميرا 👋 كيف أقدر أساعدك؟',
    'تم تحديث طلبك بنجاح ✅',
    'سأحوّلك للقسم المختص خلال لحظات.',
    'نعتذر عن الإزعاج، سنعالج الأمر فوراً.',
  ];

  // ——— بوابة المزوّد
  const vendorListings = [
    { id: 'v1', slot: 'r1', title: 'شقة فاخرة بإطلالة على الكورنيش', kind: 'وحدة تأجير', city: 'جازان', price: '٣٢٠ ر.س / ليلة', state: 'منشور', bookings: 18 },
    { id: 'v2', slot: 'r3', title: 'استوديو عصري في العليا', kind: 'وحدة تأجير', city: 'الرياض', price: '٢٤٠ ر.س / ليلة', state: 'منشور', bookings: 31 },
    { id: 'v3', slot: 'p2', title: 'شقة تمليك بإطلالة على الواجهة', kind: 'عقار للبيع', city: 'جدة', price: '٩٨٠٬٠٠٠ ر.س', state: 'قيد المراجعة', bookings: 0 },
    { id: 'v4', slot: 's1', title: 'باقة تنظيف عميق للمنازل', kind: 'خدمة', city: 'الرياض', price: 'من ٣٢٠ ر.س', state: 'منشور', bookings: 54 },
    { id: 'v5', slot: 'r5', title: 'شقة عائلية واسعة', kind: 'وحدة تأجير', city: 'نجران', price: '٢٨٠ ر.س / ليلة', state: 'مخفي', bookings: 9 },
  ];

  const vendorOrders = [
    { id: '#HM-90412', customer: 'سارة الزهراني', item: 'شقة الكورنيش — ٣ ليالٍ', amount: 960, status: 'جديد' },
    { id: '#HM-90388', customer: 'خالد المالكي', item: 'استوديو العليا — ليلتان', amount: 480, status: 'مؤكد' },
    { id: '#HM-90376', customer: 'هند السبيعي', item: 'تنظيف عميق — فيلا', amount: 540, status: 'مكتمل' },
  ];

  const vendorEarnings = {
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    values: [8.2, 9.6, 11.1, 10.4, 12.8, 14.2], // بالألف
    total: '٦٦٬٣٠٠',
    pending: '٤٬٨٠٠',
    payout: '١٤٬٢٠٠',
  };

  // ——— بيانات إضافية للوحات الاحترافية
  // حصة القطاعات من الإيراد
  const sectorShare = [
    { key: 'rental', label: 'التأجير اليومي', value: 44, color: '#0E3340' },
    { key: 'sales', label: 'بيع العقارات', value: 33, color: '#15495B' },
    { key: 'services', label: 'الخدمات التشغيلية', value: 23, color: '#C7A36B' },
  ];

  // أعلى المدن أداءً (بالألف ر.س)
  const topCities = [
    { city: 'الرياض', value: 168 },
    { city: 'جدة', value: 132 },
    { city: 'جازان', value: 96 },
    { city: 'أبها', value: 64 },
    { city: 'الدمام', value: 58 },
    { city: 'نجران', value: 34 },
  ];

  // لوحة شرف المزوّدين
  const topVendors = [
    { name: 'بريق للنظافة والتعقيم', sector: 'خدمات', revenue: 86, rating: 4.9, jobs: 1240 },
    { name: 'منتجعات السودة', sector: 'تأجير', revenue: 72, rating: 4.9, jobs: 410 },
    { name: 'عقارات الواجهة', sector: 'عقارات', revenue: 68, rating: 4.7, jobs: 92 },
    { name: 'التكييف المثالي', sector: 'خدمات', revenue: 54, rating: 4.7, jobs: 860 },
    { name: 'دور الملقا المفروشة', sector: 'تأجير', revenue: 47, rating: 4.8, jobs: 320 },
  ];

  // مسار التحويل
  const funnel = [
    { label: 'زيارات المنصة', value: 48200, pct: 100 },
    { label: 'بحث عن خدمة', value: 31400, pct: 65 },
    { label: 'عرض التفاصيل', value: 18900, pct: 39 },
    { label: 'بدء الطلب', value: 7600, pct: 16 },
    { label: 'إتمام العملية', value: 4820, pct: 10 },
  ];

  // مؤشرات الدعم
  const supportMeta = {
    open: 12, firstResp: '١.٤ د', csat: '٩٦٪', sla: '٩٨٪', resolvedToday: 84,
  };
  // بيانات إضافية للتذاكر (حسب id)
  const ticketExtra = {
    t1: { priority: 'عالية', sla: 'متبقٍ ٨ د', sentiment: 'محايد', csat: 4.8, ltv: '١٢٬٤٠٠', tier: 'ذهبي' },
    t2: { priority: 'متوسطة', sla: 'متبقٍ ٢٢ د', sentiment: 'منزعج', csat: 4.5, ltv: '٦٬٢٠٠', tier: 'فضّي' },
    t3: { priority: 'عادية', sla: 'متبقٍ ١.٢ س', sentiment: 'إيجابي', csat: 4.9, ltv: '٢١٬٨٠٠', tier: 'بلاتيني' },
    t4: { priority: 'منخفضة', sla: 'مغلق', sentiment: 'سعيد', csat: 5.0, ltv: '٩٬١٠٠', tier: 'ذهبي' },
  };

  // ملف المزوّد المهني
  const vendorProfile = {
    name: 'شركة بريق للنظافة والتعقيم', tier: 'شريك ذهبي', rating: 4.9, reviews: 1240,
    responseRate: 98, acceptance: 94, since: 'عضو منذ ٢٠٢٣', city: 'الرياض',
  };
  // بطاقة الأداء
  const vendorScore = [
    { label: 'معدّل الإشغال', value: 87, suffix: '٪', tone: 'ok' },
    { label: 'متوسط التقييم', value: 98, display: '٤.٩', tone: 'gold' },
    { label: 'سرعة الاستجابة', value: 98, suffix: '٪', tone: 'ok' },
    { label: 'نسبة الإلغاء', value: 12, suffix: '٪', tone: 'warn', invert: true },
  ];
  // جدول التسويات
  const payouts = [
    { date: '١٥ يونيو ٢٠٢٦', amount: 14200, status: 'مجدولة' },
    { date: '١ يونيو ٢٠٢٦', amount: 12800, status: 'مدفوعة' },
    { date: '١٥ مايو ٢٠٢٦', amount: 11400, status: 'مدفوعة' },
  ];
  // تقييمات العملاء
  const vendorReviews = [
    { name: 'سارة الزهراني', rating: 5, text: 'فريق محترف ودقيق في المواعيد، النتيجة فاقت التوقعات.', when: 'قبل يومين' },
    { name: 'خالد المالكي', rating: 5, text: 'تعامل راقٍ وخدمة ممتازة، أنصح بهم بشدة.', when: 'قبل ٥ أيام' },
    { name: 'هند السبيعي', rating: 4, text: 'خدمة جيدة جداً، مع تحسّن بسيط مطلوب في سرعة الوصول.', when: 'قبل أسبوع' },
  ];

  return {
    sar, cities, sectors, rentals, properties, providers,
    kpis, revenueSeries, recentOrders, alerts,
    tickets, chat, quickReplies,
    vendorListings, vendorOrders, vendorEarnings,
    sectorShare, topCities, topVendors, funnel,
    supportMeta, ticketExtra,
    vendorProfile, vendorScore, payouts, vendorReviews,
  };
})();
