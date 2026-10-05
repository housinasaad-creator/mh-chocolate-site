/*
  أصوات الشوكولا (مولَّدة بالكامل بـ Web Audio، بلا ملفات): كسر لوح، سكين، ذوبان فقاعي، قطرة، نقرة، إضافة للسلة، ختم الطلب.
  مطفأة افتراضياً، والزر في الهيدر يشغلها ويحفظ الاختيار.
*/
export function createSfx() {
  let ctx = null, master = null, noiseBuf = null, enabled = false;
  const last = {};
  const ensure = () => {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .65;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  };
  const gate = (name, ms) => { const n = performance.now(); if (last[name] && n - last[name] < ms) return false; last[name] = n; return true; };
  const run = (name, ms, fn) => { if (!enabled || !gate(name, ms) || !ensure()) return; if (ctx.state === 'suspended') ctx.resume(); try { fn(ctx.currentTime); } catch (e) {} };
  const noise = (t, dur, { type = 'bandpass', f = 2500, f2, q = 1, g = .3, at = 0 } = {}) => {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t + at); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + at + dur);
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, t + at); gn.gain.exponentialRampToValueAtTime(g, t + at + .004); gn.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
    s.connect(fl); fl.connect(gn); gn.connect(master); s.start(t + at, Math.random() * 1.4); s.stop(t + at + dur + .05);
  };
  const tone = (t, freq, dur, { type = 'sine', f2, g = .15, at = 0 } = {}) => {
    const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t + at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + at + dur);
    gn.gain.setValueAtTime(0.0001, t + at); gn.gain.exponentialRampToValueAtTime(g, t + at + .006); gn.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
    o.connect(gn); gn.connect(master); o.start(t + at); o.stop(t + at + dur + .05);
  };
  const api = {
    get enabled() { return enabled; },
    restore(v) { enabled = !!v; },   // يستعيد الحالة المحفوظة بلا صوت (المتصفح يمنع التشغيل قبل أول لمسة)
    setOn(v) { enabled = !!v; if (enabled) { ensure(); ctx && ctx.state === 'suspended' && ctx.resume(); api.ting(true); } },
    tick() { run('tick', 60, (t) => { noise(t, .035, { type: 'highpass', f: 3600, g: .22 }); tone(t, 1250, .05, { f2: 880, g: .07 }); }); },
    drip() { run('drip', 120, (t) => { tone(t, 950, .09, { f2: 360, g: .17 }); tone(t, 1900, .03, { g: .05, at: .01 }); }); },
    ting(force) { if (!enabled) return; if (!force && !gate('ting', 150)) return; ensure(); if (!ctx) return; const t = ctx.currentTime; tone(t, 1568, .55, { g: .09 }); tone(t, 2349, .42, { g: .045, at: .02 }); },
    snap() { run('snap', 500, (t) => {   // كسر لوح: طقة حادة + ثقل منخفض + فتات صغيرة
      noise(t, .08, { f: 3200, q: .8, g: .9 }); tone(t, 190, .07, { f2: 85, g: .5 });
      for (let i = 0; i < 6; i++) noise(t, .035, { f: 4200 + Math.random() * 2600, q: 1.4, g: .22, at: .09 + Math.random() * .38 });
    }); },
    knife() { run('knife', 500, (t) => { noise(t, .26, { f: 1300, f2: 7200, q: 1.1, g: .3 }); tone(t, 3400, .2, { f2: 3050, g: .045, at: .12 }); }); },
    melt() { run('melt', 1500, (t) => {   // ذوبان: فقاعات لزجة منخفضة + حفيف ناعم
      noise(t, 1.7, { type: 'lowpass', f: 480, q: .7, g: .14 });
      for (let i = 0; i < 9; i++) { const f = 85 + Math.random() * 95; tone(t, f, .13, { f2: f * (1.5 + Math.random()), g: .2, at: .08 + i * .17 + Math.random() * .08 }); }
    }); },
    whoosh() { run('whoosh', 350, (t) => { noise(t, .5, { f: 500, f2: 1900, q: .7, g: .13 }); }); },
    add() { run('add', 120, (t) => { tone(t, 880, .38, { g: .11 }); tone(t, 1320, .5, { g: .085, at: .09 }); noise(t, .2, { type: 'highpass', f: 6200, g: .1 }); }); },
    seal() { run('seal', 600, (t) => { [392, 494, 587, 784].forEach((f, i) => tone(t, f, 1.15, { g: .075, at: i * .08 })); noise(t, .6, { type: 'highpass', f: 9000, g: .06, at: .25 }); }); }
  };
  return api;
}
