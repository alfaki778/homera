/* هوميرا — مكوّنات مشتركة، أيقونات، شعار */
const { useState, useEffect, useRef, createElement: h } = React;

/* ============ أيقونات SVG (stroke حقيقية) ============ */
function Icon({ name, size = 22, stroke = 'currentColor', sw = 1.7, fill = 'none', style }) {
  const P = { width: size, height: size, viewBox: '0 0 24 24', fill, stroke,
    strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  const paths = {
    bed: <g><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18h18"/><path d="M3 14h18"/><path d="M7 10V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></g>,
    building: <g><rect x="5" y="3" width="14" height="18" rx="1.2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/><path d="M10 21v-3h4v3"/></g>,
    tools: <g><path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8 7.2 20l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.3 2.3-2.1-.6-.6-2.1z"/></g>,
    search: <g><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></g>,
    pin: <g><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></g>,
    bell: <g><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10.5 19a1.5 1.5 0 0 0 3 0"/></g>,
    user: <g><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/></g>,
    star: <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z"/>,
    swap: <g><path d="M7 4 3 8l4 4"/><path d="M3 8h13a4 4 0 0 1 0 8h-1"/><path d="m17 20 4-4-4-4"/><path d="M21 16H8"/></g>,
    filter: <g><path d="M3 5h18"/><path d="M6 12h12"/><path d="M10 19h4"/></g>,
    arrowL: <g><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></g>,
    arrowR: <g><path d="M5 12h14"/><path d="m12 19 7-7-7-7"/></g>,
    check: <path d="M5 12.5 10 17l9-10"/>,
    checkCircle: <g><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></g>,
    heart: <path d="M12 20s-7-4.4-7-9.3A3.7 3.7 0 0 1 12 7.6 3.7 3.7 0 0 1 19 10.7c0 4.9-7 9.3-7 9.3z"/>,
    bath: <g><path d="M5 12V6a2 2 0 0 1 4 0"/><path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M7 19l-1 2M18 19l1 2"/></g>,
    ruler: <g><rect x="3" y="8" width="18" height="8" rx="1.5" transform="rotate(0)"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/></g>,
    door: <g><path d="M5 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M3 21h18"/><circle cx="14" cy="12" r=".8" fill="currentColor"/></g>,
    grid: <g><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/></g>,
    wallet: <g><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="17" cy="14" r="1.2" fill="currentColor"/></g>,
    cart: <g><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h8.4a1 1 0 0 0 1-.8L21 8H6"/></g>,
    users: <g><circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.7-4.7 6-4.7S15 16 15 19"/><path d="M16 5.2A3 3 0 0 1 16 11M21 19c0-2.3-1.3-3.8-3.3-4.4"/></g>,
    chart: <g><path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-7"/></g>,
    dash: <g><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="3" y="16" width="8" height="5" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/></g>,
    list: <g><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></g>,
    chat: <g><path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z"/></g>,
    headset: <g><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M20 19a4 4 0 0 1-4 3h-2"/></g>,
    store: <g><path d="M4 9 5.5 4h13L20 9"/><path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9 20v-5h6v5"/></g>,
    calendar: <g><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></g>,
    plus: <g><path d="M12 5v14M5 12h14"/></g>,
    money: <g><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5a2.5 2 0 0 1 5 0c0 2.5-5 1-5 4a2.5 2 0 0 0 5 0"/></g>,
    spark: <g><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></g>,
    snow: <g><path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/></g>,
    frame: <g><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 12h16M12 4v16"/></g>,
    hammer: <g><path d="m14 7 3-3 3 3-3 3z"/><path d="m15.5 8.5-9 9L4 19l-1-1 1.5-2.5 9-9"/></g>,
    wrench: <g><path d="M15 4a4 4 0 0 1 1.5 6.9L20 14.5 17.5 17 14 13.5A4 4 0 0 1 8.6 8L11 10l2-2-2.4-2.4A4 4 0 0 1 15 4z"/></g>,
    logout: <g><path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"/><path d="M19 12H9m10 0-3-3m3 3-3 3"/></g>,
    eye: <g><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></g>,
    dots: <g><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></g>,
    close: <g><path d="M6 6l12 12M18 6 6 18"/></g>,
    image: <g><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/></g>,
    send: <g><path d="M4 12 20 4l-6 16-3-7z"/><path d="M11 13 20 4"/></g>,
    map: <g><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></g>,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>,
    clock: <g><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>,
    trend: <g><path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/></g>,
  };
  return <svg {...P}>{paths[name] || null}</svg>;
}

/* ============ الشعار ============ */
function Logo({ size = 'md', mono = false, tagline = true }) {
  const scale = size === 'lg' ? 1.5 : size === 'sm' ? 0.78 : 1;
  const gold = mono ? '#fff' : 'url(#hg)';
  const wordColor = mono ? '#fff' : '#0E3340';
  const tagColor = mono ? 'rgba(255,255,255,.7)' : '#6E7C82';
  return (
    <div className="hm-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 * scale }}>
      <svg width={40 * scale} height={40 * scale} viewBox="0 0 40 40" aria-label="HOMERA">
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E0C99B"/>
            <stop offset="1" stopColor="#C7A36B"/>
          </linearGradient>
        </defs>
        <rect x="6" y="5" width="6.5" height="30" rx="3.25" fill={gold}/>
        <rect x="27.5" y="5" width="6.5" height="30" rx="3.25" fill={gold}/>
        <rect x="11" y="17" width="18" height="6" rx="3" fill={gold}/>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontWeight: 700, letterSpacing: '.14em', fontSize: 19 * scale, color: wordColor }}>HOMERA</span>
        {tagline && <span style={{ fontSize: 8.4 * scale, letterSpacing: '.05em', color: tagColor, marginTop: 4 * scale, direction: 'ltr' }}>Property · Hospitality · Facilities</span>}
      </div>
    </div>
  );
}

