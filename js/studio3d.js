/*
  ورشة القطعة: القطعة الكاملة على سطح لامع (دوران 360° حر بالسحب) وبجانبها القطعة المقطوعة التي تُظهر الكبوة والحشوة والطبقة المقرمشة.
  كل تغيير في الخيارات يُعاد بناؤه فوراً في المقطع. نقر على طبقة = إبراز + إخبار الواجهة لتشرحها.
*/
import { THREE, baseStage, TYPE_COLORS, ease, paintType } from './lib3d.js';
import { buildWhole, buildSlice, decorate, setHighlight, disposeSlice } from './models.js';

export function createStudio(canvas, cfg0 = {}) {
  const S = baseStage(canvas, { fov: 26, exposure: 1.1 });
  if (!S) return null;
  const { scene, camera, mats: M, tw } = S;
  const cfg = { shape: 'kalp', type: 'ruby', shell: 1, fill: 'karamel', crunch: 'yok', crunchAmt: 1, top: 'yok', ...cfg0 };
  const api = { onPick: null, cfg };

  const key = new THREE.DirectionalLight(0xfff0dd, 1.5); key.position.set(-3, 6, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe2c8, 1.0); fill.position.set(2, 2.5, 7); scene.add(fill);   // ضوء أمامي: يضيء وجه القطع المقطوع
  scene.add(new THREE.HemisphereLight(0xffd8c0, 0x3a1c12, 0.7));

  /* سطح العرض: لوح داكن لامع بحواف تتلاشى (لا قرص طائر) + ظلال تلامس ناعمة */
  const rad = (stops, size = 256) => { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size); return new THREE.CanvasTexture(c); };
  const fadeTex = rad([[0, '#fff'], [.45, '#cfcfcf'], [1, '#000']]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshPhysicalMaterial({ color: 0x3a1b0f, roughness: .16, metalness: .12, clearcoat: 1, clearcoatRoughness: .12, transparent: true, alphaMap: fadeTex, envMapIntensity: 1.5, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.006; floor.renderOrder = -2; scene.add(floor);
  const shTex = rad([[0, 'rgba(0,0,0,.7)'], [.6, 'rgba(0,0,0,.25)'], [1, 'rgba(0,0,0,0)']], 128);
  const mkShadow = (w) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * .7), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = .004; m.renderOrder = -1; scene.add(m); return m; };
  const shW = mkShadow(3.1), shS = mkShadow(2.6);

  /* العناصر */
  const wholeHolder = new THREE.Group(), spin = new THREE.Group(), sliceHolder = new THREE.Group();
  wholeHolder.add(spin); scene.add(wholeHolder, sliceHolder);
  let whole = null, slice = null, yaw = 0, yawV = .5, dragging = false, down = null, lit = null;
  const WX = -1.15, SX = 1.15;
  const knife = new THREE.Mesh(new THREE.PlaneGeometry(.05, 2.4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); knife.position.set(0, 1, .9); scene.add(knife);

  function buildWholeNow() {
    if (whole) { spin.remove(whole); whole.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.isInstancedMesh) { n.dispose(); n.material !== M.gold && n.material.dispose(); } }); }
    whole = buildWhole(cfg.shape, M); spin.add(whole); scene.updateMatrixWorld(true); decorate(whole, cfg.top, M);
  }
  function buildSliceNow(animate) {
    if (slice) { sliceHolder.remove(slice.group); disposeSlice(slice); }
    slice = buildSlice(cfg, M); sliceHolder.add(slice.group); api.layerIds = slice.ids; lit = null;
    sliceHolder.scale.setScalar(cfg.shape === 'tablet' ? 1.25 : 1);
    if (animate) { slice.group.scale.z = .25; tw(420, (p) => { slice.group.scale.z = .25 + .75 * ease.out(p); }); }
  }
  function layout(w, h) {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), need = 2.45, d = Math.max(need / (t * camera.aspect), 1.25 / t), el = .4;
    camera.position.set(0, .55 + d * Math.sin(el), d * Math.cos(el)); camera.lookAt(0, .42, 0); camera.updateProjectionMatrix();
  }
  S.onResize = layout; layout();

  /* قصّ: القطعة تنقسم، والمقطع يخرج ويستدير نحو الكاميرا */
  function playCut() {
    wholeHolder.position.x = 0; sliceHolder.visible = false; sliceHolder.position.x = 0; sliceHolder.rotation.y = Math.PI / 2; shS.visible = false;
    wholeHolder.scale.setScalar(.001); shW.scale.setScalar(.2);
    tw(520, (p) => { const e = ease.back(p); wholeHolder.scale.setScalar(Math.max(.001, e)); shW.scale.setScalar(.2 + .8 * ease.out(p)); }, () => {
      tw(260, (p) => { knife.material.opacity = Math.sin(p * Math.PI) * .9; knife.position.x = (p - .5) * 1.4; knife.scale.y = 1; }, () => {
        knife.material.opacity = 0; sliceHolder.visible = true; shS.visible = true;
        tw(780, (p) => { const e = ease.out(p); wholeHolder.position.x = WX * e; sliceHolder.position.x = SX * e; sliceHolder.rotation.y = Math.PI / 2 + (-.3 - Math.PI / 2) * e; shW.position.x = WX * e; shS.position.x = SX * e; shS.scale.setScalar(.2 + .8 * e); });
      });
    });
  }
  buildWholeNow(); buildSliceNow(false); playCut();

  /* ---------------------------------------------------------------- تحديث الإعدادات */
  api.set = (patch) => {
    const old = { ...cfg }; Object.assign(cfg, patch);
    if (cfg.shape !== old.shape) { buildWholeNow(); buildSliceNow(false); playCut(); }
    if (cfg.type !== old.type) { const from = M.gloss.color.clone(), to = new THREE.Color(TYPE_COLORS[cfg.type]); tw(520, (p) => { const k = ease.io(p); M.choc.forEach((m) => m.color.copy(from).lerp(to, k)); wholeHolder.scale.setScalar(1 + Math.sin(p * Math.PI) * .05); M.gloss.envMapIntensity = M.flat.envMapIntensity = 1.35 + Math.sin(p * Math.PI) * .9; }, () => wholeHolder.scale.setScalar(1)); }
    if (cfg.shape === old.shape && (cfg.type !== old.type || cfg.shell !== old.shell || cfg.fill !== old.fill || cfg.crunch !== old.crunch || cfg.crunchAmt !== old.crunchAmt)) buildSliceNow(true);
    if (cfg.top !== old.top) { decorate(whole, cfg.top, M); const d = whole.userData.deco; if (d) tw(420, (p) => d.scale.setScalar(Math.max(.001, ease.back(p)))); }
  };
  paintType(M, TYPE_COLORS[cfg.type]);
  api.highlight = (id) => { lit = id; setHighlight(slice, id, tw); };
  api.replayCut = playCut;
  api.wobble = () => { tw(700, (p) => { wholeHolder.rotation.z = Math.sin(p * 18) * (1 - p) * .1; }, () => { wholeHolder.rotation.z = 0; }); };

  /* ---------------------------------------------------------------- سحب 360° حر + نقر على الطبقات */
  const ndc = new THREE.Vector2(), ray = new THREE.Raycaster();
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, moved: 0 }; dragging = true; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - down.lx; down.lx = e.clientX; down.moved += Math.abs(dx); yaw += dx * .014; yawV = dx * .014 * 60; });
  const up = (e) => {
    if (!down) return; const tap = down.moved < 7 && performance.now() - down.t < 380; const r = canvas.getBoundingClientRect(); const cx = e.clientX, cy = e.clientY; down = null; dragging = false;
    if (!tap) return;
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hits = slice ? ray.intersectObjects(slice.group.children, true) : [];
    const h = hits.find((x) => { let o = x.object; while (o && !o.userData.layer) o = o.parent; return o; });
    if (h) { let o = h.object; while (o && !o.userData.layer) o = o.parent; const id = o.userData.layer; api.highlight(lit === id ? null : id); api.onPick && api.onPick(lit === id ? id : null, id); }
    else { api.wobble(); }
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { down = null; dragging = false; });

  S.onFrame = (dt) => {
    if (!dragging) { yaw += yawV * dt; yawV += (.55 - yawV) * Math.min(1, dt * 1.4); }
    spin.rotation.y = yaw;
    if (sliceHolder.visible && wholeHolder.position.x < WX * .98) sliceHolder.rotation.y = -.3 + Math.sin(S.time * .7) * .09;
    knife.rotation.z = .12;
  };
  api.stage = S; api.snapshot = (px) => S.snapshot(px); api.dispose = () => { S.dispose(); }; api.canvas = canvas;
  Object.defineProperty(api, 'disposed', { get: () => S.disposed });
  S.onDispose = () => { disposeSlice(slice); };
  return api;
}
