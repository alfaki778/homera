/* هوميرا — التطبيق الرئيسي: التوجيه + خريطة النموذج */

function App() {
  const [route, setRoute] = useState('hub');
  const [params, setParams] = useState({});
  const [city, setCity] = useState('جازان');
  const [switcher, setSwitcher] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const go = (r, p = {}) => {
    setRoute(r); setParams(p); setSwitcher(false); setMapOpen(false);
    window.scrollTo(0, 0);
  };

  const openSwitch = () => setSwitcher(true);
  const pickSector = (id) => { setSwitcher(false); go('sector', { sector: id }); };

  let screen;
  if (route === 'hub') screen = <Hub go={go} city={city} setCity={setCity}/>;
  else if (route === 'sector') screen = <Sector sector={params.sector || 'rental'} go={go} city={city} setCity={setCity} openSwitch={openSwitch}/>;
  else if (route === 'done') screen = <Completion ctx={params} go={go} city={city} setCity={setCity} openSwitch={openSwitch}/>;
  else if (route === 'admin') screen = <Admin go={go}/>;
  else if (route === 'support') screen = <Support go={go}/>;
  else if (route === 'vendor') screen = <Vendor go={go}/>;

  const isBack = ['admin', 'support', 'vendor'].includes(route);

  const mapItems = [
    { id: 'hub', label: 'الواجهة الرئيسية', sub: 'Hub · النسخة المعتمدة', icon: 'grid', go: () => go('hub') },
    { id: 'rental', label: 'التأجير اليومي', sub: 'فلاتر + نتائج', icon: 'bed', go: () => go('sector', { sector: 'rental' }) },
    { id: 'sales', label: 'بيع العقارات', sub: 'بطاقات عقارات', icon: 'building', go: () => go('sector', { sector: 'sales' }) },
    { id: 'services', label: 'الخدمات التشغيلية', sub: 'مزوّدو خدمة', icon: 'tools', go: () => go('sector', { sector: 'services' }) },
    { id: 'done', label: 'إتمام العملية', sub: 'تأكيد + كمّل تجربتك', icon: 'checkCircle', go: () => go('done', { sector: 'rental', item: window.HOMERA.rentals[0] }) },
    { id: 'admin', label: 'لوحة الأدمن', sub: 'KPI + رسوم + جداول', icon: 'dash', go: () => go('admin') },
    { id: 'support', label: 'خدمة العملاء', sub: 'تذاكر + محادثة', icon: 'headset', go: () => go('support') },
    { id: 'vendor', label: 'بوابة المزوّد', sub: 'قوائم + تقويم + عوائد', icon: 'store', go: () => go('vendor') },
  ];
  const curKey = route === 'sector' ? (params.sector || 'rental') : route;

  return (
    <div className={'hm-app' + (isBack ? ' is-back' : '')}>
      {screen}
      <ServiceSwitcher open={switcher} current={params.sector} onPick={pickSector} onClose={() => setSwitcher(false)}/>

      {/* مشغّل خريطة النموذج */}
      <button className="hm-maplauncher" onClick={() => setMapOpen(o => !o)} title="خريطة النموذج">
        <Icon name="map" size={20}/> <span>خريطة النموذج</span>
      </button>

      {mapOpen && (
        <div className="hm-map-overlay" onClick={() => setMapOpen(false)}>
          <div className="hm-map" onClick={e => e.stopPropagation()}>
            <div className="hm-map-head">
              <Logo size="sm" tagline={false}/>
              <button className="hm-icon-btn sm" onClick={() => setMapOpen(false)}><Icon name="close" size={18}/></button>
            </div>
            <p className="hm-map-sub">تنقّل سريع بين جميع شاشات النموذج</p>
            <div className="hm-map-grid">
              {mapItems.map(m => (
                <button key={m.id} className={'hm-map-card' + (m.id === curKey ? ' on' : '')} onClick={m.go}>
                  <span className="hm-map-ic"><Icon name={m.icon} size={22}/></span>
                  <div><b>{m.label}</b><small>{m.sub}</small></div>
                  {m.id === curKey && <span className="hm-map-now">هنا</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
