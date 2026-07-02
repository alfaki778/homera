/* هوميرا — بوابة المزوّد (لوحة الشريك) */
function Vendor({ go }) {
  const D = window.HOMERA;
  const P = D.vendorProfile;
  const E = D.vendorEarnings;
  const days = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const avail = [1, 1, 0, 1, 1, 2, 0];
  const availColor = { 0: '#E7E0D2', 1: '#C7A36B', 2: '#0E3340' };
  const vkpis = [
    { ic: 'wallet', val: E.total + ' ر.س', label: 'إجمالي العوائد', delta: 18 },
    { ic: 'clock', val: E.pending + ' ر.س', label: 'قيد التسوية', delta: 6 },
    { ic: 'money', val: E.payout + ' ر.س', label: 'الدفعة القادمة', delta: 11 },
    { ic: 'cart', val: '٣', label: 'طلبات واردة', delta: 50 },
  ];
  const payTone = { 'مدفوعة': 'ok', 'مجدولة': 'warn' };
  const ringColor = { ok: '#1F8A5B', gold: '#C7A36B', warn: '#B6781A' };

  return (
    <BackShell active="vendor" go={go} title="بوابة المزوّد" subtitle="لوحة الشريك · إدارة قوائمك وعوائدك"
      actions={<Btn kind="gold" size="sm" icon="plus">إضافة قائمة جديدة</Btn>}>

      {/* بطاقة الملف */}
      <div className="hm-vendor-hero">
        <div className="hm-vendor-hero-av"><Icon name="spark" size={34} stroke="#fff"/></div>
        <div className="hm-vendor-hero-info">
          <div className="hm-vendor-hero-name">
            <h2>{P.name}</h2>
            <Tag tone="gold"><Icon name="checkCircle" size={13}/> {P.tier}</Tag>
          </div>
          <div className="hm-vendor-hero-meta">
            <span><Icon name="star" size={14} fill="#C7A36B" stroke="#C7A36B" sw={0}/> <b>{P.rating}</b> ({D.sar(P.reviews)} تقييم)</span>
            <span className="hm-dotsep">·</span>
            <span><Icon name="pin" size={13}/> {P.city}</span>
            <span className="hm-dotsep">·</span>
            <span>{P.since}</span>
          </div>
        </div>
        <div className="hm-vendor-hero-stats">
          <div><b>{P.responseRate}٪</b><span>سرعة الاستجابة</span></div>
          <div><b>{P.acceptance}٪</b><span>قبول الطلبات</span></div>
        </div>
      </div>

      {/* KPIs */}
      <div className="hm-kpi-row">
        {vkpis.map(k => (
          <div key={k.label} className="hm-kpi">
            <div className="hm-kpi-top"><span className="hm-kpi-ic"><Icon name={k.ic} size={20} stroke="#15495B"/></span><span className="hm-kpi-delta up"><Icon name="trend" size={13}/> +{k.delta}%</span></div>
            <div className="hm-kpi-val" style={{ fontSize: 22 }}>{k.val}</div>
            <div className="hm-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* العوائد + التسويات */}
      <div className="hm-vendor-grid2">
        <div className="hm-panel">
          <div className="hm-panel-head"><h3>العوائد الشهرية</h3><Tag tone="ok"><Icon name="trend" size={12}/> +١٨٪ عن أبريل</Tag></div>
          <AreaChart months={E.months} values={E.values} color="#C7A36B"/>
        </div>
        <div className="hm-panel">
          <div className="hm-panel-head"><h3>جدول التسويات</h3></div>
          <div className="hm-payouts">
            {D.payouts.map((p, i) => (
              <div key={i} className="hm-payout">
                <span className="hm-payout-ic"><Icon name="money" size={18} stroke="#15495B"/></span>
                <div className="hm-payout-info"><b>{D.sar(p.amount)} ر.س</b><span>{p.date}</span></div>
                <Tag tone={payTone[p.status]}>{p.status}</Tag>
              </div>
            ))}
            <button className="hm-alert-all">سجلّ التسويات الكامل</button>
          </div>
        </div>
      </div>

      {/* بطاقة الأداء */}
      <div className="hm-panel">
        <div className="hm-panel-head"><h3>بطاقة الأداء</h3><span className="hm-td-muted">آخر ٣٠ يوماً</span></div>
        <div className="hm-scorecard">
          {D.vendorScore.map(s => (
            <div key={s.label} className="hm-score">
              <Ring value={s.value} color={ringColor[s.tone]} display={s.display || (s.value + (s.suffix || ''))}/>
              <span className="hm-score-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* القوائم + التقويم */}
      <div className="hm-vendor-grid">
        <div className="hm-panel">
          <div className="hm-panel-head"><h3>قوائمي</h3><Btn kind="ghost" size="sm" icon="plus">إضافة جديد</Btn></div>
          <table className="hm-table compact">
            <thead><tr><th>القائمة</th><th>النوع</th><th>المدينة</th><th>السعر</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              {D.vendorListings.map(l => (
                <tr key={l.id}>
                  <td><div className="hm-vlist"><Slot id={'vl-' + l.slot} ratio="1 / 1" radius={8} style={{ width: 42, flex: 'none' }} placeholder=""/><b>{l.title}</b></div></td>
                  <td className="hm-td-muted">{l.kind}</td>
                  <td className="hm-td-muted">{l.city}</td>
                  <td><b>{l.price}</b></td>
                  <td><Tag tone={statusTone(l.state)}>{l.state}</Tag></td>
                  <td><button className="hm-icon-btn sm"><Icon name="dots" size={18}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="hm-panel">
          <div className="hm-panel-head"><h3>تقويم التوافر</h3><span className="hm-td-muted">يونيو ٢٠٢٦</span></div>
          <div className="hm-cal">
            {days.map(d => <span key={d} className="hm-cal-d">{d}</span>)}
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 1;
              const st = day >= 1 && day <= 30 ? avail[i % 7] : -1;
              return <span key={i} className={'hm-cal-cell' + (st < 0 ? ' empty' : '')} style={st >= 0 ? { background: availColor[st], color: st === 2 ? '#fff' : st === 1 ? '#3a2a12' : '#6E7C82' } : {}}>{st >= 0 ? day : ''}</span>;
            })}
          </div>
          <div className="hm-cal-legend">
            <span><i style={{ background: '#E7E0D2' }}></i> متاح</span>
            <span><i style={{ background: '#C7A36B' }}></i> محجوز جزئياً</span>
            <span><i style={{ background: '#0E3340' }}></i> ممتلئ</span>
          </div>
        </div>
      </div>

      {/* الطلبات الواردة + التقييمات */}
      <div className="hm-vendor-grid">
        <div className="hm-panel">
          <div className="hm-panel-head"><h3>الطلبات الواردة</h3><Tag tone="gold">١ جديد</Tag></div>
          <div className="hm-vorders">
            {D.vendorOrders.map(o => (
              <div key={o.id} className="hm-vorder">
                <div className="hm-vorder-main"><b style={{ direction: 'ltr' }}>{o.id}</b><span>{o.customer} · {o.item}</span></div>
                <div className="hm-vorder-side"><b>{D.sar(o.amount)} ر.س</b><Tag tone={statusTone(o.status)}>{o.status}</Tag></div>
                {o.status === 'جديد' && <div className="hm-vorder-act"><Btn kind="primary" size="sm">قبول</Btn><Btn kind="outline" size="sm">رفض</Btn></div>}
              </div>
            ))}
          </div>
        </div>

        <div className="hm-panel">
          <div className="hm-panel-head"><h3>أحدث التقييمات</h3><span><Icon name="star" size={14} fill="#C7A36B" stroke="#C7A36B" sw={0}/> <b>{P.rating}</b></span></div>
          <div className="hm-reviews">
            {D.vendorReviews.map((r, i) => (
              <div key={i} className="hm-review">
                <div className="hm-review-top">
                  <div className="hm-review-av">{r.name.slice(0, 1)}</div>
                  <div><b>{r.name}</b><span>{r.when}</span></div>
                  <div className="hm-review-stars">{Array.from({ length: 5 }).map((_, s) => <Icon key={s} name="star" size={13} fill={s < r.rating ? '#C7A36B' : '#E7E0D2'} stroke={s < r.rating ? '#C7A36B' : '#E7E0D2'} sw={0}/>)}</div>
                </div>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BackShell>
  );
}

Object.assign(window, { Vendor });
