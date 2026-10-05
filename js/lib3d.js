/*
  أدوات مشتركة لكل مشاهد three.js في الموقع: بيئة استوديو، مواد الشوكولا، هندسة (وسادة منفوخة، مقاطع، تنعيم)،
  وقاعدة منصّة (رسم عند الظهور فقط، حارس دقة، تفكيك كامل للذاكرة).
*/
import * as THREE from './vendor/three.module.min.js';
export { THREE };

export const TAU = Math.PI * 2;
export const TYPE_COLORS = { bitter: 0x2a130b, sutlu: 0x7d4727, beyaz: 0xf0e2c4, ruby: 0xcf6a86 };
/* لون مسحوق/طلاء التروفل لكل نوع شوكولا (كاكاو، كاكاو بحليب، سكر بودرة، وردي) */
export const POWDER = { bitter: 0x5a3b28, sutlu: 0x80593e, beyaz: 0xf3ead7, ruby: 0xd88ba3 };
export const powderOf = (hex) => { for (const k in TYPE_COLORS) if (TYPE_COLORS[k] === hex) return POWDER[k]; return hex; };
export const FILL_COLORS = { sade: 0x5a3322, karamel: 0xd08a2e, frambuaz: 0xb01f45, findik: 0xa87340, fistik: 0x9db55c };
export const CRUNCH_COLORS = { findik: 0xc79559, biskuvi: 0xdcb87f };
export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  back: (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  io: (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
};

/* ------------------------------------------------------------------ هندسة ثنائية الأبعاد */
export function chaikin(pts, iters = 2, closed = true) {
  let a = pts;
  for (let k = 0; k < iters; k++) {
    const b = [], n = a.length, m = closed ? n : n - 1;
    if (!closed) b.push(a[0]);
    for (let i = 0; i < m; i++) { const p = a[i], q = a[(i + 1) % n]; b.push([.75 * p[0] + .25 * q[0], .75 * p[1] + .25 * q[1]], [.25 * p[0] + .75 * q[0], .25 * p[1] + .75 * q[1]]); }
    if (!closed) b.push(a[n - 1]);
    a = b;
  }
  return a;
}
const heartRaw = (() => { const a = [], N = 48; for (let i = 0; i < N; i++) { const t = i / N * TAU; a.push([Math.pow(Math.sin(t), 3), (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16 + 0.155]); } return a; })();
export const HEART = chaikin(heartRaw, 3);
export const LIPS = (() => {
  const pts = [], bez = (p0, p1, p2, p3, n) => { for (let i = 0; i < n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } };
  bez([-1, 0], [-.78, .34], [-.45, .52], [-.12, .32], 14); pts.push([-.06, .26], [0, .22], [.06, .26]);
  bez([.12, .32], [.45, .52], [.78, .34], [1, 0], 14); bez([1, 0], [.78, -.52], [.34, -.82], [0, -.8], 14); bez([0, -.8], [-.34, -.82], [-.78, -.52], [-1, 0], 14);
  return chaikin(pts, 2);
})();
export const circle = (r = 1, n = 72) => Array.from({ length: n }, (_, i) => [Math.cos(i / n * TAU) * r, Math.sin(i / n * TAU) * r]);
const scaleAbout = (pts, k, cx, cy) => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
export const centroid = (pts) => { let x = 0, y = 0; pts.forEach((p) => { x += p[0]; y += p[1]; }); return [x / pts.length, y / pts.length]; };
export const scaleOutline = scaleAbout;

/* ------------------------------------------------------------------ وسادة منفوخة (قطعة مصبوبة)
   حلقات من الحدّ نحو المركز، والارتفاع يعتمد على المسافة الحقيقية إلى الحدّ (كنفخ بالون): لا "قرون" عند الشقّ في القلب. */
/* إعادة أخذ عيّنات من حدّ مغلق بمسافات متساوية (Chaikin يكدّس النقاط عند الزوايا فتظهر مثلثات رفيعة ببقع تظليل) */
export function resample(pts, n) {
  const m = pts.length, len = [0]; for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % m]; len.push(len[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const L = len[m], out = []; let j = 0;
  for (let i = 0; i < n; i++) { const d = (i / n) * L; while (len[j + 1] < d) j++; const a = pts[j % m], b = pts[(j + 1) % m], f = (d - len[j]) / ((len[j + 1] - len[j]) || 1); out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }
  return out;
}
/* نفخ سلس (معادلة بواسون بطريقة SOR على شبكة): ارتفاع ناعم بلا طيّات على المحور الأوسط، كبالون ممتلئ */
export function inflater(outline) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; outline.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
  const n = 64, dx = (x1 - x0) / (n - 3), dy = (y1 - y0) / (n - 3), ox = x0 - dx, oy = y0 - dy, phi = new Float32Array(n * n), mask = new Uint8Array(n * n);
  const inside = (x, y) => { let c = false; for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) { const [xi, yi] = outline[i], [xj, yj] = outline[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) mask[j * n + i] = inside(ox + i * dx, oy + j * dy) ? 1 : 0;
  const w = 1.88, c = dx * dy;
  for (let it = 0; it < 190; it++) for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) { const k = j * n + i; if (!mask[k]) continue; const nb = phi[k - 1] + phi[k + 1] + phi[k - n] + phi[k + n]; phi[k] += w * ((nb + c) / 4 - phi[k]); }
  let mx = 0; for (let k = 0; k < phi.length; k++) mx = Math.max(mx, phi[k]);
  const at = (i, j) => phi[Math.min(n - 1, Math.max(0, j)) * n + Math.min(n - 1, Math.max(0, i))] / mx;
  const cr = (p0, p1, p2, p3, t) => .5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  // استيفاء ثنائي التكعيب (Catmull-Rom): المشتقات مستمرة، فلا طيّات على شبكة الحل
  return (x, y) => { const fx = Math.min(n - 1.001, Math.max(0, (x - ox) / dx)), fy = Math.min(n - 1.001, Math.max(0, (y - oy) / dy)), i = fx | 0, j = fy | 0, tx = fx - i, ty = fy - j; const col = (jj) => cr(at(i - 1, jj), at(i, jj), at(i + 1, jj), at(i + 2, jj), tx); return cr(col(j - 1), col(j), col(j + 1), col(j + 2), ty); };
}
export function pillow(outline, H, wall = .1, K = 22) {
  { let a = 0; for (let i = 0; i < outline.length; i++) { const p = outline[i], q = outline[(i + 1) % outline.length]; a += p[0] * q[1] - q[0] * p[1]; } if (a > 0) outline = outline.slice().reverse(); }
  outline = resample(outline, 220);   // اتجاه ثابت (مع عقارب الساعة) كي لا ينقلب السطح
  const N = outline.length, [cx, cy] = centroid(outline), pos = [], idx = [], uv = [], hAt = inflater(outline);
  const vert = (x, y, z) => { pos.push(x, y, z); uv.push(x * .5 + .5, z * .5 + .5); return pos.length / 3 - 1; };
  const rings = [], HT = [], XY = [];
  for (let k = 0; k <= K; k++) {
    const s = 1 - Math.pow(k / K, 1.7), ht = [], xy = [];
    for (let i = 0; i < N; i++) { const [px, py] = outline[i], vx = cx + (px - cx) * s, vy = cy + (py - cy) * s; xy.push([vx, vy]); ht.push(k === 0 ? 0 : H * Math.sqrt(Math.min(1, Math.max(0, hAt(vx, vy))))); }
    HT.push(ht); XY.push(xy);
  }
  for (let it = 0; it < 3; it++) for (let k = 1; k < K; k++) { HT[k] = HT[k].map((y, i) => .5 * y + .125 * (HT[k][(i + 1) % N] + HT[k][(i + N - 1) % N]) + .125 * (HT[k - 1][i] + HT[k + 1][i])); }
  for (let k = 0; k <= K; k++) rings.push(XY[k].map(([vx, vy], i) => vert(vx, HT[k][i], -vy)));
  for (let k = 0; k < K; k++) for (let i = 0; i < N; i++) { const a = rings[k][i], b = rings[k][(i + 1) % N], c = rings[k + 1][i], d = rings[k + 1][(i + 1) % N]; idx.push(a, c, b, b, c, d); }
  const w0 = [], w1 = []; for (let i = 0; i < N; i++) { const [px, py] = outline[i]; w0.push(vert(px, 0, -py)); w1.push(vert(px, -wall, -py)); }
  for (let i = 0; i < N; i++) { const a = w0[i], b = w0[(i + 1) % N], c = w1[i], d = w1[(i + 1) % N]; idx.push(a, b, c, b, d, c); }
  const ctr = vert(cx, -wall, -cy); for (let i = 0; i < N; i++) idx.push(ctr, w1[i], w1[(i + 1) % N]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const nrm = g.attributes.normal;
  // نورمالات تحليلية من حقل الارتفاع نفسه (لا من مثلثات رفيعة تقع على أشعة متقاربة قرب رأس القلب والشق): تظليل ناعم تماماً
  const e = .006;
  for (let k = 2; k <= K; k++) for (let i = 0; i < N; i++) {
    const [vx, vy] = XY[k][i], gx = (hAt(vx + e, vy) - hAt(vx - e, vy)) / (2 * e), gy = (hAt(vx, vy + e) - hAt(vx, vy - e)) / (2 * e), f = H / (2 * Math.sqrt(Math.max(hAt(vx, vy), 2e-3)));
    let nx = -f * gx, ny = 1, nz = f * gy; const l = Math.hypot(nx, ny, nz); nrm.setXYZ(rings[k][i], nx / l, ny / l, nz / l);
  }
  for (let i = 0; i < N; i++) { const a = rings[0][i], b = w0[i], nx = (nrm.getX(a) + nrm.getX(b)) / 2, ny = (nrm.getY(a) + nrm.getY(b)) / 2, nz = (nrm.getZ(a) + nrm.getZ(b)) / 2, l = Math.hypot(nx, ny, nz) || 1; nrm.setXYZ(a, nx / l, ny / l, nz / l); nrm.setXYZ(b, nx / l, ny / l, nz / l); }
  return g;
}

/* ------------------------------------------------------------------ قلب مضلّع (Geometric heart)
   أوجه مسطحة بحرافٍ حادّة كقالب السيليكون الحقيقي: حلقة خارجية ناعمة الحدّ، حلقة داخلية بعدد قليل من القمم، ومحور وسطي مرتفع. قاعدة مسطّحة مغلقة. */
export function facetHeart(S = 1, wall = .1) {
  const O = [[0, .47], [.28, .76], [.6, .89], [.88, .77], [1, .42], [.92, .12], [.53, -.3], [.22, -.6], [0, -.9]];
  const I = [[0, .38, .2], [.27, .62, .36], [.55, .68, .5], [.78, .55, .44], [.82, .28, .4], [.68, 0, .42], [.38, -.28, .4], [.16, -.55, .26], [0, -.7, .18]];
  const mirror = (a, f) => a.concat(a.slice(1, -1).reverse().map(f));
  const kO = mirror(O, ([x, y]) => [-x, y]), kI = mirror(I, ([x, y, h]) => [-x, y, h]), K = kO.length, RIM = .07 * S;
  const pos = [], uv = [], P = (x, h, y) => [x, h, -y];
  const tri = (a, b, c, dir) => {   // يضمن أن يكون وجه المثلث إلى الخارج
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, cx = (a[0] + b[0] + c[0]) / 3, cz = (a[2] + b[2] + c[2]) / 3;
    const d = dir === 'up' ? ny : dir === 'down' ? -ny : nx * cx + nz * cz;
    (d < 0 ? [a, c, b] : [a, b, c]).forEach((p) => { pos.push(p[0], p[1], p[2]); uv.push(p[0] * .5 + .5, p[2] * .5 + .5); });
  };
  const ring = [], u = [], ch = .18;   // حدّ مضلّع بزوايا مشطوفة قليلاً: كل ضلع وجه مسطّح
  kO.forEach((v, i) => { const p = kO[(i + K - 1) % K], n = kO[(i + 1) % K]; ring.push([v[0] + (p[0] - v[0]) * ch, v[1] + (p[1] - v[1]) * ch], [v[0] + (n[0] - v[0]) * ch, v[1] + (n[1] - v[1]) * ch]); u.push((i - ch + K) % K, i + ch); });
  const N = ring.length;
  const J = (uu) => { const i0 = Math.floor(uu) % K, f = uu - Math.floor(uu), a = kI[i0], b = kI[(i0 + 1) % K]; return P(a[0] + (b[0] - a[0]) * f, (a[2] + (b[2] - a[2]) * f) * S, a[1] + (b[1] - a[1]) * f); };
  const top = ring.map(([x, y]) => P(x, RIM, y)), low = ring.map(([x, y]) => P(x, -wall, y)), inn = u.map(J), c0 = P(0, -wall, 0);
  for (let k = 0; k < N; k++) {
    const k2 = (k + 1) % N;
    tri(top[k], top[k2], inn[k2], 'up'); tri(top[k], inn[k2], inn[k], 'up');      // حزام الأوجه من الحافّة نحو الداخل
    tri(top[k], top[k2], low[k], 'wall'); tri(top[k2], low[k2], low[k], 'wall');   // جدار القاعدة
    tri(c0, low[k], low[k2], 'down');                                              // قاعدة مسطّحة مغلقة
  }
  const V = kI.map(([x, y, h]) => P(x, h * S, y)), S1 = P(0, .52 * S, .12), S2 = P(0, .45 * S, -.28), L = (i) => (i === 0 || i === 8 ? i : K - i);
  const get = (id, left) => (id === 'a' ? S1 : id === 'b' ? S2 : V[left ? L(id) : id]);
  [[0, 1, 'a'], [1, 2, 'a'], [2, 3, 'a'], [3, 4, 'a'], [4, 5, 'a'], [5, 'b', 'a'], [5, 6, 'b'], [6, 7, 'b'], [7, 8, 'b']].forEach((t) => {   // التاج: أوجه كبيرة مسطحة
    tri(get(t[0], false), get(t[1], false), get(t[2], false), 'up'); tri(get(t[0], true), get(t[1], true), get(t[2], true), 'up');
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}

/* ------------------------------------------------------------------ قبة مضلّعة (Fluted dome)
   أضلاع طولية مستديرة تتجمّع عند قرص دائري صغير في القمة كما في قالب الشوكولا الحقيقي، وقاعدة مسطّحة مغلقة. */
export function flutedDome(o = {}) {
  const ribs = o.ribs || 16, R = o.R || 1, H = o.H || .84, Rt = o.Rt || .23, A0 = o.A0 || .15, NT = ribs * 12, NS = 44;
  const pos = [], uv = [], idx = [], V = (x, y, z) => { pos.push(x, y, z); uv.push(x * .5 + .5, z * .5 + .5); return pos.length / 3 - 1; };
  const lobe = (th) => { const c = Math.abs(Math.cos(ribs * th / 2)); return Math.pow(Math.sqrt(c * c + .015), .7) / Math.pow(Math.sqrt(1.015), .7); };
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rows = [];
  for (let j = 0; j <= NS; j++) {
    const s = j / NS, a = s * Math.PI / 2, Rm = R * (Rt + (1 - Rt) * Math.cos(a)), y = H * Math.sin(a), A = A0 * (1 - ss(.82, 1, s)), row = [];
    for (let i = 0; i < NT; i++) { const th = i / NT * TAU, r = Rm * (1 - A * (1 - lobe(th))); row.push(V(Math.cos(th) * r, y, Math.sin(th) * r)); }
    rows.push(row);
  }
  for (let j = 0; j < NS; j++) for (let i = 0; i < NT; i++) { const i2 = (i + 1) % NT, a = rows[j][i], b = rows[j + 1][i], c = rows[j][i2], d = rows[j + 1][i2]; idx.push(a, b, c, c, b, d); }
  const ring = (r, y) => Array.from({ length: NT }, (_, i) => { const th = i / NT * TAU; return V(Math.cos(th) * r, y, Math.sin(th) * r); });
  const D0 = ring(R * Rt, H), D1 = ring(R * Rt * .9, H + .02), dc = V(0, H + .027, 0);          // قرص القمة بحافّة بارزة قليلاً
  for (let i = 0; i < NT; i++) { const i2 = (i + 1) % NT; idx.push(D0[i], D1[i], D0[i2], D0[i2], D1[i], D1[i2], dc, D1[i2], D1[i]); }
  const B0 = rows[0].map((id) => V(pos[id * 3], 0, pos[id * 3 + 2])), bc = V(0, 0, 0);            // قاعدة مسطّحة مغلقة
  for (let i = 0; i < NT; i++) idx.push(bc, B0[i], B0[(i + 1) % NT]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

/* ------------------------------------------------------------------ تظليل ناعم لـ ExtrudeGeometry + قطاعات */
export function smooth(g) {
  const pos = g.attributes.position, n = pos.count, key = new Map(), acc = [], idx = new Array(n);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), fn = new THREE.Vector3(), e = new THREE.Vector3();
  for (let i = 0; i < n; i++) { const k = Math.round(pos.getX(i) * 1e4) + '_' + Math.round(pos.getY(i) * 1e4) + '_' + Math.round(pos.getZ(i) * 1e4); let id = key.get(k); if (id === undefined) { id = acc.length; key.set(k, id); acc.push(new THREE.Vector3()); } idx[i] = id; }
  for (let i = 0; i < n; i += 3) { a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2); fn.subVectors(c, b); e.subVectors(a, b); fn.cross(e); acc[idx[i]].add(fn); acc[idx[i + 1]].add(fn); acc[idx[i + 2]].add(fn); }
  const nor = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const v = acc[idx[i]].clone().normalize(); nor[i * 3] = v.x; nor[i * 3 + 1] = v.y; nor[i * 3 + 2] = v.z; }
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); return g;
}
export function rr(w, h, r) { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
export function ext(shape, depth, bev, seg = 5, size = bev) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: size, bevelSegments: seg, curveSegments: 8 });
  g.rotateX(-Math.PI / 2); return smooth(g);
}
export const shapeOf = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; };
export function lumpy(g, amp, f, seed) {
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = Math.sin(v.x * f + seed) * Math.sin(v.y * f * 1.3 + seed * 2) * Math.sin(v.z * f * .9 + seed * 3) + .5 * Math.sin(v.x * f * 2.7 + v.y * f * 2.1 + seed) * Math.sin(v.z * f * 3.1); v.multiplyScalar(1 + amp * n); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
export function speckle(size, base, spread, dots, tint) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < dots; i++) { const v = 128 + (Math.random() - .5) * spread; g.fillStyle = `rgba(${v},${v},${v},${Math.random() * .5})`; g.beginPath(); g.arc(Math.random() * size, Math.random() * size, Math.random() * 2.4 + .4, 0, TAU); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t;
}
export function fit(group, size) {
  const b = new THREE.Box3().setFromObject(group), s = new THREE.Vector3(), c = new THREE.Vector3(); b.getSize(s); b.getCenter(c);
  const k = size / Math.max(s.x, s.y, s.z); group.children.forEach((ch) => ch.position.sub(c)); group.scale.setScalar(k); return group;
}