/* ============ تقييم بالنجوم ============ */
function Stars({ value, reviews }) {
  return (
    <div className="hm-stars" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon name="star" size={15} fill="#C7A36B" stroke="#C7A36B" sw={0}/>
      <b style={{ fontSize: 13, color: '#14202A' }}>{value.toFixed(1)}</b>
      {reviews != null && <span style={{ fontSize: 12, color: '#8A9499' }}>({reviews})</span>}
    </div>
  );
}

/* ============ خانة صورة (رفع ذاتي: نقر أو سحب وإفلات، يحفظ في المتصفّح) ============ */
function Slot({ id, ratio = '4 / 3', radius = 14, placeholder = 'أضف صورة', children, style }) {
  const key = 'homera-img-' + id;
  const [src, setSrc] = useState(() => { try { return localStorage.getItem(key) || ''; } catch (e) { return ''; } });
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target.result;
      const img = new Image();
      img.onload = () => {
        const max = 1100;
        let w = img.width, hgt = img.height;
        if (w > max) { hgt = Math.round(hgt * max / w); w = max; }
        const c = document.createElement('canvas');
        c.width = w; c.height = hgt;
        c.getContext('2d').drawImage(img, 0, 0, w, hgt);
        let data;
        try { data = c.toDataURL('image/jpeg', 0.82); } catch (err) { data = raw; }
        setSrc(data);
        try { localStorage.setItem(key, data); } catch (err) { /* تجاوز السعة */ }
      };
      img.onerror = () => { setSrc(raw); try { localStorage.setItem(key, raw); } catch (e) {} };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  };

  const pick = (e) => { e.stopPropagation(); if (inputRef.current) inputRef.current.click(); };
  const clear = (e) => { e.stopPropagation(); setSrc(''); try { localStorage.removeItem(key); } catch (err) {} };

  return (
    <div
      className={'hm-slot' + (over ? ' over' : '') + (src ? ' filled' : '')}
      onClick={pick}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setOver(false); handleFile(e.dataTransfer.files && e.dataTransfer.files[0]); }}
      style={{ position: 'relative', width: '100%', aspectRatio: ratio, borderRadius: radius, overflow: 'hidden', cursor: 'pointer',
        ...(src ? { backgroundImage: 'url(' + src + ')', backgroundSize: 'cover', backgroundPosition: 'center' } : {}), ...style }}>
      {!src && (
        <div className="hm-slot-empty">
          <Icon name="image" size={22} stroke="#A89B7F"/>
          {placeholder && <span>{placeholder}</span>}
          <small>اسحب صورة أو انقر</small>
        </div>
      )}
      {src && <span className="hm-slot-clear" role="button" onClick={clear} title="إزالة الصورة"><Icon name="close" size={13}/></span>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files && e.target.files[0])}/>
      {children}
    </div>
  );
}

