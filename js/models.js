/*
  مجسّمات الشوكولا: القطعة الكاملة (تقف على سطح، لا تطير) + القطعة المقطوعة (مقطع يُظهر الكبسولة: كبوة، حشوة، طبقة مقرمشة)
  + تزيين مجسّم فوق القطعة (ذهب/فستق/بندق/لوز) يوضع على السطح الحقيقي بالإشعاع.
*/
import { THREE, TAU, TYPE_COLORS, FILL_COLORS, CRUNCH_COLORS, HEART, LIPS, circle, chaikin, centroid, pillow, ext, rr, shapeOf, lumpy, smooth, truffleGeo, powderOf } from './lib3d.js';

export const SHAPES = ['tablet', 'truf', 'kalp', 'elmas', 'karamel', 'dudak'];
export const SHELL_T = [.05, .085, .135];            // سماكة الكبوة: رقيقة، متوسطة، سميكة
export const CRUNCH_AMT = [.34, .5, .68];            // ارتفاع الطبقة المقرمشة داخل القطعة

/* يضع المجموعة على الأرض: أدنى نقطة y=0، المركز x/z=0، وتحجيم حسب أكبر امتداد أفقي */
export function ground(g, footprint = 1.95) {
  const b = new THREE.Box3().setFromObject(g), s = new THREE.Vector3(), c = new THREE.Vector3(); b.getSize(s); b.getCenter(c);
  g.children.forEach((ch) => { ch.position.x -= c.x; ch.position.z -= c.z; ch.position.y -= b.min.y; });
  const k = footprint / Math.max(s.x, s.z); g.scale.setScalar(k); g.userData.ground = { k, cx: c.x, cz: c.z, w: s.x * k, d: s.z * k, h: s.y * k }; return g;
}

/* ------------------------------------------------------------------ القطعة الكاملة */
export function buildWhole(id, M) {
  const g = new THREE.Group();
  if (id === 'kalp') g.add(new THREE.Mesh(pillow(HEART, .52, .1, 22), M.gloss));
  else if (id === 'dudak') g.add(new THREE.Mesh(pillow(LIPS, .42, .09, 22), M.gloss));
  else if (id === 'tablet') {
    const base = new THREE.Mesh(ext(rr(1.62, 2.14, .08), .05, .03, 3), M.gloss); g.add(base);
    const t1 = ext(rr(.45, .45, .07), .06, .035, 4), t2 = ext(rr(.3, .3, .05), .025, .025, 3);
    for (let c = 0; c < 3; c++) for (let r = 0; r < 4; r++) {
      const x = (c - 1) * .5, z = (r - 1.5) * .5;
      const a = new THREE.Mesh(t1, M.gloss); a.position.set(x, .06, z); g.add(a);
      const b = new THREE.Mesh(t2, M.gloss); b.position.set(x, .19, z); g.add(b);
    }
  } else if (id === 'truf') {
    // ثلاث حبات بأشكال وأحجام مختلفة (كلٌّ بعيّنة ضجيج خاصة) تلامس السطح
    const geos = [truffleGeo(1.7, .86), truffleGeo(5.3, .8), truffleGeo(9.1, .9)];
    const spheres = []; [[-.62, .62, .62, .2], [.66, .58, .52, 1.9], [.02, -.58, .56, 3.7]].forEach(([x, z, r, ry], i) => { const m = new THREE.Mesh(geos[i], M.truf); m.scale.setScalar(r); m.position.set(x, r * .62, z); m.rotation.y = ry; g.add(m); spheres.push(m); }); g.userData.spheres = spheres;
  } else if (id === 'elmas') {
    const pts = [[0, 0], [.55, 0], [.95, .42], [.8, .66], [.5, .85], [0, .85]].map(([x, y]) => new THREE.Vector2(x, y));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 10), M.flat); m.rotation.y = Math.PI / 10; g.add(m);
  } else if (id === 'karamel') {
    const pr = [new THREE.Vector2(1.03, 0)];
    for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI / 2; pr.push(new THREE.Vector2(Math.cos(a), Math.sin(a) * .82)); }
    pr[pr.length - 1].x = .0001;
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pr, 56), M.gloss));
    const f = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .018, 6), M.gold); f.position.set(.04, .83, .02); g.add(f);
  }
  return ground(g, id === 'tablet' ? 1.9 : 1.95);
}

