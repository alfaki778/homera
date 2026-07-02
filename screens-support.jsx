/* هوميرا — خدمة العملاء (وحدة تحكّم الوكيل) */
function Support({ go }) {
  const D = window.HOMERA;
  const M = D.supportMeta;
  const [active, setActive] = useState(D.tickets[0].id);
  const [msgs, setMsgs] = useState(D.chat);
  const [draft, setDraft] = useState('');
  const t = D.tickets.find(x => x.id === active);
  const ex = D.ticketExtra[active] || {};
  const endRef = useRef(null);
  useEffect(() => { if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight; }, [msgs, active]);

  const send = (text) => { const v = (text ?? draft).trim(); if (!v) return; setMsgs(m => [...m, { from: 'me', text: v, time: 'الآن' }]); setDraft(''); };
  const prioTone = { 'عالية': 'bad', 'متوسطة': 'warn', 'عادية': 'info', 'منخفضة': 'neutral' };
  const sentiTone = { 'سعيد': 'ok', 'إيجابي': 'ok', 'محايد': 'info', 'منزعج': 'warn' };
  const aiReplies = ['بكل تأكيد، سأتحقق من ذلك حالاً ✅', 'تم تعديل الحجز حسب طلبك.', 'هل ترغب بتعويض عن الإزعاج؟'];

  const metrics = [
    { ic: 'chat', label: 'تذاكر مفتوحة', val: M.open },
    { ic: 'clock', label: 'متوسط أول رد', val: M.firstResp },
    { ic: 'sparkle', label: 'رضا العملاء', val: M.csat },
    { ic: 'checkCircle', label: 'التزام SLA', val: M.sla },
    { ic: 'check', label: 'محلولة اليوم', val: M.resolvedToday },
  ];

  const timeline = [
    { label: 'تم استلام الطلب', done: true, time: '٤ يونيو · ٨:١٠' },
    { label: 'تأكيد المضيف', done: true, time: '٤ يونيو · ٨:٢٢' },
    { label: 'تم الدفع', done: true, time: '٤ يونيو · ٨:٢٤' },
    { label: 'إتمام الإقامة', done: false, time: 'بعد الوصول' },
  ];

  return (
    <BackShell active="support" go={go} title="خدمة العملاء" subtitle="مركز الدعم الموحّد · جميع القطاعات"
      actions={<Btn kind="soft" size="sm" icon="filter">تصفية</Btn>}>

      <div className="hm-sup-metrics">
        {metrics.map(m => (
          <div key={m.label} className="hm-sup-metric">
            <span className="hm-kpi-ic"><Icon name={m.ic} size={18} stroke="#15495B"/></span>
            <div><b>{m.val}</b><span>{m.label}</span></div>
          </div>
        ))}
      </div>

      <div className="hm-support">
        {/* قائمة التذاكر */}
        <div className="hm-tickets">
          <div className="hm-tickets-head"><Icon name="chat" size={18}/><b>المحادثات</b><span className="hm-tickets-count">{D.tickets.length}</span></div>
          <div className="hm-tickets-tabs"><button className="on">الكل</button><button>عاجلة</button><button>غير مقروء</button></div>
          {D.tickets.map(tk => {
            const e = D.ticketExtra[tk.id] || {};
            return (
              <button key={tk.id} className={'hm-ticket' + (tk.id === active ? ' on' : '')} onClick={() => { setActive(tk.id); setMsgs(D.chat); }}>
                <span className={'hm-prio-dot ' + (prioTone[e.priority] || 'info')}></span>
                <div className="hm-ticket-av">{tk.name.slice(0, 1)}</div>
                <div className="hm-ticket-body">
                  <div className="hm-ticket-top"><b>{tk.name}</b><span>{tk.time}</span></div>
                  <p>{tk.last}</p>
                  <div className="hm-ticket-meta">
                    <Tag tone="petrol" style={{ fontSize: 10.5, padding: '2px 7px' }}>{tk.sector}</Tag>
                    <span className={'hm-sla ' + (e.sla === 'مغلق' ? 'closed' : '')}><Icon name="clock" size={11}/> {e.sla}</span>
                    {tk.unread > 0 && <span className="hm-unread">{tk.unread}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* المحادثة */}
        <div className="hm-chat">
          <div className="hm-chat-head">
            <div className="hm-ticket-av lg">{t.name.slice(0, 1)}</div>
            <div className="hm-chat-head-info"><b>{t.name}</b><span><Icon name="pin" size={12}/> {t.sector} · {t.order}</span></div>
            <div className="hm-chat-head-actions">
              <Tag tone={sentiTone[ex.sentiment] || 'info'}>المزاج: {ex.sentiment}</Tag>
              <button className="hm-chip-btn"><Icon name="swap" size={15}/> تحويل</button>
              <button className="hm-chip-btn ok"><Icon name="check" size={15}/> إغلاق</button>
            </div>
          </div>
          <div className="hm-chat-stream" ref={endRef}>
            <div className="hm-chat-day"><span>اليوم</span></div>
            {msgs.map((m, i) => (
              <div key={i} className={'hm-bubble ' + m.from}><p>{m.text}</p><span>{m.time}</span></div>
            ))}
          </div>
          <div className="hm-ai">
            <span className="hm-ai-label"><Icon name="sparkle" size={13}/> ردود ذكية مقترحة</span>
            <div className="hm-ai-chips">{aiReplies.map((q, i) => <button key={i} onClick={() => send(q)}>{q}</button>)}</div>
          </div>
          <div className="hm-chat-input">
            <button className="hm-attach"><Icon name="plus" size={18}/></button>
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="اكتب رداً…"/>
            <Btn kind="primary" icon="send" onClick={() => send()}>إرسال</Btn>
          </div>
        </div>

        {/* بطاقة العميل 360 */}
        <div className="hm-cust">
          <div className="hm-cust-head">
            <div className="hm-cust-av">{t.name.slice(0, 1)}</div>
            <Tag tone="gold" style={{ marginInlineStart: 'auto' }}><Icon name="sparkle" size={12}/> {ex.tier}</Tag>
          </div>
          <h3>{t.name}</h3>
          <span className="hm-cust-sub"><Icon name="pin" size={13}/> {t.sector}</span>
          <div className="hm-cust-stat">
            <div><b>١٢</b><span>طلب</span></div>
            <div><b>{ex.csat}</b><span>تقييم</span></div>
            <div><b>{ex.ltv}</b><span>ر.س قيمة</span></div>
          </div>
          <div className="hm-cust-block">
            <span className="hm-cust-block-l">الطلب الحالي · {t.order}</span>
            <div className="hm-timeline">
              {timeline.map((s, i) => (
                <div key={i} className={'hm-tl-step' + (s.done ? ' done' : '')}>
                  <span className="hm-tl-dot">{s.done && <Icon name="check" size={11} stroke="#fff" sw={2.6}/>}</span>
                  <div><b>{s.label}</b><small>{s.time}</small></div>
                </div>
              ))}
            </div>
          </div>
          <div className="hm-cust-actions">
            <Btn kind="ghost" size="sm" icon="wallet">تعويض</Btn>
            <Btn kind="outline" size="sm" icon="eye">الملف الكامل</Btn>
          </div>
        </div>
      </div>
    </BackShell>
  );
}

Object.assign(window, { Support });
