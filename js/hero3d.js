/*
  هيرو قصة على السكرول (كما في موقع العطور): لوح شوكولا كبير واقف على سطح لامع بانعكاسه، وكل مرحلة من السكرول تحرّكه:
  0 واقف  ->  1 يتكسّر (فتات + نصفه يسقط)  ->  2 سكين تقطع شريحة وتظهر طبقاتها  ->  3 يلين ويذوب في بركة  ->  4 قلب روبي يطلع من البركة.
  التقدّم دالة حتمية في p (0..1) فيعمل للأمام والخلف. السكرول عادي (لا اختطاف للتمرير) والمشهد يُفكَّك بعد الخروج من الشاشة.
*/
import { THREE, baseStage, makeMats, TYPE_COLORS, ease, rr, smooth, paintType } from './lib3d.js';
import { buildWhole, decorate } from './models.js';

const PW = 1.84, PH = 2.5, TS = .5, STEP = .56;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1), ss = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
export const CHAPTERS = [0, .16, .36, .58, .82];

export function createHero(canvas, host, opts = {}) {
  const S = baseStage(canvas, { fov: 28, exposure: 1.12, dprCap: 1.5 });
  if (!S) return null;
  const { scene, camera, mats: M, coarse } = S;
  const M2 = makeMats(M); paintType(M, TYPE_COLORS.bitter); paintType(M2, TYPE_COLORS.ruby);

  const key = new THREE.DirectionalLight(0xfff0dd, 1.5); key.position.set(-3, 6, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe2c8, .9); fill.position.set(3, 2.5, 7); scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xffd8c0, 0x3a1c12, .65));

  /* أرضية لامعة بحواف تتلاشى + ظل تلامس */
  const rad = (stops, size = 256) => { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([p, col]) => gr.addColorStop(p, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size); return new THREE.CanvasTexture(c); };
  const fadeTex = rad([[0, '#fff'], [.5, '#bdbdbd'], [1, '#000']]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshPhysicalMaterial({ color: 0x2a130a, roughness: .14, metalness: .1, clearcoat: 1, clearcoatRoughness: .1, transparent: true, alphaMap: fadeTex, envMapIntensity: 1.4, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.006; floor.renderOrder = -3; scene.add(floor);
  const shTex = rad([[0, 'rgba(0,0,0,.75)'], [.55, 'rgba(0,0,0,.3)'], [1, 'rgba(0,0,0,0)']], 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .004; shadow.renderOrder = -2; scene.add(shadow);

  /* ------------------------------------------------------------ العالم (يُستنسخ مرآةً للانعكاس) */
  const world = new THREE.Group(); world.name = 'world';
  const mkExt = (shape, depth, bev, seg = 4) => smooth(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: seg, curveSegments: 6 }));
  const plateG = mkExt(rr(PW, PH / 2, .09), .06, .03, 3), tileO = mkExt(rr(TS, TS, .07), .07, .035), tileI = mkExt(rr(.34, .34, .05), .03, .025, 3);
  const faceMat = new THREE.MeshStandardMaterial({ color: 0x6a4630, roughness: .8, bumpMap: M.dust, bumpScale: 1.2 });
  const nutMat = new THREE.MeshStandardMaterial({ roughness: .6, flatShading: true });
  const rowY = (r) => PH / 2 + (1.5 - r) * STEP;
  const mkHalf = (name, rows, cy) => {
    const g = new THREE.Group(); g.name = name; g.position.y = cy;
    const plate = new THREE.Mesh(plateG, M.gloss); plate.position.z = -.045; g.add(plate);
    rows.forEach((r) => { for (let c = 0; c < 3; c++) { const x = (c - 1) * STEP, y = rowY(r) - cy; const a = new THREE.Mesh(tileO, M.gloss); a.position.set(x, y, .06); g.add(a); const b = new THREE.Mesh(tileI, M.gloss); b.position.set(x, y, .06 + .075); g.add(b); } });
    // وجه الكسر الخشن + قطع بندق
    const up = name === 'bot', fy = up ? PH / 4 : -PH / 4;
    const face = new THREE.Mesh(new THREE.BoxGeometry(PW - .12, .02, .13), faceMat); face.position.set(0, fy + (up ? .004 : -.004), .005); g.add(face);
    const ng = new THREE.IcosahedronGeometry(1, 0), im = new THREE.InstancedMesh(ng, nutMat, 16), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), cc = new THREE.Color();
    for (let i = 0; i < 16; i++) { const r = .035 + Math.random() * .035; q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3)); s3.set(r * 1.3, r * .9, r); m4.compose(new THREE.Vector3((Math.random() - .5) * (PW - .3), fy + (up ? .01 : -.01), -.03 + Math.random() * .09), q, s3); im.setMatrixAt(i, m4); cc.setHex([0xb98a52, 0xc79559, 0xa87340][i % 3]); im.setColorAt(i, cc); }
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; g.add(im);
    return g;
  };
  const bar = new THREE.Group(); bar.name = 'bar'; bar.rotation.x = -.09;
  const top = mkHalf('top', [0, 1], PH * .75), bot = mkHalf('bot', [2, 3], PH * .25); bar.add(bot, top); world.add(bar);

  // شريحة المقطع: طبقات (قاعدة، مقرمش، كراميل، قشرة بنقوش) مواجهة للكاميرا
  const slab = new THREE.Group(); slab.name = 'slab'; slab.visible = false;
  { const dark = new THREE.MeshStandardMaterial({ color: 0x3a1e12, roughness: .6, bumpMap: M.dust, bumpScale: .5 }), crunch = new THREE.MeshStandardMaterial({ color: 0xa57a4a, roughness: .85, bumpMap: M.dust, bumpScale: 1 }), car = new THREE.MeshPhysicalMaterial({ color: 0xd08a2e, roughness: .2, clearcoat: .9 });
    const band = (w, h, y, mat, depth = .3) => { const m = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(w, h, h * .22), { depth, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 2, curveSegments: 4 }), mat); m.position.set(0, y, 0); slab.add(m); return m; };
    band(PW * .98, .13, -.22, dark); band(PW * .96, .15, -.085, crunch); band(PW * .96, .12, .05, car);
    const topShell = band(PW * .98, .14, .185, M.gloss); topShell.position.z = 0;
    for (let c = 0; c < 3; c++) { const b = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(.44, .1, .035), { depth: .3, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 2, curveSegments: 4 }), M.gloss); b.position.set((c - 1) * STEP, .3, 0); slab.add(b); }
    const ng = new THREE.IcosahedronGeometry(1, 0), im = new THREE.InstancedMesh(ng, nutMat, 46), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), cc = new THREE.Color();
    for (let i = 0; i < 46; i++) { const r = .022 + Math.random() * .03; q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3)); s3.set(r * 1.3, r, r); m4.compose(new THREE.Vector3((Math.random() - .5) * (PW * .9), -.085 + (Math.random() - .5) * .1, .32), q, s3); im.setMatrixAt(i, m4); cc.setHex([0xb98a52, 0xc79559, 0xa87340, 0xdcb87f][i % 4]); im.setColorAt(i, cc); }
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; slab.add(im); slab.scale.setScalar(1); }
  world.add(slab);

  const knife = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .05), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); knife.name = 'knife'; knife.visible = false; world.add(knife);

  // فتات الكسر (باليستي حتمي)
  const NC = 46, cg = new THREE.IcosahedronGeometry(1, 0), crumbs = new THREE.InstancedMesh(cg, new THREE.MeshStandardMaterial({ roughness: .45, flatShading: true }), NC); crumbs.name = 'crumbs'; crumbs.frustumCulled = false;
  const C0 = []; { const cc = new THREE.Color(); for (let i = 0; i < NC; i++) { const nut = i % 4 === 0; C0.push({ x: (Math.random() - .5) * (PW - .2), z: -.02 + Math.random() * .1, vx: (Math.random() - .5) * 2.2, vy: .9 + Math.random() * 1.7, vz: -.2 + Math.random() * 1.6, s: nut ? .022 + Math.random() * .026 : .014 + Math.random() * .026, r: Math.random() * 6, rv: (Math.random() - .5) * 8 }); cc.setHex(nut ? 0xc79559 : [0x2a130b, 0x3a1d10, 0x4a2a18][i % 3]); crumbs.setColorAt(i, cc); } crumbs.instanceColor.needsUpdate = true; }
  world.add(crumbs);

  // بركة الذوبان
  const pg = new THREE.CircleGeometry(1, 96); { const p = pg.attributes.position; for (let i = 1; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), a = Math.atan2(y, x), k = 1 + .09 * Math.sin(3 * a + 1) + .05 * Math.sin(5 * a + 2) + .03 * Math.sin(8 * a); p.setXY(i, x * k, y * k); } }
  const puddle = new THREE.Mesh(pg, new THREE.MeshPhysicalMaterial({ color: 0x24110a, roughness: .1, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: .8 })); puddle.name = 'puddle'; puddle.rotation.x = -Math.PI / 2; puddle.position.set(0, .012, .1); puddle.scale.setScalar(.001); world.add(puddle);

  // قلب روبي بزينة ذهب
  const heartG = new THREE.Group(); heartG.name = 'heart'; heartG.visible = false; world.add(heartG);
  const heartWhole = buildWhole('kalp', M2); heartG.add(heartWhole);
  scene.add(world); scene.updateMatrixWorld(true); decorate(heartWhole, 'altin', M2);

  /* ------------------------------------------------------------ انعكاس: نسخة مقلوبة بمواد تتلاشى مع البعد عن الأرض */
  const mirror = new THREE.Group(); mirror.scale.y = -1; const mClone = world.clone(true); mirror.add(mClone); scene.add(mirror);
  const patched = new Map(), killList = [];
  mClone.traverse((o) => {
    if (!o.material) return; o.renderOrder = -1; o.castShadow = false;
    const map = (m) => { let c = patched.get(m); if (c) return c; c = m.clone(); c.transparent = true; c.depthWrite = false; c.customProgramCacheKey = () => 'reflFade';
      c.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vRY;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvec4 rw0 = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nrw0 = instanceMatrix * rw0;\n#endif\nvRY = (modelMatrix * rw0).y;'); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vRY;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.a *= clamp(1.0 + vRY * 0.9, 0.0, 1.0) * 0.36;'); };
      patched.set(m, c); killList.push(c); return c; };
    o.material = Array.isArray(o.material) ? o.material.map(map) : map(o.material);
  });
  const names = ['bar', 'top', 'bot', 'slab', 'knife', 'crumbs', 'puddle', 'heart'];
  const real = {}, refl = {}; names.forEach((n) => { real[n] = world.getObjectByName(n); refl[n] = mClone.getObjectByName(n); });
  // الفتات المنسوخ يحتاج مصفوفات خاصة (copy يعمل نسخة مستقلة)

  /* ------------------------------------------------------------ الجدول الزمني (دالة حتمية في p) */
  const dm = new THREE.Matrix4(), dq = new THREE.Quaternion(), dp = new THREE.Vector3(), ds = new THREE.Vector3(), de = new THREE.Euler();
  let intro = 0;
  function apply(P, p, t) {
    const bar = P.bar, k = ease.out(intro);
    bar.scale.setScalar(.9 + .1 * k); bar.rotation.y = Math.sin(t * .45) * .12 * (1 - seg(p, .18, .3)) + seg(p, .92, 1) * 0;
    // كسر
    const a = seg(p, .14, .23), f = seg(p, .23, .37), eF = ease.out(f), shake = Math.sin(t * 70) * .008 * a * (1 - ss(f * 3 > 1 ? 1 : f * 3));
    P.top.visible = true;
    P.top.position.set(lerp(0, 1.5, eF) + shake, lerp(PH * .75, .15, eF) + Math.sin(eF * Math.PI) * .85 + a * .03, lerp(0, .75, eF));
    P.top.rotation.set(-(Math.PI / 2) * eF + (-.05 * a * (1 - f)), lerp(0, -.45, eF), -.06 * a * (1 - f));
    // فتات
    const tc = Math.max(0, (p - .225) / .13) * 1.5, show = p > .222;
    for (let i = 0; i < NC; i++) { const c = C0[i]; let x = c.x, y = PH / 2 + .02, z = c.z; const g = 6.5;
      if (show) { const th = (c.vy + Math.sqrt(c.vy * c.vy + 2 * g * (y - c.s))) / g; if (tc < th) { x += c.vx * tc; y += c.vy * tc - .5 * g * tc * tc; z += c.vz * tc; } else { const e2 = tc - th; x += c.vx * th + c.vx * .18 * (1 - Math.exp(-e2 * 3)); z += c.vz * th + c.vz * .18 * (1 - Math.exp(-e2 * 3)); y = c.s * .6 + Math.abs(Math.sin(e2 * 9)) * .06 * Math.exp(-e2 * 5); } }
      const sc = show ? c.s * (1 - seg(p, .56, .7)) : 0; de.set(c.r + c.rv * tc, c.r * .7, c.r * .4); dq.setFromEuler(de); dp.set(x, y, z); ds.set(sc, sc * .8, sc * 1.1); dm.compose(dp, dq, ds); P.crumbs.setMatrixAt(i, dm); }
    P.crumbs.instanceMatrix.needsUpdate = true;
    // سكين + شريحة المقطع
    const kp = seg(p, .38, .44), sp = seg(p, .44, .54), m = ease.io(seg(p, .58, .78));
    P.knife.visible = kp > 0 && kp < 1; P.knife.position.set(lerp(-1.3, 1.3, kp), PH / 2 + .3, .17); P.knife.material.opacity = Math.sin(kp * Math.PI) * .95; P.knife.rotation.z = .14;
    P.slab.visible = sp > 0 && m < .96;
    const sK = ease.back(sp) * (1 - m * .85); P.slab.scale.setScalar(Math.max(.001, sK) * .98);
    P.slab.position.set(0, lerp(PH / 2 - .1, PH / 2 + .62, ease.out(sp)) * (1 - .86 * m) + m * .1, lerp(.1, .22, sp)); P.slab.rotation.set(lerp(-1.25, 0, ease.out(sp)), 0, 0);
    // ذوبان
    P.bot.scale.set(1 + .34 * m, 1 - .86 * m, 1 + .2 * m); P.bot.position.y = PH * .25 * (1 - .86 * m); P.bot.visible = m < .985;
    P.top.scale.set(1 + .3 * m, 1 - .7 * m, 1 + .3 * m); if (m > .95) P.top.visible = false;
    const h = seg(p, .8, .94), pr = (m > .02 ? .08 + 1.75 * Math.pow(m, 1.1) : 0.001) * (1 - .8 * ease.io(seg(p, .84, .98)));
    P.puddle.scale.setScalar(Math.max(.001, pr));
    // قلب يطلع من البركة
    P.heart.visible = h > .001; P.heart.scale.setScalar(Math.max(.001, ease.back(h)) * 1.2); P.heart.position.set(0, lerp(-.5, 0, ease.out(h)), .1); P.heart.rotation.set(0, Math.sin(t * .55) * .38 + (1 - ease.out(h)) * 4, 0);   // الطرف نحو الكاميرا، ويتمايل قليلاً (لا دوران كامل يُظهر الشقّ)
  }
  function frameUpdate(p, t) {
    apply(real, p, t); apply(refl, p, t);
    // ظل التلامس
    const m = ease.io(seg(p, .58, .78)), hh = seg(p, .8, .94); shadow.scale.set(lerp(2.5, 3.8, m) * (1 - .1 * hh), lerp(1.0, 2.6, m), 1); shadow.position.set(lerp(0, .4, seg(p, .23, .37)), .004, .1);
    shadow.material.opacity = .95;
  }
  // عيّنة الفتات المنسوخ تُحدَّث بنفس الدالة (refl.crumbs له instanceMatrix خاص)

  /* ------------------------------------------------------------ الكاميرا */
  const KF = [
    { p: 0, az: 0, el: .17, d: 1, look: [0, 1.15, 0] }, { p: .16, az: .1, el: .19, d: .93, look: [0, 1.25, 0] }, { p: .3, az: .42, el: .3, d: .78, look: [.3, 1.35, 0] },
    { p: .4, az: -.22, el: .22, d: .88, look: [.55, 1.0, 0] }, { p: .54, az: .05, el: .2, d: .78, look: [0, 1.15, 0] }, { p: .68, az: -.38, el: .36, d: .8, look: [0, .35, 0] },
    { p: .84, az: 0, el: .3, d: .98, look: [0, .4, 0] }, { p: 1, az: .1, el: .36, d: 1.06, look: [0, .3, 0] }
  ];
  let dist0 = 8, px = 0;
  S.onResize = (w, h) => {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); dist0 = Math.max(1.55 / (t * camera.aspect), 1.95 / t);
    if (camera.aspect < 1) camera.setViewOffset(w, h, 0, h * .21, w, h); else camera.setViewOffset(w, h, -w * .17, 0, w, h);
  };
  S.onResize(canvas.clientWidth || 300, canvas.clientHeight || 300);
  function camAt(p) {
    let i = 0; while (i < KF.length - 2 && p > KF[i + 1].p) i++;
    const a = KF[i], b = KF[i + 1], k = ss(clamp((p - a.p) / (b.p - a.p), 0, 1)), L = (u, v) => lerp(u, v, k);
    const az = L(a.az, b.az) + px * .1, el = L(a.el, b.el), d = dist0 * L(a.d, b.d), lx = L(a.look[0], b.look[0]), ly = L(a.look[1], b.look[1]), lz = L(a.look[2], b.look[2]);
    camera.position.set(lx + d * Math.cos(el) * Math.sin(az), ly + d * Math.sin(el), lz + d * Math.cos(el) * Math.cos(az)); camera.lookAt(lx, ly, lz);
  }

  /* ------------------------------------------------------------ التقدّم من السكرول */
  let pT = 0, pS = 0, chap = -1;
  const readP = () => { const r = host.getBoundingClientRect(), total = r.height - innerHeight; return total > 0 ? clamp(-r.top / total, 0, 1) : 0; };
  host.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') px = (e.clientX / innerWidth - .5) * 2; }, { passive: true });
  S.onFrame = (dt, now) => {
    intro = Math.min(1, intro + dt / 1.1); pT = readP(); pS += (pT - pS) * (1 - Math.exp(-dt * 7));
    if (Math.abs(pT - pS) < 1e-4) pS = pT;
    frameUpdate(pS, S.time); camAt(pS);
    let c = 0; for (let i = CHAPTERS.length - 1; i >= 0; i--) if (pS >= CHAPTERS[i]) { c = i; break; }
    if (c !== chap) { chap = c; opts.onChapter && opts.onChapter(c); } opts.onProgress && opts.onProgress(pS, c);
  };
  S.onDispose = () => { M2.choc.forEach((m) => m.dispose()); killList.forEach((m) => m.dispose()); fadeTex.dispose(); shTex.dispose(); faceMat.dispose(); nutMat.dispose(); };
  // أول إطار فوراً
  frameUpdate(readP(), 0); camAt(readP());
  const api = { stage: S, canvas, dispose: () => S.dispose(), get progress() { return pS; } };
  Object.defineProperty(api, 'disposed', { get: () => S.disposed });
  return api;
}