/* ------------------------------------------------------------------ التزيين المجسّم */
const ray = new THREE.Raycaster(), _o = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _c = new THREE.Color();
const toppingDefs = {
  hindistan: { n: 84, cover: 300, geo: () => new THREE.BoxGeometry(1, .1, .3), mat: () => new THREE.MeshStandardMaterial({ roughness: .95 }), size: [.07, .125], colors: [0xf8f1e0, 0xefe5cc, 0xfffaf0, 0xe9dcc0], off: .004, shred: true },
  altin: { n: 40, cover: 90, geo: () => { const g = new THREE.CircleGeometry(1, 5); g.rotateX(-Math.PI / 2); return g; }, mat: (M) => M.gold, size: [.03, .07], flat: true, off: .006 },
  fistik: { n: 56, cover: 210, geo: () => new THREE.IcosahedronGeometry(1, 0), mat: () => new THREE.MeshStandardMaterial({ roughness: .55, flatShading: true }), size: [.028, .056], colors: [0x7f9f3e, 0x9cbd55, 0xb4cf72], off: .012 },
  findik: { n: 34, cover: 120, geo: () => new THREE.IcosahedronGeometry(1, 1), mat: () => new THREE.MeshStandardMaterial({ roughness: .62, flatShading: true }), size: [.04, .072], colors: [0xa8702f, 0xbf8a46, 0x8b5826], off: .02 },
  badem: { n: 24, cover: 90, geo: () => new THREE.SphereGeometry(1, 10, 8), mat: () => new THREE.MeshStandardMaterial({ roughness: .7 }), size: [.065, .1], colors: [0xd9b47c, 0xe4c590, 0xc9a06a], off: .012, almond: true }
};
export function decorate(holder, kind, M) {
  if (holder.userData.deco) { holder.remove(holder.userData.deco); const d = holder.userData.deco; d.geometry.dispose(); d.material !== M.gold && d.material.dispose(); d.dispose(); holder.userData.deco = null; }
  const def = toppingDefs[kind]; if (!def) return null;
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder); box.applyMatrix4(holder.matrixWorld.clone().invert());
  const spheres = holder.userData.spheres, total = spheres ? def.cover * spheres.length : def.n;
  const geo = def.geo(), im = new THREE.InstancedMesh(geo, def.mat(M), total); let k = 0; const hits = [];
  if (spheres) {   // تروفل: كساء بكامل السطح (جوز هند / مكسرات) بأخذ عيّنات من كل كرة بإشعاعات من الخارج نحو المركز
    const inv = holder.matrixWorld.clone().invert(), cen = new THREE.Vector3(), nrm = new THREE.Vector3(), dir = new THREE.Vector3();
    spheres.forEach((mesh) => {
      mesh.geometry.computeBoundingSphere(); mesh.getWorldPosition(cen); const R = mesh.geometry.boundingSphere.radius * mesh.getWorldScale(new THREE.Vector3()).x * 1.6 + .1; let got = 0;
      for (let tries = 0; tries < def.cover * 10 && got < def.cover; tries++) {
        dir.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1); if (dir.lengthSq() < .01 || dir.lengthSq() > 1) continue; dir.normalize();
        _o.copy(cen).addScaledVector(dir, R); _d.copy(dir).negate(); ray.set(_o, _d);
        const h = ray.intersectObject(mesh, false)[0]; if (!h || !h.face) continue;
        nrm.copy(h.face.normal).transformDirection(mesh.matrixWorld); if (nrm.y < -.25) continue;
        hits.push([holder.worldToLocal(h.point.clone()), nrm.clone().transformDirection(inv)]); got++;
      }
    });
  } else {
    for (let tries = 0; tries < def.n * 7 && hits.length < def.n; tries++) {
      _o.set(box.min.x + Math.random() * (box.max.x - box.min.x), box.max.y + 2, box.min.z + Math.random() * (box.max.z - box.min.z)); _d.set(0, -1, 0);
      _o.applyMatrix4(holder.matrixWorld); _d.transformDirection(holder.matrixWorld); ray.set(_o, _d);
      const h = ray.intersectObject(holder, true)[0]; if (!h || !h.face) continue;
      const p = holder.worldToLocal(h.point.clone()), n = h.face.normal.clone().normalize(); if (n.y < .4) continue;
      hits.push([p, n]);
    }
  }
  hits.forEach(([p, n]) => {
    const sz = def.size[0] + Math.random() * (def.size[1] - def.size[0]);
    _q.setFromUnitVectors(_up, n); _q.multiply(new THREE.Quaternion().setFromAxisAngle(_up, Math.random() * TAU));
    if (!def.flat && !def.shred) _q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((Math.random() - .5) * 1.2, 0, (Math.random() - .5) * 1.2)));
    const pos = p.clone().addScaledVector(n, def.off + sz * (def.flat || def.shred ? 0 : .35));
    if (def.shred) { _s.set(sz * (.8 + Math.random() * .7), sz * .16, sz * (.22 + Math.random() * .16)); _q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((Math.random() - .5) * 1.5, 0, (Math.random() - .5) * .4))); } else if (def.almond) _s.set(sz * 1.5, sz * .42, sz * .8); else if (def.flat) _s.set(sz * (.7 + Math.random() * .8), sz, sz * (.7 + Math.random() * .8)); else _s.set(sz * (.8 + Math.random() * .5), sz * (.7 + Math.random() * .4), sz * (.8 + Math.random() * .5));
    _m.compose(pos, _q, _s); im.setMatrixAt(k, _m);
    if (def.colors) { _c.setHex(def.colors[(Math.random() * def.colors.length) | 0]); im.setColorAt(k, _c); }
    k++;
  });
  im.count = k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  holder.add(im); holder.userData.deco = im; return im;
}

