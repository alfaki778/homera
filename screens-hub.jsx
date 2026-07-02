/* هوميرا — شاشات العميل: Hub (نسختان)، القطاعات، إتمام العملية */

/* ====== الشريط العلوي للعميل ====== */
function CustomerBar({ go, city, setCity, showSwitch, onSwitch, sectorName }) {
  const D = window.HOMERA;
  const [openCity, setOpenCity] = useState(false);
  return (
    <header className="hm-topbar">
      <div className="hm-topbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button onClick={() => go('hub')} style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}>
            <Logo size="sm" tagline={true}/>
          </button>
          {showSwitch && (
            <button className="hm-switch-btn" onClick={onSwitch}>
              <Icon name="swap" size={18}/>
              <span>تبديل الخدمة</span>
              {sectorName && <span className="hm-switch-cur">· {sectorName}</span>}
            </button>
          )}
        </div>

        <div className="hm-searchbar">
          <Icon name="search" size={18} stroke="#8A9499"/>
          <input placeholder="ابحث عن شقة، عقار، أو خدمة…" />
          <div className="hm-search-div"></div>
          <button className="hm-city-pick" onClick={() => setOpenCity(o => !o)}>
            <Icon name="pin" size={16} stroke="#15495B"/>
            <span>{city}</span>
          </button>
          {openCity && (
            <div className="hm-city-menu">
              {D.cities.map(c => (
                <button key={c} className={'hm-city-item' + (c === city ? ' on' : '')} onClick={() => { setCity(c); setOpenCity(false); }}>
                  <Icon name="pin" size={14}/> {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hm-topbar-actions">
          <button className="hm-icon-btn" title="الإشعارات"><Icon name="bell" size={20}/><span className="hm-dot"></span></button>
          <button className="hm-icon-btn" title="الحساب"><Icon name="user" size={20}/></button>
          <div className="hm-avatar">سا</div>
        </div>
      </div>
    </header>
  );
}

/* ====== قائمة تبديل الخدمة ====== */
function ServiceSwitcher({ open, current, onPick, onClose }) {
  const D = window.HOMERA;
  if (!open) return null;
  return (
    <div className="hm-switch-overlay" onClick={onClose}>
      <div className="hm-switch-sheet" onClick={e => e.stopPropagation()}>
        <div className="hm-switch-head">
          <span>التنقّل السريع بين القطاعات</span>
          <button className="hm-icon-btn sm" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>
        <div className="hm-switch-grid">
          {D.sectors.map(s => (
            <button key={s.id} className={'hm-switch-card' + (s.id === current ? ' on' : '')} onClick={() => onPick(s.id)}>
              <span className="hm-switch-ic" style={{ background: s.id === current ? '#0E3340' : '#F1ECDF', color: s.id === current ? '#E0C99B' : '#15495B' }}>
                <Icon name={s.icon} size={24}/>
              </span>
              <b>{s.short}</b>
              <small>{s.desc}</small>
              {s.id === current && <Tag tone="gold" style={{ marginTop: 4 }}>الحالي</Tag>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ====== بطاقة قطاع كبيرة (Hub) ====== */
function SectorCard({ s, onStart, variant }) {
  return (
    <article className={'hm-sector-card v-' + variant}>
      <div className="hm-sector-top">
        <span className="hm-sector-ic" style={{ background: s.tint }}><Icon name={s.icon} size={28} stroke="#fff"/></span>
        <Icon name="arrowL" size={20} stroke="#B7AE99" style={{ marginInlineStart: 'auto' }}/>
      </div>
      <h3>{s.name}</h3>
      <p>{s.desc}</p>
      <Btn kind="soft" size="sm" iconEnd="arrowL" onClick={onStart} style={{ marginTop: 'auto' }}>ابدأ</Btn>
    </article>
  );
}

/* ====== عرض مختار صغير ====== */
function FeaturedCard({ item, onClick }) {
  return (
    <div className="hm-feat" role="button" onClick={onClick}>
      <Slot id={item.slot} ratio="16 / 10" radius={14} placeholder="صورة العقار"/>
      <div className="hm-feat-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <b>{item.title}</b>
          <Stars value={item.rating}/>
        </div>
        <div className="hm-feat-meta"><Icon name="pin" size={13}/> {item.area}، {item.city}</div>
        <div className="hm-feat-price"><b>{item.price} ر.س</b> <span>/ الليلة</span></div>
      </div>
    </div>
  );
}

/* ====== Hub ====== */
function Hub({ go, city, setCity }) {
  return (
    <div>
      <CustomerBar go={go} city={city} setCity={setCity}/>
      <HubA go={go} city={city}/>
      <Footer go={go}/>
    </div>
  );
}

/* —— النسخة أ —— */
function HubA({ go, city }) {
  const D = window.HOMERA;
  return (
    <main className="hm-page">
      <section className="hm-hero-a">
        <Tag tone="gold"><Icon name="sparkle" size={13}/> منصة وساطة سعودية موثوقة</Tag>
        <h1>كل ما يخصّ مكانك — في منصّة واحدة</h1>
        <p>نربطك بمزوّدي الإقامة والعقار والخدمات التشغيلية في {city} ومدن المملكة، بثقة ووضوح.</p>
      </section>

      <section className="hm-sectors-a">
        {D.sectors.map(s => <SectorCard key={s.id} s={s} variant="a" onStart={() => go('sector', { sector: s.id })}/>)}
      </section>

      <section className="hm-block">
        <div className="hm-block-head">
          <div>
            <span className="hm-eyebrow">مختارات هوميرا</span>
            <h2>عروض مختارة في {city}</h2>
          </div>
          <button className="hm-link" onClick={() => go('sector', { sector: 'rental' })}>عرض الكل <Icon name="arrowL" size={15}/></button>
        </div>
        <div className="hm-feat-row">
          {D.rentals.slice(0, 3).map(r => <FeaturedCard key={r.id} item={r} onClick={() => go('sector', { sector: 'rental' })}/>)}
        </div>
      </section>

      <section className="hm-block">
        <div className="hm-block-head">
          <div>
            <span className="hm-eyebrow">حيثما كنت</span>
            <h2>تصفّح حسب المدينة</h2>
          </div>
        </div>
        <div className="hm-city-row">
          {D.cities.map((c, i) => (
            <div key={c} className="hm-city-tile" role="button" onClick={() => go('sector', { sector: 'rental' })}>
              <Slot id={'city-' + i} ratio="3 / 2" radius={14} placeholder={c}/>
              <span className="hm-city-tile-name"><Icon name="pin" size={14}/> {c}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

/* —— النسخة ب —— */
function HubB({ go, city }) {
  const D = window.HOMERA;
  return (
    <main className="hm-page">
      <section className="hm-hero-b">
        <div className="hm-hero-b-bg"><Slot id="hero-b" ratio="21 / 9" radius={22} placeholder="صورة بانورامية للمدينة"/></div>
        <div className="hm-hero-b-overlay">
          <h1>اكتشف. احجز. أنجز.</h1>
          <p>إقامة، عقار، وخدمات تشغيلية في {city} — من مزوّدين موثوقين عبر هوميرا.</p>
          <div className="hm-hero-b-tabs">
            {D.sectors.map(s => (
              <button key={s.id} onClick={() => go('sector', { sector: s.id })}>
                <Icon name={s.icon} size={20}/> {s.short}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-sectors-b">
        {D.sectors.map(s => (
          <button key={s.id} className="hm-sector-b" onClick={() => go('sector', { sector: s.id })}>
            <span className="hm-sector-b-ic" style={{ background: s.tint }}><Icon name={s.icon} size={24} stroke="#fff"/></span>
            <div>
              <b>{s.name}</b>
              <small>{s.desc}</small>
            </div>
            <Icon name="arrowL" size={20} stroke="#B7AE99" style={{ marginInlineStart: 'auto' }}/>
          </button>
        ))}
      </section>

      <section className="hm-block">
        <div className="hm-block-head">
          <h2>مختارات هوميرا</h2>
          <button className="hm-link" onClick={() => go('sector', { sector: 'rental' })}>عرض الكل <Icon name="arrowL" size={15}/></button>
        </div>
        <div className="hm-mag">
          <div className="hm-mag-lead">
            <Slot id="mag-lead" ratio="4 / 3" radius={18} placeholder="عرض مميّز"/>
            <div className="hm-mag-lead-body">
              <Tag tone="gold">الأعلى تقييماً</Tag>
              <h3>{D.rentals[1].title}</h3>
              <div className="hm-feat-meta"><Icon name="pin" size={14}/> {D.rentals[1].area}، {D.rentals[1].city}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
                <Stars value={D.rentals[1].rating} reviews={D.rentals[1].reviews}/>
                <span className="hm-feat-price"><b>{D.rentals[1].price} ر.س</b> / الليلة</span>
              </div>
              <Btn kind="primary" size="sm" iconEnd="arrowL" onClick={() => go('sector', { sector: 'rental' })} style={{ marginTop: 14 }}>استكشف العرض</Btn>
            </div>
          </div>
          <div className="hm-mag-side">
            {D.properties.slice(0, 3).map(p => (
              <div key={p.id} className="hm-mag-mini" role="button" onClick={() => go('sector', { sector: 'sales' })}>
                <Slot id={'mini-' + p.slot} ratio="1 / 1" radius={12} placeholder="عقار"/>
                <div>
                  <b>{p.title}</b>
                  <small><Icon name="pin" size={12}/> {p.city}</small>
                  <span className="hm-mag-price">{D.sar(p.price)} ر.س</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { CustomerBar, ServiceSwitcher, Hub });
