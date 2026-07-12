/* لوحة تعديلات الداشبورد */
const { useEffect } = React;

function DashTweaks() {
  const initial = Object.assign({}, window.DASH_TWEAK_DEFAULTS, window.DASH_readTweaks());
  const [t, setRaw] = useTweaks(initial);
  const setTweak = (k, v) => {
    const edits = (typeof k === 'object') ? k : { [k]: v };
    const next = Object.assign({}, t, edits);
    try { localStorage.setItem('homera_dash_tweaks', JSON.stringify(next)); } catch (e) {}
    window.DASH_applyTweaks(next);
    setRaw(edits);
  };
  useEffect(() => { window.DASH_applyTweaks(t); }, []);

  return (
    <TweaksPanel title="تعديلات اللوحة">
      <TweakSection label="المظهر" />
      <TweakRadio label="الوضع" value={t.theme}
        options={[{value:'light',label:'فاتح'},{value:'dark',label:'داكن'}]}
        onChange={(v) => setTweak('theme', v)} />
      <TweakColor label="اللون المميّز" value={t.accent === 'petrol' ? '#15495B' : '#C7A36B'}
        options={['#C7A36B','#15495B']}
        onChange={(v) => setTweak('accent', v === '#15495B' ? 'petrol' : 'gold')} />
      <TweakSection label="التخطيط" />
      <TweakRadio label="كثافة الجداول" value={t.density}
        options={[{value:'comfy',label:'مريح'},{value:'compact',label:'مدمج'}]}
        onChange={(v) => setTweak('density', v)} />
      <TweakSlider label="استدارة البطاقات" value={t.cardRadius} min={0} max={28} step={2} unit="px"
        onChange={(v) => setTweak('cardRadius', v)} />
    </TweaksPanel>
  );
}
ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<DashTweaks />);