/* ------------------------------------------------------------------ مقاطع (قطاع عرضي) لكل شكل */
function domeProfile(W, H, wall) {
  const pts = [[-W, 0], [W, 0]], n = 36;
  for (let i = 0; i <= n; i++) { const x = W * (1 - 2 * i / n); pts.push([x, wall + (H - wall) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / W, 2.4)), 1 / 2.4)]); }
  return chaikin(pts, 2);
}
function profileOf(id) {
  if (id === 'kalp') return domeProfile(.95, .55, .1);
  if (id === 'dudak') return domeProfile(.95, .44, .09);
  if (id === 'karamel') return domeProfile(.9, .82, .07);
  if (id === 'truf') return circle(.86, 80).map(([x, y]) => [x, y + .86]);
  if (id === 'elmas') return chaikin([[-.55, 0], [.55, 0], [.95, .42], [.8, .66], [.5, .85], [-.5, .85], [-.8, .66], [-.95, .42]], 1);
  // tablet: صف من ثلاث مربعات بارزة فوق القاعدة
  const pts = [[-.82, 0], [.82, 0], [.82, .09]];
  [.5, 0, -.5].forEach((c) => { pts.push([c + .25, .09], [c + .2, .27], [c - .2, .27], [c - .25, .09]); });
  pts.push([-.82, .09]); return chaikin(pts, 1);
}
const bounds = (pts) => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; pts.forEach(([x, y]) => { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); }); return { minX: a, maxX: b, minY: c, maxY: d, wx: (b - a) / 2, hy: (d - c) / 2, cx: (a + b) / 2, cy: (c + d) / 2 }; };
function inset(pts, t, B) { const kx = Math.max(.15, 1 - t / B.wx), ky = Math.max(.15, 1 - t / B.hy); return pts.map(([x, y]) => [B.cx + (x - B.cx) * kx, B.cy + (y - B.cy) * ky]); }
function inside(pts, x, y) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
const lighten = (hex, k) => new THREE.Color(hex).lerp(new THREE.Color(0xffffff), k);

