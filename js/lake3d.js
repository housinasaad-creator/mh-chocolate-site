/*
  هيرو: قطع شوكولا غاطسة نصفها في بحيرة شوكولا سائلة (لا شيء يطير في الفضاء).
  الشوكولا السائلة هي طبقة 2D خلف الكانفاس؛ هنا مستوى ماء غير مرئي يكتب العمق فقط فيُخفي الجزء الغاطس من القطع،
  وحلقة لامعة (meniscus) تتبع حدّ القطعة عند خط الماء، وتموجات حلقية تنتشر عند النقر. دوران حر 360° بالسحب.
*/
import { THREE, baseStage, makeMats, TYPE_COLORS, HEART, ease, paintType } from './lib3d.js';
import { buildWhole, decorate } from './models.js';

export function createLake(canvas, opts = {}) {
  const S = baseStage(canvas, { fov: 30, exposure: 1.08 });
  if (!S) return null;
  const { scene, camera, tw } = S, coarse = S.coarse;
  const key = new THREE.DirectionalLight(0xfff0dd, 1.5); key.position.set(-3, 6, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe2c8, .8); fill.position.set(2, 3, 6); scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xffd8c0, 0x3a1c12, .6));

  // مستوى الماء: يكتب العمق فقط
  const water = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ colorWrite: false }));
  water.rotation.x = -Math.PI / 2; water.renderOrder = -10; scene.add(water);

  const shTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(8,3,1,.0)'); gr.addColorStop(.62, 'rgba(8,3,1,.55)'); gr.addColorStop(1, 'rgba(8,3,1,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const bead = new THREE.MeshPhysicalMaterial({ color: 0x2c150c, roughness: .12, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.5, transparent: true, opacity: .82 });

  /* القطع: كل واحدة بمواد خاصة بلونها */
  const sets = [
    { id: 'kalp', type: 'ruby', x: .15, z: .55, s: 1.28, sink: .2, yaw: .4, v: .12, top: 'yok' },
    { id: 'karamel', type: 'bitter', x: 1.75, z: -.55, s: .88, sink: .22, yaw: 0, v: -.1, top: 'yok' },
    { id: 'truf', type: 'bitter', x: -1.8, z: -.6, s: .86, sink: .3, yaw: 1.2, v: .09, top: 'yok' }
  ];
  const baseM = S.mats, extra = [], pieces = [];
  sets.forEach((c, i) => {
    const M = i === 0 ? baseM : makeMats(baseM); if (i) extra.push(M);
    paintType(M, TYPE_COLORS[c.type]);
    const w = buildWhole(c.id, M), holder = new THREE.Group(), spin = new THREE.Group();
    spin.add(w); holder.add(spin); holder.position.set(c.x, -c.sink * c.s, c.z); holder.scale.setScalar(c.s); scene.add(holder);
    const ring = ringFor(c.id, w);
    const rg = new THREE.Group(); rg.add(ring); rg.position.set(c.x, .012, c.z); rg.scale.setScalar(c.s); scene.add(rg);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(c.x, .008, c.z); sh.scale.setScalar(c.s * .95); scene.add(sh);
    pieces.push({ c, holder, spin, rg, w, phase: i * 2.1, yaw: c.yaw });
  });
  scene.updateMatrixWorld(true);
  function ringFor(id, w) {
    const g = w.userData.ground, pts3 = [];
    if (id === 'truf') return new THREE.Group();                       // عنقود كرات: بلا حلقة
    if (id === 'kalp') HEART.forEach(([x, y]) => pts3.push(new THREE.Vector3((x - g.cx) * g.k, 0, (-y - g.cz) * g.k)));
    else { const r = Math.max(g.w, g.d) / 2 * 1.0; for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; pts3.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); } }
    const curve = new THREE.CatmullRomCurve3(pts3, true), tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 220, .042, 10, true), bead); tube.scale.y = .55; return tube;
  }

  /* تموجات عند النقر */
  const ripples = []; const rgeo = new THREE.RingGeometry(.92, 1, 64);
  const addRipple = (x, z, delay = 0) => { const m = new THREE.Mesh(rgeo, new THREE.MeshBasicMaterial({ color: 0xffd9a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.x = -Math.PI / 2; m.position.set(x, .02, z); scene.add(m); const t0 = performance.now() + delay; ripples.push({ m, t0 }); };

  /* التخطيط */
  S.onResize = () => {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), d = Math.max(2.55 / (t * camera.aspect), 1.75 / t), el = .92;
    camera.position.set(0, d * Math.sin(el), d * Math.cos(el) + .3); camera.lookAt(.1, .15, .15); camera.updateProjectionMatrix();
  };
  S.onResize();

  /* سحب 360° حر + نقر = تموج */
  let yawAll = 0, yawV = .12, dragging = false, down = null; const ndc = new THREE.Vector2(), ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  canvas.addEventListener('pointerdown', (e) => { down = { t: performance.now(), lx: e.clientX, moved: 0 }; dragging = true; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - down.lx; down.lx = e.clientX; down.moved += Math.abs(dx); yawAll += dx * .013; yawV = dx * .013 * 60; });
  const up = (e) => {
    if (!down) return; const tap = down.moved < 7 && performance.now() - down.t < 380; down = null; dragging = false; if (!tap) return;
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) { addRipple(hit.x, hit.z); addRipple(hit.x, hit.z, 180); pieces.forEach((p) => { const dx = p.c.x - hit.x, dz = p.c.z - hit.z; if (Math.hypot(dx, dz) < 1.6) p.kick = performance.now(); }); }
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { down = null; dragging = false; });

  S.onFrame = (dt, now) => {
    if (!dragging) { yawAll += yawV * dt; yawV += (.12 - yawV) * Math.min(1, dt * 1.2); }
    pieces.forEach((p) => {
      const t = S.time + p.phase, kick = p.kick ? Math.max(0, 1 - (now - p.kick) / 1100) : 0;
      p.spin.rotation.y = p.yaw + yawAll * (p.c.v > 0 ? 1 : -.8) + Math.sin(t * .5) * .12;
      p.holder.position.y = -p.c.sink * p.c.s + Math.sin(t * .9) * .018 - kick * Math.sin((1 - kick) * 14) * .05;
      p.rg.rotation.y = p.spin.rotation.y;
      p.holder.rotation.z = Math.sin(t * .7) * .025 + kick * Math.sin((1 - kick) * 12) * .06; p.holder.rotation.x = Math.cos(t * .6) * .02;
    });
    for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i], k = (now - r.t0) / 1500; if (k < 0) continue; if (k >= 1) { scene.remove(r.m); r.m.material.dispose(); ripples.splice(i, 1); continue; } const e = ease.out(k); r.m.scale.setScalar(.15 + e * 2.6); r.m.material.opacity = (1 - k) * (1 - k) * .34; }
  };
  S.onDispose = () => { extra.forEach((M) => M.choc.forEach((m) => m.dispose())); shTex.dispose(); ripples.forEach((r) => r.m.material.dispose()); rgeo.dispose(); };
  const api = { stage: S, dispose: () => S.dispose(), canvas, ripple: (x = 0, z = .3) => { addRipple(x, z); addRipple(x, z, 180); } };
  Object.defineProperty(api, 'disposed', { get: () => S.disposed });
  // تموج ترحيبي بعد الظهور
  setTimeout(() => { if (!S.disposed) api.ripple(.1, .5); }, 900);
  return api;
}
