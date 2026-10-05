/*
  قطع شوكولا ثلاثية الأبعاد (three.js): سطح لامع بانعكاسات استوديو، تبديل النوع (بيتر/حليب/أبيض/روبي) بتحوّل لون ناعم،
  وتزيين فوق القطعة (ذهب/فستق/بندق/لوز) كنسخ مجسّمة (InstancedMesh) توضع على السطح الحقيقي بالإشعاع.
  خفيف للموبايل: بلا ظلال ولا معالجة لاحقة، ويتوقف الرسم لما يخرج من الشاشة، وحارس دقة يخفض الدقة إن تباطأ.
*/
import * as THREE from './vendor/three.module.min.js';

export const SHAPES = ['tablet', 'truf', 'kalp', 'elmas', 'karamel', 'dudak'];
export const TYPE_COLORS = { bitter: 0x2a130b, sutlu: 0x7d4727, beyaz: 0xf1e4c8, ruby: 0xdc668f };
const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ أدوات هندسية */
/* منحنى القلب ثم تنعيم Chaikin مرتين: يدوّر رأس القلب وشقّه فلا تظهر خدوش تظليل عند الزوايا الحادة */
const HP = (() => {
  let a = []; const N = 48;
  for (let i = 0; i < N; i++) { const t = i / N * TAU; a.push([Math.pow(Math.sin(t), 3), (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16 + 0.155]); }
  for (let k = 0; k < 3; k++) { const b = []; for (let i = 0; i < a.length; i++) { const p = a[i], q = a[(i + 1) % a.length]; b.push([.75 * p[0] + .25 * q[0], .75 * p[1] + .25 * q[1]], [.25 * p[0] + .75 * q[0], .25 * p[1] + .75 * q[1]]); } a = b; }
  return a;
})();
function heartShape(s) { const sh = new THREE.Shape(); HP.forEach(([x, y], i) => (i ? sh.lineTo(x * s, y * s) : sh.moveTo(x * s, y * s))); sh.closePath(); return sh; }
function rr(w, h, r) { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
/* ExtrudeGeometry غير مفهرسة (تظليل مسطّح بكل مثلث)؛ ندمج الرؤوس المتطابقة ونحسب نورمالات ناعمة حتى تبدو الشوكولا مستديرة */
function smooth(g) {
  const pos = g.attributes.position, n = pos.count, key = new Map(), acc = [], idx = new Array(n);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), fn = new THREE.Vector3(), e = new THREE.Vector3();
  for (let i = 0; i < n; i++) { const k = Math.round(pos.getX(i) * 1e4) + '_' + Math.round(pos.getY(i) * 1e4) + '_' + Math.round(pos.getZ(i) * 1e4); let id = key.get(k); if (id === undefined) { id = acc.length; key.set(k, id); acc.push(new THREE.Vector3()); } idx[i] = id; }
  for (let i = 0; i < n; i += 3) { a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2); fn.subVectors(c, b); e.subVectors(a, b); fn.cross(e); acc[idx[i]].add(fn); acc[idx[i + 1]].add(fn); acc[idx[i + 2]].add(fn); }
  const nor = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const v = acc[idx[i]].clone().normalize(); nor[i * 3] = v.x; nor[i * 3 + 1] = v.y; nor[i * 3 + 2] = v.z; }
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); return g;
}
function ext(shape, depth, bev, seg = 5, size = bev) { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: size, bevelSegments: seg, curveSegments: 8 }); g.rotateX(-Math.PI / 2); return smooth(g); }
function lumpy(g, amp, f, seed) {
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = Math.sin(v.x * f + seed) * Math.sin(v.y * f * 1.3 + seed * 2) * Math.sin(v.z * f * .9 + seed * 3) + .5 * Math.sin(v.x * f * 2.7 + v.y * f * 2.1 + seed) * Math.sin(v.z * f * 3.1); v.multiplyScalar(1 + amp * n); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
function speckle(size, base, spread, dots) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < dots; i++) { const v = 128 + (Math.random() - .5) * spread; g.fillStyle = `rgba(${v},${v},${v},${Math.random() * .5})`; g.beginPath(); g.arc(Math.random() * size, Math.random() * size, Math.random() * 2.4 + .4, 0, TAU); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t;
}
function fit(group, size) {
  const b = new THREE.Box3().setFromObject(group), s = new THREE.Vector3(), c = new THREE.Vector3(); b.getSize(s); b.getCenter(c);
  const k = size / Math.max(s.x, s.y, s.z); group.children.forEach((ch) => { ch.position.sub(c); }); group.scale.setScalar(k); return group;
}
const ease = { out: (t) => 1 - Math.pow(1 - t, 3), back: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, io: (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) };