/* cfg: {shape,type,shell(0-2),fill,crunch,crunchAmt(0-2)}  ->  { group, layers:{id:[meshes]}, ids:[...] } */
export function buildSlice(cfg, M) {
  const grp = new THREE.Group(), layers = {}, ids = [];
  const add = (id, mesh) => { mesh.userData.layer = id; (layers[id] = layers[id] || []).push(mesh); grp.add(mesh); if (!ids.includes(id)) ids.push(id); };
  const outline = profileOf(cfg.shape), B = bounds(outline), T = SHELL_T[cfg.shell | 0];
  const tcol = TYPE_COLORS[cfg.type] ?? TYPE_COLORS.bitter;
  const shellCut = new THREE.MeshStandardMaterial({ color: lighten(tcol, cfg.shape === 'truf' ? .02 : .16), roughness: .62, envMapIntensity: .7, emissive: 0x000000, emissiveIntensity: 0, bumpMap: M.dust, bumpScale: .5 });
  const shellSide = M.gloss.clone(); shellSide.color.setHex(tcol); shellSide.emissiveIntensity = 0;   // نسخ خاصة بالقطع حتى لا يتوهج المجسّم الكامل
  const mkExt = (pts, depth, bev) => new THREE.ExtrudeGeometry(shapeOf(pts), { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 4 });
  const D = .24;
  if (cfg.shape === 'truf') { // طبقة مسحوق الكاكاو في الخارج
    const COAT = { hindistan: 0xf3ead6, findik: 0xa8702f, fistik: 0x9cbd55, badem: 0xd9b47c, altin: 0xd8a93a };
    const dm = M.dusty.clone(); dm.color.setHex(COAT[cfg.top] ?? powderOf(tcol)); dm.sheen = 0; dm.emissiveIntensity = 0;   // كساء التروفل: مسحوق أو جوز هند أو مكسرات
    add('dust', new THREE.Mesh(mkExt(circle(.9, 80).map(([x, y]) => [x, y + .86]), D - .02, .02), [dm, dm]));
  }
  add('shell', new THREE.Mesh(mkExt(outline, D, .02), [shellCut, shellSide]));
  const hasFill = cfg.shape !== 'tablet' && cfg.fill && cfg.fill !== 'yok';
  const inner = inset(outline, T, B), IB = bounds(inner);
  let fillFront = D + .02;
  if (hasFill) {
    const fcol = FILL_COLORS[cfg.fill] ?? FILL_COLORS.sade, glossy = cfg.fill === 'karamel' || cfg.fill === 'frambuaz';
    const fm = new THREE.MeshPhysicalMaterial({ color: fcol, roughness: glossy ? .22 : .5, clearcoat: glossy ? .9 : .2, envMapIntensity: .9, emissive: 0x000000, emissiveIntensity: 0, bumpMap: glossy ? null : M.dust, bumpScale: .6 });
    add('fill', new THREE.Mesh(mkExt(inner, D + .07, .015), [fm, fm])); fillFront = D + .07 + .015;
  }
  if (cfg.crunch && cfg.crunch !== 'yok') {
    const region = hasFill ? inner : (cfg.shape === 'tablet' ? outline : inner), RB = bounds(region);
    const yc = RB.minY + (RB.maxY - RB.minY) * CRUNCH_AMT[cfg.crunchAmt | 0 || 0] + (cfg.shape === 'tablet' ? .2 : 0);
    const cnt = [34, 70, 120][cfg.crunchAmt | 0], geo = new THREE.IcosahedronGeometry(1, 0), mat = new THREE.MeshStandardMaterial({ roughness: .75, flatShading: true, emissive: 0x000000, emissiveIntensity: 0 });
    const im = new THREE.InstancedMesh(geo, mat, cnt); let k = 0;
    for (let tries = 0; tries < cnt * 14 && k < cnt; tries++) {
      const x = RB.minX + Math.random() * (RB.maxX - RB.minX), y = RB.minY + Math.random() * (yc - RB.minY); if (!inside(region, x, y)) continue;
      const r = .022 + Math.random() * .03;
      _q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3)); _s.set(r * (1 + Math.random() * .6), r, r * (.8 + Math.random() * .4)); _m.compose(new THREE.Vector3(x, y, fillFront + r * .35), _q, _s); im.setMatrixAt(k, _m);
      _c.setHex(CRUNCH_COLORS[cfg.crunch] ?? CRUNCH_COLORS.findik).multiplyScalar(.8 + Math.random() * .4); im.setColorAt(k, _c); k++;
    }
    im.count = k; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; add('crunch', im);
  }
  // نقاط تثبيت التسميات (إحداثيات المقطع بعد إزاحة القاعدة إلى y=0 والمنتصف إلى x=0)
  const A = (x, y, z) => new THREE.Vector3(x - B.cx, y - B.minY, z), anchors = {};
  anchors.shell = A(B.cx - B.wx * .08, B.maxY - T * .5, D + .03);
  if (ids.includes('dust')) anchors.dust = A(B.minX + .02, B.cy, D - .02);
  if (ids.includes('fill')) anchors.fill = A(IB.cx + IB.wx * .22, IB.cy + IB.hy * .28, fillFront);
  if (ids.includes('crunch')) { const im = layers.crunch[0], mm = new THREE.Matrix4(), v = new THREE.Vector3(); let sx = 0, sy = 0; for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, mm); v.setFromMatrixPosition(mm); sx += v.x; sy += v.y; } anchors.crunch = A(sx / Math.max(1, im.count), sy / Math.max(1, im.count), fillFront + .03); }
  grp.children.forEach((m) => { m.position.x -= B.cx; m.position.y -= B.minY; });
  return { group: grp, layers, ids, w: B.wx * 2, h: B.hy * 2, anchors };
}

/* إبراز طبقة: توهج خفيف + بروز للأمام */
export function setHighlight(slice, id, tw) {
  if (!slice) return;
  Object.entries(slice.layers).forEach(([lid, meshes]) => meshes.forEach((m) => {
    const on = lid === id, mats = Array.isArray(m.material) ? m.material : [m.material];
    const z0 = m.position.z, z1 = on ? .13 : 0, e0 = mats[0].emissiveIntensity ?? 0;
    tw(300, (p) => { const k = p * p * (3 - 2 * p); m.position.z = z0 + (z1 - z0) * k; mats.forEach((mm) => { if (mm.emissive) { mm.emissive.setRGB(1, .86, .6); mm.emissiveIntensity = e0 + ((on ? .14 : 0) - e0) * k; } }); });
  }));
}

/* تفكيك مقطع قديم (كل موادّه نسخ خاصة به، آمن) */
export function disposeSlice(slice) {
  if (!slice) return;
  slice.group.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.isInstancedMesh) n.dispose(); if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => m.dispose()); });
}