/* ============ زر ============ */
function Btn({ kind = 'primary', size = 'md', icon, iconEnd, children, onClick, style, full }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', border: '1px solid transparent',
    borderRadius: 11, transition: 'all .16s ease', whiteSpace: 'nowrap',
    width: full ? '100%' : undefined,
    padding: size === 'sm' ? '7px 13px' : size === 'lg' ? '14px 26px' : '10px 18px',
    fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 14.5,
  };
  const kinds = {
    primary: { background: '#0E3340', color: '#fff' },
    gold: { background: '#C7A36B', color: '#22150A' },
    outline: { background: 'transparent', color: '#0E3340', borderColor: '#CDD6D8' },
    ghost: { background: 'rgba(14,51,64,.06)', color: '#0E3340' },
    soft: { background: '#fff', color: '#0E3340', borderColor: '#E6E0D2', boxShadow: '0 1px 2px rgba(20,32,42,.04)' },
  };
  return (
    <button className={'hm-btn hm-btn-' + kind} style={{ ...base, ...kinds[kind], ...style }} onClick={onClick}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18}/>}
      {children}
      {iconEnd && <Icon name={iconEnd} size={size === 'sm' ? 16 : 18}/>}
    </button>
  );
}

/* ============ شارة ============ */
function Tag({ children, tone = 'neutral', style }) {
  const tones = {
    neutral: { background: '#F1ECDF', color: '#6E5B3C' },
    gold: { background: 'rgba(199,163,107,.16)', color: '#9A7637' },
    petrol: { background: 'rgba(21,73,91,.1)', color: '#15495B' },
    ok: { background: 'rgba(31,138,91,.12)', color: '#1F8A5B' },
    warn: { background: 'rgba(214,151,30,.14)', color: '#B6781A' },
    bad: { background: 'rgba(199,74,62,.12)', color: '#C24A3E' },
    info: { background: 'rgba(21,73,91,.1)', color: '#15495B' },
  };
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, ...tones[tone], ...style }}>{children}</span>;
}

/* ============ حالة الطلب → لون ============ */
function statusTone(s) {
  return ({ 'مكتمل': 'ok', 'مغلق': 'ok', 'مؤكد': 'ok',
    'قيد التنفيذ': 'info', 'مفتوح': 'info', 'جديد': 'gold', 'منشور': 'ok',
    'بانتظار': 'warn', 'قيد المراجعة': 'warn', 'مخفي': 'neutral', 'ملغي': 'bad' })[s] || 'neutral';
}

/* ============ تذييل العلامة الرسمي ============ */
function Footer({ go }) {
  const D = window.HOMERA;
  return (
    <footer className="hm-footer">
      <div className="hm-footer-inner">
        <div className="hm-footer-brand">
          <Logo size="md" mono tagline={true}/>
          <p>منصة الوساطة الرقمية السعودية — نربط مزوّدي الإقامة والعقار والخدمات التشغيلية بالعميل النهائي، بثقة ووضوح.</p>
        </div>
        <div className="hm-footer-col">
          <span>القطاعات</span>
          {D.sectors.map(s => <button key={s.id} onClick={() => go('sector', { sector: s.id })}>{s.short}</button>)}
        </div>
        <div className="hm-footer-col">
          <span>المنصة</span>
          <button onClick={() => go('admin')}>لوحة التحكم</button>
          <button onClick={() => go('vendor')}>بوابة المزوّد</button>
          <button onClick={() => go('support')}>خدمة العملاء</button>
        </div>
      </div>
      <div className="hm-footer-bar">
        <div className="hm-footer-bar-inner">
          <span>© ٢٠٢٦ هوميرا · جميع الحقوق محفوظة</span>
          <span className="hm-footer-tag">Property · Hospitality · Facilities</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Icon, Logo, Stars, Slot, Btn, Tag, statusTone, Footer });
