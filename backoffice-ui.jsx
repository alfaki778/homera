/* هوميرا — هيكل اللوحات الخلفية + أدوات الرسوم البيانية (SVG) */

/* ====== هيكل احترافي بشريط جانبي وترويسة ====== */
function BackShell({ active, go, title, subtitle, crumb, children, actions }) {
  const nav = [
    { grp: 'إدارة المنصة', items: [{ id: 'admin', label: 'لوحة التحكم', icon: 'dash' }] },
    { grp: 'العمليات', items: [
      { id: 'support', label: 'خدمة العملاء', icon: 'headset' },
      { id: 'vendor', label: 'بوابة المزوّد', icon: 'store' },
    ] },
  ];
  return (
    <div className="hm-back">
      <aside className="hm-side">
        <div className="hm-side-logo"><Logo size="sm" mono tagline={true}/></div>
        <nav className="hm-side-nav">
          {nav.map(g => (
            <React.Fragment key={g.grp}>
              <span className="hm-side-label">{g.grp}</span>
              {g.items.map(n => (
                <button key={n.id} className={'hm-side-item' + (n.id === active ? ' on' : '')} onClick={() => go(n.id)}>
                  <Icon name={n.icon} size={20}/> <span>{n.label}</span>
                </button>
              ))}
            </React.Fragment>
          ))}
          <span className="hm-side-label">عام</span>
          <button className="hm-side-item" onClick={() => go('hub')}><Icon name="grid" size={20}/> <span>واجهة العميل</span></button>
        </nav>
        <div className="hm-side-profile">
          <div className="hm-side-av">HM</div>
          <div className="hm-side-prof-info"><b>إدارة هوميرا</b><span>مدير العمليات</span></div>
          <button className="hm-side-logout" onClick={() => go('hub')} title="خروج"><Icon name="logout" size={17}/></button>
        </div>
      </aside>
      <div className="hm-back-main">
        <header className="hm-back-head">
          <div className="hm-head-titles">
            <div className="hm-crumb">هوميرا <Icon name="arrowL" size={12}/> {crumb || title}</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="hm-head-tools">
            <label className="hm-head-search"><Icon name="search" size={17} stroke="#8A9499"/><input placeholder="بحث سريع…"/></label>
            {actions}
            <button className="hm-icon-btn" title="الإشعارات"><Icon name="bell" size={19}/><span className="hm-dot"></span></button>
          </div>
        </header>
        <div className="hm-back-body">{children}</div>
      </div>
    </div>
  );
}