/* ------------------------------------------------------------------ بيئة الاستوديو */
function makeEnv(renderer) {
  const sc = new THREE.Scene();
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: 0x1a0d09, side: THREE.BackSide })));
  const panel = (w, h, col, k, pos) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); sc.add(m); };
  panel(6, 4, 0xfff0da, 7, [-5, 7, 4]);
  panel(3, 7, 0xff7fb0, 1.5, [7, 2, -1]);
  panel(9, 2, 0xffd49a, 3.4, [0, 6, -8]);
  panel(4, 4, 0xaabcff, .9, [-7, 1, -5]);
  panel(8, 3, 0xfff6ea, 2.2, [3, 4, 7]);
  panel(10, 10, 0x40231a, .7, [0, -6, 0]);
  const pm = new THREE.PMREMGenerator(renderer), rt = pm.fromScene(sc, 0.03); pm.dispose(); return rt.texture;
}

/* ------------------------------------------------------------------ المنصّة */
export function createStage(canvas, o = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const coarse = matchMedia('(pointer: coarse)').matches;
  let dprMax = Math.min(devicePixelRatio || 1, coarse ? 1.75 : 2);
  const scene = new THREE.Scene(); scene.environment = makeEnv(renderer);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
  const key = new THREE.DirectionalLight(0xfff0dd, 1.1); key.position.set(-3, 6, 4); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffd8c0, 0x2a1410, 0.35));

  /* مواد مشتركة: تتغير ألوانها معاً عند تبديل النوع */
  const dust = speckle(128, '#fff', 90, 900);
  const mGloss = new THREE.MeshPhysicalMaterial({ color: TYPE_COLORS.bitter, roughness: .2, metalness: 0, clearcoat: 1, clearcoatRoughness: .07, envMapIntensity: 1.25 });
  const mFlat = mGloss.clone(); mFlat.flatShading = true; mFlat.roughness = .17;
  const mDust = new THREE.MeshPhysicalMaterial({ color: TYPE_COLORS.bitter, roughness: .8, bumpMap: dust, bumpScale: .7, map: dust, clearcoat: 0, sheen: 1, sheenRoughness: .55, sheenColor: new THREE.Color(0xe6cdb0), envMapIntensity: .55 }); // مسحوق كاكاو ناعم
  const choc = [mGloss, mFlat, mDust];
  const gold = new THREE.MeshStandardMaterial({ color: 0xf0c968, emissive: 0x3d2900, metalness: 1, roughness: .3, side: THREE.DoubleSide, envMapIntensity: 1.5 });

  /* ---------------------------------------------------------------- النماذج */
  const builders = {
    tablet() {
      const g = new THREE.Group();
      const base = new THREE.Mesh(ext(rr(1.62, 2.14, .08), .05, .03, 3), mGloss); g.add(base);
      const t1 = ext(rr(.45, .45, .07), .06, .035, 4), t2 = ext(rr(.3, .3, .05), .025, .025, 3);
      for (let c = 0; c < 3; c++) for (let r = 0; r < 4; r++) {
        const x = (c - 1) * .5, z = (r - 1.5) * .5;
        const a = new THREE.Mesh(t1, mGloss); a.position.set(x, .06, z); g.add(a);
        const b = new THREE.Mesh(t2, mGloss); b.position.set(x, .06 + .13, z); g.add(b);
      }
      return fit(g, 2.35);
    },
    truf() {
      const g = new THREE.Group(), geo = lumpy(new THREE.SphereGeometry(1, 40, 28), .045, 5.5, 1.3);
      [[-.62, .5, .22, .62], [.62, .5, .3, .6], [0, .5, -.62, .6]].forEach(([x, y, z, r], i) => { const m = new THREE.Mesh(i === 1 ? lumpy(new THREE.SphereGeometry(1, 40, 28), .05, 5.1, 4.2 + i) : geo, mDust); m.scale.setScalar(r); m.position.set(x, y, z); m.rotation.y = i * 1.7; g.add(m); });
      return fit(g, 2.1);
    },
    kalp() {
      const g = new THREE.Group(); g.add(new THREE.Mesh(ext(heartShape(.9), .2, .2, 10, .085), mGloss));
      return fit(g, 2.25);
    },
    elmas() {
      const g = new THREE.Group();
      const pts = [[0, -1], [.46, -.52], [.95, 0], [.8, .26], [.52, .5], [0, .52]].map(([x, y]) => new THREE.Vector2(x, y));
      const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 10), mFlat); g.add(m); m.rotation.y = Math.PI / 10;
      return fit(g, 2.1);
    },
    karamel() {
      const g = new THREE.Group(), pr = [new THREE.Vector2(1.03, -.05), new THREE.Vector2(1.03, 0)];
      for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI / 2; pr.push(new THREE.Vector2(Math.cos(a), Math.sin(a) * .8)); }
      pr[pr.length - 1].x = 0.0001;
      g.add(new THREE.Mesh(new THREE.LatheGeometry(pr, 48), mGloss));
      const f = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .018, 6), gold); f.position.set(.04, .8, .02); g.add(f);
      return fit(g, 2.0);
    },
    dudak() {
      const s = new THREE.Shape();
      s.moveTo(-1, 0); s.bezierCurveTo(-.78, .34, -.45, .52, -.12, .32); s.quadraticCurveTo(0, .22, .12, .32);
      s.bezierCurveTo(.45, .52, .78, .34, 1, 0); s.bezierCurveTo(.78, -.52, .34, -.82, 0, -.8); s.bezierCurveTo(-.34, -.82, -.78, -.52, -1, 0);
      const g = new THREE.Group(); g.add(new THREE.Mesh(ext(s, .2, .17, 9, .1), mGloss));
      return fit(g, 2.35);
    }
  };
  const tilts = { tablet: .95, truf: .35, kalp: .8, elmas: .55, karamel: .3, dudak: .85 };

  /* ---------------------------------------------------------------- التزيين */
  const ray = new THREE.Raycaster(), _o = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _c = new THREE.Color();
  const toppingDefs = {
    altin: { n: 36, geo: () => { const g = new THREE.CircleGeometry(1, 5); g.rotateX(-Math.PI / 2); return g; }, mat: () => gold, size: [.035, .075], flat: true, off: .006 },
    fistik: { n: 52, geo: () => new THREE.IcosahedronGeometry(1, 0), mat: () => new THREE.MeshStandardMaterial({ roughness: .55, flatShading: true }), size: [.03, .06], colors: [0x7f9f3e, 0x9cbd55, 0xb4cf72], off: .012 },
    findik: { n: 30, geo: () => new THREE.IcosahedronGeometry(1, 1), mat: () => new THREE.MeshStandardMaterial({ roughness: .62, flatShading: true }), size: [.045, .08], colors: [0xa8702f, 0xbf8a46, 0x8b5826], off: .02 },
    badem: { n: 22, geo: () => new THREE.SphereGeometry(1, 10, 8), mat: () => new THREE.MeshStandardMaterial({ roughness: .7, color: 0xffffff }), size: [.07, .11], colors: [0xd9b47c, 0xe4c590, 0xc9a06a], off: .012, almond: true }
  };
  function decorate(holder, kind) {
    holder.userData.deco && (holder.remove(holder.userData.deco), holder.userData.deco.traverse((m) => m.isInstancedMesh && m.dispose()), holder.userData.deco = null);
    const def = toppingDefs[kind]; if (!def) return;
    holder.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(holder); const inv = holder.matrixWorld.clone().invert(); box.applyMatrix4(inv);
    const geo = def.geo(), im = new THREE.InstancedMesh(geo, def.mat(), def.n); let k = 0;
    const hits = [];
    for (let tries = 0; tries < def.n * 6 && hits.length < def.n; tries++) {
      _o.set(box.min.x + Math.random() * (box.max.x - box.min.x), box.max.y + 2, box.min.z + Math.random() * (box.max.z - box.min.z));
      _d.set(0, -1, 0);
      _o.applyMatrix4(holder.matrixWorld); _d.transformDirection(holder.matrixWorld);
      ray.set(_o, _d);
      const h = ray.intersectObject(holder, true)[0]; if (!h || !h.face) continue;
      const p = holder.worldToLocal(h.point.clone()), n = h.face.normal.clone().normalize(); if (n.y < .35) continue;
      hits.push([p, n]);
    }
    hits.forEach(([p, n]) => {
      const sz = def.size[0] + Math.random() * (def.size[1] - def.size[0]);
      _q.setFromUnitVectors(_up, n); const yaw = new THREE.Quaternion().setFromAxisAngle(_up, Math.random() * TAU); _q.multiply(yaw);
      if (!def.flat) { const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler((Math.random() - .5) * 1.2, 0, (Math.random() - .5) * 1.2)); _q.multiply(tilt); }
      const pos = p.clone().addScaledVector(n, def.off + sz * (def.flat ? 0 : .35));
      if (def.almond) _s.set(sz * 1.5, sz * .42, sz * .8); else if (def.flat) _s.set(sz * (.7 + Math.random() * .8), sz, sz * (.7 + Math.random() * .8)); else _s.set(sz * (.8 + Math.random() * .5), sz * (.7 + Math.random() * .4), sz * (.8 + Math.random() * .5));
      _m.compose(pos, _q, _s); im.setMatrixAt(k, _m);
      if (def.colors) { _c.setHex(def.colors[(Math.random() * def.colors.length) | 0]); im.setColorAt(k, _c); }
      k++;
    });
    im.count = k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    holder.add(im); holder.userData.deco = im;
    return im;
  }

  /* ---------------------------------------------------------------- مشهد: حامل > ميل > دوران > نموذج */
  const holder = new THREE.Group(), tilt = new THREE.Group(), spin = new THREE.Group();
  holder.add(tilt); tilt.add(spin); scene.add(holder);
  let model = null, shape = null, kind = 'yok', type = o.type || 'bitter';
  const cache = {};
  function getModel(id) { return (cache[id] = cache[id] || builders[id]()); }

  // ظل تلامس ناعم
  const sh = document.createElement('canvas'); sh.width = sh.height = 128; { const g = sh.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.55; scene.add(shadow);

  // غبار ذهبي
  const NP = o.dust || 70, pg = new THREE.BufferGeometry(), pp = new Float32Array(NP * 3), pv = new Float32Array(NP);
  for (let i = 0; i < NP; i++) { pp[i * 3] = (Math.random() - .5) * 6; pp[i * 3 + 1] = (Math.random() - .5) * 4.5; pp[i * 3 + 2] = (Math.random() - .5) * 3 - .5; pv[i] = .05 + Math.random() * .12; }
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const sp = document.createElement('canvas'); sp.width = sp.height = 32; { const g = sp.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,225,150,1)'); gr.addColorStop(.35, 'rgba(255,200,110,.55)'); gr.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: .09, map: new THREE.CanvasTexture(sp), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 })); scene.add(pts);

  /* ---------------------------------------------------------------- تحريك */
  const tweens = []; const tw = (dur, fn, done) => tweens.push({ t0: performance.now(), dur, fn, done });
  let yaw = 0, yawV = o.hero ? .35 : .45, dragging = false, pitch = 0, burst = 0, bob = 0, userAt = -1e9;

  function setShape(id, instant) {
    if (id === shape || !builders[id]) return; const old = model; shape = id;
    const m = getModel(id); const wrap = new THREE.Group(); wrap.add(m);
    const apply = () => { tilt.rotation.x = tilts[id]; };
    if (instant || !old) { if (old) spin.remove(old); spin.add(wrap); model = wrap; apply(); wrap.scale.setScalar(1); decorate(model, kind); return; }
    spin.add(wrap); wrap.scale.setScalar(.001); model = wrap; decorate(wrap, kind);
    tw(260, (p) => { const k = 1 - ease.out(p); old.scale.setScalar(Math.max(.001, k)); old.rotation.y += .12; }, () => { spin.remove(old); });
    tw(520, (p) => { wrap.scale.setScalar(Math.max(.001, ease.back(p))); }, apply);
    const from = tilt.rotation.x, to = tilts[id]; tw(520, (p) => { tilt.rotation.x = from + (to - from) * ease.io(p); });
    yaw += Math.PI * .6;
  }
  function setType(id) {
    if (!TYPE_COLORS[id] || id === type) return; type = id;
    const to = new THREE.Color(TYPE_COLORS[id]), from = mGloss.color.clone();
    tw(560, (p) => { const k = ease.io(p); choc.forEach((m) => m.color.copy(from).lerp(to, k)); const s = 1 + Math.sin(p * Math.PI) * .07; holder.scale.setScalar(s); mGloss.envMapIntensity = mFlat.envMapIntensity = 1.25 + Math.sin(p * Math.PI) * 1.1; }, () => { holder.scale.setScalar(1); });
    burst = 1;
  }
  function setTopping(id) { if (id === kind) return; kind = id; if (model) { decorate(model, kind); const im = model.userData.deco; if (im) tw(420, (p) => { im.scale.setScalar(Math.max(.001, ease.back(p))); }); } }
  choc.forEach((m) => m.color.setHex(TYPE_COLORS[type]));
  function wobble() { const t0 = performance.now(); burst = 1; tw(700, (p) => { holder.rotation.z = Math.sin(p * 18) * (1 - p) * .12; holder.scale.setScalar(1 + Math.sin(p * Math.PI) * .06); }, () => { holder.rotation.z = 0; holder.scale.setScalar(1); }); }

  /* ---------------------------------------------------------------- حجم + دقة */
  function resize() {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300, dpr = dprMax;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); camera.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), need = o.need || 1.75;
    const dist = Math.max(need / t, (need * 0.9) / (t * camera.aspect)); camera.position.set(0, 0.35, dist); camera.lookAt(0, -0.05, 0); camera.updateProjectionMatrix();
  }
  const onResize = () => resize(); addEventListener('resize', onResize);
  let disposed = false;

  /* ---------------------------------------------------------------- تفاعل */
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, moved: 0 }; dragging = true; userAt = performance.now(); canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - down.lx; down.lx = e.clientX; down.moved += Math.abs(dx); yaw += dx * .011; yawV = dx * .011 * 60 * .5; userAt = performance.now(); });
  const up = (e) => { if (!down) return; const tap = down.moved < 6 && performance.now() - down.t < 350; down = null; dragging = false; if (tap && o.onTap) o.onTap(); if (tap) wobble(); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { down = null; dragging = false; });

  /* ---------------------------------------------------------------- حلقة الرسم */
  let vis = false, raf = 0, last = 0, acc = 0, frames = 0, slow = 0; const cap = coarse ? 1 / 30 : 1 / 60;
  function render(now) {
    raf = 0; if (disposed || !vis || document.hidden) return;
    const dtRaw = Math.min(.05, (now - last) / 1000); last = now; acc += dtRaw;
    if (acc < cap * .9) { raf = requestAnimationFrame(render); return; }
    const dt = acc; acc = 0;
    for (let i = tweens.length - 1; i >= 0; i--) { const t = tweens[i], p = Math.min(1, (now - t.t0) / t.dur); t.fn(p); if (p >= 1) { tweens.splice(i, 1); t.done && t.done(); } }
    const idle = now - userAt > 1400;
    if (!dragging) { yaw += yawV * dt; yawV += ((idle ? (o.hero ? .38 : .5) : 0) - yawV) * Math.min(1, dt * (idle ? 1.1 : 2.4)); }
    spin.rotation.y = yaw; bob += dt; holder.position.y = Math.sin(bob * 1.25) * .06; shadow.scale.setScalar(1 - Math.sin(bob * 1.25) * .05); shadow.material.opacity = .9;
    burst = Math.max(0, burst - dt * 1.4); const arr = pg.attributes.position.array;
    for (let i = 0; i < NP; i++) { arr[i * 3 + 1] += pv[i] * dt * (1 + burst * 6); if (arr[i * 3 + 1] > 2.4) arr[i * 3 + 1] = -2.2; }
    pg.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    frames++; if (dt > .045) slow++;
    if (frames === 50) { if (slow > 22 && dprMax > 1) { dprMax = Math.max(1, dprMax - .3); resize(); } frames = 0; slow = 0; }
    raf = requestAnimationFrame(render);
  }
  const wake = () => { if (!disposed && vis && !raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(render); } };
  const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; wake(); }, { rootMargin: '80px' }); io.observe(canvas);
  document.addEventListener('visibilitychange', wake);

  /* تفكيك كامل: إيقاف الحلقة، تحرير الهندسة والمواد والخامات، وإفقاد سياق WebGL لتحرير ذاكرة كرت الشاشة */
  function dispose() {
    if (disposed) return; disposed = true; vis = false; cancelAnimationFrame(raf); raf = 0; tweens.length = 0;
    removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', wake); io.disconnect();
    const killMat = (m) => { ['map', 'bumpMap', 'envMap'].forEach((k) => m[k] && m[k].dispose && m[k].dispose()); m.dispose(); };
    const kill = (root) => root.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.isInstancedMesh) n.dispose(); if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach(killMat); });
    kill(scene); Object.values(cache).forEach(kill); choc.forEach(killMat); gold.dispose(); dust.dispose();
    if (scene.environment) scene.environment.dispose(); scene.environment = null;
    renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.width = 1; renderer.domElement.height = 1;
  }

  resize(); setShape(o.shape || 'kalp', true);

  return {
    dispose, get disposed() { return disposed; },
    setShape, setType, setTopping, wobble, resize,
    get shape() { return shape; }, get type() { return type; }, get topping() { return kind; },
    snapshot(px = 150) {
      for (const t of tweens.splice(0)) { t.fn(1); t.done && t.done(); } // نُنهي كل الحركات حتى تُلتقط القطعة بوضعها النهائي
      renderer.render(scene, camera);
      const c = document.createElement('canvas'), r = canvas.width / canvas.height; c.width = px; c.height = Math.round(px / r); c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
      return c.toDataURL('image/webp', .82);
    },
    renderNow() { renderer.render(scene, camera); },
    setYaw(v) { yaw = v; }
  };
}
