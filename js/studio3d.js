/*
  ورشة القطعة: القطعة الكاملة على سطح لامع (تدوير حر 360° بالاتجاهين: يمين/يسار وفوق/تحت) وبجانبها القطعة المقطوعة (أكبر وأوضح)
  التي تُظهر الكبوة والحشوة والطبقة المقرمشة. السحب على أيٍّ منهما يديره بحرية؛ ترتفع القطعة تلقائياً كي لا تخترق الأرض ثم تعود لوضعها.
  كل تغيير في الخيارات يُعاد بناؤه فوراً في المقطع. نقر على طبقة = إبراز + إخبار الواجهة. onLayout يعطي مواضع الطبقات على الشاشة لرسم التسميات.
*/
import { THREE, baseStage, TYPE_COLORS, ease, paintType, powderOf } from './lib3d.js';
import { buildWhole, buildSlice, decorate, setHighlight, disposeSlice } from './models.js';

const SLICE_K = 1.32;   // حجم المقطع نسبةً للقطعة (أكبر ليكون أوضح)

export function createStudio(canvas, cfg0 = {}) {
  const S = baseStage(canvas, { fov: 26, exposure: 1.1 });
  if (!S) return null;
  const { scene, camera, mats: M, tw } = S;
  const cfg = { shape: 'kalp', type: 'ruby', shell: 1, fill: 'karamel', crunch: 'yok', crunchAmt: 1, top: 'yok', ...cfg0 };
  const api = { onPick: null, onLayout: null, cfg, layerIds: [] };

  const key = new THREE.DirectionalLight(0xfff0dd, 1.5); key.position.set(-3, 6, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe2c8, 1.1); fill.position.set(2, 2.5, 7); scene.add(fill);   // ضوء أمامي: يضيء وجه القطع
  scene.add(new THREE.HemisphereLight(0xffd8c0, 0x3a1c12, 0.7));

  /* سطح العرض: لوح داكن لامع بحواف تتلاشى + ظلال تلامس ناعمة */
  const rad = (stops, size = 256) => { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size); return new THREE.CanvasTexture(c); };
  const fadeTex = rad([[0, '#fff'], [.45, '#cfcfcf'], [1, '#000']]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshPhysicalMaterial({ color: 0x3a1b0f, roughness: .16, metalness: .12, clearcoat: 1, clearcoatRoughness: .12, transparent: true, alphaMap: fadeTex, envMapIntensity: 1.5, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.006; floor.renderOrder = -2; scene.add(floor);
  const shTex = rad([[0, 'rgba(0,0,0,.7)'], [.6, 'rgba(0,0,0,.25)'], [1, 'rgba(0,0,0,0)']], 128);
  const mkShadow = (w) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * .7), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = .004; m.renderOrder = -1; scene.add(m); return m; };
  const shW = mkShadow(3.1), shS = mkShadow(3.0);

  /* العناصر: حامل > محور دوران في المركز > القطعة. المقطع مثله. */
  const wholeHolder = new THREE.Group(), pivot = new THREE.Group(), sliceHolder = new THREE.Group(), slicePivot = new THREE.Group();
  wholeHolder.add(pivot); sliceHolder.add(slicePivot); scene.add(wholeHolder, sliceHolder);
  let whole = null, slice = null, lit = null, cutDone = false, dragging = null, lastUser = -1e9;
  let wd = { hx: 1, hy: .5, hz: 1 }, sd = { hx: 1, hy: .3, hz: .2 };
  const qW = new THREE.Quaternion(), qS = new THREE.Quaternion(), qI = new THREE.Quaternion(), eul = new THREE.Euler(), tq = new THREE.Quaternion(), tv = new THREE.Vector3();
  const AY = new THREE.Vector3(0, 1, 0), AX = new THREE.Vector3(1, 0, 0), vW = { y: .5, x: 0 }, vS = { y: 0, x: 0 };
  const WX = -1.35, SX = 1.2;
  const knife = new THREE.Mesh(new THREE.PlaneGeometry(.05, 2.4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); knife.position.set(0, 1, .9); scene.add(knife);

  function buildWholeNow() {
    if (whole) { pivot.remove(whole); whole.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.isInstancedMesh) { n.dispose(); n.material !== M.gold && n.material.dispose(); } }); }
    whole = buildWhole(cfg.shape, M); const b = new THREE.Box3().setFromObject(whole);
    wd = { hx: (b.max.x - b.min.x) / 2, hy: (b.max.y - b.min.y) / 2, hz: (b.max.z - b.min.z) / 2 };
    whole.position.y = -wd.hy; pivot.add(whole); pivot.position.y = wd.hy; qW.identity(); vW.y = .5; vW.x = 0;
    scene.updateMatrixWorld(true); decorate(whole, cfg.top, M);
  }
  function buildSliceNow(animate) {
    if (slice) { slicePivot.remove(slice.group); disposeSlice(slice); }
    slice = buildSlice(cfg, M); sd = { hx: slice.w / 2, hy: slice.h / 2, hz: .17 };
    slice.group.position.y = -sd.hy; slicePivot.add(slice.group); slicePivot.position.y = sd.hy; api.layerIds = slice.ids; lit = null;
    sliceHolder.scale.setScalar(SLICE_K * (cfg.shape === 'tablet' ? 1.18 : 1));
    if (animate) { slice.group.scale.z = .25; tw(420, (p) => { slice.group.scale.z = .25 + .75 * ease.out(p); }); }
  }
  function layout() {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), need = 2.95, d = Math.max(need / (t * camera.aspect), 1.4 / t), el = .4;
    camera.position.set(0, .55 + d * Math.sin(el), d * Math.cos(el)); camera.lookAt(0, .58, 0); camera.updateProjectionMatrix();
  }
  S.onResize = layout; layout();

  /* قصّ: القطعة تنقسم، والمقطع يخرج ويستدير نحو الكاميرا */
  function playCut() {
    cutDone = false; wholeHolder.position.x = 0; sliceHolder.visible = false; sliceHolder.position.x = 0; sliceHolder.rotation.y = Math.PI / 2; shS.visible = false;
    wholeHolder.scale.setScalar(.001); shW.scale.setScalar(.2); api.onLayout && api.onLayout(null);
    tw(520, (p) => { const e = ease.back(p); wholeHolder.scale.setScalar(Math.max(.001, e)); shW.scale.setScalar(.2 + .8 * ease.out(p)); }, () => {
      tw(260, (p) => { knife.material.opacity = Math.sin(p * Math.PI) * .9; knife.position.x = (p - .5) * 1.4; }, () => {
        knife.material.opacity = 0; sliceHolder.visible = true; shS.visible = true;
        tw(780, (p) => { const e = ease.out(p); wholeHolder.position.x = WX * e; sliceHolder.position.x = SX * e; sliceHolder.rotation.y = Math.PI / 2 + (-.18 - Math.PI / 2) * e; shW.position.x = WX * e; shS.position.x = SX * e; shS.scale.setScalar(.2 + .8 * e); }, () => { cutDone = true; });
      });
    });
  }
  buildWholeNow(); buildSliceNow(false); playCut();

  /* ---------------------------------------------------------------- تحديث الإعدادات */
  api.set = (patch) => {
    const old = { ...cfg }; Object.assign(cfg, patch);
    if (cfg.shape !== old.shape) { buildWholeNow(); buildSliceNow(false); playCut(); }
    if (cfg.type !== old.type) { const from = M.gloss.color.clone(), to = new THREE.Color(TYPE_COLORS[cfg.type]), pf = M.truf.color.clone(), pt = new THREE.Color(powderOf(TYPE_COLORS[cfg.type])); tw(520, (p) => { const k = ease.io(p); [M.gloss, M.flat, M.cut].forEach((m) => m.color.copy(from).lerp(to, k)); M.dusty.color.copy(pf).lerp(pt, k); M.truf.color.copy(pf).lerp(pt, k); wholeHolder.scale.setScalar(1 + Math.sin(p * Math.PI) * .05); M.gloss.envMapIntensity = M.flat.envMapIntensity = 1.35 + Math.sin(p * Math.PI) * .9; }, () => wholeHolder.scale.setScalar(1)); }
    if (cfg.shape === old.shape && (cfg.type !== old.type || cfg.shell !== old.shell || cfg.fill !== old.fill || cfg.crunch !== old.crunch || cfg.crunchAmt !== old.crunchAmt || (cfg.shape === 'truf' && cfg.top !== old.top))) buildSliceNow(true);
    if (cfg.top !== old.top) { decorate(whole, cfg.top, M); const d = whole.userData.deco; if (d) tw(420, (p) => d.scale.setScalar(Math.max(.001, ease.back(p)))); }
  };
  paintType(M, TYPE_COLORS[cfg.type]);
  api.highlight = (id) => { lit = id; setHighlight(slice, id, tw); };
  api.replayCut = () => { qW.identity(); qS.identity(); playCut(); };
  api.wobble = () => { tw(700, (p) => { wholeHolder.rotation.z = Math.sin(p * 18) * (1 - p) * .1; }, () => { wholeHolder.rotation.z = 0; }); };

  /* ---------------------------------------------------------------- سحب حر 360° + نقر على الطبقات */
  const ndc = new THREE.Vector2(), ray = new THREE.Raycaster();
  let down = null;
  const pick = (cx, cy) => { const r = canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return slice && sliceHolder.visible ? ray.intersectObjects(slice.group.children, true) : []; };
  const layerOf = (hit) => { let o = hit.object; while (o && !o.userData.layer) o = o.parent; return o ? o.userData.layer : null; };
  canvas.addEventListener('pointerdown', (e) => { const hit = pick(e.clientX, e.clientY).find((h) => layerOf(h)); dragging = hit ? 'slice' : 'whole'; down = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, ly: e.clientY, lt: performance.now(), moved: 0, hit }; lastUser = performance.now(); const v = dragging === 'slice' ? vS : vW; v.y = 0; v.x = 0; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!down) return; const now = performance.now(), dx = e.clientX - down.lx, dy = e.clientY - down.ly, dtm = Math.max(.008, (now - down.lt) / 1000); down.lx = e.clientX; down.ly = e.clientY; down.lt = now; down.moved += Math.abs(dx) + Math.abs(dy); lastUser = now;
    const k = .0105, q = dragging === 'slice' ? qS : qW, v = dragging === 'slice' ? vS : vW;
    tq.setFromAxisAngle(AY, dx * k); q.premultiply(tq); tq.setFromAxisAngle(AX, dy * k); q.premultiply(tq); q.normalize();
    v.y = THREE.MathUtils.clamp(dx * k / dtm, -9, 9); v.x = THREE.MathUtils.clamp(dy * k / dtm, -9, 9);
  });
  const up = () => {
    if (!down) return; const tap = down.moved < 7 && performance.now() - down.t < 380, hit = down.hit; down = null; dragging = null; if (!tap) return;
    if (hit) { const id = layerOf(hit); api.highlight(lit === id ? null : id); api.onPick && api.onPick(lit, id); } else api.wobble();
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { down = null; dragging = null; });

  /* ---------------------------------------------------------------- كل إطار: قصور ذاتي، عودة للوضع الأفقي، رفع كي لا تخترق الأرض، مواضع التسميات */
  const corners = (d) => { const a = []; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) a.push(new THREE.Vector3(sx * d.hx, sy * d.hy, sz * d.hz)); return a; };
  let cw = corners(wd), cs = corners(sd), cwKey = '', csKey = '';
  const lift = (q, cs_, base) => { let mn = 1e9; for (const c of cs_) { tv.copy(c).applyQuaternion(q); mn = Math.min(mn, tv.y); } return Math.max(base, -mn + .012); };
  const proj = (v3, obj) => { tv.copy(v3); obj.localToWorld(tv); tv.project(camera); return { x: (tv.x * .5 + .5) * (canvas.clientWidth || 300), y: (-tv.y * .5 + .5) * (canvas.clientHeight || 300) }; };
  S.onFrame = (dt, now) => {
    const idle = !dragging && now - lastUser > 2600;
    if (!dragging) {
      if (Math.abs(vW.y) + Math.abs(vW.x) > .002) { tq.setFromAxisAngle(AY, vW.y * dt); qW.premultiply(tq); tq.setFromAxisAngle(AX, vW.x * dt); qW.premultiply(tq); const d = Math.exp(-dt * (idle ? 1.1 : 2.4)); vW.y *= d; vW.x *= d; }
      if (Math.abs(vS.y) + Math.abs(vS.x) > .002) { tq.setFromAxisAngle(AY, vS.y * dt); qS.premultiply(tq); tq.setFromAxisAngle(AX, vS.x * dt); qS.premultiply(tq); const d = Math.exp(-dt * 2.4); vS.y *= d; vS.x *= d; }
      if (idle) {
        tq.setFromAxisAngle(AY, .5 * dt); qW.premultiply(tq);
        eul.setFromQuaternion(qW, 'YXZ'); tq.setFromEuler(eul.set(0, eul.y, 0, 'YXZ')); qW.slerp(tq, 1 - Math.exp(-dt * 1.1));   // يعود أفقياً ويحتفظ بزاوية الدوران
        qS.slerp(qI, 1 - Math.exp(-dt * 1.5));
      }
    }
    qW.normalize(); qS.normalize(); pivot.quaternion.copy(qW); slicePivot.quaternion.copy(qS);
    if (cwKey !== wd.hy + ':' + wd.hx) { cw = corners(wd); cwKey = wd.hy + ':' + wd.hx; } if (csKey !== sd.hy + ':' + sd.hx) { cs = corners(sd); csKey = sd.hy + ':' + sd.hx; }
    const lw = lift(qW, cw, wd.hy), ls = lift(qS, cs, sd.hy), kk = 1 - Math.exp(-dt * 12);
    pivot.position.y += (lw - pivot.position.y) * kk; slicePivot.position.y += (ls - slicePivot.position.y) * kk;
    shW.material.opacity = THREE.MathUtils.clamp(1 - (pivot.position.y - wd.hy) * .7, .3, 1); shS.material.opacity = THREE.MathUtils.clamp(1 - (slicePivot.position.y - sd.hy) * .7, .3, 1);
    if (cutDone) sliceHolder.rotation.y = -.18 + Math.sin(S.time * .7) * .05;
    knife.rotation.z = .12;
    if (api.onLayout) {
      if (cutDone && sliceHolder.visible && slice) {
        scene.updateMatrixWorld(true); const an = {}; for (const id in slice.anchors) an[id] = proj(slice.anchors[id], slice.group);
        const pts = [[-sd.hx, 0], [sd.hx, 0], [-sd.hx, sd.hy * 2], [sd.hx, sd.hy * 2]].map(([x, y]) => proj(new THREE.Vector3(x, y, 0), slice.group));
        api.onLayout({ anchors: an, bbox: { l: Math.min(...pts.map((p) => p.x)), r: Math.max(...pts.map((p) => p.x)), t: Math.min(...pts.map((p) => p.y)), b: Math.max(...pts.map((p) => p.y)) }, w: canvas.clientWidth, h: canvas.clientHeight, lit });
      } else api.onLayout(null);
    }
  };
  api.stage = S; api.snapshot = (px) => S.snapshot(px); api.dispose = () => { S.dispose(); }; api.canvas = canvas;
  Object.defineProperty(api, 'disposed', { get: () => S.disposed });
  S.onDispose = () => { disposeSlice(slice); };
  return api;
}