/* ====== خطّ مصغّر ====== */
function Sparkline({ values, color = '#C7A36B', w = 78, h = 30 }) {
  const max = Math.max(...values), min = Math.min(...values);
  const rng = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 3 - ((v - min) / rng) * (h - 6)}`);
  const area = `0,${h} ${pts.join(' ')} ${w},${h}`;
  const gid = 'sp-' + color.replace('#', '');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={area} fill={`url(#${gid})`}/>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ====== بطاقة KPI مع خطّ اتجاه ====== */
function KpiCard({ k, spark, sparkColor }) {
  const up = k.delta >= 0;
  return (
    <div className="hm-kpi">
      <div className="hm-kpi-top">
        <span className="hm-kpi-ic"><Icon name={k.icon} size={20} stroke="#15495B"/></span>
        <span className={'hm-kpi-delta ' + (up ? 'up' : 'down')}><Icon name="trend" size={13}/> {up ? '+' : ''}{k.delta}%</span>
      </div>
      <div className="hm-kpi-val">{k.value} <small>{k.unit}</small></div>
      <div className="hm-kpi-foot">
        <div className="hm-kpi-label">{k.label}</div>
        {spark && <Sparkline values={spark} color={sparkColor || '#C7A36B'}/>}
      </div>
    </div>
  );
}

/* ====== رسم مساحات متراكم (الإيراد حسب القطاع) ====== */
function StackedRevenue() {
  const D = window.HOMERA.revenueSeries;
  const W = 660, H = 256, padX = 40, padY = 22, padB = 32;
  const n = D.months.length;
  const sums = D.months.map((_, i) => D.rental[i] + D.sales[i] + D.services[i]);
  const maxY = 520;
  const x = i => padX + (i * (W - padX - 16)) / (n - 1);
  const y = v => H - padB - (v / maxY) * (H - padY - padB);
  const bands = [
    { key: 'rental', color: '#0E3340', label: 'تأجير يومي' },
    { key: 'sales', color: '#15495B', label: 'بيع عقارات' },
    { key: 'services', color: '#C7A36B', label: 'خدمات تشغيلية' },
  ];
  const cum = D.months.map((_, i) => { let acc = 0; const t = {}; bands.forEach(b => { acc += D[b.key][i]; t[b.key] = acc; }); return t; });
  const areaPath = (key, idx) => {
    const lower = idx === 0 ? null : bands[idx - 1].key;
    const top = D.months.map((_, i) => `${x(i)},${y(cum[i][key])}`);
    const bot = D.months.map((_, i) => `${x(i)},${y(lower ? cum[i][lower] : 0)}`).reverse();
    return `M${top.join(' L')} L${bot.join(' L')} Z`;
  };
  const grid = [0, 130, 260, 390, 520];
  return (
    <div className="hm-chart">
      <div className="hm-chart-head">
        <div><h3>الإيرادات حسب القطاع</h3><span>آخر ٦ أشهر · بالألف ر.س</span></div>
        <div className="hm-chart-legend">{bands.map(b => <span key={b.key}><i style={{ background: b.color }}></i>{b.label}</span>)}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="hm-chart-svg" preserveAspectRatio="xMidYMid meet">
        <defs>{bands.map(b => (
          <linearGradient key={b.key} id={'g-' + b.key} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={b.color} stopOpacity="0.92"/><stop offset="1" stopColor={b.color} stopOpacity="0.62"/>
          </linearGradient>))}
        </defs>
        {grid.map(g => (<g key={g}><line x1={padX} y1={y(g)} x2={W - 16} y2={y(g)} stroke="#E7E0D2"/><text x={padX - 8} y={y(g) + 4} textAnchor="end" className="hm-chart-ytick">{g}</text></g>))}
        {bands.map((b, idx) => <path key={b.key} d={areaPath(b.key, idx)} fill={'url(#g-' + b.key + ')'} stroke={b.color} strokeWidth="1.4"/>)}
        {D.months.map((_, i) => <circle key={i} cx={x(i)} cy={y(sums[i])} r="3.4" fill="#fff" stroke="#0E3340" strokeWidth="1.6"/>)}
        {D.months.map((m, i) => <text key={m} x={x(i)} y={H - 11} textAnchor="middle" className="hm-chart-xtick">{m}</text>)}
      </svg>
    </div>
  );
}

/* ====== رسم مساحة (سلسلة واحدة) ====== */
function AreaChart({ months, values, color = '#C7A36B' }) {
  const W = 560, H = 210, padX = 34, padY = 18, padB = 30;
  const n = values.length;
  const maxY = Math.ceil(Math.max(...values) / 4) * 4 + 2;
  const x = i => padX + (i * (W - padX - 14)) / (n - 1);
  const y = v => H - padB - (v / maxY) * (H - padY - padB);
  const line = values.map((v, i) => `${x(i)},${y(v)}`);
  const area = `M${x(0)},${H - padB} L${line.join(' L')} L${x(n - 1)},${H - padB} Z`;
  const grid = [0, maxY / 2, maxY];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hm-chart-svg" preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id="area-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".4"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      {grid.map(g => <g key={g}><line x1={padX} y1={y(g)} x2={W - 14} y2={y(g)} stroke="#E7E0D2"/><text x={padX - 8} y={y(g) + 4} textAnchor="end" className="hm-chart-ytick">{Math.round(g)}</text></g>)}
      <path d={area} fill="url(#area-g)"/>
      <polyline points={line.join(' ')} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.2" fill="#fff" stroke={color} strokeWidth="1.8"/>)}
      {months.map((m, i) => <text key={m} x={x(i)} y={H - 10} textAnchor="middle" className="hm-chart-xtick">{m}</text>)}
    </svg>
  );
}

/* ====== دائرة (حصص) ====== */
function Donut({ data, size = 188, thickness = 26, centerTop, centerBottom }) {
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="hm-donut">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFE9DC" strokeWidth={thickness}/>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((d, i) => {
          const len = (d.value / total) * C;
          const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} strokeLinecap="butt"/>;
          acc += len; return el;
        })}
      </g>
      {centerTop && <text x="50%" y="47%" textAnchor="middle" className="hm-donut-top">{centerTop}</text>}
      {centerBottom && <text x="50%" y="59%" textAnchor="middle" className="hm-donut-bottom">{centerBottom}</text>}
    </svg>
  );
}

/* ====== حلقة تقدّم ====== */
function Ring({ value, color = '#15495B', size = 76, display }) {
  const thickness = 7, r = (size - thickness) / 2, C = 2 * Math.PI * r;
  const len = (value / 100) * C;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFE9DC" strokeWidth={thickness}/>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeDasharray={`${len} ${C - len}`} strokeLinecap="round"/>
      </g>
      <text x="50%" y="54%" textAnchor="middle" className="hm-ring-txt">{display || value + '٪'}</text>
    </svg>
  );
}

Object.assign(window, { BackShell, Sparkline, KpiCard, StackedRevenue, AreaChart, Donut, Ring });