/* ------------------------------------------------------------------ بيئة استوديو (انعكاسات نوافذ وإضاءة ناعمة) */
export function makeEnv(renderer) {
  const sc = new THREE.Scene();
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: 0x0e0604, side: THREE.BackSide })));
  // نوافذ إضاءة بتدرّج (soft boxes): تعطي انعكاسات مستطيلة ناعمة الحواف كما في تصوير الشوكولا الحقيقي
  const gc = document.createElement('canvas'); gc.width = 8; gc.height = 64; { const g = gc.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#fff'); gr.addColorStop(.55, '#d8d0c8'); gr.addColorStop(1, '#4a423c'); g.fillStyle = gr; g.fillRect(0, 0, 8, 64); }
  const grad = new THREE.CanvasTexture(gc); grad.colorSpace = THREE.SRGBColorSpace;
  const panel = (w, h, col, k, pos, rollZ = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: grad, color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); m.rotateZ(rollZ); sc.add(m); };
  panel(7, 3.2, 0xfff1dd, 9, [-4, 7, 5]);        // نافذة علوية دافئة
  panel(1.3, 9, 0xfff6ea, 7, [-8, 2, 1]);        // شريط عمودي يسار
  panel(1.3, 9, 0xffe7cf, 4.5, [8, 2, 2]);       // شريط عمودي يمين
  panel(3.5, 6, 0xff7fb0, 1.5, [6, 1, -4]);      // وردي خفيف من الخلف
  panel(10, 2.4, 0xffd49a, 3.4, [0, 6, -8]);     // ضوء خلفي ذهبي
  panel(4, 2, 0xfff3e6, 3, [3, 3, 8]);           // ملء أمامي خفيف
  panel(10, 10, 0x35190f, .6, [0, -6, 0]);
  const pm = new THREE.PMREMGenerator(renderer), rt = pm.fromScene(sc, 0.02); pm.dispose(); grad.dispose(); return rt.texture;
}

