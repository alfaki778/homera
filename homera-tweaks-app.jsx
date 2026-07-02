/* لوحة تعديلات هوميرا — تعيش في الصفحة الرئيسية وتخزّن في localStorage
   ليقرأها كامل الموقع عبر homera-tweaks.js */
const { useState, useEffect } = React;

function HomeraTweaks() {
  const initial = Object.assign({}, window.HOMERA_TWEAK_DEFAULTS, window.HOMERA_readTweaks());
  const [t, setTweakRaw] = useTweaks(initial);

  const setTweak = (keyOrEdits, val) => {
    const edits = (typeof keyOrEdits === 'object' && keyOrEdits !== null) ? keyOrEdits : { [keyOrEdits]: val };
    const next = Object.assign({}, t, edits);
    try { localStorage.setItem('homera_tweaks', JSON.stringify(next)); } catch (e) {}
    window.HOMERA_applyTweaks(next);
    setTweakRaw(edits);
  };

  useEffect(() => { window.HOMERA_applyTweaks(t); }, []);

  return (
    <TweaksPanel title="تعديلات هوميرا">
      <TweakSection label="الهيرو" />
      <TweakRadio label="تصميم الهيرو" value={t.heroVariant}
        options={[{value:'centered',label:'مركزي'},{value:'split',label:'مقسوم'}]}
        onChange={(v) => setTweak('heroVariant', v)} />
      <TweakText label="الترويسة الصغيرة" value={t.heroEyebrow}
        onChange={(v) => setTweak('heroEyebrow', v)} />
      <TweakText label="العنوان الرئيسي" value={t.heroTitle}
        onChange={(v) => setTweak('heroTitle', v)} />
      <TweakText label="النص التعريفي" value={t.heroText}
        onChange={(v) => setTweak('heroText', v)} />

      <TweakSection label="الطباعة" />
      <TweakSelect label="الخط" value={t.fontFamily}
        options={['Alexandria','Cairo','Tajawal','IBM Plex Sans Arabic']}
        onChange={(v) => setTweak('fontFamily', v)} />
      <TweakRadio label="وزن العناوين" value={String(t.headingWeight)}
        options={[{value:'700',label:'عريض'},{value:'800',label:'أعرض'}]}
        onChange={(v) => setTweak('headingWeight', Number(v))} />

      <TweakSection label="النمط البصري" />
      <TweakColor label="لون التمييز" value={t.accent === 'petrol' ? '#15495B' : '#C7A36B'}
        options={['#C7A36B','#15495B']}
        onChange={(v) => setTweak('accent', v === '#15495B' ? 'petrol' : 'gold')} />
      <TweakSelect label="شكل الأزرار" value={t.buttonShape}
        options={[
          {value:'hex',label:'سداسي'},
          {value:'rect',label:'مستطيل حاد'},
          {value:'rounded',label:'حواف دائرية'},
          {value:'pill',label:'كبسولة'},
          {value:'bevel',label:'مشطوف الأركان'}
        ]}
        onChange={(v) => setTweak('buttonShape', v)} />
      <TweakSlider label="استدارة الحواف" value={t.cornerRadius} min={0} max={28} step={2} unit="px"
        onChange={(v) => setTweak('cornerRadius', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<HomeraTweaks />);
