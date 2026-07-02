/* هوميرا — لوحة التحكم (نظرة تنفيذية) */
function Admin({ go }) {
  const D = window.HOMERA;
  const sparks = {
    rev: [3.6, 3.9, 4.1, 4.4, 4.6, 4.82],
    orders: [240, 268, 255, 290, 300, 314],
    vendors: [920, 910, 980, 1010, 1050, 1082],
    rate: [90, 91, 92, 93, 93.5, 94.2],
  };
  const sparkColor = { rev: '#C7A36B', orders: '#15495B', vendors: '#0E3340', rate: '#1F8A5B' };
  const maxCity = Math.max(...D.topCities.map(c => c.value));
  const sectorTag = { 'تأجير': 'petrol', 'عقارات': 'info', 'خدمات': 'gold' };

  return (
    <BackShell active="admin" go={go} title="لوحة التحكم" subtitle="نظرة عامة على أداء المنصة · اليوم، ٦ يونيو ٢٠٢٦"
      actions={<><Btn kind="soft" size="sm" icon="calendar">هذا الشهر</Btn><Btn kind="primary" size="sm" icon="chart">تصدير تقرير</Btn></>}>

      <div className="hm-kpi-row">
        {D.kpis.map(k => <KpiCard key={k.id} k={k} spark={sparks[k.id]} sparkColor={sparkColor[k.id]}/>)}
      </div>

      <div className="hm-admin-grid">
        <StackedRevenue/>
        <div className="hm-panel hm-share">
          <div className="hm-panel-head"><h3>توزيع الإيراد</h3><Tag tone="gold">٤٨٢ ألف ر.س</Tag></div>
          <div className="hm-share-body">
            <Donut data={D.sectorShare} centerTop="٤٨٢ ألف" centerBottom="إجمالي يونيو"/>
            <div className="hm-share-legend">
              {D.sectorShare.map(s => (
                <div key={s.key} className="hm-share-row">
                  <span className="hm-share-dot" style={{ background: s.color }}></span>
                  <span className="hm-share-label">{s.label}</span>
                  <b>{s.value}٪</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hm-insights">
        {/* أعلى المدن */}
        <div className="hm-panel">
          <div className="hm-panel-head"><h3>أعلى المدن أداءً</h3><span className="hm-td-muted">بالألف ر.س</span></div>
          <div className="hm-citybars">
            {D.topCities.map(c => (
              <div key={c.city} className="hm-citybar">
                <span className="hm-citybar-name">{c.city}</span>
                <div className="hm-citybar-track"><div className="hm-citybar-fill" style={{ width: (c.value / maxCity * 100) + '%' }}></div></div>
                <b className="hm-citybar-val">{c.value}</b>
              </div>
            ))}
          </div>
        </div>

        {/* لوحة شرف المزوّدين */}
        <div className="hm-panel">
          <div className="hm-panel-head"><h3>أبرز المزوّدين</h3><button className="hm-link">الكل <Icon name="arrowL" size={14}/></button></div>
          <div className="hm-leader">
            {D.topVendors.map((v, i) => (
              <div key={v.name} className="hm-leader-row">
                <span className={'hm-rank' + (i < 3 ? ' top' : '')}>{i + 1}</span>
                <div className="hm-leader-info">
                  <b>{v.name}</b>
                  <div className="hm-leader-meta"><Tag tone={sectorTag[v.sector]} style={{ fontSize: 10.5, padding: '2px 8px' }}>{v.sector}</Tag><span><Icon name="star" size={12} fill="#C7A36B" stroke="#C7A36B" sw={0}/> {v.rating}</span></div>
                </div>
                <b className="hm-leader-rev">{v.revenue} ألف</b>
              </div>
            ))}
          </div>
        </div>

        {/* مسار التحويل */}
        <div className="hm-panel">
          <div className="hm-panel-head"><h3>مسار التحويل</h3><Tag tone="ok">١٠٪ إتمام</Tag></div>
          <div className="hm-funnel">
            {D.funnel.map((f, i) => (
              <div key={f.label} className="hm-funnel-row">
                <div className="hm-funnel-bar" style={{ width: f.pct + '%', background: `linear-gradient(90deg, #0E3340, #15495B ${100 - i * 12}%)` }}>
                  <span>{D.sar(f.value)}</span>
                </div>
                <div className="hm-funnel-meta"><span>{f.label}</span><b>{f.pct}٪</b></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hm-admin-bottom">
        <div className="hm-panel">
          <div className="hm-panel-head"><h3>آخر الطلبات</h3><button className="hm-link">عرض كل الطلبات <Icon name="arrowL" size={15}/></button></div>
          <table className="hm-table">
            <thead><tr><th>رقم الطلب</th><th>العميل</th><th>القطاع</th><th>التفاصيل</th><th>المبلغ</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              {D.recentOrders.map(o => (
                <tr key={o.id}>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}><b>{o.id}</b></td>
                  <td>{o.customer}</td>
                  <td><Tag tone="petrol">{o.sector}</Tag></td>
                  <td className="hm-td-muted">{o.item}</td>
                  <td>{o.amount ? <b>{D.sar(o.amount)} ر.س</b> : <span className="hm-td-muted">—</span>}</td>
                  <td><Tag tone={statusTone(o.status)}>{o.status}</Tag></td>
                  <td><button className="hm-icon-btn sm"><Icon name="dots" size={18}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="hm-panel hm-alerts">
          <div className="hm-panel-head"><h3>تنبيهات مباشرة</h3><Tag tone="bad">٣ جديدة</Tag></div>
          <div className="hm-alerts-list">
            {D.alerts.map(a => (
              <div key={a.id} className="hm-alert">
                <span className={'hm-alert-ic ' + a.kind}><Icon name={a.kind === 'warn' ? 'bell' : a.kind === 'ok' ? 'checkCircle' : 'sparkle'} size={16}/></span>
                <div><p>{a.text}</p><span className="hm-alert-time"><Icon name="clock" size={12}/> {a.time}</span></div>
              </div>
            ))}
            <button className="hm-alert-all">عرض كل التنبيهات</button>
          </div>
        </div>
      </div>
    </BackShell>
  );
}

Object.assign(window, { Admin });