/* ------------------------------------------------------------------ مواد مشتركة */
/* ضجيج قيمي ثلاثي الأبعاد + fbm: يُستعمل لتشويه سطح التروفل بشكل عضوي */
const _h = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
export function vnoise(x, y, z) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf), l = (a, b, t) => a + (b - a) * t; return l(l(l(_h(xi, yi, zi), _h(xi + 1, yi, zi), u), l(_h(xi, yi + 1, zi), _h(xi + 1, yi + 1, zi), u), v), l(l(_h(xi, yi, zi + 1), _h(xi + 1, yi, zi + 1), u), l(_h(xi, yi + 1, zi + 1), _h(xi + 1, yi + 1, zi + 1), u), v), w); }
export function fbm3(x, y, z, o = 4) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f, z * f); f *= 2.03; a *= .5; } return s; }
/* تروفل حقيقي: كرة غير منتظمة (مفلطحة قليلاً)، ثنيات من لفّ الإيد، حبيبات المسحوق، وألوان رؤوس تُظلِم الشقوق (cavity) */
export function truffleGeo(seed = 1, flat = .86) {
  const g = new THREE.SphereGeometry(1, 96, 64), p = g.attributes.position, col = new Float32Array(p.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const x = v.x, y = v.y, z = v.z;
    const big = fbm3(x * 1.25 + seed, y * 1.25 + seed * 2, z * 1.25 + seed * 3, 3) - .5;                      // عدم انتظام الشكل
    const rid = 1 - Math.abs(2 * fbm3(x * 3.1 + seed * 5, y * 3.1, z * 3.1 + seed * 7, 3) - 1);                // ثنيات (ridged)
    const grain = vnoise(x * 46 + seed, y * 46, z * 46) - .5;                                                  // حبيبات المسحوق
    let r = 1 + big * .34 - Math.pow(rid, 2.6) * .07 + grain * .012;
    let py = y * flat; if (py < -.62) py = -.62 + (py + .62) * .15;                                            // قاعدة شبه مسطّحة تلامس السطح
    v.set(x * r, py * r, z * r); p.setXYZ(i, v.x, v.y, v.z);
    const cav = clamp01(.78 + big * .55 - Math.pow(rid, 2.2) * .5 + grain * .2); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = cav;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const ni = g.toNonIndexed(); g.dispose(); return smooth(ni);
}
const clamp01 = (v) => Math.max(.38, Math.min(1.08, v));

export function makeMats(share) {
  const bump = share ? share.bump : speckle(256, '#fff', 40, 700);
  const dust = share ? share.dust : speckle(128, '#fff', 90, 900);
  const grain = share ? share.grain : (() => { const t = speckle(256, '#fff', 130, 4200); t.repeat.set(3, 2); return t; })();
  const gloss = new THREE.MeshPhysicalMaterial({ color: TYPE_COLORS.bitter, roughness: .24, metalness: 0, clearcoat: 1, clearcoatRoughness: .09, envMapIntensity: 1.35, bumpMap: bump, bumpScale: .12, sheen: .15, sheenColor: new THREE.Color(0xffd7b8), sheenRoughness: .6 });
  const flat = gloss.clone(); flat.flatShading = true; flat.roughness = .2;
  const dusty = new THREE.MeshPhysicalMaterial({ color: TYPE_COLORS.bitter, roughness: .8, bumpMap: dust, bumpScale: .7, map: dust, clearcoat: 0, sheen: 1, sheenRoughness: .55, sheenColor: new THREE.Color(0xe6cdb0), envMapIntensity: .55 });
  const truf = new THREE.MeshPhysicalMaterial({ color: POWDER.bitter, vertexColors: true, roughness: .96, bumpMap: grain, bumpScale: 2.2, map: dust, sheen: 1, sheenRoughness: .4, sheenColor: new THREE.Color(0xf1dcc4), envMapIntensity: .5, clearcoat: 0 });
  const cut = new THREE.MeshStandardMaterial({ color: TYPE_COLORS.bitter, roughness: .55, metalness: 0, envMapIntensity: .8 }); // وجه القطع: مطفي قليلاً
  const gold = new THREE.MeshStandardMaterial({ color: 0xffd875, emissive: 0x6b4a00, metalness: .9, roughness: .32, side: THREE.DoubleSide, envMapIntensity: 1.6 });
  return { gloss, flat, dusty, truf, cut, gold, bump, dust, grain, choc: [gloss, flat, dusty, truf, cut] };
}

/* ------------------------------------------------------------------ قاعدة منصّة: حلقة رسم + تفكيك */
export function baseStage(canvas, o = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposure || 1.08;
  const coarse = matchMedia('(pointer: coarse)').matches;
  let dprMax = Math.min(devicePixelRatio || 1, o.dprCap || (coarse ? 1.75 : 2));
  const scene = new THREE.Scene(); scene.environment = makeEnv(renderer);
  const camera = new THREE.PerspectiveCamera(o.fov || 28, 1, 0.1, 60);
  const mats = makeMats();
  const tweens = []; const tw = (dur, fn, done) => tweens.push({ t0: performance.now(), dur, fn, done });
  const S = { renderer, scene, camera, mats, coarse, tw, tweens, canvas, vis: false, disposed: false, onFrame: null, onResize: null, time: 0 };
  let raf = 0, last = 0, acc = 0, frames = 0, slow = 0; const cap = coarse ? 1 / 30 : 1 / 60;
  function resize() {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300; renderer.setPixelRatio(dprMax); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    S.onResize && S.onResize(w, h);
  }
  function frame(now) {
    raf = 0; if (S.disposed || !S.vis || document.hidden) return;
    const dtRaw = Math.min(.05, (now - last) / 1000); last = now; acc += dtRaw;
    if (acc < cap * .9) { raf = requestAnimationFrame(frame); return; }
    const dt = acc; acc = 0; S.time += dt;
    for (let i = tweens.length - 1; i >= 0; i--) { const t = tweens[i], p = Math.min(1, (now - t.t0) / t.dur); t.fn(p); if (p >= 1) { tweens.splice(i, 1); t.done && t.done(); } }
    S.onFrame && S.onFrame(dt, now);
    renderer.render(scene, camera);
    frames++; if (dt > .045) slow++;
    if (frames === 50) { if (slow > 22 && dprMax > 1) { dprMax = Math.max(1, dprMax - .3); resize(); } frames = 0; slow = 0; }
    raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!S.disposed && S.vis && !raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const io = new IntersectionObserver((es) => { S.vis = es[0].isIntersecting; wake(); }, { rootMargin: '80px' }); io.observe(canvas);
  const onWin = () => resize(); addEventListener('resize', onWin); document.addEventListener('visibilitychange', wake);
  S.resize = resize; S.wake = wake;
  S.settle = () => { for (const t of tweens.splice(0)) { t.fn(1); t.done && t.done(); } };
  S.snapshot = (px = 150) => {
    S.settle(); renderer.render(scene, camera);
    const c = document.createElement('canvas'), r = canvas.width / canvas.height; c.width = px; c.height = Math.round(px / r); c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height); return c.toDataURL('image/webp', .82);
  };
  S.dispose = () => {
    if (S.disposed) return; S.disposed = true; S.vis = false; cancelAnimationFrame(raf); raf = 0; tweens.length = 0;
    removeEventListener('resize', onWin); document.removeEventListener('visibilitychange', wake); io.disconnect(); S.onDispose && S.onDispose();
    const killMat = (m) => { ['map', 'bumpMap', 'envMap'].forEach((k) => m[k] && m[k].dispose && m[k].dispose()); m.dispose(); };
    scene.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.isInstancedMesh) n.dispose(); if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach(killMat); });
    mats.choc.forEach(killMat); mats.gold.dispose(); mats.bump.dispose(); mats.dust.dispose(); mats.grain.dispose();
    if (scene.environment) scene.environment.dispose(); scene.environment = null;
    renderer.dispose(); renderer.forceContextLoss(); canvas.width = 1; canvas.height = 1;
  };
  S.resize();
  return S;
}

/* لون النوع على كل المواد المشتركة (يُستعمل مع tween) */
export function paintType(mats, hex) { mats.choc.forEach((m) => m.color.setHex(m === mats.dusty || m === mats.truf ? powderOf(hex) : hex)); }
