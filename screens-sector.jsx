/* هوميرا — شاشة القطاع (فلاتر + نتائج) + إتمام العملية */

/* ====== فلاتر جانبية ====== */
function Filters({ sector, city, setCity, maxPrice, setMaxPrice, type, setType, rooms, setRooms, amenities, toggleAm }) {
  const D = window.HOMERA;
  const priceCap = sector === 'sales' ? 6000000 : 1000;
  const priceStep = sector === 'sales' ? 50000 : 20;
  const typeOpts = sector === 'rental' ? ['الكل', 'شقة', 'شاليه', 'استوديو', 'دور']
    : sector === 'sales' ? ['الكل', 'فيلا', 'شقة', 'أرض', 'عمارة']
    : ['الكل', 'نظافة', 'تكييف', 'ألمنيوم', 'مقاولات'];
  const amOpts = sector === 'services'
    ? ['تقييم 4.5+', 'متاح اليوم', 'يصدر فاتورة', 'ضمان']
    : ['واي فاي', 'موقف', 'مسبح', 'مطبخ', 'تكييف مركزي'];
  return (
    <aside className="hm-filters">
      <div className="hm-filters-head"><Icon name="filter" size={18}/><b>تصفية النتائج</b></div>

      <div className="hm-fgroup">
        <label>المدينة</label>
        <div className="hm-chips">
          {D.cities.map(c => (
            <button key={c} className={'hm-chip' + (c === city ? ' on' : '')} onClick={() => setCity(c === city ? null : c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="hm-fgroup">
        <label>{sector === 'services' ? 'نوع الخدمة' : 'النوع'}</label>
        <div className="hm-chips">
          {typeOpts.map(t => (
            <button key={t} className={'hm-chip' + (t === type ? ' on' : '')} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="hm-fgroup">
        <label>الحد الأقصى للسعر <b>{D.sar(maxPrice)} ر.س{sector === 'rental' ? ' / ليلة' : ''}</b></label>
        <input type="range" className="hm-range" min={priceStep} max={priceCap} step={priceStep} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)}/>
        <div className="hm-range-ends"><span>{D.sar(priceStep)}</span><span>{D.sar(priceCap)}</span></div>
      </div>

      {sector !== 'services' && (
        <div className="hm-fgroup">
          <label>عدد الغرف</label>
          <div className="hm-chips">
            {['الكل', '1', '2', '3', '4+'].map(r => (
              <button key={r} className={'hm-chip' + (r === rooms ? ' on' : '')} onClick={() => setRooms(r)}>{r}</button>
            ))}
          </div>
        </div>
      )}

      {sector === 'rental' && (
        <div className="hm-fgroup">
          <label>التواريخ</label>
          <div className="hm-date-row">
            <span className="hm-date"><Icon name="calendar" size={15}/> الوصول</span>
            <span className="hm-date"><Icon name="calendar" size={15}/> المغادرة</span>
          </div>
        </div>
      )}

      <div className="hm-fgroup">
        <label>{sector === 'services' ? 'المرشّحات' : 'المرافق'}</label>
        <div className="hm-checks">
          {amOpts.map(a => (
            <label key={a} className="hm-check">
              <input type="checkbox" checked={amenities.includes(a)} onChange={() => toggleAm(a)}/>
              <span className="hm-check-box"><Icon name="check" size={13} stroke="#fff"/></span>
              {a}
            </label>
          ))}
        </div>
      </div>

      <Btn kind="ghost" size="sm" full onClick={() => { setCity(null); setType('الكل'); setRooms('الكل'); setMaxPrice(priceCap); }}>إعادة التعيين</Btn>
    </aside>
  );
}

/* ====== بطاقات النتائج لكل قطاع ====== */
function RentalCard({ item, onBook }) {
  return (
    <article className="hm-rcard">
      <div className="hm-rcard-media">
        <Slot id={item.slot} ratio="4 / 3" radius={0} placeholder="صورة الوحدة"/>
        <button className="hm-fav"><Icon name="heart" size={17}/></button>
        <span className="hm-rcard-rate"><Icon name="star" size={12} fill="#fff" stroke="#fff" sw={0}/> {item.rating}</span>
      </div>
      <div className="hm-rcard-body">
        <div className="hm-rcard-meta"><Icon name="pin" size={13}/> {item.area}، {item.city}</div>
        <h4>{item.title}</h4>
        <div className="hm-rcard-feats">
          <span><Icon name="bed" size={15}/> {item.beds} غرف</span>
          <span><Icon name="user" size={15}/> {item.guests} ضيوف</span>
        </div>
        <div className="hm-rcard-foot">
          <div className="hm-price"><b>{item.price}</b> ر.س <small>/ ليلة</small></div>
          <Btn kind="primary" size="sm" onClick={() => onBook(item)}>احجز</Btn>
        </div>
      </div>
    </article>
  );
}

function PropertyCard({ item, onBook }) {
  return (
    <article className="hm-pcard">
      <div className="hm-pcard-media">
        <Slot id={item.slot} ratio="16 / 10" radius={0} placeholder="صورة العقار"/>
        {item.badge && <span className="hm-pcard-badge">{item.badge}</span>}
        <span className="hm-pcard-type">{item.type}</span>
      </div>
      <div className="hm-pcard-body">
        <h4>{item.title}</h4>
        <div className="hm-rcard-meta"><Icon name="pin" size={13}/> {item.area}، {item.city}</div>
        <div className="hm-pcard-specs">
          <span><Icon name="ruler" size={15}/> {item.size} م²</span>
          {item.rooms > 0 && <span><Icon name="door" size={15}/> {item.rooms} غرف</span>}
          <span><Icon name="building" size={15}/> {item.type}</span>
        </div>
        <div className="hm-pcard-foot">
          <div className="hm-price-lg">{window.HOMERA.sar(item.price)} <small>ر.س</small></div>
          <Btn kind="gold" size="sm" iconEnd="arrowL" onClick={() => onBook(item)}>اطلب معاينة</Btn>
        </div>
      </div>
    </article>
  );
}

function ProviderCard({ item, onBook }) {
  return (
    <article className="hm-scard">
      <div className="hm-scard-head">
        <span className="hm-scard-ic"><Icon name={item.icon} size={26} stroke="#15495B"/></span>
        <div style={{ flex: 1 }}>
          <h4>{item.name}</h4>
          <div className="hm-rcard-meta">{item.cat}</div>
        </div>
        <button className="hm-fav sm"><Icon name="heart" size={16}/></button>
      </div>
      <div className="hm-scard-stats">
        <Stars value={item.rating}/>
        <span className="hm-dotsep">·</span>
        <span className="hm-scard-jobs">{window.HOMERA.sar(item.jobs)} مهمة منجزة</span>
        <span className="hm-dotsep">·</span>
        <span><Icon name="pin" size={13}/> {item.city}</span>
      </div>
      <div className="hm-scard-foot">
        <div className="hm-price">
          {item.quote ? <span className="hm-quote">حسب المعاينة</span> : <span><small>يبدأ من</small> <b>{item.from}</b> ر.س</span>}
        </div>
        <Btn kind="primary" size="sm" onClick={() => onBook(item)}>{item.quote ? 'اطلب عرض سعر' : 'اطلب الخدمة'}</Btn>
      </div>
    </article>
  );
}

/* ====== شاشة القطاع ====== */
function Sector({ sector, go, city, setCity, openSwitch }) {
  const D = window.HOMERA;
  const s = D.sectors.find(x => x.id === sector);
  const [fCity, setFCity] = useState(null);
  const [type, setType] = useState('الكل');
  const [rooms, setRooms] = useState('الكل');
  const [amenities, setAmenities] = useState([]);
  const cap = sector === 'sales' ? 6000000 : 1000;
  const [maxPrice, setMaxPrice] = useState(cap);
  useEffect(() => { setMaxPrice(cap); setFCity(null); setType('الكل'); setRooms('الكل'); setAmenities([]); }, [sector]);

  const toggleAm = a => setAmenities(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);

  let list = sector === 'rental' ? D.rentals : sector === 'sales' ? D.properties : D.providers;
  list = list.filter(it => {
    if (fCity && it.city !== fCity) return false;
    if (sector === 'rental' && it.price > maxPrice) return false;
    if (sector === 'sales' && it.price > maxPrice) return false;
    if (sector === 'services' && !it.quote && it.from > maxPrice && maxPrice < cap) return false;
    if (type !== 'الكل') {
      if (sector === 'sales' && it.type !== type) return false;
      if (sector === 'rental' && !it.title.includes(type) && type !== 'شقة') { /* loose */ }
    }
    if (rooms !== 'الكل' && sector !== 'services') {
      const n = it.rooms ?? it.beds;
      if (rooms === '4+') { if (n < 4) return false; } else if (String(n) !== rooms) return false;
    }
    return true;
  });

  const sortLabel = sector === 'sales' ? 'الأعلى سعراً' : sector === 'services' ? 'الأعلى تقييماً' : 'الموصى به';

  return (
    <div>
      <CustomerBar go={go} city={city} setCity={setCity} showSwitch onSwitch={openSwitch} sectorName={s.short}/>
      <div className="hm-sector-banner" style={{ background: s.tint }}>
        <div className="hm-sector-banner-inner">
          <span className="hm-sector-banner-ic"><Icon name={s.icon} size={26} stroke="#fff"/></span>
          <div>
            <h1>{s.name}</h1>
            <p>{s.desc}</p>
          </div>
          <button className="hm-banner-switch" onClick={openSwitch}>
            <Icon name="swap" size={18}/> تبديل الخدمة
          </button>
        </div>
      </div>

      <div className="hm-sector-layout">
        <Filters sector={sector} city={fCity} setCity={setFCity} maxPrice={maxPrice} setMaxPrice={setMaxPrice}
          type={type} setType={setType} rooms={rooms} setRooms={setRooms} amenities={amenities} toggleAm={toggleAm}/>

        <main className="hm-results">
          <div className="hm-results-head">
            <span><b>{list.length}</b> نتيجة{fCity ? ` في ${fCity}` : ''}</span>
            <div className="hm-sort">
              <Icon name="list" size={16}/> الترتيب: <b>{sortLabel}</b>
            </div>
          </div>
          <div className={'hm-grid ' + (sector === 'services' ? 'cols2' : 'cols3')}>
            {list.map(it => sector === 'rental'
              ? <RentalCard key={it.id} item={it} onBook={i => go('done', { sector, item: i })}/>
              : sector === 'sales'
              ? <PropertyCard key={it.id} item={it} onBook={i => go('done', { sector, item: i })}/>
              : <ProviderCard key={it.id} item={it} onBook={i => go('done', { sector, item: i })}/>
            )}
          </div>
          {list.length === 0 && <div className="hm-empty"><Icon name="search" size={28} stroke="#B7AE99"/><p>لا نتائج مطابقة — جرّب توسيع الفلاتر.</p></div>}
        </main>
      </div>
      <Footer go={go}/>
    </div>
  );
}

/* ====== إتمام العملية ====== */
function Completion({ ctx, go, city, setCity, openSwitch }) {
  const D = window.HOMERA;
  const sector = ctx?.sector || 'rental';
  const item = ctx?.item;
  const s = D.sectors.find(x => x.id === sector);
  const order = '#HM-' + (90400 + Math.floor(Math.random() * 90));

  const isQuote = sector === 'sales' || (item && item.quote);
  const title = sector === 'rental' ? 'تم تأكيد حجزك!' : sector === 'sales' ? 'تم إرسال طلب المعاينة!' : (item && item.quote) ? 'تم إرسال طلب عرض السعر!' : 'تم تأكيد طلب الخدمة!';
  const sub = sector === 'rental' ? 'سيصلك تأكيد المضيف وتفاصيل الوصول عبر الرسائل.'
    : sector === 'sales' ? 'سيتواصل معك مستشار العقار لتحديد موعد المعاينة.'
    : (item && item.quote) ? 'سيرسل المزوّد عرض السعر خلال ساعات.'
    : 'سيصلك المزوّد في الموعد المحدّد. تابع الحالة من حسابك.';

  // اقتراح قطاع آخر (cross-sell)
  const suggestId = sector === 'rental' ? 'services' : sector === 'sales' ? 'services' : 'rental';
  const suggest = D.sectors.find(x => x.id === suggestId);
  const suggestPitch = sector === 'rental' ? 'احجزت مكاناً؟ جهّزه باستقبالك — اطلب خدمة نظافة وتعقيم قبل وصولك.'
    : sector === 'sales' ? 'بعد المعاينة، جهّز عقارك الجديد — نظافة، تكييف، وتشطيبات من مزوّدين موثوقين.'
    : 'تحتاج إقامة أثناء العمل؟ تصفّح شققاً وشاليهات قريبة بالليلة.';

  return (
    <div>
      <CustomerBar go={go} city={city} setCity={setCity} showSwitch onSwitch={openSwitch} sectorName={s.short}/>
      <main className="hm-done">
        <div className="hm-done-card">
          <div className="hm-done-check"><Icon name="check" size={40} stroke="#fff" sw={2.4}/></div>
          <h1>{title}</h1>
          <p>{sub}</p>

          <div className="hm-done-summary">
            <div className="hm-done-sum-row">
              <span>رقم الطلب</span><b style={{ direction: 'ltr' }}>{order}</b>
            </div>
            <div className="hm-done-sum-row">
              <span>القطاع</span><Tag tone="petrol"><Icon name={s.icon} size={13}/> {s.short}</Tag>
            </div>
            {item && <div className="hm-done-sum-row"><span>{sector === 'services' ? 'المزوّد' : 'العقار'}</span><b>{item.title || item.name}</b></div>}
            <div className="hm-done-sum-row">
              <span>المدينة</span><b>{item?.city || city}</b>
            </div>
            {!isQuote && item && (
              <div className="hm-done-sum-row total">
                <span>الإجمالي</span>
                <b className="hm-done-total">{sector === 'rental' ? D.sar(item.price * 3) : D.sar(item.from || 0)} ر.س</b>
              </div>
            )}
          </div>

          <div className="hm-done-actions">
            <Btn kind="outline" icon="eye">تتبّع الطلب</Btn>
            <Btn kind="primary" icon="grid" onClick={() => go('hub')}>تصفّح خدمة ثانية</Btn>
          </div>
        </div>

        <aside className="hm-crosssell">
          <div className="hm-crosssell-tag"><Icon name="sparkle" size={15}/> كمّل تجربتك</div>
          <div className="hm-crosssell-card" style={{ borderColor: suggest.tint + '44' }}>
            <span className="hm-crosssell-ic" style={{ background: suggest.tint }}><Icon name={suggest.icon} size={26} stroke="#fff"/></span>
            <h3>{suggest.name}</h3>
            <p>{suggestPitch}</p>
            <Btn kind="gold" iconEnd="arrowL" full onClick={() => go('sector', { sector: suggestId })}>تصفّح {suggest.short}</Btn>
          </div>
          <button className="hm-crosssell-alt" onClick={openSwitch}>
            <Icon name="swap" size={16}/> أو انتقل لقطاع آخر
          </button>
        </aside>
      </main>
      <Footer go={go}/>
    </div>
  );
}

Object.assign(window, { Sector, Completion });
